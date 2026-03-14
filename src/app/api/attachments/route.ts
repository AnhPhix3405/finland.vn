import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import cloudinary from '@/src/lib/cloudinary';

// GET - Lấy danh sách tất cả attachments
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search');
        const target_id = searchParams.get('target_id');
        const target_type = searchParams.get('target_type');
        const slug = searchParams.get('slug');

        const skip = (page - 1) * limit;

        // Tạo điều kiện where
        const where: Record<string, unknown> = {};

        if (target_id) {
            where.target_id = target_id;
        }

        if (target_type) {
            where.target_type = target_type;
        }

        if (slug) {
            const project = await prisma.projects.findUnique({
                where: { slug }
            });
            if (project) {
                where.target_id = project.id;
                // Giả định target_type cho resource project là 'project'
                where.target_type = 'project';
            } else {
                // Nếu không tìm thấy project bằng slug, set một uuid không tồn tại để trả về danh sách trống
                where.target_id = '00000000-0000-0000-0000-000000000000';
            }
        }

        if (search) {
            where.original_name = { contains: search, mode: 'insensitive' };
        }

        // Lấy tổng số bản ghi
        const totalCount = await prisma.attachments.count({ where });

        // Lấy danh sách attachments
        const attachments = await prisma.attachments.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' }
        });

        // Prisma trả về BigInt cho trường size_bytes, Nextjs JSON() không parse được BigInt trực tiếp.
        // Xử lý parse size_bytes sang string
        const serializedAttachments = attachments.map(item => ({
            ...item,
            size_bytes: item.size_bytes ? item.size_bytes.toString() : null
        }));

        return NextResponse.json({
            success: true,
            data: serializedAttachments,
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

// POST - Tạo attachment mới
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            url,
            secure_url,
            size_bytes,
            original_name,
            public_id,
            target_id,
            target_type
        } = body;

        // Validation
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

        // Tạo attachment mới
        const newAttachment = await prisma.attachments.create({
            data: {
                url,
                secure_url,
                size_bytes: size_bytes ? BigInt(size_bytes) : null,
                original_name,
                public_id,
                target_id,
                target_type
            }
        });

        // Chuyển BigInt sang string để trả về JSON
        const serializedAttachment = {
            ...newAttachment,
            size_bytes: newAttachment.size_bytes ? newAttachment.size_bytes.toString() : null
        };

        return NextResponse.json({
            success: true,
            data: serializedAttachment,
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

// DELETE - Xóa nhiều attachments theo target_id và target_type
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const target_id = searchParams.get('target_id');
        const target_type = searchParams.get('target_type');

        if (!target_id || !target_type) {
            return NextResponse.json(
                { success: false, error: 'target_id và target_type là bắt buộc' },
                { status: 400 }
            );
        }

        // 1. Lấy danh sách attachments để có public_id xóa trên Cloudinary
        const attachments = await prisma.attachments.findMany({
            where: {
                target_id,
                target_type
            }
        });

        if (attachments.length > 0) {
            // 2. Xóa trên Cloudinary
            const publicIds = attachments
                .filter(img => img.public_id)
                .map(img => img.public_id as string);

            if (publicIds.length > 0) {
                await Promise.all(
                    publicIds.map(pid => cloudinary.uploader.destroy(pid))
                );
            }

            // 3. Xóa records trong database
            await prisma.attachments.deleteMany({
                where: {
                    target_id,
                    target_type
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Đã xóa ${attachments.length} attachments liên quan.`
        });

    } catch (error) {
        console.error('Error deleting bulk attachments:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi xóa attachments' },
            { status: 500 }
        );
    }
}
