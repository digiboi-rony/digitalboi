import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

const MONTH_NAMES = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'overview';
  const now = new Date();
  const from = searchParams.get('from') || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to   = searchParams.get('to')   || now.toISOString().split('T')[0] + 'T23:59:59';
  const toFull = to.includes('T') ? to : to + 'T23:59:59';

  try {
    // ─── OVERVIEW ─────────────────────────────────────
    if (type === 'overview') {
      const [salesRes, expRes, purRes, cusRes] = await Promise.all([
        supabaseAdmin.from('sales')
          .select('total, paid_amount, due_amount, payment_method, payment_status')
          .eq('shop_id', user.shopId).gte('created_at', from).lte('created_at', toFull),
        supabaseAdmin.from('expenses')
          .select('amount, category')
          .eq('shop_id', user.shopId).gte('created_at', from).lte('created_at', toFull),
        supabaseAdmin.from('purchases')
          .select('total').eq('shop_id', user.shopId).gte('created_at', from).lte('created_at', toFull),
        supabaseAdmin.from('customers').select('due_amount').eq('shop_id', user.shopId),
      ]);

      const sales = salesRes.data || [];
      const expenses = expRes.data || [];
      const purchases = purRes.data || [];

      const totalSales    = sales.reduce((s, x) => s + x.total, 0);
      const totalDue      = (cusRes.data || []).reduce((s, x) => s + (x.due_amount || 0), 0);
      const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
      const totalPurchase = purchases.reduce((s, x) => s + x.total, 0);
      const totalProfit   = totalSales - totalPurchase - totalExpenses;
      const totalOrders   = sales.length;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

      // By category (expenses)
      const catMap = {};
      expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      const byCategory = Object.entries(catMap).map(([name, amt]) => ({
        name, value: Math.round((amt / (totalExpenses || 1)) * 100), revenue: amt,
      }));

      // Payment methods breakdown
      const methodMap = {};
      sales.forEach(s => { methodMap[s.payment_method] = (methodMap[s.payment_method] || 0) + s.total; });

      return NextResponse.json({
        totalSales, totalDue, totalExpenses, totalPurchase,
        totalProfit, totalOrders, avgOrderValue, byCategory,
        methodBreakdown: methodMap,
      });
    }

    // ─── TOP PRODUCTS ──────────────────────────────────
    if (type === 'top_products') {
      const { data: items } = await supabaseAdmin
        .from('sale_items')
        .select('product_id, product_name, quantity, total, unit_price, products(unit, purchase_price)')
        .gte('created_at', from).lte('created_at', toFull);

      const map = {};
      (items || []).forEach(i => {
        const key = i.product_id || i.product_name;
        if (!map[key]) map[key] = { name: i.product_name, sold: 0, revenue: 0, profit: 0, unit: i.products?.unit || 'pcs' };
        map[key].sold    += i.quantity;
        map[key].revenue += i.total;
        map[key].profit  += (i.unit_price - (i.products?.purchase_price || 0)) * i.quantity;
      });

      const products = Object.values(map)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(p => ({ ...p, revenue: Math.round(p.revenue), profit: Math.round(p.profit) }));

      return NextResponse.json({ products });
    }

    // ─── MONTHLY CHART ─────────────────────────────────
    if (type === 'monthly') {
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
      const [salesRes, expRes, purRes] = await Promise.all([
        supabaseAdmin.from('sales').select('total, created_at').eq('shop_id', user.shopId).gte('created_at', yearStart),
        supabaseAdmin.from('expenses').select('amount, created_at').eq('shop_id', user.shopId).gte('created_at', yearStart),
        supabaseAdmin.from('purchases').select('total, created_at').eq('shop_id', user.shopId).gte('created_at', yearStart),
      ]);

      const salesByMonth   = Array(12).fill(0);
      const profitByMonth  = Array(12).fill(0);
      const purByMonth     = Array(12).fill(0);
      const expByMonth     = Array(12).fill(0);

      (salesRes.data || []).forEach(s => { salesByMonth[new Date(s.created_at).getMonth()] += s.total; });
      (purRes.data || []).forEach(p => { purByMonth[new Date(p.created_at).getMonth()] += p.total; });
      (expRes.data || []).forEach(e => { expByMonth[new Date(e.created_at).getMonth()] += e.amount; });
      salesByMonth.forEach((s, i) => { profitByMonth[i] = s - purByMonth[i] - expByMonth[i]; });

      const monthly = MONTH_NAMES.map((name, i) => ({
        name,
        sales:   Math.round(salesByMonth[i]),
        profit:  Math.round(profitByMonth[i]),
        expenses: Math.round(expByMonth[i]),
      }));

      return NextResponse.json({ monthly });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e) {
    console.error('Reports error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
