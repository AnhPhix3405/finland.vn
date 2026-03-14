import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';
import { processNewsTagsForCreation } from '@/src/app/modules/news.tags.service';

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

// Helper to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
}

// GET - Get all news articles (Admin only)
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get all news with tags
    const [news, total] = await Promise.all([
      prisma.news.findMany({
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
      prisma.news.count()
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

// POST - Create new news article (Admin only)
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
    const { title, description, content, thumbnail_url, tags } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Tiêu đề và nội dung là bắt buộc' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = generateSlug(title);

    // Check if slug already exists
    const existingNews = await prisma.news.findUnique({
      where: { slug }
    });

    if (existingNews) {
      return NextResponse.json(
        { success: false, error: 'Bài viết này đã tồn tại' },
        { status: 400 }
      );
    }

    // Create news article
    const news = await prisma.news.create({
      data: {
        title,
        slug,
        description: description || null,
        content,
        thumbnail_url: thumbnail_url || null
      }
    });

    // Process tags if provided
    let processedTags: { id: string; name: string; slug: string }[] = [];
    if (tags && Array.isArray(tags) && tags.length > 0) {
      try {
        processedTags = await processNewsTagsForCreation(tags, news.id);
        console.log(`Created/linked ${processedTags.length} tags for news ${news.id}`);
      } catch (tagError) {
        console.error('Error processing tags:', tagError);
        // Don't fail the entire operation if tags fail
      }
    }

    // Fetch the news with tags for response
    const newsWithTags = await prisma.news.findUnique({
      where: { id: news.id },
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

    return NextResponse.json({
      success: true,
      data: {
        id: newsWithTags!.id,
        title: newsWithTags!.title,
        slug: newsWithTags!.slug,
        description: newsWithTags!.description,
        thumbnail_url: newsWithTags!.thumbnail_url,
        created_at: newsWithTags!.created_at,
        tags: newsWithTags!.news_tags.map(nt => nt.tags)
      },
      message: 'Tạo bài viết thành công',
      processedTags: processedTags
    });

  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo bài viết' },
      { status: 500 }
    );
  }
}
