import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET - Get all news articles (Public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');

    const whereClause: Record<string, unknown> = {};
    if (search) {
      whereClause.title = { startsWith: search, mode: 'insensitive' };
    }

    // Get all news with tags
    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where: whereClause,
        include: {
          news_tags: {
            include: {
              tags: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: skip
      }),
      prisma.news.count({ where: whereClause })
    ]);

    // Format response
    const formattedNews = news.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description,
      thumbnail_url: item.thumbnail_url,
      created_at: item.created_at,
      tags: item.news_tags.map(nt => nt.tags)
    }));

    return NextResponse.json({
      success: true,
      data: formattedNews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải tin tức' },
      { status: 500 }
    );
  }
}
