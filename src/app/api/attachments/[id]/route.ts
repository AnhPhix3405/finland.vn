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

// PATCH /api/attachments/[id] - Cập nhật attachment (ví dụ: sort_order)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { sort_order } = body;

        // Tìm attachment trong DB
        const attachment = await prisma.attachments.findUnique({
            where: { id }
        });

        if (!attachment) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy attachment' },
                { status: 404 }
            );
        }

        // Cập nhật attachment
        const updatedAttachment = await prisma.attachments.update({
            where: { id },
            data: {
                ...(sort_order !== undefined && { sort_order })
            }
        });

        // Nếu cập nhật sort_order và target_type là 'listing', cập nhật thumbnail_url cho listing
        if (sort_order !== undefined && attachment.target_type === 'listing' && attachment.target_id) {
            if (sort_order === 0) {
                // Nếu set sort_order = 0, cập nhật thumbnail_url = secure_url của attachment này
                await prisma.listings.update({
                    where: { id: attachment.target_id },
                    data: { thumbnail_url: updatedAttachment.secure_url || updatedAttachment.url }
                });
            } else {
                // Nếu sort_order != 0, kiểm tra xem có attachment nào có sort_order = 0 không
                // và cập nhật thumbnail_url tương ứng
                const primaryAttachment = await prisma.attachments.findFirst({
                    where: {
                        target_id: attachment.target_id,
                        target_type: 'listing',
                        sort_order: 0
                    }
                });
                if (primaryAttachment) {
                    await prisma.listings.update({
                        where: { id: attachment.target_id },
                        data: { thumbnail_url: primaryAttachment.secure_url || primaryAttachment.url }
                    });
                }
            }
        }

        // Parse BigInt sang string
        const serializedAttachment = {
            ...updatedAttachment,
            size_bytes: updatedAttachment.size_bytes ? updatedAttachment.size_bytes.toString() : null
        };

        return NextResponse.json({
            success: true,
            data: serializedAttachment,
            message: 'Cập nhật attachment thành công'
        });

    } catch (error) {
        console.error('Error updating attachment:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi cập nhật attachment' },
            { status: 500 }
        );
    }
}
