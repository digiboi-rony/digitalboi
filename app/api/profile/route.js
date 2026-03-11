import { NextResponse } from 'next/server';
import { getUserFromRequest, hashPassword, verifyPassword } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { uploadImage } from '../../../lib/cloudinary';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('users').select('id, full_name, phone, email, role, profile_photo, nid_number, nid_verified, is_active, created_at').eq('id', user.userId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { fullName, phone, email, profilePhoto, currentPassword, newPassword } = body;

    const updateData = {};
    if (fullName)  updateData.full_name = fullName;
    if (phone)     updateData.phone = phone;
    if (email)     updateData.email = email;

    if (profilePhoto?.startsWith('data:')) {
      const r = await uploadImage(profilePhoto, 'digiboi/profiles');
      if (r) updateData.profile_photo = r.url;
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড দিন' }, { status: 400 });
      const { data: userRow } = await supabaseAdmin.from('users').select('password_hash').eq('id', user.userId).single();
      const valid = await verifyPassword(currentPassword, userRow.password_hash);
      if (!valid) return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড ভুল' }, { status: 400 });
      if (newPassword.length < 8) return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর' }, { status: 400 });
      updateData.password_hash = await hashPassword(newPassword);
    }

    const { data, error } = await supabaseAdmin.from('users').update(updateData).eq('id', user.userId).select('id, full_name, phone, email, role, profile_photo, nid_verified').single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
