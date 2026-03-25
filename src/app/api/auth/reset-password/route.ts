import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import * as bcrypt from "bcryptjs";
import { resetTokens } from "@/src/lib/verification_store";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, resetToken } = await request.json();

    if (!email || !newPassword || !resetToken) {
      return NextResponse.json({ success: false, error: "Email, reset token and new password are required" }, { status: 400 });
    }

    const storedResetToken = resetTokens.get(email);
    if (!storedResetToken || storedResetToken.token !== resetToken) {
      return NextResponse.json({ success: false, error: "Mã xác thực không hợp lệ hoặc đã hết hạn" }, { status: 400 });
    }

    if (Date.now() > storedResetToken.expireAt) {
      resetTokens.delete(email);
      return NextResponse.json({ success: false, error: "Mã xác thực đã hết hạn" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find broker by email
    const broker = await prisma.brokers.findFirst({
        where: { email },
        select: { id: true }
    });

    if (!broker) {
      return NextResponse.json({ success: false, error: "Tài khoản không tồn tại" }, { status: 404 });
    }

    // Update broker password by ID
    await prisma.brokers.update({
      where: { id: broker.id },
      data: { 
        password_hash: hashedPassword,
        is_email_verified: true
      },
    });

    // Hash success - clear the reset token
    resetTokens.delete(email);

    return NextResponse.json({ 
      success: true, 
      message: "Password reset successfully" 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 });
  }
}
