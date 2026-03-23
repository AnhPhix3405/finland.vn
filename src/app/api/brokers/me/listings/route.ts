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

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const brokerId = auth.brokerId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const transactionType = searchParams.get('transaction_type') || '';

    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      broker_id: brokerId
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.title = { contains: search, mode: 'insensitive' };
    }

    if (transactionType) {
      whereClause.transaction_types = {
        hashtag: transactionType
      };
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
        updated_at: 'desc'
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
