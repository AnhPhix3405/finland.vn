import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// POST /api/admin/tags - Create bulk tags (Admin Only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { names } = body; // Array of tag names

    if (!names || !Array.isArray(names)) {
      return NextResponse.json(
        { success: false, error: 'Names array is required' },
        { status: 400 }
      );
    }

    const createdTags = [];
    
    for (const name of names) {
      if (name && name.trim()) {
        const slug = name.toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');

        try {
          const tag = await prisma.tags.upsert({
            where: { name: name.trim() },
            update: {},
            create: {
              name: name.trim(),
              slug: slug
            }
          });
          createdTags.push(tag);
        } catch (error) {
          console.error(`Error creating tag ${name}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: createdTags,
      message: `Processed ${createdTags.length} tags`
    });

  } catch (error) {
    console.error('Error creating tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tags' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tags - Delete tag (Admin Only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Check if tag exists
    const existingTag = await prisma.tags.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Delete the tag (related listings will be handled by cascade)
    await prisma.tags.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}