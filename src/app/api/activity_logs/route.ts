import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET - Lấy danh sách activity logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    // const action = searchParams.get('action');
    // const target_type = searchParams.get('target_type');
    // const target_id = searchParams.get('target_id');
    // const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Tạo điều kiện where
    // const where: any = {};
    
    // if (action) {
    //   where.action = action;
    // }
    
    // if (target_type) {
    //   where.target_type = target_type;
    // }
    
    // if (target_id) {
    //   where.target_id = target_id;
    // }
    
    // if (search) {
    //   where.OR = [
    //     { action: { contains: search, mode: 'insensitive' } },
    //     { target_type: { contains: search, mode: 'insensitive' } },
    //     { detail: { contains: search, mode: 'insensitive' } }
    //   ];
    // }

    // Lấy tổng số bản ghi
    const totalCount = await prisma.activity_logs.count();

    // Lấy danh sách activity logs
    const activityLogs = await prisma.activity_logs.findMany({
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: activityLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy danh sách nhật ký hoạt động' },
      { status: 500 }
    );
  }
}

// POST - Tạo activity log mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      action,
      target_type,
      target_id,
      detail
    } = body;

    // Validation
    if (!action || !target_type) {
      return NextResponse.json(
        { success: false, error: 'Action và target_type là bắt buộc' },
        { status: 400 }
      );
    }

    // Validate action length
    if (action.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Action không được vượt quá 50 ký tự' },
        { status: 400 }
      );
    }

    // Validate target_type length
    if (target_type.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Target_type không được vượt quá 50 ký tự' },
        { status: 400 }
      );
    }

    // Tạo activity log mới
    const newActivityLog = await prisma.activity_logs.create({
      data: {
        action,
        target_type,
        target_id,
        detail
      }
    });

    return NextResponse.json({
      success: true,
      data: newActivityLog,
      message: 'Tạo nhật ký hoạt động thành công'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo nhật ký hoạt động' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa activity log
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID nhật ký hoạt động là bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra activity log có tồn tại không
    const existingActivityLog = await prisma.activity_logs.findUnique({
      where: { id }
    });

    if (!existingActivityLog) {
      return NextResponse.json(
        { success: false, error: 'Nhật ký hoạt động không tồn tại' },
        { status: 404 }
      );
    }

    // Xóa activity log
    await prisma.activity_logs.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa nhật ký hoạt động thành công'
    });

  } catch (error) {
    console.error('Error deleting activity log:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa nhật ký hoạt động' },
      { status: 500 }
    );
  }
}
