import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verificationCodes, resetTokens } from "@/src/lib/verification_store";
import { verifyToken } from "@/src/app/modules/auth/jwt";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Email and code are required" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return NextResponse.json({ success: false, error: "Mã xác thực không tồn tại hoặc đã hết hạn" }, { status: 400 });
    }

    if (Date.now() > storedData.expireAt) {
      verificationCodes.delete(email);
      return NextResponse.json({ success: false, error: "Mã xác thực đã hết hạn" }, { status: 400 });
    }

    if (storedData.code !== code) {
      return NextResponse.json({ success: false, error: "Mã xác thực không chính xác" }, { status: 400 });
    }

    let brokerId = "";
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.id) {
        brokerId = payload.id as string;
      }
    }

    if (!brokerId) {
      // Unauthenticated, find broker by email
      const broker = await prisma.brokers.findFirst({
        where: { email },
        select: { id: true }
      });
      if (broker) {
        brokerId = broker.id;
      } else {
        return NextResponse.json({ success: false, error: "Không tìm thấy người dùng với email này" }, { status: 404 });
      }
    }

    // Success - update DB
    const updatedBroker = await prisma.brokers.update({
      where: { id: brokerId },
      data: { is_email_verified: true },
    });

    // Remove code from map
    verificationCodes.delete(email);

    // Generate reset token for the final reset step (expires in 1 min)
    const resetToken = randomBytes(32).toString("hex");
    resetTokens.set(email, {
      token: resetToken,
      expireAt: Date.now() + 60 * 1000
    });

    return NextResponse.json({ 
      success: true, 
      message: "Xác thực email thành công",
      resetToken, // Return the token to FE
      data: {
          is_email_verified: true
      }
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json({ success: false, error: "Lỗi trong quá trình xác thực" }, { status: 500 });
  }
}
