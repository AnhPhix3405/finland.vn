import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verificationCodes } from "@/src/lib/verification_store";
import { verifyToken } from "@/src/app/modules/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Email and code are required" }, { status: 400 });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return NextResponse.json({ success: false, error: "Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng gửi lại mã mới." }, { status: 400 });
    }

    if (Date.now() > storedData.expireAt) {
      verificationCodes.delete(email);
      return NextResponse.json({ success: false, error: "Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới." }, { status: 400 });
    }

    if (storedData.code !== code) {
      return NextResponse.json({ success: false, error: "Mã xác thực không chính xác" }, { status: 400 });
    }

    // Success - update DB
    const updatedBroker = await prisma.brokers.update({
      where: { id: payload.id as string },
      data: { is_email_verified: true },
    });

    // Remove code from map
    verificationCodes.delete(email);

    return NextResponse.json({ 
      success: true, 
      message: "Xác thực email thành công",
      data: {
          is_email_verified: true
      }
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json({ success: false, error: "Lỗi trong quá trình xác thực" }, { status: 500 });
  }
}
