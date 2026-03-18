import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';
import { Prisma } from '@prisma/client';

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

// GET - Lấy danh sách dự án (Admin Only)
export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');
    const province = searchParams.get('province');
    const ward = searchParams.get('ward');
    const property_type_id = searchParams.get('property_type_id');

    const skip = (page - 1) * limit;

    const where: Prisma.projectsWhereInput = {};

    if (status) where.status = status;
    if (slug) where.slug = slug;
    if (province) where.province = province;
    if (ward) where.ward = ward;
    if (property_type_id) where.property_type_id = property_type_id;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { project_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const totalCount = await prisma.projects.count({ where });

    const projects = await prisma.projects.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ created_at: 'desc' }, { name: 'asc' }],
      include: {
        property_types: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin projects:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy danh sách dự án' },
      { status: 500 }
    );
  }
}

// POST - Tạo dự án mới (Admin Only)
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

    const {
      project_code,
      name,
      slug,
      content,
      status = 'sắp mở bán',
      price,
      property_type_id,
      province,
      ward
    } = body;

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Tên dự án và slug là bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra slug đã tồn tại chưa
    const existingProject = await prisma.projects.findFirst({
      where: {
        OR: [
          { slug: slug },
          { project_code: project_code }
        ]
      }
    });

    if (existingProject) {
      return NextResponse.json(
        { success: false, error: 'Slug hoặc mã dự án đã tồn tại' },
        { status: 400 }
      );
    }

    // Tạo dự án mới
    const newProject = await prisma.projects.create({
      data: {
        project_code,
        name,
        slug,
        content,
        status: status || 'sắp mở bán',
        price: price ? parseFloat(price.toString()) : 0,
        property_type_id: property_type_id || null,
        province,
        ward
      }
    });

    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Tạo dự án thành công'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo dự án' },
      { status: 500 }
    );
  }
}

// PATCH - Cập nhật dự án (Admin Only)
export async function PATCH(request: NextRequest) {
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID dự án là bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra dự án có tồn tại không
    const existingProject = await prisma.projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Dự án không tồn tại' },
        { status: 404 }
      );
    }

    // Kiểm tra slug/project_code trùng lặp (nếu có thay đổi)
    if (updateData.slug || updateData.project_code) {
      const duplicateProject = await prisma.projects.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { slug: updateData.slug },
                { project_code: updateData.project_code }
              ]
            }
          ]
        }
      });

      if (duplicateProject) {
        return NextResponse.json(
          { success: false, error: 'Slug hoặc mã dự án đã tồn tại' },
          { status: 400 }
        );
      }
    }

    // Xử lý area_min, area_max
    if (updateData.area_min) updateData.area_min = parseInt(updateData.area_min.toString());
    if (updateData.area_max) updateData.area_max = parseInt(updateData.area_max.toString());
    if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price.toString());

    // Cập nhật dự án
    const updatedProject = await prisma.projects.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Cập nhật dự án thành công'
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật dự án' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa dự án (Admin Only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
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
        { success: false, error: 'ID dự án là bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra dự án có tồn tại không
    const existingProject = await prisma.projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Dự án không tồn tại' },
        { status: 404 }
      );
    }

    // Xóa dự án
    await prisma.projects.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa dự án thành công'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa dự án' },
      { status: 500 }
    );
  }
}