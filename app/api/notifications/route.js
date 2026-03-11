import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from('notifications').select('*').eq('user_id', user.userId)
    .order('created_at', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { ids, markAll } = await request.json();
  if (markAll) {
    await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', user.userId);
  } else if (ids?.length) {
    await supabaseAdmin.from('notifications').update({ is_read: true }).in('id', ids);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    await supabaseAdmin.from('notifications').delete().eq('id', id).eq('user_id', user.userId);
  } else {
    await supabaseAdmin.from('notifications').delete().eq('user_id', user.userId).eq('is_read', true);
  }
  return NextResponse.json({ success: true });
}
