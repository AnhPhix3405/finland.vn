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
    if (!payload || !payload.id) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
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

    // Find broker
    const broker = await prisma.brokers.findUnique({
      where: { id: payload.id as string }
    });

    if (!broker) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tài khoản' },
        { status: 404 }
      );
    }

    // If broker has password, verify current password
    if (broker.password_hash) {
      const isMatch = await comparePassword(currentPassword, broker.password_hash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu hiện tại không đúng' },
          { status: 400 }
        );
      }
    } else {
      // Broker registered via Google, no password set yet
      return NextResponse.json(
        { success: false, error: 'Tài khoản này đăng nhập bằng Google, vui lòng đặt mật khẩu trong cài đặt tài khoản' },
        { status: 400 }
      );
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await prisma.brokers.update({
      where: { id: payload.id as string },
      data: { password_hash: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi đổi mật khẩu' },
      { status: 500 }
    );
  }
}
