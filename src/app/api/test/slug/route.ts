import { NextRequest, NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { removeVietnameseTones } from '@/src/lib/slug-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Việt Nam đẩy mạnh kiểm soát đầu cơ bất động sản trong năm 2026';
  
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);
  const baseSlug = removeVietnameseTones(title);
  const randomSuffix = nanoid();
  const finalSlug = `${baseSlug}-${randomSuffix}`;
  
  return NextResponse.json({
    success: true,
    data: {
      title,
      baseSlug,
      randomSuffix,
      finalSlug,
      format: '{base-slug}-{random-string}'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = body.title || 'Việt Nam đẩy mạnh kiểm soát đầu cơ bất động sản trong năm 2026';
    
    const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);
    const baseSlug = removeVietnameseTones(title);
    const randomSuffix = nanoid();
    const finalSlug = `${baseSlug}-${randomSuffix}`;
    
    return NextResponse.json({
      success: true,
      data: {
        title,
        baseSlug,
        randomSuffix,
        finalSlug,
        format: '{base-slug}-{random-string}'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request'
    }, { status: 400 });
  }
}