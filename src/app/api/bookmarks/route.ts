import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

// Helper function to handle BigInt serialization
function serializeData(data: Record<string, unknown> | unknown[]) {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

// POST - Create or toggle bookmark
export async function POST(request: NextRequest) {
  try {
    // Check authentication token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token không tồn tại' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
        { status: 401 }
      );
    }

    const { listing_id } = await request.json();

    if (!listing_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu listing_id' },
        { status: 400 }
      );
    }

    console.log('POST /api/bookmarks - Request:', {
      brokerId: (payload as Record<string, unknown>).id,
      listingId: listing_id
    });

    // Check if listing exists
    const listing = await prisma.listings.findUnique({
      where: { id: listing_id }
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Bài đăng không tồn tại' },
        { status: 404 }
      );
    }

    // Check if bookmark already exists for this broker and listing
    const existingBookmark = await prisma.bookmarks.findFirst({
      where: {
        listing_id,
        broker_id: (payload as Record<string, unknown>).id as string
      }
    });

    if (existingBookmark) {
      // Delete bookmark (toggle off)
      await prisma.bookmarks.delete({
        where: {
          id: existingBookmark.id
        }
      });

      console.log('POST /api/bookmarks - Deleted bookmark:', {
        bookmarkId: existingBookmark.id,
        brokerId: (payload as Record<string, unknown>).id,
        listingId: listing_id
      });

      return NextResponse.json({
        success: true,
        data: {
          bookmarked: false,
          message: 'Đã bỏ lưu bài đăng'
        }
      });
    }

    // Create bookmark with broker_id
    const bookmark = await prisma.bookmarks.create({
      data: {
        listing_id,
        broker_id: (payload as Record<string, unknown>).id as string
      }
    });

    console.log('POST /api/bookmarks - Created bookmark:', {
      bookmarkId: bookmark.id,
      brokerId: (payload as Record<string, unknown>).id,
      listingId: listing_id
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
    // Check authentication token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token không tồn tại' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const listing_ids = searchParams.get('listing_ids')?.split(',') || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const brokerId = (payload as Record<string, unknown>).id as string;

    // If listing_ids provided, check which are bookmarked
    if (listing_ids.length > 0) {
      const bookmarks = await prisma.bookmarks.findMany({
        where: {
          broker_id: brokerId,
          listing_id: {
            in: listing_ids
          }
        },
        select: {
          listing_id: true
        }
      });

      const bookmarkedMap = Object.fromEntries(
        bookmarks.map(b => [b.listing_id, true])
      );

      return NextResponse.json({
        success: true,
        data: bookmarkedMap
      });
    }

    // Otherwise, get all bookmarked listings for current broker
    console.log('GET /api/bookmarks - Fetching all bookmarks for broker:', {
      brokerId,
      page,
      limit,
      skip
    });

    // Get total count
    const totalBookmarks = await prisma.bookmarks.count({
      where: {
        broker_id: brokerId
      }
    });

    // Get paginated bookmarks with listing details
    const bookmarks = await prisma.bookmarks.findMany({
      where: {
        broker_id: brokerId
      },
      include: {
        listings: {
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
            transaction_types: {
              select: {
                id: true,
                name: true,
                hashtag: true
              }
            },
            property_types: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      skip: skip
    });

    console.log('GET /api/bookmarks - Raw bookmarks from DB:', {
      count: bookmarks.length,
      firstItem: bookmarks[0] ? {
        id: bookmarks[0]?.listings?.id,
        title: bookmarks[0]?.listings?.title,
        transaction_types: bookmarks[0]?.listings?.transaction_types,
        property_types: bookmarks[0]?.listings?.property_types
      } : null
    });

    // Format response
    const data = bookmarks.map(bookmark => ({
      bookmarkId: bookmark.id,
      ...bookmark.listings,
      createdAt: bookmark.created_at
    }));

    // Serialize BigInt values
    const serializedData = serializeData(data);

    return NextResponse.json({
      success: true,
      data: serializedData,
      pagination: {
        page,
        limit,
        total: totalBookmarks,
        totalPages: Math.ceil(totalBookmarks / limit)
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
