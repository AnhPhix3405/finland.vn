import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Lấy danh sách tất cả môi giới
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search');
    const specialization = searchParams.get('specialization');
    const province = searchParams.get('province');
    const ward = searchParams.get('ward');


    const skip = (page - 1) * limit;

    // Tạo điều kiện where
    const where: Prisma.brokersWhereInput = {};

    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    if (province) {
      where.province = { contains: province, mode: 'insensitive' };
    }
    if (ward) {
      where.ward = { contains: ward, mode: 'insensitive' };
    }


    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Lấy tổng số bản ghi
    const totalCount = await prisma.brokers.count({ where });

    // Lấy danh sách môi giới
    const brokers = await prisma.brokers.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    // Trả về danh sách môi giới (không bao gồm password_hash)
    const safeBrokers = brokers.map(({ password_hash, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: safeBrokers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });


  } catch (error) {
    console.error('Error fetching brokers:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy danh sách môi giới' },
      { status: 500 }
    );
  }
}
