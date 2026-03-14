import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET /api/brokers/[phone] - Lấy 1 broker theo phone
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug: phone } = await params;

        const broker = await prisma.brokers.findFirst({
            where: { phone }
        });

        if (!broker) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy môi giới' },
                { status: 404 }
            );
        }

        const { password_hash, ...safeBroker } = broker;

        return NextResponse.json({ success: true, data: safeBroker });

    } catch (error) {
        console.error('Error fetching broker:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi khi lấy thông tin môi giới' },
            { status: 500 }
        );
    }
}
