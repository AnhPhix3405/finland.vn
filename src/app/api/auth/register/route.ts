import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { hashPassword } from '@/src/app/modules/auth/passwordHasher';
import { signAccessToken, signRefreshToken } from '@/src/app/modules/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            full_name,
            phone,
            email,
            password,
            province,
            ward,
            referrer_phone
        } = body;

        // Validation cơ bản
        if (!full_name || !phone || !password) {
            return NextResponse.json(
                { success: false, error: 'Họ tên, số điện thoại và mật khẩu là bắt buộc' },
                { status: 400 }
            );
        }

        // Kiểm tra trùng lặp
        const existingBroker = await prisma.brokers.findFirst({
            where: {
                OR: [
                    { phone: phone },
                    ...(email ? [{ email: email }] : [])
                ]
            }
        });

        if (existingBroker) {
            let errorMessage = 'Số điện thoại đã tồn tại';
            if (existingBroker.email === email) errorMessage = 'Email đã tồn tại';
            return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
        }

        // Hash mật khẩu
        const password_hash = await hashPassword(password);

        // Tạo broker mới
        const newBroker = await prisma.brokers.create({
            data: {
                full_name,
                phone,
                email,
                password_hash,
                province,
                ward,
                referrer_phone,
                is_active: true
            }
        });

        const { password_hash: _, ...safeBroker } = newBroker;
        console.log('🔹 [API REGISTER] Created broker:', safeBroker);

        // Auto-login after successful registration
        const accessToken = await signAccessToken({ ...safeBroker, role: 'broker' });
        const refreshToken = await signRefreshToken({ ...safeBroker, role: 'broker' });

        const responseData = {
            ...safeBroker,
            access_token: accessToken
        };
        console.log('🔹 [API REGISTER] Response data:', responseData);

        const response = NextResponse.json({
            success: true,
            data: responseData,
            message: 'Đăng ký tài khoản môi giới thành công'
        }, { status: 201 });

        response.cookies.set({
            name: 'refresh-token',
            value: refreshToken,
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60, // 30 days
            sameSite: 'strict',
            path: '/',
        });

        return response;

    } catch (error: unknown) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi trong quá trình đăng ký' },
            { status: 500 }
        );
    }
}
