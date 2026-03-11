'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, shop, token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, salesRes, reportRes] = await Promise.all([
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sales?limit=5', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/reports?type=monthly', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const statsData = await statsRes.json();
      const salesData = await salesRes.json();
      const reportData = await reportRes.json();

      setStats(statsData);
      setRecentSales(Array.isArray(salesData) ? salesData : []);
      if (reportData?.monthly) setChartData(reportData.monthly);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const s = stats || { todaySales: 0, todayProfit: 0, totalProducts: 0, lowStockCount: 0, totalDue: 0 };

  return (
    <AppShell title="ড্যাশবোর্ড" activeTab="dashboard">
      <div style={{ padding: '0 16px 80px' }}>

        {/* Hero Banner */}
        <div style={{ background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius: '22px', padding: '22px 20px', marginBottom: '18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', right: '40px', bottom: '-40px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <p style={{ margin: '0 0 3px', fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
            {user?.role === 'super_admin' ? '👑 Super Admin' : '🏪 ' + (shop?.shop_name || 'দোকান')}
          </p>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '700', color: 'white' }}>
            স্বাগতম, {user?.full_name?.split(' ')[0] || 'স্বাগতম'}!
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {loading
              ? [1, 2, 3].map(i => <div key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px', height: '56px' }} />)
              : [
                  ['৳ ' + s.todaySales.toLocaleString('bn-BD'), 'আজ বিক্রয়'],
                  ['৳ ' + s.todayProfit.toLocaleString('bn-BD'), 'আজ মুনাফা'],
                  [s.totalProducts + ' টি', 'মোট পণ্য'],
                ].map(([v, l]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 10px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'white' }}>{v}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{l}</p>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
          {loading
            ? [1, 2, 3, 4].map(i => <div key={i} className="card" style={{ height: '86px' }} />)
            : [
                { label: 'আজকের বিক্রয়', value: '৳ ' + s.todaySales.toLocaleString(), icon: '📈', color: '#0BAA69', sub: s.totalDue > 0 ? `৳ ${s.totalDue.toLocaleString()} বাকি` : '✓ কোনো বাকি নেই' },
                { label: 'মোট পণ্য', value: s.totalProducts, icon: '📦', color: '#2E86DE', sub: s.lowStockCount > 0 ? `⚠️ ${s.lowStockCount} কম স্টক` : '✓ স্বাভাবিক' },
                { label: 'বাকি পাওনা', value: '৳ ' + s.totalDue.toLocaleString(), icon: '💰', color: '#F4A261', sub: 'গ্রাহকদের কাছে', onClick: () => router.push('/customers?filter=due') },
                { label: 'কম স্টক', value: s.lowStockCount + ' পণ্য', icon: '⚠️', color: '#E63946', sub: 'জরুরি ক্রয় করুন', onClick: () => router.push('/low-stock') },
              ].map(sc => (
                <div key={sc.label} className="card" style={{ padding: '16px', borderLeft: `4px solid ${sc.color}`, cursor: sc.onClick ? 'pointer' : 'default' }} onClick={sc.onClick}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: sc.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{sc.icon}</div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#8A9AB5', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.3' }}>{sc.label}</p>
                  </div>
                  <p style={{ margin: '0 0 3px', fontSize: '20px', fontWeight: '800', color: '#141D28' }}>{sc.value}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: sc.color, fontWeight: '600' }}>{sc.sub}</p>
                </div>
              ))
          }
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: '18px' }}>
          <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>⚡ দ্রুত কাজ</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {[
              { icon: '🛒', label: 'বিক্রয়', href: '/pos', color: '#2E86DE', bg: '#EEF1FF' },
              { icon: '➕', label: 'পণ্য যোগ', href: '/inventory', color: '#0BAA69', bg: '#E6F9F2' },
              { icon: '📊', label: 'রিপোর্ট', href: '/reports', color: '#8B5CF6', bg: '#F3F0FF' },
              { icon: '⚠️', label: 'কম স্টক', href: '/low-stock', color: '#E63946', bg: '#FDECEA' },
            ].map(a => (
              <a key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: a.bg, borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '22px' }}>{a.icon}</span>
                  <p style={{ margin: '7px 0 0', fontSize: '10px', fontWeight: '600', color: a.color }}>{a.label}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ marginBottom: '18px' }}>
            <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>📊 মাসিক বিক্রয় (৳)</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8A9AB5' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={v => ['৳ ' + v.toLocaleString(), 'বিক্রয়']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #DDE4EE', fontSize: '12px', fontFamily: "'Hind Siliguri',sans-serif" }}
                />
                <Bar dataKey="sales" fill="#0F4C81" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Sales */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#141D28' }}>🕐 সাম্প্রতিক বিক্রয়</p>
            <a href="/sales" style={{ fontSize: '12px', color: '#2E86DE', fontWeight: '600', textDecoration: 'none' }}>সব দেখুন →</a>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: '72px' }} />)}
            </div>
          ) : recentSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#8A9AB5' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🛒</div>
              <p style={{ margin: 0 }}>আজ এখনো কোনো বিক্রয় হয়নি</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentSales.map(s => (
                <a key={s.id} href={`/sales/${s.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: s.payment_status === 'paid' ? '#E6F9F2' : '#FDECEA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                          {s.payment_status === 'paid' ? '✅' : '⏳'}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#141D28' }}>{s.customers?.name || 'সাধারণ গ্রাহক'}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#8A9AB5' }}>{s.invoice_number}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '800', color: '#141D28' }}>৳ {s.total?.toLocaleString()}</p>
                        <span className="pill" style={{ background: s.payment_status === 'paid' ? '#E6F9F2' : '#FDECEA', color: s.payment_status === 'paid' ? '#0BAA69' : '#E63946' }}>
                          {s.payment_status === 'paid' ? '✓ পরিশোধ' : '⏳ বাকি'}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
