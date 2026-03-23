import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json(
        { success: false, message: 'Endpoint is disabled' },
        { status: 404 }
    );
}

// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/src/lib/prisma';
// import { hashPassword } from '@/src/app/modules/auth/passwordHasher';

// export async function POST(request: NextRequest) {
//     try {
//         const { email, name, password } = await request.json();

//         // Validation
//         if (!email || !name || !password) {
//             return NextResponse.json(
//                 { success: false, error: 'Email, tên và mật khẩu là bắt buộc' },
//                 { status: 400 }
//             );
//         }

//         // Kiểm tra xem đã có admin nào chưa
//         const existingAdminCount = await prisma.admins.count();
//         if (existingAdminCount > 0) {
//             return NextResponse.json(
//                 { success: false, error: 'Hệ thống đã có admin. Không thể tạo admin mới qua endpoint này.' },
//                 { status: 403 }
//             );
//         }

//         // Validate email format
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(email)) {
//             return NextResponse.json(
//                 { success: false, error: 'Email không hợp lệ' },
//                 { status: 400 }
//             );
//         }

//         // Validate password strength
//         if (password.length < 6) {
//             return NextResponse.json(
//                 { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' },
//                 { status: 400 }
//             );
//         }

//         // Hash password
//         const passwordHash = await hashPassword(password);

//         // Tạo admin đầu tiên
//         const newAdmin = await prisma.admins.create({
//             data: {
//                 email: email.toLowerCase().trim(),
//                 name: name.trim(),
//                 password_hash: passwordHash
//             }
//         });

//         // Trả về thông tin admin (không bao gồm password_hash)
//         const { password_hash: _, ...safeAdmin } = newAdmin;

//         return NextResponse.json({
//             success: true,
//             data: safeAdmin,
//             message: 'Tạo admin đầu tiên thành công'
//         }, { status: 201 });

//     } catch (error: unknown) {
//         console.error('Error creating first admin:', error);
        
//         // Handle unique constraint violation (duplicate email)
//         if (error instanceof Object && 'code' in error && 'meta' in error && error.code === 'P2002' && (error.meta as Record<string, unknown>)?.target && Array.isArray((error.meta as Record<string, unknown>).target) && ((error.meta as Record<string, unknown>).target as string[]).includes('email')) {
//             return NextResponse.json(
//                 { success: false, error: 'Email đã được sử dụng' },
//                 { status: 400 }
//             );
//         }

//         return NextResponse.json(
//             { success: false, error: 'Lỗi server khi tạo admin' },
//             { status: 500 }
//         );
//     }
// }