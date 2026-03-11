import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin
      .from('purchases')
      .select('*, purchase_items(*), suppliers(name, phone)')
      .eq('shop_id', user.shopId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { supplierId, items, paidAmount, notes } = await request.json();
    if (!items?.length) return NextResponse.json({ error: 'পণ্য যোগ করুন' }, { status: 400 });

    const total = items.reduce((s, i) => s + (+i.qty * +i.price), 0);
    const paid = paidAmount || 0;
    const due = total - paid;

    const { data: purchase, error: pErr } = await supabaseAdmin.from('purchases').insert({
      shop_id: user.shopId, supplier_id: supplierId || null,
      total, paid_amount: paid, due_amount: due,
      payment_status: due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'due',
      notes: notes || null,
    }).select().single();
    if (pErr) throw pErr;

    const purchaseItems = items.map(i => ({
      purchase_id: purchase.id, product_name: i.name,
      quantity: +i.qty, unit_price: +i.price, total: +i.qty * +i.price,
    }));
    await supabaseAdmin.from('purchase_items').insert(purchaseItems);

    return NextResponse.json(purchase, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
