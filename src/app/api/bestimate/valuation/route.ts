import { NextRequest, NextResponse } from 'next/server';
import { bestimateClient } from '@/src/lib/bestimate-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valuation_input, timeout } = body;

    if (!valuation_input) {
      return NextResponse.json({ error: 'valuation_input is required' }, { status: 400 });
    }

    // Clamp timeout between 120 and 300
    const finalTimeout = Math.min(Math.max(Number(timeout) || 300, 120), 300);

    console.log(`DEBUG: Valuation Sync started with timeout=${finalTimeout}`);

    const result = await bestimateClient.valuationSync(valuation_input, finalTimeout, req.signal);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Valuation API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
