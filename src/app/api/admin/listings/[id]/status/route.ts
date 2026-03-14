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

// Valid status values based on the constraint
const VALID_STATUSES = [
  'Đang hiển thị',
  'Đang chờ duyệt', 
  'Đã ẩn',
  'Hết hạn',
  'Đã bán',
  'Đã xong',
  'Bị từ chối'
] as const;

// PATCH /api/admin/listings/[id]/status - Update listing status (Admin Only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check if listing exists
    const existingListing = await prisma.listings.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Update the listing status
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
      }
    });

    return NextResponse.json(serializeData({
      success: true,
      data: updatedListing,
      message: `Listing status updated to: ${status}`
    }));

  } catch (error) {
    console.error('Error updating listing status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing status' },
      { status: 500 }
    );
  }
}