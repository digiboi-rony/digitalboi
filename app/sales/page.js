'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, timeAgo, STATUS_STYLE } from '@/lib/utils';

export default function SalesHistoryPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCollect, setShowCollect] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadSales(); }, [filter, dateFrom, dateTo]);

  const loadSales = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 100 });
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo)   params.append('to', dateTo + 'T23:59:59');
    try {
      const res = await fetch('/api/sales?' + params, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
    } catch { setSales([]); }
    finally { setLoading(false); }
  };

  const collectDue = async () => {
    if (!collectAmount || !showCollect) return;
    await fetch(`/api/sales/${showCollect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: +collectAmount, paymentMethod: 'cash' }),
    });
    setShowCollect(null); setCollectAmount('');
    loadSales();
  };

  const filtered = sales.filter(s => {
    const matchSearch = !search || s.invoice_number?.includes(search) || s.customers?.name?.includes(search);
    const matchFilter = filter === 'all' || s.payment_status === filter;
    return matchSearch && matchFilter;
  });

  const totalAmount = filtered.reduce((s, x) => s + x.total, 0);
  const totalDue    = filtered.reduce((s, x) => s + (x.due_amount || 0), 0);

  return (
    <AppShell title="বিক্রয় ইতিহাস" activeTab="reports">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Date Filter */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#8A9AB5', fontWeight: 600 }}>FROM</p>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={today}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #DDE4EE', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#8A9AB5', fontWeight: 600 }}>TO</p>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} max={today}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #DDE4EE', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Quick date filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
          {[['আজ', today, today], ['এই সপ্তাহ', new Date(Date.now()-6*86400000).toISOString().split('T')[0], today], ['এই মাস', new Date(new Date().setDate(1)).toISOString().split('T')[0], today]].map(([l, f, t]) => (
            <button key={l} onClick={() => { setDateFrom(f); setDateTo(t); }}
              style={{ padding: '6px 14px', background: dateFrom === f ? '#0F4C81' : 'white', color: dateFrom === f ? 'white' : '#5E6E8A', border: `2px solid ${dateFrom === f ? '#0F4C81' : '#DDE4EE'}`, borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {l}
            </button>
          ))}
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ padding: '6px 14px', background: '#F0F4F8', color: '#5E6E8A', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>সব</button>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { l: 'মোট বিক্রয়', v: formatCurrency(totalAmount, true), c: '#0BAA69' },
            { l: 'অর্ডার', v: filtered.length + 'টি', c: '#0F4C81' },
            { l: 'বাকি', v: formatCurrency(totalDue, true), c: '#E63946' },
          ].map(s => (
            <div key={s.l} className="card" style={{ padding: 12, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: '#8A9AB5' }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ইনভয়েস বা গ্রাহকের নাম..."
          style={{ width: '100%', padding: '11px 16px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['all', 'সব'], ['paid', '✓ পরিশোধ'], ['due', '⏳ বাকি'], ['partial', '~ আংশিক']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding: '6px 14px', border: `2px solid ${filter === k ? '#0F4C81' : '#DDE4EE'}`, borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === k ? '#0F4C81' : 'white', color: filter === k ? 'white' : '#5E6E8A', fontFamily: 'inherit' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Sales List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 16 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span style={{ fontSize: 48 }}>🛒</span>
            <p style={{ color: '#8A9AB5', fontWeight: 600, marginTop: 12 }}>কোনো বিক্রয় পাওয়া যায়নি</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(s => {
              const st = STATUS_STYLE[s.payment_status] || STATUS_STYLE.due;
              return (
                <div key={s.id} className="card" style={{ padding: '14px 16px', cursor: 'pointer', borderLeft: `4px solid ${st.color}` }} onClick={() => setSelected(s)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#141D28' }}>
                        {s.customers?.name || 'সাধারণ গ্রাহক'}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#8A9AB5' }}>
                        {s.invoice_number} · {s.sale_items?.length || '?'} পণ্য · {timeAgo(s.created_at)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#141D28' }}>
                        {formatCurrency(s.total)}
                      </p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#8A9AB5', background: '#F0F4F8', padding: '3px 8px', borderRadius: 8 }}>
                        {s.payment_method === 'cash' ? '💵 নগদ' : s.payment_method === 'bkash' ? '📱 bKash' : s.payment_method === 'nagad' ? '🟠 নগদ' : '📋 বাকি'}
                      </span>
                    </div>
                    {s.due_amount > 0 && (
                      <button onClick={e => { e.stopPropagation(); setShowCollect(s); }}
                        style={{ padding: '5px 12px', background: '#0BAA69', border: 'none', borderRadius: 8, fontSize: 12, color: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                        💰 ৳{s.due_amount} নিন
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.72)', zIndex: 900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setSelected(null)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '22px 20px 28px', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.3s', fontFamily: "'Hind Siliguri', sans-serif" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>🧾 {selected.invoice_number}</p>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, background: '#F0F4F8', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                ['গ্রাহক', selected.customers?.name || 'সাধারণ'],
                ['তারিখ', new Date(selected.created_at).toLocaleString('bn-BD')],
                ['পেমেন্ট', selected.payment_method],
                ['অবস্থা', STATUS_STYLE[selected.payment_status]?.label || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#F8FAFC', borderRadius: 10, padding: 10 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 10, color: '#8A9AB5' }}>{k}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#141D28' }}>{v}</p>
                </div>
              ))}
            </div>
            {selected.sale_items?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#141D28' }}>পণ্য তালিকা:</p>
                {selected.sale_items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F4F8' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#141D28' }}>{item.product_name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#8A9AB5' }}>{item.quantity} × ৳{item.unit_price}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>৳{item.total}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px' }}>
              {[['উপমোট', formatCurrency(selected.subtotal)], selected.discount > 0 && ['ছাড়', '−'+formatCurrency(selected.discount)]].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span style={{ fontSize: 13, color: '#5E6E8A' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1px solid #DDE4EE', marginTop: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>সর্বমোট</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0F4C81' }}>{formatCurrency(selected.total)}</span>
              </div>
              {selected.due_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span style={{ fontSize: 13, color: '#E63946' }}>বাকি</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#E63946' }}>{formatCurrency(selected.due_amount)}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: selected.due_amount > 0 ? '1fr 1fr' : '1fr', gap: 10, marginTop: 14 }}>
              <button onClick={() => window.open(`/receipt?id=${selected.id}`, '_blank')} style={{ padding: 12, background: '#EEF1FF', border: 'none', borderRadius: 12, fontSize: 14, color: '#0F4C81', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>🖨️ প্রিন্ট</button>
              {selected.due_amount > 0 && (
                <button onClick={() => { setShowCollect(selected); setSelected(null); }} style={{ padding: 12, background: '#0BAA69', border: 'none', borderRadius: 12, fontSize: 14, color: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>💰 বাকি নিন</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collect Due Modal */}
      {showCollect && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.72)', zIndex: 950, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowCollect(null)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '22px 20px 28px', width: '100%', maxWidth: 480, animation: 'slideUp 0.3s', fontFamily: "'Hind Siliguri', sans-serif" }} onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>💰 বাকি আদায়</p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8A9AB5' }}>মোট বাকি: {formatCurrency(showCollect.due_amount)}</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>পরিমাণ (৳)</label>
              <input type="number" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} placeholder={showCollect.due_amount}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[showCollect.due_amount, 500, 1000, 2000].filter((v, i, a) => a.indexOf(v) === i && v <= showCollect.due_amount).slice(0, 4).map(v => (
                <button key={v} onClick={() => setCollectAmount(v)} style={{ flex: 1, padding: '8px 4px', background: +collectAmount === v ? '#0F4C81' : '#EEF1FF', color: +collectAmount === v ? 'white' : '#0F4C81', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>৳{v}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setShowCollect(null)} style={{ padding: 12, background: '#F0F4F8', border: 'none', borderRadius: 12, fontSize: 14, color: '#5E6E8A', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>বাতিল</button>
              <button onClick={collectDue} style={{ padding: 12, background: '#0BAA69', border: 'none', borderRadius: 12, fontSize: 14, color: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>✓ নিশ্চিত</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
