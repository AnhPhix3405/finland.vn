import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/src/app/modules/auth/jwt';

async function verifyAuth(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return { valid: false, error: 'Vui lòng đăng nhập', status: 401 };
    }
    
    try {
        const payload = await verifyToken(token);
        if (!payload || !(payload as Record<string, unknown>).id) {
            return { valid: false, error: 'Token không hợp lệ', status: 401 };
        }
        
        const role = (payload as Record<string, unknown>).role as string;
        
        if (role === 'admin') {
            return { valid: true };
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

        return { valid: true };
    } catch {
        return { valid: false, error: 'Token không hợp lệ', status: 401 };
    }
}

// GET - Lấy danh sách tất cả môi giới
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search');
    const province = searchParams.get('province');
    const ward = searchParams.get('ward');


    const skip = (page - 1) * limit;

    // Tạo điều kiện where
    const where: Prisma.brokersWhereInput = {};

    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active === 'true';
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
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, phone, avatar_url, full_name, email, province, ward, address, bio } = body;

    // Use id if provided, otherwise find broker by phone
    let brokerId = id;

    if (!brokerId && phone) {
      const broker = await prisma.brokers.findFirst({
        where: { phone },
        select: { id: true }
      });
      if (broker) {
        brokerId = broker.id;
      }
    }

    if (!brokerId) {
      return NextResponse.json(
        { success: false, error: 'ID broker hoặc số điện thoại là bắt buộc' },
        { status: 400 }
      );
    }

    // Update broker by id
    const updatedBroker = await prisma.brokers.update({
      where: { id: brokerId },
      data: {
        ...(avatar_url !== undefined && { avatar_url }),
        ...(full_name !== undefined && { full_name }),
        ...(email !== undefined && { email }),
        ...(province !== undefined && { province }),
        ...(ward !== undefined && { ward }),
        ...(address !== undefined && { address }),
        ...(bio !== undefined && { bio }),
      }
    });

    const { password_hash, ...safeBroker } = updatedBroker;

    return NextResponse.json({
      success: true,
      data: safeBroker,
      message: 'Cập nhật thông tin thành công'
    });

  } catch (error) {
    console.error('Error updating broker:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật thông tin broker' },
      { status: 500 }
    );
  }
}
