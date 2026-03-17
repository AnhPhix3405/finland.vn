import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';
import { updateNewsTags } from '@/src/app/modules/news.tags.service';
import { removeVietnameseTones, generateSlug } from '@/src/lib/slug-utils';

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

// GET - Get single news article by slug (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

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

// PATCH - Update news article (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const { title, description, content, thumbnail_url, tags } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { slug }
    });

    if (!existingNews) {
      return NextResponse.json(
        { success: false, error: 'Bài viết không tồn tại' },
        { status: 404 }
      );
    }

    // Generate new slug if title is being updated
    let newSlug = slug;
    if (title && title !== existingNews.title) {
      const baseSlug = removeVietnameseTones(title);
      newSlug = generateSlug(title);
      
      // Check if the new slug already exists (and is not the current news)
      const existingWithNewSlug = await prisma.news.findFirst({
        where: {
          slug: newSlug,
          id: { not: existingNews.id }
        }
      });
      
      if (existingWithNewSlug) {
        return NextResponse.json(
          { success: false, error: 'Slug đã tồn tại, vui lòng sử dụng tên khác' },
          { status: 400 }
        );
      }
    }

    // Update news article
    const updatedNews = await prisma.news.update({
      where: { slug },
      data: {
        title: title || undefined,
        slug: newSlug !== slug ? newSlug : undefined,
        description: description !== undefined ? description : undefined,
        content: content || undefined,
        thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : undefined
      },
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

    // Update tags if provided
    let processedTags: { id: string; name: string; slug: string }[] = [];
    if (tags && Array.isArray(tags)) {
      try {
        processedTags = await updateNewsTags(updatedNews.id, tags);
        console.log(`Updated ${processedTags.length} tags for news ${updatedNews.id}`);
      } catch (tagError) {
        console.error('Error updating tags:', tagError);
        // Don't fail the entire operation if tags fail
      }
    }

    // Fetch updated news with final tags
    const finalNews = await prisma.news.findUnique({
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

    return NextResponse.json({
      success: true,
      data: {
        id: finalNews!.id,
        title: finalNews!.title,
        slug: finalNews!.slug,
        description: finalNews!.description,
        content: finalNews!.content,
        thumbnail_url: finalNews!.thumbnail_url,
        created_at: finalNews!.created_at,
        tags: finalNews!.news_tags.map(nt => nt.tags)
      },
      message: 'Cập nhật bài viết thành công',
      processedTags: processedTags
    });

  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật bài viết' },
      { status: 500 }
    );
  }
}

// DELETE - Delete news article (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if news exists
    const news = await prisma.news.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true
      }
    });

    if (!news) {
      return NextResponse.json(
        { success: false, error: 'Bài viết không tồn tại' },
        { status: 404 }
      );
    }

    // Delete news (will cascade delete news_tags due to onDelete: Cascade)
    await prisma.news.delete({
      where: { slug }
    });

    return NextResponse.json({
      success: true,
      message: `Xóa bài viết "${news.title}" thành công`
    });

  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa bài viết' },
      { status: 500 }
    );
  }
}
