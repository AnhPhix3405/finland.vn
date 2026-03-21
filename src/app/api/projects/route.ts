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
    const propertyType = searchParams.get('propertyType');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const sortBy = searchParams.get('sortBy');

    const skip = (page - 1) * limit;

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

    if (propertyType) {
      where.property_types = {
        hashtag: propertyType
      };
    }

    if (ward) {
      where.ward = ward;
    }

    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) {
        where.price.gte = parseFloat(priceMin);
      }
      if (priceMax) {
        where.price.lte = parseFloat(priceMax);
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { project_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const totalCount = await prisma.projects.count({ where });

    let orderBy: Prisma.projectsOrderByWithRelationInput | Prisma.projectsOrderByWithRelationInput[] = [];
    
    if (sortBy === 'price_asc') {
      orderBy = [{ price: 'asc' }, { created_at: 'desc' }];
    } else if (sortBy === 'price_desc') {
      orderBy = [{ price: 'desc' }, { created_at: 'desc' }];
    } else if (sortBy === 'popular') {
      orderBy = [{ views_count: 'desc' }, { created_at: 'desc' }];
    } else if (sortBy === 'newest') {
      orderBy = [{ created_at: 'desc' }, { name: 'asc' }];
    } else {
      orderBy = [{ created_at: 'desc' }, { name: 'asc' }];
    }

    if ((sortBy === 'price_asc' || sortBy === 'price_desc') && !priceMin && !priceMax) {
      where.price = { gt: 0 };
    }

    const projects = await prisma.projects.findMany({
      where,
      skip,
      take: limit,
      orderBy
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

