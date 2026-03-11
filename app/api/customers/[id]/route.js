import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: customer, error } = await supabaseAdmin
    .from('customers').select('*').eq('id', params.id).eq('shop_id', user.shopId).single();
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, amount, paymentMethod, name, phone, email, address, notes } = body;

    // Collect payment
    if (action === 'pay') {
      if (!amount || amount <= 0) return NextResponse.json({ error: 'পরিমাণ দিন' }, { status: 400 });

      // Get current due
      const { data: cust, error: cErr } = await supabaseAdmin
        .from('customers').select('due_amount').eq('id', params.id).single();
      if (cErr) throw cErr;

      const newDue = Math.max(0, (cust.due_amount || 0) - amount);

      // Update customer due
      const { data: updated, error: uErr } = await supabaseAdmin
        .from('customers')
        .update({ due_amount: newDue })
        .eq('id', params.id).eq('shop_id', user.shopId)
        .select().single();
      if (uErr) throw uErr;

      // Log payment
      await supabaseAdmin.from('payments').insert({
        shop_id:        user.shopId,
        entity_type:    'customer_payment',
        entity_id:      params.id,
        amount:         amount,
        payment_method: paymentMethod || 'cash',
        notes:          `গ্রাহকের বাকি পরিশোধ`,
      }).catch(() => {}); // Don't fail if payments table structure differs

      return NextResponse.json(updated);
    }

    // Update info
    const updateData = {};
    if (name    !== undefined) updateData.name    = name;
    if (phone   !== undefined) updateData.phone   = phone;
    if (email   !== undefined) updateData.email   = email;
    if (address !== undefined) updateData.address = address;
    if (notes   !== undefined) updateData.notes   = notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'কোনো পরিবর্তন নেই' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('customers').update(updateData)
      .eq('id', params.id).eq('shop_id', user.shopId)
      .select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if customer has unpaid dues
  const { data: cust } = await supabaseAdmin
    .from('customers').select('due_amount').eq('id', params.id).single();
  if (cust?.due_amount > 0) {
    return NextResponse.json({ error: `বাকি ৳${cust.due_amount} পরিশোধ করুন আগে` }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('customers').delete().eq('id', params.id).eq('shop_id', user.shopId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
