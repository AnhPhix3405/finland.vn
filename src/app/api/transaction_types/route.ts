import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// Hàm tạo hashtag từ name
function generateHashtag(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// GET - Lấy danh sách tất cả transaction_types
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');
        const search = searchParams.get('search');

        const skip = (page - 1) * limit;

        // Tạo điều kiện where
        const where: Record<string, unknown> = {};

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        // Lấy tổng số bản ghi
        const totalCount = await prisma.transaction_types.count({ where });

        // Lấy danh sách transaction types
        const transactionTypes = await prisma.transaction_types.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            success: true,
            data: transactionTypes,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching transaction types:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi lấy danh sách loại hình giao dịch' },
            { status: 500 }
        );
    }
}