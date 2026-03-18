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
  
  // Admin role bypasses is_active check
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

// POST - Create or toggle bookmark
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const brokerId = auth.brokerId;
    const { listing_id } = await request.json();

    if (!listing_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu listing_id' },
        { status: 400 }
      );
    }

    const listing = await prisma.listings.findUnique({
      where: { id: listing_id }
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Bài đăng không tồn tại' },
        { status: 404 }
      );
    }

    const existingBookmark = await prisma.bookmarks.findFirst({
      where: {
        listing_id,
        broker_id: brokerId
      }
    });

    if (existingBookmark) {
      await prisma.bookmarks.delete({
        where: { id: existingBookmark.id }
      });

      return NextResponse.json({
        success: true,
        data: { bookmarked: false, message: 'Đã bỏ lưu bài đăng' }
      });
    }

    const bookmark = await prisma.bookmarks.create({
      data: {
        listing_id,
        broker_id: brokerId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: bookmark.id,
        bookmarked: true,
        message: 'Đã lưu bài đăng'
      }
    });

  } catch (error) {
    console.error('Error managing bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi thao tác bookmark' },
      { status: 500 }
    );
  }
}

// GET - Get bookmarked listings or check if listings are bookmarked
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const brokerId = auth.brokerId;
    const { searchParams } = new URL(request.url);
    const listing_ids = searchParams.get('listing_ids')?.split(',') || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (listing_ids.length > 0) {
      const bookmarks = await prisma.bookmarks.findMany({
        where: { broker_id: brokerId, listing_id: { in: listing_ids } },
        select: { listing_id: true }
      });

      const bookmarkedMap = Object.fromEntries(
        bookmarks.map(b => [b.listing_id, true])
      );

      return NextResponse.json({ success: true, data: bookmarkedMap });
    }

    const totalBookmarks = await prisma.bookmarks.count({ where: { broker_id: brokerId } });

    const bookmarks = await prisma.bookmarks.findMany({
      where: { broker_id: brokerId },
      include: {
        listings: {
          include: {
            brokers: { select: { id: true, full_name: true, phone: true, email: true, avatar_url: true } },
            tags: { select: { id: true, name: true, slug: true } },
            transaction_types: { select: { id: true, name: true, hashtag: true } },
            property_types: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: skip
    });

    const listingIds = bookmarks.map(b => b.listing_id);
    const attachments = await prisma.attachments.findMany({
      where: { target_id: { in: listingIds }, target_type: 'listing' },
      orderBy: { sort_order: 'asc' }
    });

    const attachmentMap = new Map<string, string>();
    attachments.forEach(att => {
      if (!attachmentMap.has(att.target_id!)) {
        attachmentMap.set(att.target_id!, att.secure_url || att.url);
      }
    });

    const data = bookmarks.map(bookmark => ({
      bookmarkId: bookmark.id,
      ...bookmark.listings,
      imageUrl: attachmentMap.get(bookmark.listing_id) || bookmark.listings.thumbnail_url || null,
      createdAt: bookmark.created_at
    }));

    return NextResponse.json({
      success: true,
      data: serializeData(data),
      pagination: {
        page, limit, total: totalBookmarks, totalPages: Math.ceil(totalBookmarks / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải dữ liệu bookmark' },
      { status: 500 }
    );
  }
}

