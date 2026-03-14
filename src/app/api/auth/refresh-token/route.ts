import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signAccessToken } from '@/src/app/modules/auth/jwt';

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

        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        // Generate new access token
        // Remove exp and iat from payload to sign a fresh one
        const { exp, iat, ...userData } = payload as Record<string, unknown>;
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
