import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { valid: false, error: 'Token không tồn tại' };
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return { valid: false, error: 'Token không hợp lệ hoặc không phải admin' };
  }

  return { valid: true, payload };
}

function generateHashtag(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// POST - Tạo feature hashtag mới (Admin Only)
export async function POST(request: NextRequest) {
    try {
        const authCheck = await verifyAdminAuth(request);
        if (!authCheck.valid) {
            return NextResponse.json(
                { success: false, error: authCheck.error },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, hashtag } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Tên đặc điểm là bắt buộc' },
                { status: 400 }
            );
        }

        const trimmedName = name.trim();
        const finalHashtag = hashtag?.trim() || generateHashtag(trimmedName);

        const existingName = await prisma.feature_hashtags.findUnique({
            where: { name: trimmedName }
        });

        if (existingName) {
            return NextResponse.json(
                { success: false, error: 'Tên đặc điểm đã tồn tại' },
                { status: 400 }
            );
        }

        const existingHashtag = await prisma.feature_hashtags.findUnique({
            where: { hashtag: finalHashtag }
        });

        if (existingHashtag) {
            return NextResponse.json(
                { success: false, error: 'Hashtag đã tồn tại' },
                { status: 400 }
            );
        }

        const newFeatureHashtag = await prisma.feature_hashtags.create({
            data: {
                name: trimmedName,
                hashtag: finalHashtag
            }
        });

        return NextResponse.json({
            success: true,
            data: newFeatureHashtag,
            message: 'Tạo đặc điểm thành công'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating feature hashtag:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi tạo đặc điểm' },
            { status: 500 }
        );
    }
}

// PATCH - Cập nhật feature hashtag (Admin Only)
export async function PATCH(request: NextRequest) {
    try {
        const authCheck = await verifyAdminAuth(request);
        if (!authCheck.valid) {
            return NextResponse.json(
                { success: false, error: authCheck.error },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, name, hashtag } = body;

        if (!id || !name || name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'ID và tên đặc điểm là bắt buộc' },
                { status: 400 }
            );
        }

        const trimmedName = name.trim();
        const finalHashtag = hashtag?.trim() || generateHashtag(trimmedName);

        const existingType = await prisma.feature_hashtags.findUnique({
            where: { id }
        });

        if (!existingType) {
            return NextResponse.json(
                { success: false, error: 'Đặc điểm không tồn tại' },
                { status: 404 }
            );
        }

        if (trimmedName !== existingType.name) {
            const duplicateName = await prisma.feature_hashtags.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        { name: trimmedName }
                    ]
                }
            });

            if (duplicateName) {
                return NextResponse.json(
                    { success: false, error: 'Tên đặc điểm đã tồn tại' },
                    { status: 400 }
                );
            }
        }

        if (finalHashtag !== existingType.hashtag) {
            const duplicateHashtag = await prisma.feature_hashtags.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        { hashtag: finalHashtag }
                    ]
                }
            });

            if (duplicateHashtag) {
                return NextResponse.json(
                    { success: false, error: 'Hashtag đã tồn tại' },
                    { status: 400 }
                );
            }
        }

        const updatedFeatureHashtag = await prisma.feature_hashtags.update({
            where: { id },
            data: {
                name: trimmedName,
                hashtag: finalHashtag,
                updated_at: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedFeatureHashtag,
            message: 'Cập nhật đặc điểm thành công'
        });

    } catch (error) {
        console.error('Error updating feature hashtag:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi cập nhật đặc điểm' },
            { status: 500 }
        );
    }
}

// DELETE - Xóa feature hashtag (Admin Only)
export async function DELETE(request: NextRequest) {
    try {
        const authCheck = await verifyAdminAuth(request);
        if (!authCheck.valid) {
            return NextResponse.json(
                { success: false, error: authCheck.error },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID đặc điểm là bắt buộc' },
                { status: 400 }
            );
        }

        const existingType = await prisma.feature_hashtags.findUnique({
            where: { id }
        });

        if (!existingType) {
            return NextResponse.json(
                { success: false, error: 'Đặc điểm không tồn tại' },
                { status: 404 }
            );
        }

        await prisma.feature_hashtags.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Xóa đặc điểm thành công'
        });

    } catch (error) {
        console.error('Error deleting feature hashtag:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi xóa đặc điểm' },
            { status: 500 }
        );
    }
}
