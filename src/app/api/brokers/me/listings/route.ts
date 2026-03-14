import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { jwtVerify } from 'jose';

// Helper function to handle BigInt serialization
function serializeData(data: Record<string, unknown> | unknown[]) {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_DO_NOT_USE_IN_PROD';
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Verify current broker via token and fetch all their listings (regardless of status)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header is missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token & extract broker data
    let payload;
    try {
      const { payload: jwtPayload } = await jwtVerify(token, secretKey);
      payload = jwtPayload;
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Check if the user is a broker by ID structure or available info
    const brokerId = payload.id as string;
    if (!brokerId) {
       return NextResponse.json(
        { success: false, error: 'Not authorized as a broker' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      broker_id: brokerId
    };
    
    // Allow filtering by exact status text in dashboard if needed
    if (status && status !== 'all') {
       whereClause.status = status;
    }

    const listings = await prisma.listings.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        property_types: {
          select: { name: true, hashtag: true }
        },
        transaction_types: {
          select: { name: true, hashtag: true }
        },
        brokers: {
          select: { full_name: true }
        }
      },
      orderBy: {
        id: 'desc' // Newest UUIDs generally sort first when ordered desc, but assuming it means newest creation.
      }
    });

    const total = await prisma.listings.count({ where: whereClause });

    return NextResponse.json(serializeData({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }));

  } catch (error) {
    console.error('Error fetching broker listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch broker listings' },
      { status: 500 }
    );
  }
}
