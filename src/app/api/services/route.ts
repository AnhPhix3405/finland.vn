import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    // Get the first service record (the announcement)
    const service = await prisma.services.findFirst({
      orderBy: { created_at: 'desc' }
    });

    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Chưa có thông báo nào'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({
      success: false,
      error: 'Lỗi khi tải thông báo dịch vụ'
    }, { status: 500 });
  }
}
