import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { hashPassword } from '@/src/app/modules/auth/passwordHasher';
import { verifyToken } from '@/src/app/modules/auth/jwt';

// Helper to verify admin token
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { valid: false, error: 'Token không tồn tại' };
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return { valid: false, error: 'Token không hợp lệ hoặc không phải admin' };
  }

  return { valid: true, payload };
}

// GET - Lấy danh sách môi giới (Admin Only)
export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const province = searchParams.get('province');
    const ward = searchParams.get('ward');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (province) where.province = province;
    if (ward) where.ward = ward;
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [brokers, total] = await Promise.all([
      prisma.brokers.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.brokers.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: brokers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching brokers:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy danh sách môi giới' },
      { status: 500 }
    );
  }
}

// PATCH - Cập nhật môi giới theo phone (Admin Only)
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, password, ...updateData } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Số điện thoại môi giới là bắt buộc' },
        { status: 400 }
      );
    }

    // Tìm broker theo phone để lấy id
    const existingBroker = await prisma.brokers.findFirst({
      where: { phone }
    });

    if (!existingBroker) {
      return NextResponse.json(
        { success: false, error: 'Môi giới không tồn tại' },
        { status: 404 }
      );
    }

    const id = existingBroker.id;

    // Kiểm tra phone/email trùng lặp (nếu có thay đổi)
    if (updateData.phone || updateData.email) {
      const duplicateBroker = await prisma.brokers.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(updateData.phone ? [{ phone: updateData.phone }] : []),
                ...(updateData.email ? [{ email: updateData.email }] : [])
              ]
            }
          ]
        }
      });

      if (duplicateBroker) {
        let errorMessage = 'Dữ liệu đã tồn tại';
        if (duplicateBroker.phone === updateData.phone) errorMessage = 'Số điện thoại đã tồn tại';
        if (duplicateBroker.email === updateData.email) errorMessage = 'Email đã tồn tại';

        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 400 }
        );
      }
    }

    // Xử lý hash password nếu client gửi password mới
    const finalUpdateData: Record<string, unknown> = { ...updateData };
    if (password) {
      finalUpdateData.password_hash = await hashPassword(password);
    }

    // Xử lý is_active
    if (finalUpdateData.is_active !== undefined) {
      finalUpdateData.is_active = Boolean(finalUpdateData.is_active);
    }

    // Cập nhật môi giới
    const updatedBroker = await prisma.brokers.update({
      where: { id },
      data: {
        ...finalUpdateData,
        updated_at: new Date()
      }
    });

    const { password_hash: _, ...safeUpdatedBroker } = updatedBroker;

    return NextResponse.json({
      success: true,
      data: safeUpdatedBroker,
      message: 'Cập nhật môi giới thành công'
    });

  } catch (error) {
    console.error('Error updating broker:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật môi giới' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa môi giới (Admin Only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID môi giới là bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra môi giới có tồn tại không
    const existingBroker = await prisma.brokers.findUnique({
      where: { id }
    });

    if (!existingBroker) {
      return NextResponse.json(
        { success: false, error: 'Môi giới không tồn tại' },
        { status: 404 }
      );
    }

    // Kiểm tra xem môi giới có tin đăng nào không
    const listingsCount = await prisma.listings.count({
      where: { broker_id: id }
    });

    if (listingsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Không thể xóa môi giới có tin đăng' },
        { status: 400 }
      );
    }

    // Xóa môi giới
    await prisma.brokers.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa môi giới thành công'
    });

  } catch (error) {
    console.error('Error deleting broker:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa môi giới' },
      { status: 500 }
    );
  }
}