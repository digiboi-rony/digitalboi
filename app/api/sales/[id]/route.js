import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('sales')
    .select('*, sale_items(*), customers(id, name, phone, address), users!staff_id(full_name)')
    .eq('id', params.id)
    .eq('shop_id', user.shopId)
    .single();

  if (error) return NextResponse.json({ error: 'বিক্রয় পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, amount, paymentMethod } = body;

    if (action === 'collect_due' || amount) {
      const collectAmount = amount;
      if (!collectAmount || collectAmount <= 0) {
        return NextResponse.json({ error: 'পরিমাণ দিন' }, { status: 400 });
      }

      // Get current sale
      const { data: sale, error: gErr } = await supabaseAdmin
        .from('sales').select('due_amount, paid_amount, customer_id').eq('id', params.id).single();
      if (gErr || !sale) return NextResponse.json({ error: 'বিক্রয় পাওয়া যায়নি' }, { status: 404 });

      const newDue   = Math.max(0, (sale.due_amount || 0) - collectAmount);
      const newPaid  = (sale.paid_amount || 0) + collectAmount;
      const newStatus = newDue <= 0 ? 'paid' : 'partial';

      const { data, error } = await supabaseAdmin
        .from('sales')
        .update({ due_amount: newDue, paid_amount: newPaid, payment_status: newStatus })
        .eq('id', params.id)
        .select('*, sale_items(*), customers(id, name, phone)')
        .single();
      if (error) throw error;

      // Update customer due
      if (sale.customer_id) {
        const { data: cust } = await supabaseAdmin
          .from('customers').select('due_amount').eq('id', sale.customer_id).single();
        if (cust) {
          await supabaseAdmin.from('customers').update({
            due_amount: Math.max(0, (cust.due_amount || 0) - collectAmount)
          }).eq('id', sale.customer_id);
        }
      }

      // Log payment
      await supabaseAdmin.from('payments').insert({
        shop_id:        user.shopId,
        entity_type:    'sale',
        entity_id:      params.id,
        amount:         collectAmount,
        payment_method: paymentMethod || 'cash',
        notes:          `বিক্রয় বাকি আদায়`,
      }).catch(() => {});

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    console.error('Sale PATCH error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
