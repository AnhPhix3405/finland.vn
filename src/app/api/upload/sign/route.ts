import { NextRequest, NextResponse } from "next/server"
import cloudinary from "@/src/lib/cloudinary"
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

async function verifyAuth(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return { valid: false, error: 'Vui lòng đăng nhập', status: 401 };
    }
    
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
        return { valid: false, error: 'Tài khoản đã bị khóa', status: 403 };
    }

    return { valid: true };
}

export async function POST(request: NextRequest) {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const timestamp = Math.round(new Date().getTime() / 1000)

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "finland/attachments",
      upload_preset: "finland"
    },
    process.env.CLOUDINARY_API_SECRET!
  )

  return NextResponse.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY
  })
}