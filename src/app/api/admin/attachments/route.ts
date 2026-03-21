import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import cloudinary from '@/src/lib/cloudinary';
import { verifyToken } from '@/src/app/modules/auth/jwt';

function serializeAttachments(attachments: Array<Record<string, unknown>>) {
    return attachments.map(item => ({
        ...item,
        size_bytes: (item.size_bytes as bigint)?.toString() || null
    }));
}

async function verifyAdminAuth(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return { valid: false, error: 'Vui lòng đăng nhập', status: 401 };
    }
    
    try {
        const payload = await verifyToken(token);
        if (!payload || !(payload as Record<string, unknown>).id) {
            return { valid: false, error: 'Token không hợp lệ', status: 401 };
        }
        
        const role = (payload as Record<string, unknown>).role as string;
        
        if (role !== 'admin') {
            return { valid: false, error: 'Chỉ admin mới có quyền truy cập', status: 403 };
        }

        return { valid: true };
    } catch {
        return { valid: false, error: 'Token không hợp lệ', status: 401 };
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const auth = await verifyAdminAuth(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');

        const where = {
            target_type: 'admin'
        };

        const totalCount = await prisma.attachments.count({ where });

        const attachments = await prisma.attachments.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: 'desc' }
        });

        console.log('📎 [ADMIN ATTACHMENTS] GET - Found:', attachments.length, 'total:', totalCount);

        return NextResponse.json({
            success: true,
            data: serializeAttachments(attachments as unknown as Array<Record<string, unknown>>),
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('📎 [ADMIN ATTACHMENTS] GET Error:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi lấy danh sách attachments' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const auth = await verifyAdminAuth(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const body = await request.json();
        const { url, secure_url, size_bytes, original_name, public_id, sort_order } = body;

        if (!url || !secure_url) {
            return NextResponse.json(
                { success: false, error: 'url và secure_url là bắt buộc' },
                { status: 400 }
            );
        }

        const newAttachment = await prisma.attachments.create({
            data: {
                url,
                secure_url,
                size_bytes: size_bytes ? BigInt(size_bytes) : null,
                original_name,
                public_id,
                target_type: 'admin',
                target_id: null,
                sort_order: sort_order ?? 0
            }
        });

        console.log('📎 [ADMIN ATTACHMENTS] POST - Created:', newAttachment.id);

        return NextResponse.json({
            success: true,
            data: {
                ...newAttachment,
                size_bytes: newAttachment.size_bytes?.toString() || null
            },
            message: 'Tạo attachment thành công'
        }, { status: 201 });

    } catch (error) {
        console.error('📎 [ADMIN ATTACHMENTS] POST Error:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi tạo attachment' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Verify admin authentication
        const auth = await verifyAdminAuth(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'id là bắt buộc' },
                { status: 400 }
            );
        }

        const attachment = await prisma.attachments.findUnique({
            where: { id }
        });

        if (!attachment) {
            return NextResponse.json(
                { success: false, error: 'Attachment không tồn tại' },
                { status: 404 }
            );
        }

        if (attachment.target_type !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Chỉ có thể xóa attachment của admin' },
                { status: 403 }
            );
        }

        // Delete from Cloudinary
        if (attachment.public_id) {
            try {
                await cloudinary.uploader.destroy(attachment.public_id);
            } catch (err) {
                console.error('Error deleting from Cloudinary:', err);
            }
        }

        // Delete from database
        await prisma.attachments.delete({
            where: { id }
        });

        console.log('📎 [ADMIN ATTACHMENTS] DELETE - Deleted:', id);

        return NextResponse.json({
            success: true,
            message: 'Xóa attachment thành công'
        });

    } catch (error) {
        console.error('📎 [ADMIN ATTACHMENTS] DELETE Error:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi xóa attachment' },
            { status: 500 }
        );
    }
}
