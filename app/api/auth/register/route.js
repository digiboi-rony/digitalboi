import { NextResponse } from 'next/server';
import { hashPassword, createToken } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { uploadImage } from '../../../lib/cloudinary';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      phone, email, password,
      ownerName, nidNumber,
      ownerPhoto, nidFront, nidBack,
      shopName, businessType, shopAddress,
      shopPhoto, tradeLicense,
      fbPageUrl, onlinePlatforms, onlineProof,
      verificationCode,
    } = body;

    // Validation
    if (!phone && !email) return NextResponse.json({ error: 'ফোন বা ইমেইল দিন' }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে' }, { status: 400 });
    if (!ownerName) return NextResponse.json({ error: 'মালিকের নাম দিন' }, { status: 400 });

    // Check duplicates
    if (phone) {
      const { data: existing } = await supabaseAdmin.from('users').select('id').eq('phone', phone).single();
      if (existing) return NextResponse.json({ error: 'এই ফোন নম্বর দিয়ে আগেই রেজিস্ট্রেশন হয়েছে' }, { status: 400 });
    }
    if (email) {
      const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).single();
      if (existing) return NextResponse.json({ error: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন হয়েছে' }, { status: 400 });
    }

    // Upload photos
    let ownerPhotoUrl = null, nidFrontUrl = null, nidBackUrl = null;
    let shopPhotoUrl = null, onlineProofUrl = null;

    if (ownerPhoto) {
      const r = await uploadImage(ownerPhoto, 'digiboi/owners');
      ownerPhotoUrl = r?.url;
    }
    if (nidFront) {
      const r = await uploadImage(nidFront, 'digiboi/nid');
      nidFrontUrl = r?.url;
    }
    if (nidBack) {
      const r = await uploadImage(nidBack, 'digiboi/nid');
      nidBackUrl = r?.url;
    }
    if (shopPhoto) {
      const r = await uploadImage(shopPhoto, 'digiboi/shops');
      shopPhotoUrl = r?.url;
    }
    if (onlineProof) {
      const r = await uploadImage(onlineProof, 'digiboi/online');
      onlineProofUrl = r?.url;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        phone: phone || null,
        email: email || null,
        password_hash: passwordHash,
        full_name: ownerName,
        role: 'owner',
        profile_photo: ownerPhotoUrl,
        nid_number: nidNumber,
        nid_front_photo: nidFrontUrl,
        nid_back_photo: nidBackUrl,
        nid_verified: false,
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create shop
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .insert({
        owner_id: user.id,
        shop_name: shopName || `${ownerName}-এর দোকান`,
        business_type: businessType || 'physical',
        shop_logo: shopPhotoUrl,
        address: shopAddress,
        trade_license: tradeLicense,
        fb_page_url: fbPageUrl,
        online_platforms: onlinePlatforms || [],
        online_proof_photo: onlineProofUrl,
        verification_code: verificationCode,
        online_verified: false,
      })
      .select()
      .single();

    if (shopError) throw shopError;

    // Create token
    const token = createToken({ userId: user.id, role: user.role, shopId: shop.id });
    const { password_hash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser, shop, token }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'রেজিস্ট্রেশনে সমস্যা হয়েছে' }, { status: 500 });
  }
}
