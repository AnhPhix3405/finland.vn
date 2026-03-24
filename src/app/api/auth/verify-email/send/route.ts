import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/src/lib/email_transporter";
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
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = Date.now() + 60 * 1000; // 1 minute

    // Store in map
    verificationCodes.set(email, { code, expireAt });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'phamphi30042005102@gmail.com',
      to: email,
      subject: "Mã xác thực Email - Finland Project",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">Xác thực Email</h2>
          <p>Chào bạn, mã xác thực để xác minh email của bạn là:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; margin: 20px 0; text-align: center; background: #f0fdf4; padding: 15px; border-radius: 8px;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">Mã này sẽ hết hạn sau 1 phút.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });

    console.log(`[VERIFY] Sent code ${code} to ${email}`);

    return NextResponse.json({ success: true, message: "Mã xác thực đã được gửi" });
  } catch (error: any) {
    console.error("Error sending verification code:", error);
    return NextResponse.json({ success: false, error: "Lỗi khi gửi email: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
