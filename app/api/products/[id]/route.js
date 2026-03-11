import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';
import { uploadImage } from '../../../../lib/cloudinary';

// GET single product
export async function GET(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from('products').select('*, categories(name, color, icon)')
    .eq('id', params.id).eq('shop_id', user.shopId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH update product
export async function PATCH(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { name, brand, description, mainPhoto, extraPhotos,
      purchasePrice, sellingPrice, currentStock, minStockAlert,
      unit, categoryId, barcode, expiryDate } = body;

    const updateData = {};
    if (name !== undefined)          updateData.name = name;
    if (brand !== undefined)         updateData.brand = brand;
    if (description !== undefined)   updateData.description = description;
    if (sellingPrice !== undefined)  updateData.selling_price = sellingPrice;
    if (purchasePrice !== undefined) updateData.purchase_price = purchasePrice;
    if (currentStock !== undefined)  updateData.current_stock = currentStock;
    if (minStockAlert !== undefined) updateData.min_stock_alert = minStockAlert;
    if (unit !== undefined)          updateData.unit = unit;
    if (categoryId !== undefined)    updateData.category_id = categoryId;
    if (barcode !== undefined)       updateData.barcode = barcode;
    if (expiryDate !== undefined)    updateData.expiry_date = expiryDate;

    if (mainPhoto?.startsWith('data:')) {
      const r = await uploadImage(mainPhoto, 'digiboi/products');
      if (r) updateData.main_photo = r.url;
    }
    if (extraPhotos?.length) {
      const uploads = await Promise.all(extraPhotos.filter(p => p.startsWith('data:')).map(p => uploadImage(p, 'digiboi/products')));
      updateData.extra_photos = uploads.filter(Boolean).map(r => r.url);
    }

    const { data, error } = await supabaseAdmin
      .from('products').update(updateData).eq('id', params.id).eq('shop_id', user.shopId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// DELETE product (soft delete)
export async function DELETE(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await supabaseAdmin
    .from('products').update({ is_active: false }).eq('id', params.id).eq('shop_id', user.shopId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
