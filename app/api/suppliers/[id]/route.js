import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('suppliers').select('*').eq('id', params.id).eq('shop_id', user.shopId).single();
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, address, payAmount } = await request.json();
    if (payAmount) {
      await supabaseAdmin.from('suppliers').update({ due_amount: supabaseAdmin.raw(`GREATEST(0, due_amount - ${payAmount})`), total_paid: supabaseAdmin.raw(`total_paid + ${payAmount}`) }).eq('id', params.id);
      return NextResponse.json({ success: true });
    }
    const { data, error } = await supabaseAdmin.from('suppliers').update({ name, phone, address }).eq('id', params.id).eq('shop_id', user.shopId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await supabaseAdmin.from('suppliers').delete().eq('id', params.id).eq('shop_id', user.shopId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
