import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'sale' | 'purchase' | 'expense'
  const from = searchParams.get('from');
  const to   = searchParams.get('to');

  try {
    let query = supabaseAdmin.from('payments').select('*')
      .eq('shop_id', user.shopId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (type)  query = query.eq('entity_type', type);
    if (from)  query = query.gte('created_at', from);
    if (to)    query = query.lte('created_at', to + 'T23:59:59');

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { entityType, entityId, amount, paymentMethod, notes } = await request.json();
    if (!entityType || !entityId || !amount) {
      return NextResponse.json({ error: 'তথ্য অসম্পূর্ণ' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from('payments').insert({
      shop_id: user.shopId,
      entity_type: entityType,
      entity_id: entityId,
      amount: +amount,
      payment_method: paymentMethod || 'cash',
      notes,
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
