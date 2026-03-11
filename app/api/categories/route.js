import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from('categories').select('*, products(count)').eq('shop_id', user.shopId).order('sort_order').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, icon, color } = await request.json();
    if (!name) return NextResponse.json({ error: 'নাম দিন' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('categories').insert({ shop_id: user.shopId, name, icon: icon || '📦', color: color || '#0F4C81' }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID দিন' }, { status: 400 });
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id).eq('shop_id', user.shopId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
