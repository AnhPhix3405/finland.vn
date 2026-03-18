import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { comparePassword } from '@/src/app/modules/auth/passwordHasher';
import { signAdminAccessToken, signAdminRefreshToken } from '@/src/app/modules/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            );
        }

        const admin = await prisma.admins.findFirst({
            where: { email }
        });

        if (!admin || !admin.password_hash) {
            return NextResponse.json(
                { success: false, error: 'Email hoặc mật khẩu không chính xác' },
                { status: 401 }
            );
        }

        const isMatch = await comparePassword(password, admin.password_hash);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, error: 'Email hoặc mật khẩu không chính xác' },
                { status: 401 }
            );
        }

        const { password_hash, ...safeAdmin } = admin;

        const accessToken = await signAdminAccessToken(safeAdmin);
        const refreshToken = await signAdminRefreshToken(safeAdmin);

        const response = NextResponse.json({
            success: true,
            data: {
                ...safeAdmin,
                role: 'admin',
                access_token: accessToken
            },
            message: 'Đăng nhập admin thành công'
        });

        // response.cookies.delete('admin-refresh-token');

        // response.cookies.set({
        //     name: 'admin-refresh-token',
        //     value: refreshToken,
        //     httpOnly: true,
        //     maxAge: 30 * 24 * 60 * 60, // 30 days
        //     sameSite: 'strict',
        //     path: '/',
        // });
        response.cookies.set({
            name: 'admin-refresh-token',
            value: refreshToken,
            httpOnly: true,
            maxAge: 60, // 60 seconds
            sameSite: 'strict',
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Error admin login:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi server khi đăng nhập' },
            { status: 500 }
        );
    }
}
