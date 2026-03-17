import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { hashPassword } from '@/src/app/modules/auth/passwordHasher';
import { signAccessToken, signRefreshToken } from '@/src/app/modules/auth/jwt';

const VALID_PROVINCES = [
    "Tuyên Quang", "Lào Cai", "Thái Nguyên", "Phú Thọ", "Bắc Ninh", "Hưng Yên", "Hải Phòng", "Ninh Bình",
    "Quảng Trị", "Đà Nẵng", "Quảng Ngãi", "Gia Lai", "Khánh Hoà", "Lâm Đồng", "Đắk Lắk", "Hồ Chí Minh",
    "Đồng Nai", "Tây Ninh", "Cần Thơ", "Vĩnh Long", "Đồng Tháp", "Cà Mau", "An Giang", "Hà Nội", "Huế",
    "Lai Châu", "Điện Biên", "Sơn La", "Lạng Sơn", "Quảng Ninh", "Thanh Hoá", "Nghệ An", "Hà Tĩnh", "Cao Bằng"
];

function validatePhone(phone: string): string | null {
    if (!phone) return "Số điện thoại là bắt buộc";
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phone)) return "Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0";
    return null;
}

function validateEmail(email: string): string | null {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email không hợp lệ";
    return null;
}

function validateFullName(full_name: string): string | null {
    if (!full_name) return "Họ tên là bắt buộc";
    const trimmed = full_name.trim();
    if (trimmed.length < 2) return "Họ tên phải có ít nhất 2 ký tự";
    if (trimmed.length > 100) return "Họ tên không được quá 100 ký tự";
    return null;
}

function validatePassword(password: string): string | null {
    if (!password) return "Mật khẩu là bắt buộc";
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    if (password.length > 50) return "Mật khẩu không được quá 50 ký tự";
    return null;
}

function validateProvince(province: string): string | null {
    if (!province) return "Vui lòng chọn Tỉnh/Thành phố";
    if (!VALID_PROVINCES.includes(province)) return "Tỉnh/Thành phố không hợp lệ";
    return null;
}

function validateWard(ward: string): string | null {
    if (!ward) return "Vui lòng chọn Phường/Xã";
    if (ward.trim().length < 2 || ward.trim().length > 100) return "Phường/Xã không hợp lệ";
    return null;
}

function validateReferrerPhone(referrer_phone: string): string | null {
    if (!referrer_phone) return null;
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(referrer_phone)) return "Số điện thoại người giới thiệu không hợp lệ";
    return null;
}

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
            address,
            referrer_phone
        } = body;

        const errors: Record<string, string> = {};

        const phoneError = validatePhone(phone);
        if (phoneError) errors.phone = phoneError;

        const emailError = validateEmail(email);
        if (emailError) errors.email = emailError;

        const fullNameError = validateFullName(full_name);
        if (fullNameError) errors.full_name = fullNameError;

        const passwordError = validatePassword(password);
        if (passwordError) errors.password = passwordError;

        const provinceError = validateProvince(province);
        if (provinceError) errors.province = provinceError;

        const wardError = validateWard(ward);
        if (wardError) errors.ward = wardError;

        const referrerPhoneError = validateReferrerPhone(referrer_phone);
        if (referrerPhoneError) errors.referrer_phone = referrerPhoneError;

        if (Object.keys(errors).length > 0) {
            return NextResponse.json(
                { success: false, error: "Dữ liệu không hợp lệ", details: errors },
                { status: 400 }
            );
        }

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
                address,
                referrer_phone,
                is_active: true
            }
        });

        const { password_hash: _, ...safeBroker } = newBroker;
        console.log('🔹 [API REGISTER] Created broker:', safeBroker);

        // Return success without tokens - user must login manually
        return NextResponse.json({
            success: true,
            data: { id: safeBroker.id, phone: safeBroker.phone },
            message: 'Đăng ký tài khoản môi giới thành công. Vui lòng đăng nhập.'
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi trong quá trình đăng ký' },
            { status: 500 }
        );
    }
}
