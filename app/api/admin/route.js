import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

// GET all shops (admin only)
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { data } = await supabaseAdmin.from('shops').select('*, users!owner_id(full_name, phone, email, nid_verified, is_active)').order('created_at', { ascending: false });
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// PATCH - verify NID or online business
export async function PATCH(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { type, targetId, action } = await request.json();
    if (type === 'nid') {
      await supabaseAdmin.from('users').update({ nid_verified: action === 'approve' }).eq('id', targetId);
    } else if (type === 'online') {
      await supabaseAdmin.from('shops').update({ online_verified: action === 'approve', online_verified_at: new Date().toISOString() }).eq('id', targetId);
    } else if (type === 'block') {
      await supabaseAdmin.from('users').update({ is_active: action === 'unblock' }).eq('id', targetId);
    }
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
