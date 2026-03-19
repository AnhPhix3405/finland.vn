import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

function serializeData(data: Record<string, unknown> | unknown[]) {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { valid: false, error: 'Token không tồn tại', status: 401 };
  }

  const payload = await verifyToken(token);
  if (!payload || !(payload as Record<string, unknown>).id) {
    return { valid: false, error: 'Token không hợp lệ', status: 401 };
  }

  const role = (payload as Record<string, unknown>).role as string;
  
  if (role === 'admin') {
    return { valid: true, brokerId: (payload as Record<string, unknown>).id as string, isAdmin: true };
  }

  const brokerId = (payload as Record<string, unknown>).id as string;

  const broker = await prisma.brokers.findUnique({
    where: { id: brokerId },
    select: { is_active: true }
  });

  if (!broker) {
    return { valid: false, error: 'Token không hợp lệ', status: 401 };
  }

  if (!broker.is_active) {
    return { valid: false, error: 'Tài khoản của bạn đã bị khóa', status: 403 };
  }

  return { valid: true, brokerId };
}

// Valid status values based on the constraint
const VALID_STATUSES = [
  'Đang hiển thị',
  'Đang chờ duyệt', 
  'Đã ẩn',
  'Hết hạn',
  'Đã bán',
  'Đã xong',
  'Bị từ chối'
] as const;

// PATCH /api/listings/[id]/status - Update listing status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check if listing exists
    const existingListing = await prisma.listings.findUnique({
      where: { id },
      include: {
        transaction_types: {
          select: { hashtag: true }
        }
      }
    });

    if (!existingListing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Permission check - only owner can update status
    if (existingListing.broker_id !== auth.brokerId) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền cập nhật trạng thái bài đăng này' },
        { status: 403 }
      );
    }

    // Allow users to change from hidden to visible, but restrict from pending
    if (existingListing.status === 'Đang chờ duyệt') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tin đăng đang ở trạng thái "${existingListing.status}", không thể thực hiện thao tác này.` 
        },
        { status: 400 }
      );
    }

    // Prevent non-admin users from updating status of rejected listings
    if (existingListing.status === 'Bị từ chối' && !(auth as Record<string, unknown>).isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tin đăng đang ở trạng thái "${existingListing.status}", không thể thực hiện thao tác này.` 
        },
        { status: 400 }
      );
    }

    // If trying to hide a listing that's already hidden, allow it
    if (existingListing.status === 'Đã ẩn' && status === 'Đã ẩn') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tin đăng đang ở trạng thái "${existingListing.status}".` 
        },
        { status: 400 }
      );
    }

    // Auto-correct status based on transaction type
    let finalStatus = status;
    const transactionHashtag = existingListing.transaction_types?.hashtag;
    
    if (status === 'Đã bán' && transactionHashtag === 'cho-thue') {
      finalStatus = 'Đã xong';
    } else if (status === 'Đã xong' && transactionHashtag === 'mua-ban') {
      finalStatus = 'Đã bán';
    }

    // Allow change from Đã ẩn to Đang hiển thị

    // Update the listing status
    const updatedListing = await prisma.listings.update({
      where: { id },
      data: { status: finalStatus },
      include: {
        brokers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            avatar_url: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        property_types: {
          select: {
            id: true,
            name: true,
            hashtag: true
          }
        },
        transaction_types: {
          select: {
            id: true,
            name: true,
            hashtag: true
          }
        }
      }
    });

    return NextResponse.json(serializeData({
      success: true,
      data: updatedListing,
      message: `Listing status updated to "${status}"`
    }));

  } catch (error) {
    console.error('Error updating listing status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing status' },
      { status: 500 }
    );
  }
}