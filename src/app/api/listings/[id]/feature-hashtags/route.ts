import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

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

  return { valid: true, brokerId: (payload as Record<string, unknown>).id as string };
}

// POST - Thêm feature hashtag vào listing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { feature_hashtag_id } = body;

    if (!feature_hashtag_id) {
      return NextResponse.json({ success: false, error: 'feature_hashtag_id là bắt buộc' }, { status: 400 });
    }

    // Check if listing exists and belongs to broker
    const listing = await prisma.listings.findUnique({
      where: { id: listingId },
      select: { broker_id: true }
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing không tồn tại' }, { status: 404 });
    }

    if (listing.broker_id !== auth.brokerId) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền thêm đặc điểm vào listing này' }, { status: 403 });
    }

    // Check if feature_hashtag exists
    const featureHashtag = await prisma.feature_hashtags.findUnique({
      where: { id: feature_hashtag_id }
    });

    if (!featureHashtag) {
      return NextResponse.json({ success: false, error: 'Đặc điểm không tồn tại' }, { status: 404 });
    }

    // Create the relation
    const result = await prisma.listing_feature_hashtags.create({
      data: {
        listing_id: listingId,
        feature_hashtag_id: feature_hashtag_id
      }
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    // Handle duplicate key error
    if ((error as Record<string, unknown>).code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Đặc điểm đã được thêm vào listing' }, { status: 400 });
    }
    console.error('Error adding feature hashtag:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi thêm đặc điểm' }, { status: 500 });
  }
}

// DELETE - Xóa tất cả feature hashtags của listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // Check if listing exists and belongs to broker
    const listing = await prisma.listings.findUnique({
      where: { id: listingId },
      select: { broker_id: true }
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing không tồn tại' }, { status: 404 });
    }

    if (listing.broker_id !== auth.brokerId) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền xóa đặc điểm của listing này' }, { status: 403 });
    }

    // Delete all feature hashtags for this listing
    await prisma.listing_feature_hashtags.deleteMany({
      where: { listing_id: listingId }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa tất cả đặc điểm' });
  } catch (error) {
    console.error('Error deleting feature hashtags:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi xóa đặc điểm' }, { status: 500 });
  }
}
