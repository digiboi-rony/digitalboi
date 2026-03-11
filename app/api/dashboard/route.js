import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const todayEnd = today + 'T23:59:59';

  try {
    const [todaySalesRes, allProductsRes, allCustomersRes, recentSalesRes] = await Promise.all([
      supabaseAdmin.from('sales')
        .select('total, paid_amount, due_amount, sale_items(quantity, unit_price, products(purchase_price))')
        .eq('shop_id', user.shopId).gte('created_at', today).lte('created_at', todayEnd),
      supabaseAdmin.from('products')
        .select('id, current_stock, min_stock_alert, selling_price, purchase_price')
        .eq('shop_id', user.shopId).eq('is_active', true),
      supabaseAdmin.from('customers')
        .select('due_amount').eq('shop_id', user.shopId),
      supabaseAdmin.from('sales')
        .select('id, invoice_number, total, payment_status, payment_method, created_at, customers(name, phone)')
        .eq('shop_id', user.shopId)
        .order('created_at', { ascending: false }).limit(5),
    ]);

    const todaySales = todaySalesRes.data?.reduce((s, x) => s + x.total, 0) || 0;

    // Calculate today's profit from sale items
    let todayProfit = 0;
    todaySalesRes.data?.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const purchasePrice = item.products?.purchase_price || 0;
        todayProfit += (item.unit_price - purchasePrice) * item.quantity;
      });
    });

    const totalProducts  = allProductsRes.data?.length || 0;
    const lowStockCount  = allProductsRes.data?.filter(p => p.current_stock <= p.min_stock_alert && p.current_stock >= 0).length || 0;
    const outOfStockCount = allProductsRes.data?.filter(p => p.current_stock <= 0).length || 0;
    const totalDue       = allCustomersRes.data?.reduce((s, x) => s + (x.due_amount || 0), 0) || 0;

    return NextResponse.json({
      todaySales:    Math.round(todaySales),
      todayProfit:   Math.round(todayProfit),
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalDue:      Math.round(totalDue),
      recentSales:   recentSalesRes.data || [],
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
