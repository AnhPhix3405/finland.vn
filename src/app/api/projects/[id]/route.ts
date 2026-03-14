import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET /api/projects/[id] - Lấy chi tiết dự án theo slug hoặc id
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Kiểm tra xem id có phải là UUID không
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        // Tìm project theo slug hoặc id (chỉ khi id là UUID)
        const whereConditions: Array<{slug?: string; id?: string}> = [{ slug: id }];
        if (isUUID) {
            whereConditions.push({ id: id });
        }

        const project = await prisma.projects.findFirst({
            where: {
                OR: whereConditions
            },
            include: {
                property_types: true,
                project_tags: {
                    include: {
                        tags: true
                    }
                }
            }
        });

        if (!project) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy dự án' },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            data: project 
        });

    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi lấy thông tin dự án' },
            { status: 500 }
        );
    }
}
