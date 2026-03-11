import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

// Step 1: Request OTP
export async function POST(request) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: 'ফোন নম্বর দিন' }, { status: 400 });

    const { data: user } = await supabaseAdmin.from('users').select('id').eq('phone', phone).single();
    if (!user) return NextResponse.json({ error: 'এই নম্বরে কোনো অ্যাকাউন্ট নেই' }, { status: 404 });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    await supabaseAdmin.from('otp_requests').upsert({ phone, otp, expires_at: expiresAt });

    // In production: send SMS via SSL Wireless / bDBL
    // For now, return OTP in dev mode
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json({ success: true, ...(isDev && { otp }) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Step 2: Verify OTP + set new password
export async function PATCH(request) {
  try {
    const { phone, otp, newPassword } = await request.json();
    if (!phone || !otp || !newPassword) return NextResponse.json({ error: 'সব তথ্য দিন' }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে' }, { status: 400 });

    const { data: otpRecord } = await supabaseAdmin.from('otp_requests')
      .select('*').eq('phone', phone).eq('otp', otp).single();

    if (!otpRecord) return NextResponse.json({ error: 'OTP ভুল হয়েছে' }, { status: 400 });
    if (new Date(otpRecord.expires_at) < new Date()) return NextResponse.json({ error: 'OTP মেয়াদ শেষ হয়ে গেছে' }, { status: 400 });

    const hash = await hashPassword(newPassword);
    await supabaseAdmin.from('users').update({ password_hash: hash }).eq('phone', phone);
    await supabaseAdmin.from('otp_requests').delete().eq('phone', phone);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
