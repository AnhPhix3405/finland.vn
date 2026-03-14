import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET /api/tags - Get all unique tag names for autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // Optional search query
    
    let whereCondition = {};
    
    if (query) {
      whereCondition = {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      };
    }

    const tags = await prisma.tags.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 20 // Limit results for performance
    });

    return NextResponse.json({
      success: true,
      data: tags
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
