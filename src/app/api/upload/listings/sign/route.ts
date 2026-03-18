import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    // Get Cloudinary configuration from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' },
        { status: 500 }
      );
    }

    // Generate timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Create signature for Cloudinary upload
    const paramsToSign = `folder=finland/listings&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign)
      .digest('hex');

    return NextResponse.json({
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder: 'finland/listings'
    });

  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}
