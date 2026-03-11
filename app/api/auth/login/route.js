import { NextResponse } from 'next/server';
import { findUser, verifyPassword, createToken, getUserShop, logActivity } from '../../../lib/auth';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'সব তথ্য পূরণ করুন' }, { status: 400 });
    }

    // Find user
    const user = await findUser(identifier);
    if (!user) {
      return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি' }, { status: 401 });
    }

    // Check password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'পাসওয়ার্ড ভুল হয়েছে' }, { status: 401 });
    }

    // Get shop (if owner)
    const shop = await getUserShop(user.id);

    // Create token
    const token = createToken({
      userId: user.id,
      role: user.role,
      shopId: shop?.id,
    });

    // Log activity
    await logActivity(user.id, shop?.id, 'login');

    // Remove password from response
    const { password_hash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser, shop, token });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'সার্ভারে সমস্যা হয়েছে' }, { status: 500 });
  }
}
