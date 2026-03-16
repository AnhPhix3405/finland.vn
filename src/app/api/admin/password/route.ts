import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';
import { comparePassword, hashPassword } from '@/src/app/modules/auth/passwordHasher';

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token không tồn tại' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ hoặc không phải admin' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Find admin
    const admin = await prisma.admins.findUnique({
      where: { id: payload.id as string }
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tài khoản admin' },
        { status: 404 }
      );
    }

    // Verify current password
    if (admin.password_hash) {
      const isMatch = await comparePassword(currentPassword, admin.password_hash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu hiện tại không đúng' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Tài khoản admin không có mật khẩu' },
        { status: 400 }
      );
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.admins.update({
      where: { id: payload.id as string },
      data: { password_hash: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Error changing admin password:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi đổi mật khẩu' },
      { status: 500 }
    );
  }
}
