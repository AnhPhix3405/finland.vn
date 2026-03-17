import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { Prisma } from '@prisma/client';
// GET - Lấy danh sách tất cả dự án
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');

    const skip = (page - 1) * limit;

    // Tạo điều kiện where
    const where: Prisma.projectsWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (slug) {
      where.slug = slug;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { project_code: { contains: search, mode: 'insensitive' } },
        { developer: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Lấy tổng số bản ghi
    const totalCount = await prisma.projects.count({ where });

    // Lấy danh sách dự án
    const projects = await prisma.projects.findMany({
      where,
      skip,
      take: limit,
      include: {
        property_types: true
      },
      orderBy: [
        { created_at: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy danh sách dự án' },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateProjectData(data: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Tên dự án là bắt buộc (ít nhất 2 ký tự)');
  }

  if (!data.property_type_id || typeof data.property_type_id !== 'string') {
    errors.push('Loại hình bất động sản là bắt buộc');
  }

  if (!data.province || typeof data.province !== 'string' || data.province.trim() === '') {
    errors.push('Tỉnh/Thành phố là bắt buộc');
  }

  if (data.area !== undefined && data.area !== null && data.area !== '') {
    const areaNum = typeof data.area === 'number' ? data.area : parseFloat(String(data.area));
    if (isNaN(areaNum) || areaNum <= 0) {
      errors.push('Diện tích phải là số dương');
    } else if (areaNum > 1000000) {
      errors.push('Diện tích không hợp lệ (tối đa 1,000,000 m²)');
    }
  }

  if (data.price !== undefined && data.price !== null && data.price !== '') {
    const priceNum = typeof data.price === 'number' ? data.price : parseFloat(String(data.price).replace(/,/g, ''));
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push('Giá không hợp lệ');
    } else if (priceNum > 100000000000000) {
      errors.push('Giá không hợp lệ (quá lớn)');
    }
  }

  if (data.ward && typeof data.ward === 'string' && data.ward.trim() === '') {
    errors.push('Phường/Xã không hợp lệ');
  }

  return errors;
}

// POST - Tạo mới dự án
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, province, ward, area, price, property_type_id, content, developer } = body;

    const validationErrors = validateProjectData({ name, province, ward, area, price, property_type_id });
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join('; ') },
        { status: 400 }
      );
    }

    const generatedSlug = slug?.trim() ? slug.trim() : generateSlug(name);

    const existingProject = await prisma.projects.findFirst({
      where: { slug: generatedSlug }
    });

    if (existingProject) {
      return NextResponse.json(
        { success: false, error: 'Slug đã tồn tại, vui lòng sử dụng tên khác hoặc tự điền slug khác' },
        { status: 400 }
      );
    }

    const areaValue = area ? Number(area) : undefined;
    const priceValue = price ? parseFloat(String(price).replace(/,/g, '')) : 0;

    const project = await prisma.projects.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        province: province?.trim() || undefined,
        ward: ward?.trim() || undefined,
        area: areaValue,
        price: priceValue,
        property_type_id: property_type_id || undefined,
        content: content?.trim() || undefined,
        developer: developer?.trim() || undefined,
        status: 'đang mở bán',
      } 
    });

    return NextResponse.json({
      success: true,
      data: project
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo dự án' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, province, ward, area, price, property_type_id, content, developer, status, thumbnail_url } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID dự án là bắt buộc' },
        { status: 400 }
      );
    }

    // Skip validation if only updating thumbnail
    const isThumbnailOnlyUpdate = !!thumbnail_url && !name && !province;
    if (!isThumbnailOnlyUpdate) {
      const validationErrors = validateProjectData({ name, province, ward, area, price, property_type_id });
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { success: false, error: validationErrors.join('; ') },
          { status: 400 }
        );
      }
    }

    const existingProject = await prisma.projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy dự án' },
        { status: 404 }
      );
    }

    if (slug && slug !== existingProject.slug) {
      const slugExists = await prisma.projects.findFirst({
        where: { slug, id: { not: id } }
      });
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Slug đã tồn tại' },
          { status: 400 }
        );
      }
    }

    const areaValue = area ? Number(area) : undefined;
    const priceValue = price !== undefined ? parseFloat(String(price).replace(/,/g, '')) : undefined;

    const updateData: Record<string, unknown> = {};
    
    if (name) updateData.name = name.trim();
    if (slug) updateData.slug = slug.trim();
    if (province !== undefined) updateData.province = province?.trim() || null;
    if (ward !== undefined) updateData.ward = ward?.trim() || null;
    if (areaValue !== undefined) updateData.area = areaValue;
    if (priceValue !== undefined) updateData.price = priceValue;
    if (property_type_id !== undefined) updateData.property_type_id = property_type_id || null;
    if (content !== undefined) updateData.content = content?.trim() || null;
    if (developer !== undefined) updateData.developer = developer?.trim() || null;
    if (status) updateData.status = status;
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;

    const project = await prisma.projects.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật dự án' },
      { status: 500 }
    );
  }
}

