import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET - Lấy danh sách tất cả property_types
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');

        const skip = (page - 1) * limit;

        // Tạo điều kiện where
        const where: any = {};

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        // Lấy tổng số bản ghi
        const totalCount = await prisma.property_types.count({ where });

        // Lấy danh sách property types
        const propertyTypes = await prisma.property_types.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            success: true,
            data: propertyTypes,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching property types:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi lấy danh sách loại hình BĐS' },
            { status: 500 }
        );
    }
}