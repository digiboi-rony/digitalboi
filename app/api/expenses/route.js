import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  try {
    let query = supabaseAdmin.from('expenses').select('*')
      .eq('shop_id', user.shopId).order('created_at', { ascending: false });
    if (from) query = query.gte('created_at', from);
    if (to)   query = query.lte('created_at', to);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { category, amount, description, paymentMethod } = await request.json();
    if (!amount || !category) return NextResponse.json({ error: 'পরিমাণ ও ক্যাটাগরি দিন' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('expenses').insert({
      shop_id: user.shopId, staff_id: user.userId,
      category, amount: +amount, description, payment_method: paymentMethod || 'cash',
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
