import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// POST /api/projects/[id]/views - Tăng lượt xem dự án
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Tìm dự án để kiểm tra tồn tại
        const project = await prisma.projects.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
                ]
            }
        });

        if (!project) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy dự án' },
                { status: 404 }
            );
        }

        // Tăng lượt xem
        const updatedProject = await prisma.projects.update({
            where: { id: project.id },
            data: {
                views_count: {
                    increment: 1
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                viewsCount: updatedProject.views_count
            }
        });

    } catch (error) {
        console.error('Error incrementing project views:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi cập nhật lượt xem' },
            { status: 500 }
        );
    }
}
