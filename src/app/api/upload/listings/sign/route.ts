import { NextResponse } from 'next/server';
import crypto from 'crypto';
export async function POST() {
  try {
    // Get Cloudinary configuration from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' },
        { status: 500 }
      );
    }

    // Generate timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Create signature for Cloudinary upload
    const paramsToSign = `folder=finland/listings&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign)
      .digest('hex');

    return NextResponse.json({
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder: 'finland/listings'
    });

  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}
