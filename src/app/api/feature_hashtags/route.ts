import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET - Lấy danh sách tất cả feature_hashtags
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');

        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const totalCount = await prisma.feature_hashtags.count({ where });

        const featureHashtags = await prisma.feature_hashtags.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            success: true,
            data: featureHashtags,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching feature hashtags:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi lấy danh sách đặc điểm' },
            { status: 500 }
        );
    }
}
