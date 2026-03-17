import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { Prisma } from '@prisma/client';
import { jwtVerify } from 'jose';

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

// PATCH - Cập nhật thông tin broker (avatar_url, etc.)
export async function PATCH(request: NextRequest) {
  console.log('🔹 [API BROKERS PATCH] Received request');
  try {
    const body = await request.json();
    console.log('🔹 [API BROKERS PATCH] Request body:', body);
    
    const { id, phone, avatar_url, full_name, email, province, ward, address, specialization, bio } = body;

    // Use id if provided, otherwise find broker by phone
    let brokerId = id;
    
    if (!brokerId && phone) {
      console.log('🔹 [API BROKERS PATCH] No id, looking up by phone:', phone);
      const broker = await prisma.brokers.findFirst({
        where: { phone },
        select: { id: true }
      });
      if (broker) {
        brokerId = broker.id;
        console.log('🔹 [API BROKERS PATCH] Found broker id:', brokerId);
      }
    }

    if (!brokerId) {
      console.log('🔹 [API BROKERS PATCH] No brokerId found!');
      return NextResponse.json(
        { success: false, error: 'ID broker hoặc số điện thoại là bắt buộc' },
        { status: 400 }
      );
    }

    // Update broker by id
    console.log('🔹 [API BROKERS PATCH] Updating broker id:', brokerId);
    const updatedBroker = await prisma.brokers.update({
      where: { id: brokerId },
      data: {
        ...(avatar_url !== undefined && { avatar_url }),
        ...(full_name !== undefined && { full_name }),
        ...(email !== undefined && { email }),
        ...(province !== undefined && { province }),
        ...(ward !== undefined && { ward }),
        ...(address !== undefined && { address }),
        ...(specialization !== undefined && { specialization }),
        ...(bio !== undefined && { bio }),
      }
    });
    console.log('🔹 [API BROKERS PATCH] Updated broker:', updatedBroker);

    const { password_hash, ...safeBroker } = updatedBroker;

    return NextResponse.json({
      success: true,
      data: safeBroker,
      message: 'Cập nhật thông tin thành công'
    });

  } catch (error) {
    console.error('🔹 [API BROKERS PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật thông tin broker' },
      { status: 500 }
    );
  }
}
