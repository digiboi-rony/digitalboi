import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

// POST - adjust stock manually
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { productId, type, quantity, reason, note } = await request.json();
    // type: 'add' | 'remove' | 'set'
    if (!productId || !type || quantity === undefined) return NextResponse.json({ error: 'তথ্য অসম্পূর্ণ' }, { status: 400 });

    const { data: product } = await supabaseAdmin.from('products').select('current_stock, name').eq('id', productId).eq('shop_id', user.shopId).single();
    if (!product) return NextResponse.json({ error: 'পণ্য পাওয়া যায়নি' }, { status: 404 });

    let newStock;
    if (type === 'add')    newStock = product.current_stock + quantity;
    else if (type === 'remove') newStock = Math.max(0, product.current_stock - quantity);
    else if (type === 'set')    newStock = quantity;
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const { data, error } = await supabaseAdmin.from('products')
      .update({ current_stock: newStock }).eq('id', productId).select().single();
    if (error) throw error;

    // Log adjustment
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.userId, shop_id: user.shopId,
      action: 'stock_adjustment',
      details: { productId, productName: product.name, type, quantity, before: product.current_stock, after: newStock, reason, note },
    });

    return NextResponse.json({ product: data, before: product.current_stock, after: newStock });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
