import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signAccessToken } from '@/src/app/modules/auth/jwt';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('refresh-token')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: No refresh token provided' },
                { status: 401 }
            );
        }

        const payload = await verifyToken(refreshToken);

        if (!payload || !(payload as Record<string, unknown>).id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        const { exp, iat, ...userData } = payload as Record<string, unknown>;

        // [FIX] Verify user still exists and is active in DB
        const user = await prisma.brokers.findUnique({
            where: { id: userData.id as string },
            select: { is_active: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: User no longer exists' },
                { status: 401 }
            );
        }

        if (!user.is_active) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Account is locked' },
                { status: 403 }
            );
        }

        // Generate new access token
        const accessToken = await signAccessToken(userData);

        return NextResponse.json({
            success: true,
            data: {
                access_token: accessToken
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
