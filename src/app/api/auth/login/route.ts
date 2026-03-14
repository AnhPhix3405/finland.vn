import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { comparePassword } from '@/src/app/modules/auth/passwordHasher';
import { signAccessToken, signRefreshToken } from '@/src/app/modules/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        const { phone, password } = await request.json();

        if (!phone || !password) {
            return NextResponse.json(
                { success: false, error: 'Số điện thoại và mật khẩu là bắt buộc' },
                { status: 400 }
            );
        }

        const broker = await prisma.brokers.findFirst({
            where: { phone }
        });

        if (!broker || !broker.password_hash) {
            return NextResponse.json(
                { success: false, error: 'Số điện thoại hoặc mật khẩu không chính xác' },
                { status: 401 }
            );
        }

        const isMatch = await comparePassword(password, broker.password_hash);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, error: 'Số điện thoại hoặc mật khẩu không chính xác' },
                { status: 401 }
            );
        }

        const { password_hash, ...safeBroker } = broker;

        const accessToken = await signAccessToken({ ...safeBroker, role: 'broker' });
        const refreshToken = await signRefreshToken({ ...safeBroker, role: 'broker' });

        const response = NextResponse.json({
            success: true,
            data: {
                ...safeBroker,
                role: 'broker',
                access_token: accessToken
            },
            message: 'Đăng nhập thành công'
        });

        response.cookies.set({
            name: 'refresh-token',
            value: refreshToken,
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60, // 30 days
            sameSite: 'strict',
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi trong quá trình đăng nhập' },
            { status: 500 }
        );
    }
}
