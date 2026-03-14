import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import cloudinary from '@/src/lib/cloudinary';

// GET /api/attachments/[id] (Lấy attachment theo target_id)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const target_type = searchParams.get('target_type') || 'project';

        let target_id = id;

        // Nếu id không phải UUID (ví dụ nó là slug từ page truyền xuống)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            if (target_type === 'project') {
                const project = await prisma.projects.findUnique({
                    where: { slug: id }
                });
                if (project) {
                    target_id = project.id;
                } else {
                    return NextResponse.json({ success: true, data: [] });
                }
            }
        }

        const attachments = await prisma.attachments.findMany({
            where: {
                target_id,
                target_type
            },
            orderBy: { created_at: 'desc' }
        });

        // Prisma trả về BigInt, cần parse sang string
        const serializedAttachments = attachments.map(item => ({
            ...item,
            size_bytes: item.size_bytes ? item.size_bytes.toString() : null
        }));

        return NextResponse.json({
            success: true,
            data: serializedAttachments
        });
    } catch (error) {
        console.error('Error fetching attachments by target:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi lấy danh sách attachments' },
            { status: 500 }
        );
    }
}

// DELETE /api/attachments/[id]
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Tìm attachment trong DB để lấy public_id
        const attachment = await prisma.attachments.findUnique({
            where: { id }
        });

        if (!attachment) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy attachment' },
                { status: 404 }
            );
        }

        // Xóa trên Cloudinary nếu có public_id
        if (attachment.public_id) {
            await cloudinary.uploader.destroy(attachment.public_id);
        }

        // Xóa record trong DB
        await prisma.attachments.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'Đã xóa attachment' });

    } catch (error) {
        console.error('Error deleting attachment:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi xóa attachment' },
            { status: 500 }
        );
    }
}
