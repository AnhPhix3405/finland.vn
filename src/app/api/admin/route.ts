import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

export async function GET(request: NextRequest) {
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

        // Get admin info
        const admin = await prisma.admins.findUnique({
            where: { id: payload.id as string },
            select: {
                id: true,
                email: true,
                name: true,
                created_at: true
            }
        });

        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Admin không tồn tại' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...admin,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('Error getting admin info:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi server khi lấy thông tin admin' },
            { status: 500 }
        );
    }
}
