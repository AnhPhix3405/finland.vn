import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET - Get single news article by slug (Public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug không hợp lệ' },
        { status: 400 }
      );
    }

    // Get news with tags
    const news = await prisma.news.findUnique({
      where: { slug },
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
      }
    });

    if (!news) {
      return NextResponse.json(
        { success: false, error: 'Bài viết không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: news.id,
        title: news.title,
        slug: news.slug,
        description: news.description,
        content: news.content,
        thumbnail_url: news.thumbnail_url,
        created_at: news.created_at,
        tags: news.news_tags.map(nt => nt.tags)
      }
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải bài viết' },
      { status: 500 }
    );
  }
}
