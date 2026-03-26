import { NextRequest, NextResponse } from 'next/server';
import { bestimateClient } from '@/src/lib/bestimate-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, lat, lng } = body;

    if (type !== 'coord' || !lat || !lng) {
      return NextResponse.json({ error: 'Only coordinate search is supported and requires lat/lng' }, { status: 400 });
    }

    console.log(`DEBUG: API Route received lookup: lat=${lat}, lng=${lng}`);

    const fb = await bestimateClient.cadastralLookup(lat, lng, req.signal);
    
    if (fb && fb.success) {
      console.log('DEBUG: Bestimate Lookup Success');
      
      const data = {
        geo_data: fb.geo_data,
        map_number: fb.parcel?.so_to_ban_do || fb.extra?.so_to_ban_do || fb.valuation_input?.so_to_ban_do || fb.parcel?.to_ban_do || fb.parcel?.so_to || fb.attributes?.so_to || fb.map_number,
        lot_number: fb.parcel?.so_hieu_thua || fb.extra?.so_hieu_thua || fb.valuation_input?.so_hieu_thua || fb.parcel?.so_thua || fb.attributes?.so_thua || fb.lot_number,
        area: fb.parcel?.dien_tich_m2 || fb.valuation_input?.dien_tich_thuc_te_m || fb.parcel?.dien_tich || fb.attributes?.dien_tich_thua || fb.area,
        address: fb.parcel?.so_nha ? `${fb.parcel.so_nha}` : (fb.valuation_input?.full_address || fb.valuation_input?.dia_chi || fb.attributes?.dia_chi || fb.address || ''),
        land_type: fb.parcel?.loai_dat_quy_hoach || fb.extra?.mdsdd || fb.valuation_input?.mdsdd || fb.parcel?.mdsdd || fb.attributes?.loai_dat || fb.land_type,
        lat: lat,
        lng: lng,
        estimated_price_vnd: fb.estimated_price_vnd,
        valuation_input: fb.valuation_input,
        parcel: fb.parcel,
        _debug: { source: 'bestimate_only' }
      };

      const response = NextResponse.json(data);
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    } else {
      console.error('DEBUG: Bestimate lookup failed or returned no data.');
      return NextResponse.json({ 
        error: 'Could not retrieve parcel data', 
        _debug: { detail: fb } 
      }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Planning API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
