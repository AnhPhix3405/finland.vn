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

async function verifyAuth(request: NextRequest) {
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
        return { valid: true, brokerId: (payload as Record<string, unknown>).id as string };
    } catch {
        return { valid: false, error: 'Token không hợp lệ', status: 401 };
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const target_id = searchParams.get('target_id');
        const target_type = searchParams.get('target_type');
        const slug = searchParams.get('slug');

        const where: Record<string, unknown> = {};

        if (target_id) {
            where.target_id = target_id;
        }

        if (target_type) {
            where.target_type = target_type;
        }

        if (slug) {
            const project = await prisma.projects.findUnique({ where: { slug } });
            if (project) {
                where.target_id = project.id;
                where.target_type = 'project';
            } else {
                where.target_id = '00000000-0000-0000-0000-000000000000';
            }
        }

        const totalCount = await prisma.attachments.count({ where });

        const attachments = await prisma.attachments.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: 'desc' }
        });

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
        console.error('Error fetching attachments:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi lấy danh sách attachments' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const body = await request.json();
        const { url, secure_url, size_bytes, original_name, public_id, target_id, target_type, sort_order } = body;

        if (!url || !secure_url || !target_type) {
            return NextResponse.json(
                { success: false, error: 'url, secure_url và target_type là bắt buộc' },
                { status: 400 }
            );
        }
        
        if (target_type !== 'admin' && !target_id) {
            return NextResponse.json(
                { success: false, error: 'target_id là bắt buộc' },
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
                target_id,
                target_type,
                sort_order: sort_order ?? 0
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...newAttachment,
                size_bytes: newAttachment.size_bytes?.toString() || null
            },
            message: 'Tạo attachment thành công'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating attachment:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi tạo attachment' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(request.url);
        const target_id = searchParams.get('target_id');
        const target_type = searchParams.get('target_type');

        if (!target_id || !target_type) {
            return NextResponse.json(
                { success: false, error: 'target_id và target_type là bắt buộc' },
                { status: 400 }
            );
        }

        const attachments = await prisma.attachments.findMany({
            where: { target_id, target_type }
        });

        if (attachments.length > 0) {
            const publicIds = attachments
                .filter(img => img.public_id)
                .map(img => img.public_id as string);

            if (publicIds.length > 0) {
                await Promise.all(publicIds.map(pid => cloudinary.uploader.destroy(pid)));
            }

            await prisma.attachments.deleteMany({ where: { target_id, target_type } });
        }

        return NextResponse.json({
            success: true,
            message: `Đã xóa ${attachments.length} attachments`
        });

    } catch (error) {
        console.error('Error deleting bulk attachments:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi xóa attachments' },
            { status: 500 }
        );
    }
}
