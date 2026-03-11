import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { uploadImage } from '../../../lib/cloudinary';

// GET — product list
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const barcode = searchParams.get('barcode') || '';
  const lowStock = searchParams.get('lowStock') === 'true';

  try {
    let query = supabaseAdmin
      .from('products')
      .select('*, categories(name, color, icon)')
      .eq('shop_id', user.shopId)
      .eq('is_active', true)
      .order('name');

    if (search) query = query.ilike('name', `%${search}%`);
    if (category) query = query.eq('category_id', category);
    if (barcode) query = query.eq('barcode', barcode);
    if (lowStock) query = query.lte('current_stock', supabaseAdmin.raw('min_stock_alert'));

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — add product
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, brand, description, mainPhoto, extraPhotos,
      purchasePrice, sellingPrice, currentStock, minStockAlert,
      unit, categoryId, barcode, expiryDate } = body;

    if (!name || !sellingPrice) {
      return NextResponse.json({ error: 'পণ্যের নাম ও দাম দিন' }, { status: 400 });
    }

    // Upload main photo
    let mainPhotoUrl = null;
    if (mainPhoto) {
      const r = await uploadImage(mainPhoto, 'digiboi/products');
      mainPhotoUrl = r?.url;
    }

    // Upload extra photos
    let extraPhotoUrls = [];
    if (extraPhotos?.length) {
      const uploads = await Promise.all(extraPhotos.slice(0, 5).map(p => uploadImage(p, 'digiboi/products')));
      extraPhotoUrls = uploads.filter(Boolean).map(r => r.url);
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        shop_id: user.shopId,
        category_id: categoryId || null,
        barcode: barcode || null,
        name,
        brand: brand || null,
        description: description || null,
        main_photo: mainPhotoUrl,
        extra_photos: extraPhotoUrls,
        purchase_price: purchasePrice || 0,
        selling_price: sellingPrice,
        current_stock: currentStock || 0,
        min_stock_alert: minStockAlert || 5,
        unit: unit || 'pcs',
        expiry_date: expiryDate || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
