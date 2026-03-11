import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

// GET — sales list
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from       = searchParams.get('from');
  const to         = searchParams.get('to');
  const limit      = parseInt(searchParams.get('limit') || '20');
  const customerId = searchParams.get('customerId');
  const status     = searchParams.get('status'); // paid | due | partial
  const search     = searchParams.get('search');

  try {
    let query = supabaseAdmin
      .from('sales')
      .select('*, sale_items(*), customers(id, name, phone)')
      .eq('shop_id', user.shopId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (from)       query = query.gte('created_at', from);
    if (to)         query = query.lte('created_at', to);
    if (customerId) query = query.eq('customer_id', customerId);
    if (status)     query = query.eq('payment_status', status);

    const { data, error } = await query;
    if (error) throw error;

    // Client-side search on invoice_number
    const filtered = search
      ? data.filter(s =>
          s.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
          s.customers?.name?.toLowerCase().includes(search.toLowerCase())
        )
      : data;

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create sale
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { items, customerId, discount, paymentMethod, paidAmount, notes } = body;

    if (!items?.length) return NextResponse.json({ error: 'পণ্য যোগ করুন' }, { status: 400 });

    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const total    = subtotal - (discount || 0);
    const paid     = paidAmount ?? total;
    const due      = total - paid;

    const payStatus = due <= 0 ? 'paid' : paid <= 0 ? 'due' : 'partial';

    // Generate invoice number
    const now = new Date();
    const yy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const { count } = await supabaseAdmin
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', user.shopId);
    const invoiceNumber = `INV-${yy}${mm}-${String((count || 0) + 1).padStart(4, '0')}`;

    // Insert sale
    const { data: sale, error: sErr } = await supabaseAdmin
      .from('sales')
      .insert({
        shop_id: user.shopId,
        staff_id: user.userId,
        customer_id: customerId || null,
        invoice_number: invoiceNumber,
        subtotal,
        discount: discount || 0,
        total,
        paid_amount: paid,
        due_amount: due > 0 ? due : 0,
        payment_status: payStatus,
        payment_method: paymentMethod || 'cash',
        notes: notes || null,
      })
      .select()
      .single();
    if (sErr) throw sErr;

    // Insert sale items
    const saleItems = items.map(i => ({
      sale_id:      sale.id,
      product_id:   i.productId || null,
      product_name: i.productName,
      quantity:     i.quantity,
      unit_price:   i.unitPrice,
      total:        i.quantity * i.unitPrice,
      unit:         i.unit || 'pcs',
    }));
    const { error: iErr } = await supabaseAdmin.from('sale_items').insert(saleItems);
    if (iErr) throw iErr;

    // Decrease stock for each product
    for (const item of items) {
      if (item.productId) {
        await supabaseAdmin.rpc('decrement_stock', {
          p_product_id: item.productId,
          p_quantity:   item.quantity,
        }).catch(() => {
          // If RPC doesn't exist, do it manually
          supabaseAdmin.from('products')
            .select('current_stock')
            .eq('id', item.productId)
            .single()
            .then(({ data: p }) => {
              if (p) {
                supabaseAdmin.from('products')
                  .update({ current_stock: Math.max(0, p.current_stock - item.quantity) })
                  .eq('id', item.productId);
              }
            });
        });
      }
    }

    // Update customer due if needed
    if (customerId && due > 0) {
      const { data: cust } = await supabaseAdmin
        .from('customers').select('due_amount, total_spent, visit_count').eq('id', customerId).single();
      if (cust) {
        await supabaseAdmin.from('customers').update({
          due_amount:  (cust.due_amount || 0) + due,
          total_spent: (cust.total_spent || 0) + total,
          visit_count: (cust.visit_count || 0) + 1,
          last_visit:  new Date().toISOString(),
        }).eq('id', customerId);
      }
    } else if (customerId) {
      const { data: cust } = await supabaseAdmin
        .from('customers').select('total_spent, visit_count').eq('id', customerId).single();
      if (cust) {
        await supabaseAdmin.from('customers').update({
          total_spent: (cust.total_spent || 0) + total,
          visit_count: (cust.visit_count || 0) + 1,
          last_visit:  new Date().toISOString(),
        }).eq('id', customerId);
      }
    }

    return NextResponse.json({ ...sale, invoice_number: invoiceNumber }, { status: 201 });
  } catch (error) {
    console.error('Sale create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
