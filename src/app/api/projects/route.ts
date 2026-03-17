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
    const province = searchParams.get('province');
    const ward = searchParams.get('ward');
    const property_type_id = searchParams.get('property_type_id');

    const skip = (page - 1) * limit;

    // Tạo điều kiện where
    const where: Prisma.projectsWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (slug) {
      where.slug = slug;
    }

    if (province) {
      where.province = province;
    }

    if (property_type_id) {
      where.property_type_id = property_type_id;
    }

    if (ward) {
      where.ward = ward;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { project_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Lấy tổng số bản ghi
    const totalCount = await prisma.projects.count({ where });

    // Lấy danh sách dự án
    const projects = await prisma.projects.findMany({
      where,
      skip,
      take: limit,
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

    // Generate project_code (e.g. FIN260001)
    const currentYearStr = new Date().getFullYear().toString().substring(2, 4);
    const prefix = `FIN${currentYearStr}`;

    // Find max sequence from DB - query with raw SQL for better performance
    const maxProject = await prisma.$queryRaw<Array<{ project_code: string }>>`
      SELECT project_code FROM projects 
      WHERE project_code LIKE ${`${prefix}%`}
      ORDER BY project_code DESC 
      LIMIT 1
    `;

    let nextSequenceNumber = 1;
    if (maxProject && maxProject.length > 0 && maxProject[0].project_code) {
      const lastSeqStr = maxProject[0].project_code.slice(-4);
      const lastSeqNum = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeqNum)) {
        nextSequenceNumber = lastSeqNum + 1;
      }
    }

    // Project code: FIN + year + 4 digits (e.g., FIN260001)
    const sequenceStr = nextSequenceNumber.toString().padStart(4, '0');
    const finalProjectCode = `${prefix}${sequenceStr}`;

    // Slug: -P + year + 4 digits = P260001 (6 digits total)
    const slugSequence = `${currentYearStr}${sequenceStr}`;
    const baseSlug = slug?.trim() ? slug.trim() : generateSlug(name);
    const generatedSlug = `${baseSlug}-P${slugSequence}`;

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
        project_code: finalProjectCode,
        province: province?.trim() || undefined,
        ward: ward?.trim() || undefined,
        area: areaValue,
        price: priceValue,
        property_type_id: property_type_id || undefined,
        content: content?.trim() || undefined,
        developer: developer?.trim() || undefined,
        status: 'đang mở bán',
      } as any
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

    // Skip validation if only updating thumbnail or no critical fields
    const isPartialUpdate = !!thumbnail_url || (!name && !province && !area && !price && !property_type_id);
    if (!isPartialUpdate) {
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

    // Ensure slug has correct suffix based on project_code
    // project_code: FIN260001 -> get last 6 chars: 260001
    // slug suffix should be: P260001
    if (existingProject.project_code) {
      const codePart = existingProject.project_code.slice(-6); // Get last 6 digits: "260001"
      const expectedSuffix = `P${codePart}`;

      // Check if slug needs to be updated
      let newSlug = existingProject.slug;

      if (name) {
        updateData.name = name.trim();
        const newBaseSlug = generateSlug(name.trim());
        newSlug = `${newBaseSlug}-${expectedSuffix}`;
      } else if (existingProject.slug && !existingProject.slug.includes(expectedSuffix)) {
        // Fix slug suffix even if name not changed
        const slugBase = existingProject.slug.split('-P')[0];
        newSlug = `${slugBase}-${expectedSuffix}`;
      }

      if (newSlug !== existingProject.slug) {
        updateData.slug = newSlug;
      }
    } else if (name) {
      updateData.name = name.trim();
    }

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

// DELETE - Xóa dự án
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('DELETE project request, id:', id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID dự án là bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra dự án tồn tại
    const existingProject = await prisma.projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      console.log('Project not found:', id);
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy dự án' },
        { status: 404 }
      );
    }

    console.log('Deleting project:', existingProject.id);

    // Xóa dự án (attachments sẽ tự động xóa theo cascade nếu đã cấu hình)
    await prisma.projects.delete({
      where: { id }
    });

    console.log('Project deleted successfully');

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

