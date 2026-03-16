import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { processTagsForListing } from '@/src/app/modules/tags.service.server';
import { verifyToken } from '@/src/app/modules/auth/jwt';

// Helper function to handle BigInt serialization
function serializeData(data: Record<string, unknown> | unknown[]) {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

// Helper function to convert Vietnamese text to URL-friendly slug
function createSlug(text: string): string {
  // Vietnamese character mappings
  const vietnameseMap: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  };

  let slug = text.toLowerCase();
  
  // Replace Vietnamese characters
  for (const [viet, eng] of Object.entries(vietnameseMap)) {
    slug = slug.replace(new RegExp(viet, 'g'), eng);
  }
  
  return slug
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure unique slug
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  let counter = 1;

  // Check if slug already exists
  while (true) {
    const existingListing = await prisma.listings.findFirst({
      where: { slug }
    });

    if (!existingListing) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
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

    // Determine sort order
    let orderBy: Record<string, unknown> = { id: 'desc' };
    
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
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

    // Validate required fields
    const requiredFields = ['broker_id', 'title', 'description', 'province', 'ward'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Extract valid fields
    const {
      broker_id, title, description, transaction_type_id,
      property_type_id, province, ward, address,
      area, width, length, price, direction, tags,
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

    // Generate slug from title + listing_code (without FIN prefix)
    // Example: "anh la phi" + "260001" -> "anh-la-phi-260001"
    const titleSlug = createSlug(title);
    const listingCodeNumber = finalListingCode.replace('FIN', ''); // e.g., "260001"
    let finalSlug = `${titleSlug}-${listingCodeNumber}`;

    // Ensure uniqueness
    let counter = 1;
    let uniqueSlug = finalSlug;
    while (true) {
      const existingListing = await prisma.listings.findFirst({
        where: { slug: uniqueSlug }
      });
      if (!existingListing) {
        finalSlug = uniqueSlug;
        break;
      }
      uniqueSlug = `${titleSlug}-${listingCodeNumber}-${counter}`;
      counter++;
    }

    console.log('Generated slug:', finalSlug);

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
        width: width ?? null,
        length: length ?? null,
        price: priceBigInt,
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
