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
      orderBy: [{ updated_at: 'desc' }, { name: 'asc' }],
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
      name,
      content,
      status,
      price,
      area,
      property_type_id,
      province,
      ward,
      latitude,
      longitude
    } = body;

    // Validation - các field bắt buộc
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Tên dự án là bắt buộc' },
        { status: 400 }
      );
    }

    if (!province || province.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Tỉnh/Thành phố là bắt buộc' },
        { status: 400 }
      );
    }

    if (!property_type_id || property_type_id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Loại hình bất động sản là bắt buộc' },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || price === '') {
      return NextResponse.json(
        { success: false, error: 'Giá là bắt buộc' },
        { status: 400 }
      );
    }

    if (area === undefined || area === null || area === '') {
      return NextResponse.json(
        { success: false, error: 'Diện tích là bắt buộc' },
        { status: 400 }
      );
    }

    // Validate price and area are valid numbers
    const priceNum = parseFloat(price.toString());
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Giá không hợp lệ' },
        { status: 400 }
      );
    }

    const areaNum = parseFloat(area.toString());
    if (isNaN(areaNum) || areaNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Diện tích phải là số dương' },
        { status: 400 }
      );
    }

    const latNum = latitude ? parseFloat(latitude.toString()) : null;
    const lngNum = longitude ? parseFloat(longitude.toString()) : null;

    // Generate project_code: FIN + 2 digits year + 6 digit sequence
    const currentYear = new Date().getFullYear().toString().slice(-2); // e.g., "26"
    const prefix = `FIN${currentYear}`; // e.g., "FIN26"

    // Get the highest sequence number for this year
    const lastProject = await prisma.projects.findFirst({
      where: {
        project_code: {
          startsWith: prefix
        }
      },
      orderBy: {
        project_code: 'desc'
      },
      select: {
        project_code: true
      }
    });

    let sequence = 1;
    if (lastProject?.project_code) {
      const lastSeq = parseInt(lastProject.project_code.replace(prefix, ''));
      sequence = lastSeq + 1;
    }

    const project_code = `${prefix}${sequence.toString().padStart(6, '0')}`; // e.g., "FIN26000001"
    const sequenceStr = `P${currentYear}${sequence.toString().padStart(6, '0')}`; // e.g., "P26000002"

    // Generate slug: normalized-name-sequence
    const normalizedName = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const slug = `${normalizedName}-${sequenceStr}`; // e.g., "anh-la-phi-P26000002"

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
        { success: false, error: 'Dự án này đã tồn tại' },
        { status: 400 }
      );
    }

    // Tạo dự án mới
    const newProject = await prisma.projects.create({
      data: {
        project_code,
        name: name.trim(),
        slug,
        content,
        status: status || 'sắp mở bán',
        price: priceNum,
        area: areaNum,
        property_type_id,
        province,
        ward,
        latitude: latNum,
        longitude: lngNum
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

    // Xử lý area, price validation
    if (updateData.area !== undefined) {
      const areaNum = parseFloat(updateData.area.toString());
      if (isNaN(areaNum) || areaNum <= 0) {
        return NextResponse.json(
          { success: false, error: 'Diện tích phải là số dương' },
          { status: 400 }
        );
      }
      updateData.area = areaNum;
    }

    if (updateData.price !== undefined) {
      const priceNum = parseFloat(updateData.price.toString());
      if (isNaN(priceNum) || priceNum < 0) {
        return NextResponse.json(
          { success: false, error: 'Giá không hợp lệ' },
          { status: 400 }
        );
      }
      updateData.price = priceNum;
    }

    // Validate status if provided
    if (updateData.status !== undefined) {
      const validStatuses = ['sắp mở bán', 'đang mở bán', 'hàng thứ cấp'];
      if (updateData.status && !validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          { success: false, error: 'Trạng thái không hợp lệ' },
          { status: 400 }
        );
      }
    }

    // If name is updated, regenerate slug while keeping the sequence suffix (with P prefix)
    if (updateData.name !== undefined && existingProject.slug) {
      const normalizedName = updateData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Extract the sequence suffix from existing slug (last part like "P26000001")
      const existingSlugParts = existingProject.slug.split('-');
      const sequenceSuffix = existingSlugParts[existingSlugParts.length - 1];

      updateData.slug = `${normalizedName}-${sequenceSuffix}`;
    }

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