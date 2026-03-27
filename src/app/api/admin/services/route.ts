import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

// Helper to verify admin token
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

// GET - Get service announcement (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const service = await prisma.services.findFirst({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error('Error fetching admin service announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải thông báo dịch vụ' },
      { status: 500 }
    );
  }
}

// POST/PATCH - Update/Create service announcement (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, title, content } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Tiêu đề và nội dung là bắt buộc' },
        { status: 400 }
      );
    }

    let result;
    if (id) {
      // Update existing record
      result = await prisma.services.update({
        where: { id },
        data: {
          title,
          content,
          updated_at: new Date()
        }
      });
    } else {
      // Check if any record exists, update the first one or create a new one
      const existing = await prisma.services.findFirst();
      if (existing) {
        result = await prisma.services.update({
          where: { id: existing.id },
          data: {
            title,
            content,
            updated_at: new Date()
          }
        });
      } else {
        result = await prisma.services.create({
          data: {
            title,
            content
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Cập nhật thông báo thành công'
    });

  } catch (error) {
    console.error('Error updating admin service announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật thông báo' },
      { status: 500 }
    );
  }
}
