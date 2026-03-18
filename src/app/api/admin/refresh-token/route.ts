import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken, signAdminAccessToken } from '@/src/app/modules/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('admin-refresh-token')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { success: false, error: 'Refresh token không tồn tại' },
                { status: 401 }
            );
        }

        // Verify refresh token
        const payload = await verifyToken(refreshToken);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Refresh token không hợp lệ' },
                { status: 401 }
            );
        }

        const admin = await prisma.admins.findUnique({
            where: { id: payload.id as string }
        });

        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Admin không tồn tại' },
                { status: 401 }
            );
        }

        const { password_hash, ...safeAdmin } = admin;

        const accessToken = await signAdminAccessToken(safeAdmin);
        return NextResponse.json({
            success: true,
            data: {
                access_token: accessToken
            },
            message: 'Làm mới token thành công'
        });

    } catch (error) {
        console.error('Error refreshing admin token:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi server khi làm mới token' },
            { status: 500 }
        );
    }
}