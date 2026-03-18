import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';
import { removeVietnameseTones } from '@/src/lib/slug-utils';

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

// GET /api/listings/[id] - Get listing by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Listing ID or slug is required' },
        { status: 400 }
      );
    }

    // Get current broker from token if logged in
    let currentBrokerId: string | null = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload && (payload as Record<string, unknown>).id) {
          currentBrokerId = (payload as Record<string, unknown>).id as string;
        }
      } catch (err) {
        // Token invalid or expired, continue without broker context
        console.error('Token verification failed:', err);
      }
    }

    // Try to find by slug first, then by ID
    let listing = null;

    // Check if it's a UUID (ID) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    const dbStartTime = Date.now();
    if (isUUID) {
      // Find by ID
      listing = await prisma.listings.findUnique({
        where: { id },
        include: {
          brokers: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              email: true,
              avatar_url: true,
              bio: true
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
    } else {
      // Find by slug
      listing = await prisma.listings.findFirst({
        where: { slug: id },
        include: {
          brokers: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              email: true,
              avatar_url: true,
              bio: true
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
    }

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Increment views_count
    try {
      await prisma.listings.update({
        where: { id: listing.id },
        data: { views_count: { increment: 1 } }
      });
    } catch (err) {
      console.error('Error incrementing views_count:', err);
    }

    // Only show approved listings for public access
    const publicStatuses = ['Đang hiển thị', 'Đã bán', 'Đã xong'];
    if (!publicStatuses.includes(listing.status || '')) {
      return NextResponse.json(
        { success: false, error: 'Listing not available' },
        { status: 404 }
      );
    }

    // Check if current broker has bookmarked this listing
    let isBookmarked = false;
    const bookmarkStartTime = Date.now();
    if (currentBrokerId) {
      const bookmark = await prisma.bookmarks.findFirst({
        where: {
          broker_id: currentBrokerId,
          listing_id: listing.id
        }
      });
      isBookmarked = !!bookmark;

      console.log('GET /api/listings/[id] - Checking bookmark:', {
        brokerId: currentBrokerId,
        listingId: listing.id,
        isBookmarked: isBookmarked,
        bookmarkQueryTime: Date.now() - bookmarkStartTime
      });
    } else {
      console.log('GET /api/listings/[id] - No broker logged in, isBookmarked:', false);
    }

    const totalTime = Date.now() - startTime;
    console.log(`GET /api/listings/[id] - Total time: ${totalTime}ms (DB: ${Date.now() - dbStartTime}ms)`);

    return NextResponse.json(serializeData({
      success: true,
      data: {
        ...listing,
        is_bookmarked: isBookmarked
      }
    }));

  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    const existingListing = await prisma.listings.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (existingListing.broker_id !== auth.brokerId) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền xóa bài đăng này' }, { status: 403 });
    }

    await prisma.tags.deleteMany({ where: { listing_id: id } });

    await prisma.listings.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id: _ignoredId, price, ...otherData } = body;

    const existingListing = await prisma.listings.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    if (existingListing.broker_id !== auth.brokerId) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền sửa bài đăng này' }, { status: 403 });
    }

    // New restriction: if status is pending or hidden, no actions allowed
    // Exception: allow updating thumbnail_url for any status
    const isThumbnailUpdate = Object.keys(body).length === 1 && body.thumbnail_url !== undefined;
    if ((existingListing.status === 'Đang chờ duyệt' || existingListing.status === 'Đã ẩn') && !isThumbnailUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: `Tin đăng đang ở trạng thái "${existingListing.status}", không thể chỉnh sửa.`
        },
        { status: 400 }
      );
    }

    // Validate price_per_m2 > 0
    const pricePerM2 = body.price_per_m2;
    if (pricePerM2 !== undefined && pricePerM2 !== null && pricePerM2 !== "") {
      const pricePerM2Num = parseFloat(pricePerM2);
      if (isNaN(pricePerM2Num) || pricePerM2Num <= 0) {
        return NextResponse.json(
          { success: false, error: "Giá/m² phải lớn hơn 0" },
          { status: 400 }
        );
      }
    }

    // Validate price_per_frontage_meter > 0
    const pricePerFrontageMeter = body.price_per_frontage_meter;
    if (pricePerFrontageMeter !== undefined && pricePerFrontageMeter !== null && pricePerFrontageMeter !== "") {
      const pricePerFrontageMeterNum = parseFloat(pricePerFrontageMeter);
      if (isNaN(pricePerFrontageMeterNum) || pricePerFrontageMeterNum <= 0) {
        return NextResponse.json(
          { success: false, error: "Giá/mặt tiền phải lớn hơn 0" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...otherData };

    // If title is updated, regenerate slug while keeping the sequence suffix
    if (updateData.title !== undefined && existingListing.slug) {
      const titleSlug = removeVietnameseTones(updateData.title as string);

      // Extract the sequence suffix from existing slug (last part like "26000001")
      const existingSlugParts = existingListing.slug.split('-');
      const sequenceSuffix = existingSlugParts[existingSlugParts.length - 1];

      updateData.slug = `${titleSlug}-${sequenceSuffix}`;
    }

    if (price !== undefined) {
      if (price === null || price === "") {
        updateData.price = null;
      } else {
        try {
          updateData.price = BigInt(price);
        } catch (e) {
          console.error("Error converting price to BigInt:", e);
        }
      }
    }

    // Update the listing
    const updatedListing = await prisma.listings.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(serializeData({
      success: true,
      message: 'Đã cập nhật bài đăng thành công',
      data: updatedListing
    }));

  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}
