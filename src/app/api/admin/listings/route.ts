import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// Helper function to handle BigInt serialization
function serializeData(data: Record<string, unknown> | unknown[]) {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filter by transaction type (hashtag like 'mua-ban', 'cho-thue')
    const transactionType = searchParams.get('transaction_type');
    // Filter by status
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {};

    // Add transaction type filter
    if (transactionType) {
      whereClause.transaction_types = {
        hashtag: transactionType
      };
    }

    // Add status filter
    if (status) {
      whereClause.status = status;
    }

    const listings = await prisma.listings.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        brokers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            avatar_url: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        property_types: {
          select: {
            id: true,
            name: true,
            hashtag: true
          }
        },
        transaction_types: {
          select: {
            id: true,
            name: true,
            hashtag: true
          }
        }
      },
orderBy: {
        id: 'desc'
      }
    });

    const total = await prisma.listings.count({ where: whereClause });
    
    console.log(`Admin found ${listings.length} total listings with filters:`, { transactionType, status });

    return NextResponse.json(serializeData({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }));

  } catch (error) {
    console.error('Error fetching admin listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin listings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id or status' },
        { status: 400 }
      );
    }

    const updatedListing = await prisma.listings.update({
      where: { id },
      data: { status },
      include: {
        brokers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            avatar_url: true
          }
        }
      }
    });

    return NextResponse.json(serializeData({
      success: true,
      data: updatedListing,
      message: 'Listing status updated successfully'
    }));

  } catch (error) {
    console.error('Error updating listing status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Delete related tags first (if any foreign key constraints)
    await prisma.tags.deleteMany({
      where: { listing_id: id }
    });

    // Delete the listing
    await prisma.listings.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
