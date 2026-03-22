import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import cloudinary from '@/src/lib/cloudinary';
import { verifyToken } from '@/src/app/modules/auth/jwt';

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
        
        const role = (payload as Record<string, unknown>).role as string;
        
        if (role === 'admin') {
            return { valid: true };
        }
        
        const brokerId = (payload as Record<string, unknown>).id as string;
        const broker = await prisma.brokers.findUnique({
            where: { id: brokerId },
            select: { is_active: true }
        });

        if (!broker) {
            return { valid: false, error: 'Token không hợp lệ', status: 401 };
        }

        if (!broker.is_active) {
            return { valid: false, error: 'Tài khoản của bạn đã bị khóa', status: 403 };
        }

        return { valid: true };
    } catch {
        return { valid: false, error: 'Token không hợp lệ', status: 401 };
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const target_type = searchParams.get('target_type') || 'project';

        let target_id = id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(id)) {
            if (target_type === 'project') {
                const project = await prisma.projects.findUnique({ where: { slug: id } });
                if (project) {
                    target_id = project.id;
                } else {
                    return NextResponse.json({ success: true, data: [] });
                }
            }
        }

        const attachments = await prisma.attachments.findMany({
            where: { target_id, target_type },
            orderBy: [
                { sort_order: 'asc' },
                { created_at: 'desc' }
            ]
        });

        const serializedAttachments = attachments.map(item => ({
            ...item,
            size_bytes: item.size_bytes?.toString() || null
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { id } = await params;

        const attachment = await prisma.attachments.findUnique({ where: { id } });

        if (!attachment) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy attachment' },
                { status: 404 }
            );
        }

        if (attachment.public_id) {
            await cloudinary.uploader.destroy(attachment.public_id);
        }

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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { sort_order } = body;

        const attachment = await prisma.attachments.findUnique({ where: { id } });

        if (!attachment) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy attachment' },
                { status: 404 }
            );
        }

        const updatedAttachment = await prisma.attachments.update({
            where: { id },
            data: { ...(sort_order !== undefined && { sort_order }) }
        });

        if (sort_order !== undefined && attachment.target_type === 'listing' && attachment.target_id) {
            if (sort_order === 0) {
                await prisma.listings.update({
                    where: { id: attachment.target_id },
                    data: { thumbnail_url: updatedAttachment.secure_url || updatedAttachment.url }
                });
            } else {
                const primaryAttachment = await prisma.attachments.findFirst({
                    where: { target_id: attachment.target_id, target_type: 'listing', sort_order: 0 }
                });
                if (primaryAttachment) {
                    await prisma.listings.update({
                        where: { id: attachment.target_id },
                        data: { thumbnail_url: primaryAttachment.secure_url || primaryAttachment.url }
                    });
                }
            }
        }

        if (sort_order !== undefined && attachment.target_type === 'project' && attachment.target_id) {
            if (sort_order === 0) {
                await prisma.projects.update({
                    where: { id: attachment.target_id },
                    data: { thumbnail_url: updatedAttachment.secure_url || updatedAttachment.url }
                });
            } else {
                const primaryAttachment = await prisma.attachments.findFirst({
                    where: { target_id: attachment.target_id, target_type: 'project', sort_order: 0 }
                });
                if (primaryAttachment) {
                    await prisma.projects.update({
                        where: { id: attachment.target_id },
                        data: { thumbnail_url: primaryAttachment.secure_url || primaryAttachment.url }
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...updatedAttachment,
                size_bytes: updatedAttachment.size_bytes?.toString() || null
            },
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
