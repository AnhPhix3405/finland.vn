import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

// Helper to verify admin token
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { valid: false, error: 'Token không tồn tại' };
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return { valid: false, error: 'Token không hợp lệ hoặc không phải admin' };
  }

  return { valid: true, payload };
}

// PATCH - Toggle is_active status (lock/unlock account)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'lock', 'unlock', or 'toggle'

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID môi giới là bắt buộc' },
        { status: 400 }
      );
    }

    // Get current broker
    const broker = await prisma.brokers.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        phone: true,
        is_active: true
      }
    });

    if (!broker) {
      return NextResponse.json(
        { success: false, error: 'Môi giới không tồn tại' },
        { status: 404 }
      );
    }

    // Determine new status
    let newStatus = broker.is_active;
    if (action === 'lock') {
      newStatus = false;
    } else if (action === 'unlock') {
      newStatus = true;
    } else if (action === 'toggle') {
      newStatus = !broker.is_active;
    } else {
      return NextResponse.json(
        { success: false, error: 'Action không hợp lệ (lock, unlock, hoặc toggle)' },
        { status: 400 }
      );
    }

    // Update broker status
    const updatedBroker = await prisma.brokers.update({
      where: { id },
      data: {
        is_active: newStatus,
        updated_at: new Date()
      },
      select: {
        id: true,
        full_name: true,
        phone: true,
        is_active: true,
        email: true,
        avatar_url: true,
        specialization: true,
        province: true,
        ward: true,
        bio: true
      }
    });

    const statusText = newStatus ? 'mở khóa' : 'khóa';

    return NextResponse.json({
      success: true,
      data: updatedBroker,
      message: `${statusText.charAt(0).toUpperCase() + statusText.slice(1)} tài khoản thành công`
    });

  } catch (error) {
    console.error('Error updating broker status:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật trạng thái môi giới' },
      { status: 500 }
    );
  }
}

// DELETE - Delete broker account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID môi giới là bắt buộc' },
        { status: 400 }
      );
    }

    // Check if broker exists
    const broker = await prisma.brokers.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        phone: true
      }
    });

    if (!broker) {
      return NextResponse.json(
        { success: false, error: 'Môi giới không tồn tại' },
        { status: 404 }
      );
    }

    // Check if broker has any listings
    const listingsCount = await prisma.listings.count({
      where: { broker_id: id }
    });

    if (listingsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Không thể xóa. Môi giới này có ${listingsCount} tin đăng hoạt động` 
        },
        { status: 400 }
      );
    }

    // Check if broker has any bookmarks (cleanup)
    await prisma.bookmarks.deleteMany({
      where: { broker_id: id }
    });

    // Delete broker
    await prisma.brokers.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `Xóa tài khoản môi giới ${broker.full_name} (${broker.phone}) thành công`
    });

  } catch (error) {
    console.error('Error deleting broker:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa môi giới' },
      { status: 500 }
    );
  }
}
