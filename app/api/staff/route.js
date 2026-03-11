import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { hashPassword, createToken } from '../../../lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin.from('staff')
      .select('*, users(full_name, phone, email, profile_photo, is_active)')
      .eq('shop_id', user.shopId);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, password, role, permissions } = await request.json();
    if (!name || !phone || !password) return NextResponse.json({ error: 'সব তথ্য দিন' }, { status: 400 });

    const hash = await hashPassword(password);
    const { data: staffUser, error: uErr } = await supabaseAdmin.from('users').insert({
      full_name: name, phone, password_hash: hash, role: 'staff',
    }).select().single();
    if (uErr) throw uErr;

    const { data: staffEntry, error: sErr } = await supabaseAdmin.from('staff').insert({
      shop_id: user.shopId, user_id: staffUser.id, role, permissions: permissions || {},
    }).select().single();
    if (sErr) throw sErr;

    return NextResponse.json(staffEntry, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
