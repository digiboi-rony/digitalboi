import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { uploadImage } from '../../../lib/cloudinary';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('shops').select('*').eq('id', user.shopId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { shopName, address, district, shopLogo, shopBanner, fbPageUrl, onlinePlatforms, tradeLicense } = body;

    const updateData = {};
    if (shopName)        updateData.shop_name = shopName;
    if (address)         updateData.address = address;
    if (district)        updateData.district = district;
    if (fbPageUrl !== undefined) updateData.fb_page_url = fbPageUrl;
    if (onlinePlatforms) updateData.online_platforms = onlinePlatforms;
    if (tradeLicense)    updateData.trade_license = tradeLicense;

    if (shopLogo?.startsWith('data:')) {
      const r = await uploadImage(shopLogo, 'digiboi/logos');
      if (r) updateData.shop_logo = r.url;
    }
    if (shopBanner?.startsWith('data:')) {
      const r = await uploadImage(shopBanner, 'digiboi/banners');
      if (r) updateData.shop_banner = r.url;
    }

    const { data, error } = await supabaseAdmin.from('shops').update(updateData).eq('id', user.shopId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
