import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { processTagsForListing } from '@/src/app/modules/tags.service.server';
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
    return { valid: false, error: 'Vui lòng đăng nhập', status: 401 };
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const hashtags = searchParams.get('hashtags');
    const province = searchParams.get('province');
    const ward = searchParams.get('ward');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const search = searchParams.get('search');
    const onMap = searchParams.get('onMap') === 'true';

    let currentBrokerId: string | null = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload && (payload as Record<string, unknown>).id) {
          if ((payload as Record<string, unknown>).role !== 'admin') {
            const broker = await prisma.brokers.findUnique({
              where: { id: (payload as Record<string, unknown>).id as string },
              select: { is_active: true }
            });
            if (!broker) {
              return NextResponse.json(
                { success: false, error: 'Tài khoản đã bị khóa' },
                { status: 403 }
              );
            }
            if (!broker.is_active) {
              return NextResponse.json(
                { success: false, error: 'Tài khoản đã bị khóa' },
                { status: 403 }
              );
            }
            currentBrokerId = (payload as Record<string, unknown>).id as string;
          } else {
            currentBrokerId = (payload as Record<string, unknown>).id as string;
          }
        }
      } catch (err) {
        // Token invalid, continue without broker context
      }
    }

    const andConditions: Record<string, unknown>[] = [
      { status: { notIn: ['Đang chờ duyệt', 'Đã ẩn', 'Bị từ chối'] } }
    ];

    if (province && province !== 'all') {
      andConditions.push({ province });
    }

    if (ward && ward !== 'all') {
      andConditions.push({ ward });
    }

    if (priceMin || priceMax) {
      const priceFilter: Record<string, unknown> = {};
      if (priceMin) priceFilter.gte = BigInt(priceMin);
      if (priceMax) priceFilter.lte = BigInt(priceMax);
      if (Object.keys(priceFilter).length > 0) {
        andConditions.push({ price: priceFilter });
      }
    }

    if (hashtags) {
      const hashtagList = hashtags.split(',').map(tag => tag.trim().toLowerCase());

      const [transactionTypes, propertyTypes, tags] = await Promise.all([
        prisma.transaction_types.findMany({
          where: { hashtag: { in: hashtagList } },
          select: { id: true }
        }),
        prisma.property_types.findMany({
          where: { hashtag: { in: hashtagList } },
          select: { id: true }
        }),
        prisma.tags.findMany({
          where: { slug: { in: hashtagList } },
          select: { id: true }
        })
      ]);

      if (transactionTypes.length > 0) {
        andConditions.push({ transaction_type_id: { in: transactionTypes.map(t => t.id) } });
      }
      if (propertyTypes.length > 0) {
        andConditions.push({ property_type_id: { in: propertyTypes.map(p => p.id) } });
      }
      if (tags.length > 0) {
        andConditions.push({ tags: { some: { id: { in: tags.map(t => t.id) } } } });
      }
    }

    if (search) {
      console.log('🔍 [SEARCH] Search query:', search);
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { brokers: { full_name: { contains: search, mode: 'insensitive' } } }
        ]
      });
    }

    if (onMap) {
      andConditions.push({
        latitude: { not: null },
        longitude: { not: null }
      });
    }

    let whereClause: Record<string, unknown>;
    if (andConditions.length === 1) {
      whereClause = andConditions[0];
    } else {
      whereClause = { AND: andConditions };
    }

    console.log('🔍 [SEARCH] Where clause:', JSON.stringify(whereClause, null, 2));

    let orderBy: Record<string, unknown> = { created_at: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    else if (sortBy === 'oldest') orderBy = { created_at: 'asc' };

    const listings = await prisma.listings.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        brokers: true,
        tags: { select: { id: true, name: true, slug: true } },
        property_types: { select: { id: true, name: true, hashtag: true } },
        transaction_types: { select: { id: true, name: true, hashtag: true } },
        listing_feature_hashtags: {
          select: {
            feature_hashtags: {
              select: { id: true, name: true, hashtag: true }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('🔍 [SEARCH] Found listings:', listings.length);
    if (listings.length > 0) {
      console.log('🔍 [SEARCH] Sample listing:', {
        id: listings[0].id,
        title: listings[0].title,
        brokerName: listings[0].brokers?.full_name
      });
    }

    const listingIds = listings.map(l => l.id);
    const attachments = await prisma.attachments.findMany({
      where: { target_id: { in: listingIds }, target_type: 'listing' },
      orderBy: { sort_order: 'asc' }
    });

    const attachmentsByListingId: Record<string, typeof attachments[0][]> = {};
    attachments.forEach(att => {
      if (att.target_id) {
        if (!attachmentsByListingId[att.target_id]) {
          attachmentsByListingId[att.target_id] = [];
        }
        attachmentsByListingId[att.target_id].push(att);
      }
    });

    const total = await prisma.listings.count({ where: whereClause });

    let bookmarkMap: Record<string, boolean> = {};
    if (currentBrokerId) {
      const bookmarks = await prisma.bookmarks.findMany({
        where: { broker_id: currentBrokerId, listing_id: { in: listingIds } },
        select: { listing_id: true }
      });
      bookmarkMap = Object.fromEntries(bookmarks.map(b => [b.listing_id, true]));
    }

    const listingsWithBookmarks = listings.map(listing => {
      const listingAttachments = attachmentsByListingId[listing.id] || [];
      const firstAttachment = listingAttachments[0];
      const imageUrl = listing.thumbnail_url || firstAttachment?.secure_url || firstAttachment?.url || null;

      // Extract feature tags from listing_feature_hashtags
      const featureTags = (listing.listing_feature_hashtags || []).map((lfh: { feature_hashtags: { id: string; name: string; hashtag: string } }) => lfh.feature_hashtags);

      console.log('🔍 [SEARCH] featureTags for listing', listing.id, ':', JSON.stringify(featureTags));

      return {
        ...listing,
        is_bookmarked: bookmarkMap[listing.id] || false,
        thumbnail_url: imageUrl,
        featureTags: featureTags
      };
    });

    console.log('🔍 [SEARCH] Returning response with', listingsWithBookmarks.length, 'listings');
    if (search && listingsWithBookmarks.length > 0) {
      console.log('🔍 [SEARCH] First result broker:', listingsWithBookmarks[0].brokers?.full_name);
    }
    console.log('🔍 [SEARCH] First listing featureTags:', JSON.stringify(listingsWithBookmarks[0]?.featureTags));

    return NextResponse.json(serializeData({
      success: true,
      data: listingsWithBookmarks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }));

  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const brokerId = auth.brokerId as string;
    const body = await request.json();
    const errors: Record<string, string> = {};

    if (!body.transaction_type_id) {
      errors.transactionType = "Vui lòng chọn loại giao dịch";
    }

    if (!body.property_type_id) {
      errors.propertyType = "Vui lòng chọn loại bất động sản";
    }

    if (!body.province) {
      errors.province = "Vui lòng chọn Tỉnh/Thành phố";
    }

    if (!body.ward) {
      errors.ward = "Vui lòng chọn Phường/Xã";
    }

    if (!body.title || !body.title.trim()) {
      errors.title = "Tiêu đề là bắt buộc";
    } else if (body.title.trim().length < 10) {
      errors.title = "Tiêu đề phải có ít nhất 10 ký tự";
    } else if (body.title.trim().length > 200) {
      errors.title = "Tiêu đề không được quá 200 ký tự";
    }

    if (!body.description || !body.description.trim()) {
      errors.description = "Mô tả là bắt buộc";
    } else if (body.description.trim().length < 50) {
      errors.description = "Mô tả phải có ít nhất 50 ký tự";
    } else if (body.description.trim().length > 10000) {
      errors.description = "Mô tả không được quá 10000 ký tự";
    }

    if (!body.area) {
      errors.area = "Diện tích là bắt buộc";
    } else {
      const areaNum = parseFloat(body.area);
      if (isNaN(areaNum) || areaNum <= 0) {
        errors.area = "Diện tích phải là số dương";
      } else if (areaNum > 1000000) {
        errors.area = "Diện tích không hợp lệ";
      }
    }

    const priceValue = body.price ? String(body.price).replace(/\D/g, '') : '';
    if (!priceValue || parseInt(priceValue) === 0) {
      errors.price = "Giá là bắt buộc";
    } else {
      const priceNum = parseInt(priceValue);
      if (priceNum < 100000) {
        errors.price = "Giá phải lớn hơn 100,000 VNĐ";
      } else if (priceNum > 100000000000) {
        errors.price = "Giá không hợp lệ";
      }
    }

    if (body.price_per_frontage_meter !== undefined && body.price_per_frontage_meter !== null && body.price_per_frontage_meter !== "") {
      const pricePerFrontageMeterNum = parseFloat(body.price_per_frontage_meter);
      if (isNaN(pricePerFrontageMeterNum) || pricePerFrontageMeterNum <= 0) {
        errors.pricePerFrontageMeter = "Giá/mặt tiền phải lớn hơn 0";
      }
    }

    if (body.floor_count) {
      const floorNum = parseInt(body.floor_count);
      if (isNaN(floorNum) || floorNum < 1 || floorNum > 100) {
        errors.floorCount = "Số tầng không hợp lệ";
      }
    }

    if (body.bedroom_count) {
      const bedroomNum = parseInt(body.bedroom_count);
      if (isNaN(bedroomNum) || bedroomNum < 0 || bedroomNum > 100) {
        errors.bedroomCount = "Số phòng ngủ không hợp lệ";
      }
    }

    if (body.contact_phone && body.contact_phone.trim()) {
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(body.contact_phone.trim())) {
        errors.contactPhone = "Số điện thoại không hợp lệ";
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ", details: errors },
        { status: 400 }
      );
    }

    const { title, description, transaction_type_id, property_type_id, province, ward, address, area, price, price_per_frontage_meter, direction, tags, feature_hashtag_ids, contact_name: rawContactName, contact_phone: rawContactPhone, floor_count, bedroom_count, latitude, longitude } = body;

    const currentYearStr = new Date().getFullYear().toString().substring(2, 4);
    const prefix = `FIN${currentYearStr}`;

    const latestListing = await prisma.listings.findFirst({
      where: { listing_code: { startsWith: prefix } },
      orderBy: { listing_code: 'desc' },
      select: { listing_code: true }
    });

    let nextSequenceNumber = 1;
    if (latestListing?.listing_code) {
      const lastSeqStr = latestListing.listing_code.substring(5);
      const lastSeqNum = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeqNum)) {
        nextSequenceNumber = lastSeqNum + 1;
      }
    }

    const sequenceStr = nextSequenceNumber.toString().padStart(6, '0');
    const finalListingCode = `${prefix}${sequenceStr}`;
    const slugSequenceStr = `${currentYearStr}${sequenceStr}`;
    const titleSlug = removeVietnameseTones(title);
    const slug = `${titleSlug}-${slugSequenceStr}`;

    let priceBigInt: bigint | null = null;
    if (price !== undefined && price !== null && price !== "") {
      priceBigInt = BigInt(price);
    }

    let finalContactName: string | null = null;
    let finalContactPhone: string | null = null;

    if (rawContactName && rawContactName.trim()) {
      finalContactName = rawContactName.trim();
    } else {
      const broker = await prisma.brokers.findUnique({
        where: { id: brokerId },
        select: { full_name: true, phone: true }
      });
      if (broker) {
        finalContactName = broker.full_name;
        finalContactPhone = broker.phone;
      }
    }

    if (rawContactPhone && rawContactPhone.trim()) {
      finalContactPhone = rawContactPhone.trim();
    } else if (finalContactPhone === null) {
      const broker = await prisma.brokers.findUnique({
        where: { id: brokerId },
        select: { phone: true }
      });
      if (broker) {
        finalContactPhone = broker.phone;
      }
    }

    const listing = await prisma.listings.create({
      data: {
        broker_id: brokerId,
        title,
        description,
        transaction_type_id,
        property_type_id,
        province,
        ward,
        address,
        area: area ?? null,
        price: priceBigInt,
        price_per_m2: (priceBigInt !== null && area ? Math.round(Number(priceBigInt) / parseFloat(area)) : null),
        price_per_frontage_meter: price_per_frontage_meter ? parseFloat(price_per_frontage_meter) : null,
        direction,
        slug,
        status: 'Đang chờ duyệt',
        contact_name: finalContactName,
        contact_phone: finalContactPhone,
        listing_code: finalListingCode,
        floor_count: floor_count ?? null,
        bedroom_count: bedroom_count ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
      include: {
        brokers: { select: { id: true, full_name: true, phone: true, email: true, avatar_url: true } }
      }
    });

    let processedTags: Awaited<ReturnType<typeof processTagsForListing>> = [];
    if (tags && Array.isArray(tags) && tags.length > 0) {
      try {
        processedTags = await processTagsForListing(tags, listing.id);
      } catch (tagError) {
        console.error('Error processing tags:', tagError);
      }
    }

    // Create feature hashtags
    const processedFeatureHashtags: string[] = [];
    if (feature_hashtag_ids && Array.isArray(feature_hashtag_ids) && feature_hashtag_ids.length > 0) {
      try {
        for (const featureHashtagId of feature_hashtag_ids) {
          await prisma.listing_feature_hashtags.create({
            data: {
              listing_id: listing.id,
              feature_hashtag_id: featureHashtagId
            }
          });
          processedFeatureHashtags.push(featureHashtagId);
        }
        console.log(`Created ${processedFeatureHashtags.length} feature hashtags for listing ${listing.id}`);
      } catch (featureError) {
        console.error('Error creating feature hashtags:', featureError);
      }
    }

    return NextResponse.json(serializeData({
      success: true,
      data: listing,
      tags: processedTags,
      feature_hashtag_ids: processedFeatureHashtags,
      message: 'Tạo bài đăng thành công'
    }), { status: 201 });

  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
