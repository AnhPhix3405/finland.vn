import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { processTagsForListing } from '@/src/app/modules/tags.service.server';
import { verifyToken } from '@/src/app/modules/auth/jwt';
import { customAlphabet } from 'nanoid';
import { removeVietnameseTones } from '@/src/lib/slug-utils';

// Helper function to handle BigInt serialization
function serializeData(data: Record<string, unknown> | unknown[]) {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
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

    // Get current broker from token if logged in
    let currentBrokerId: string | null = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('GET /api/listings - Auth Check:', {
      authHeader: authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : 'NO HEADER',
      hasToken: !!token,
      tokenLength: token?.length || 0
    });

    if (token) {
      try {
        const payload = await verifyToken(token);
        console.log('Token verification result:', {
          payloadKeys: Object.keys(payload || {}),
          payload: payload
        });

        if (payload && (payload as Record<string, unknown>).id) {
          currentBrokerId = (payload as Record<string, unknown>).id as string;
          console.log('✓ currentBrokerId extracted:', currentBrokerId);
        } else {
          console.log('✗ No id in payload');
        }
      } catch (err) {
        // Token invalid or expired, continue without broker context
        console.error('✗ Token verification failed:', err instanceof Error ? err.message : String(err));
      }
    } else {
      console.log('✗ No token provided in Authorization header');
    }

    // Build where clause based on filters
    const andConditions: Record<string, unknown>[] = [
      {
        status: {
          notIn: ['Đang chờ duyệt', 'Đã ẩn', 'Bị từ chối']
        }
      }
    ];

    // Add province filter
    if (province && province !== 'all') {
      andConditions.push({ province });
      console.log('Added province filter:', province);
    }

    // Add ward filter
    if (ward && ward !== 'all') {
      andConditions.push({ ward });
      console.log('Added ward filter:', ward);
    }

    // Add price filters
    if (priceMin || priceMax) {
      const priceFilter: Record<string, unknown> = {};
      if (priceMin) {
        try {
          priceFilter.gte = BigInt(priceMin);
          console.log('Added priceMin filter:', priceMin);
        } catch (e) {
          console.error('Invalid priceMin value:', priceMin);
        }
      }
      if (priceMax) {
        try {
          priceFilter.lte = BigInt(priceMax);
          console.log('Added priceMax filter:', priceMax);
        } catch (e) {
          console.error('Invalid priceMax value:', priceMax);
        }
      }
      if (Object.keys(priceFilter).length > 0) {
        andConditions.push({ price: priceFilter });
      }
    }

    if (hashtags) {
      const hashtagList = hashtags.split(',').map(tag => tag.trim().toLowerCase());
      console.log('Filtering by hashtags:', hashtagList);

      // Find matching IDs from different tables
      const [transactionTypes, propertyTypes, tags] = await Promise.all([
        prisma.transaction_types.findMany({
          where: {
            hashtag: {
              in: hashtagList
            }
          },
          select: { id: true, hashtag: true }
        }),
        prisma.property_types.findMany({
          where: {
            hashtag: {
              in: hashtagList
            }
          },
          select: { id: true, hashtag: true }
        }),
        prisma.tags.findMany({
          where: {
            slug: {
              in: hashtagList
            }
          },
          select: { id: true, slug: true }
        })
      ]);

      console.log('Found transaction types:', transactionTypes);
      console.log('Found property types:', propertyTypes);
      console.log('Found tags:', tags);

      // Add transaction type condition if found
      if (transactionTypes.length > 0) {
        andConditions.push({
          transaction_type_id: {
            in: transactionTypes.map(t => t.id)
          }
        });
      }

      // Add property type condition if found
      if (propertyTypes.length > 0) {
        andConditions.push({
          property_type_id: {
            in: propertyTypes.map(p => p.id)
          }
        });
      }

      // Add tags condition if found
      if (tags.length > 0) {
        andConditions.push({
          tags: {
            some: {
              id: {
                in: tags.map(tag => tag.id)
              }
            }
          }
        });
      }
    }

    // Build final whereClause from andConditions
    let whereClause: Record<string, unknown>;
    if (andConditions.length === 1) {
      whereClause = andConditions[0];
    } else {
      whereClause = {
        AND: andConditions
      };
    }

    // Determine sort order - default is newest (created_at desc)
    let orderBy: Record<string, unknown> = { created_at: 'desc' };

    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { created_at: 'desc' };
    } else if (sortBy === 'oldest') {
      orderBy = { created_at: 'asc' };
    }

    const listings = await prisma.listings.findMany({
      where: whereClause,
      skip,
      take: limit,
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
      },
      orderBy: orderBy
    });

    // Get attachments for all listings (to use as fallback for thumbnail_url)
    const listingIds = listings.map(l => l.id);
    const attachments = await prisma.attachments.findMany({
      where: {
        target_id: { in: listingIds },
        target_type: 'listing'
      },
      orderBy: { sort_order: 'asc' }
    });

    // Group attachments by listing ID
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

    // Log without BigInt values to avoid serialization error
    const logWhereClause = JSON.parse(
      JSON.stringify(whereClause, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    console.log(`Found ${listings.length} listings with filters:`, {
      province,
      ward,
      priceMin,
      priceMax,
      hashtags,
      sortBy,
      whereClause: logWhereClause,
      totalInDb: total
    });

    // Log first listing details for debugging
    if (listings.length > 0) {
      const firstListing = listings[0];
      console.log('First listing sample:', {
        id: firstListing.id,
        title: firstListing.title,
        slug: firstListing.slug,
        transaction_type_id: firstListing.transaction_type_id,
        property_type_id: firstListing.property_type_id,
        status: firstListing.status,
        brokers: firstListing.brokers,
        tags: firstListing.tags
      });
    }

    // Fetch bookmarks for current broker if logged in
    let bookmarkMap: Record<string, boolean> = {};
    if (currentBrokerId) {
      console.log('Searching bookmarks for broker:', currentBrokerId);

      const bookmarks = await prisma.bookmarks.findMany({
        where: {
          broker_id: currentBrokerId,
          listing_id: {
            in: listings.map(l => l.id)
          }
        },
        select: {
          listing_id: true
        }
      });

      console.log('Bookmarks query result:', {
        where: {
          broker_id: currentBrokerId,
          listing_ids: listings.map(l => l.id)
        },
        found: bookmarks.length,
        bookmarks: bookmarks
      });

      bookmarkMap = Object.fromEntries(
        bookmarks.map(b => [b.listing_id, true])
      );

      console.log('GET /api/listings - Bookmarks found:', {
        brokerId: currentBrokerId,
        totalListings: listings.length,
        bookmarkedCount: bookmarks.length,
        bookmarkMap: bookmarkMap
      });
    } else {
      console.log('GET /api/listings - No broker logged in (currentBrokerId is null)');
    }

    // Add is_bookmarked and image to each listing
    // Use thumbnail_url if available, otherwise use first attachment's secure_url
    const listingsWithBookmarks = listings.map(listing => {
      const listingAttachments = attachmentsByListingId[listing.id] || [];
      const firstAttachment = listingAttachments[0];

      // Use thumbnail_url if available, otherwise use first attachment's secure_url or url
      const imageUrl = listing.thumbnail_url || firstAttachment?.secure_url || firstAttachment?.url || null;

      return {
        ...listing,
        is_bookmarked: bookmarkMap[listing.id] || false,
        thumbnail_url: imageUrl
      };
    });

    // Debug: Log what we're about to return
    console.log('API Response Debug:', {
      success: true,
      dataCount: listingsWithBookmarks.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      firstItem: listingsWithBookmarks[0] ? {
        id: listingsWithBookmarks[0].id,
        title: listingsWithBookmarks[0].title,
        slug: listingsWithBookmarks[0].slug,
        thumbnail_url: listingsWithBookmarks[0].thumbnail_url,
        price: listingsWithBookmarks[0].price?.toString()
      } : null
    });

    return NextResponse.json(serializeData({
      success: true,
      data: listingsWithBookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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
    const body = await request.json();
    const errors: Record<string, string> = {};

    // Validate broker_id
    if (!body.broker_id) {
      errors.broker_id = "ID người dùng là bắt buộc";
    }

    // Validate transaction_type_id
    if (!body.transaction_type_id) {
      errors.transactionType = "Vui lòng chọn loại giao dịch";
    }

    // Validate property_type_id
    if (!body.property_type_id) {
      errors.propertyType = "Vui lòng chọn loại bất động sản";
    }

    // Validate province
    if (!body.province) {
      errors.province = "Vui lòng chọn Tỉnh/Thành phố";
    }

    // Validate ward
    if (!body.ward) {
      errors.ward = "Vui lòng chọn Phường/Xã";
    }

    // Validate title
    if (!body.title || !body.title.trim()) {
      errors.title = "Tiêu đề là bắt buộc";
    } else if (body.title.trim().length < 10) {
      errors.title = "Tiêu đề phải có ít nhất 10 ký tự";
    } else if (body.title.trim().length > 200) {
      errors.title = "Tiêu đề không được quá 200 ký tự";
    }

    // Validate description
    if (!body.description || !body.description.trim()) {
      errors.description = "Mô tả là bắt buộc";
    } else if (body.description.trim().length < 50) {
      errors.description = "Mô tả phải có ít nhất 50 ký tự";
    } else if (body.description.trim().length > 10000) {
      errors.description = "Mô tả không được quá 10000 ký tự";
    }

    // Validate area
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

    // Validate price
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

    // Validate price_per_m2 (optional)
    if (body.price_per_m2 !== undefined && body.price_per_m2 !== null && body.price_per_m2 !== "") {
      const pricePerM2Num = parseFloat(body.price_per_m2);
      if (isNaN(pricePerM2Num) || pricePerM2Num <= 0) {
        errors.pricePerM2 = "Giá/m² phải lớn hơn 0";
      }
    }

    // Validate price_per_frontage_meter (optional)
    if (body.price_per_frontage_meter !== undefined && body.price_per_frontage_meter !== null && body.price_per_frontage_meter !== "") {
      const pricePerFrontageMeterNum = parseFloat(body.price_per_frontage_meter);
      if (isNaN(pricePerFrontageMeterNum) || pricePerFrontageMeterNum <= 0) {
        errors.pricePerFrontageMeter = "Giá/mặt tiền phải lớn hơn 0";
      }
    }

    // Validate floor_count (optional)
    if (body.floor_count) {
      const floorNum = parseInt(body.floor_count);
      if (isNaN(floorNum) || floorNum < 1 || floorNum > 100) {
        errors.floorCount = "Số tầng không hợp lệ";
      }
    }

    // Validate bedroom_count (optional)
    if (body.bedroom_count) {
      const bedroomNum = parseInt(body.bedroom_count);
      if (isNaN(bedroomNum) || bedroomNum < 0 || bedroomNum > 100) {
        errors.bedroomCount = "Số phòng ngủ không hợp lệ";
      }
    }

    // Validate contact_phone (optional)
    if (body.contact_phone && body.contact_phone.trim()) {
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(body.contact_phone.trim())) {
        errors.contactPhone = "Số điện thoại không hợp lệ";
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
          details: errors
        },
        { status: 400 }
      );
    }

    // Extract valid fields after validation
    const {
      broker_id, title, description, transaction_type_id,
      property_type_id, province, ward, address,
      area, price, price_per_m2, price_per_frontage_meter, direction, tags,
      contact_name: rawContactName, contact_phone: rawContactPhone,
      floor_count, bedroom_count
    } = body;

    // Generate listing_code (e.g. FIN26000001)
    const currentYearStr = new Date().getFullYear().toString().substring(2, 4);
    const prefix = `FIN${currentYearStr}`;

    // Find the latest listing code for the current year to determine next sequence
    const latestListing = await prisma.listings.findFirst({
      where: {
        listing_code: {
          startsWith: prefix
        }
      },
      orderBy: {
        listing_code: 'desc'
      },
      select: {
        listing_code: true
      }
    });

    let nextSequenceNumber = 1;
    if (latestListing && latestListing.listing_code) {
      // Extract the 6-digit sequence from the end
      const lastSeqStr = latestListing.listing_code.substring(5); // prefix is 5 chars e.g. FIN26
      const lastSeqNum = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeqNum)) {
        nextSequenceNumber = lastSeqNum + 1;
      }
    }

    // Format to 6 digits, e.g. 000001
    const sequenceStr = nextSequenceNumber.toString().padStart(6, '0');
    const finalListingCode = `${prefix}${sequenceStr}`;

    // Convert price to BigInt if provided and not empty
    let priceBigInt: bigint | null = null;
    if (price !== undefined && price !== null && price !== "") {
      try {
        priceBigInt = BigInt(price);
      } catch (e) {
        console.error("Error converting price to BigInt:", e);
      }
    }

    // Generate slug from title with nanoid random suffix
    const titleSlug = removeVietnameseTones(title);
    console.log('[POST] Title slug:', titleSlug);
    
    const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);
    const randomSuffix = nanoid();
    console.log('[POST] Random suffix:', randomSuffix);
    
    let finalSlug = `${titleSlug}-${randomSuffix}`;
    console.log('[POST] Initial slug:', finalSlug);

    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const existingListing = await prisma.listings.findFirst({
        where: { slug: finalSlug }
      });
      if (!existingListing) {
        break;
      }
      console.log('[POST] Slug conflict, regenerating...');
      const newRandom = nanoid();
      console.log('[POST] New random suffix:', newRandom);
      finalSlug = `${titleSlug}-${newRandom}`;
      attempts++;
    }

    console.log('[POST] Final generated slug:', finalSlug);

    // Resolve contact info: use provided value or fall back to broker data
    let finalContactName: string | null = null;
    let finalContactPhone: string | null = null;

    if (rawContactName && rawContactName.trim()) {
      finalContactName = rawContactName.trim();
    } else {
      // Fallback: fetch broker data
      const broker = await prisma.brokers.findUnique({
        where: { id: broker_id },
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
      // Only fetch if we haven't already fetched broker (fallback above sets it)
      const broker = await prisma.brokers.findUnique({
        where: { id: broker_id },
        select: { phone: true }
      });
      if (broker) {
        finalContactPhone = broker.phone;
      }
    }

    const listing = await prisma.listings.create({
      data: {
        broker_id,
        title,
        description,
        transaction_type_id,
        property_type_id,
        province,
        ward,
        address,
        area: area ?? null,
        price: priceBigInt,
        price_per_m2: price_per_m2 ? parseFloat(price_per_m2) : null,
        price_per_frontage_meter: price_per_frontage_meter ? parseFloat(price_per_frontage_meter) : null,
        direction,
        slug: finalSlug,
        status: 'Đang chờ duyệt',
        contact_name: finalContactName,
        contact_phone: finalContactPhone,
        listing_code: finalListingCode,
        floor_count: floor_count ?? null,
        bedroom_count: bedroom_count ?? null,
      },
      include: {
        brokers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            avatar_url: true
          }
        }
      }
    });

    // Process tags if provided
    let processedTags: Awaited<ReturnType<typeof processTagsForListing>> = [];
    if (tags && Array.isArray(tags) && tags.length > 0) {
      try {
        processedTags = await processTagsForListing(tags, listing.id);
        console.log(`Created/found ${processedTags.length} tags for listing ${listing.id}`);
      } catch (tagError) {
        console.error('Error processing tags:', tagError);
        // Don't fail the entire operation if tags fail
      }
    }

    return NextResponse.json(serializeData({
      success: true,
      data: listing,
      tags: processedTags,
      message: 'Listing created successfully'
    }));

  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
