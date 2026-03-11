import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const hasDue = searchParams.get('hasDue');
  try {
    let query = supabaseAdmin.from('customers').select('*').eq('shop_id', user.shopId).order('name');
    if (search) query = query.ilike('name', `%${search}%`);
    if (hasDue === 'true') query = query.gt('due_amount', 0);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, email, address, notes } = await request.json();
    if (!name) return NextResponse.json({ error: 'নাম দিন' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('customers').insert({
      shop_id: user.shopId, name, phone, email, address, notes
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
