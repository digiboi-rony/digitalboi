'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore, useNotifStore } from '@/lib/store';

export default function StockPage() {
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [adjustType, setAdjustType] = useState('add'); // add | remove | set
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all | low | out

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=200', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search));
    const matchFilter = filter === 'all' || (filter === 'low' && p.current_stock <= p.min_stock_alert && p.current_stock > 0) || (filter === 'out' && p.current_stock <= 0);
    return matchSearch && matchFilter;
  });

  const doAdjust = async () => {
    if (!selected || qty === '') { addNotif('পরিমাণ দিন', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: selected.id, type: adjustType, quantity: +qty, reason }),
      });
      const data = await res.json();
      if (!res.ok) { addNotif(data.error || 'সমস্যা হয়েছে', 'error'); return; }
      addNotif(`✅ স্টক আপডেট হয়েছে (${data.before} → ${data.after})`, 'success');
      setSelected(null); setQty(''); setReason('');
      loadProducts();
    } finally { setSaving(false); }
  };

  const stockStatus = (p) => {
    if (p.current_stock <= 0) return { label: 'স্টক নেই', color: '#E63946', bg: '#FDECEA' };
    if (p.current_stock <= p.min_stock_alert) return { label: 'কম স্টক', color: '#F4A261', bg: '#FFF3E0' };
    return { label: 'স্বাভাবিক', color: '#0BAA69', bg: '#E6F9F2' };
  };

  const lowCount = products.filter(p => p.current_stock <= p.min_stock_alert && p.current_stock > 0).length;
  const outCount = products.filter(p => p.current_stock <= 0).length;

  const REASONS = ['ক্রয় করা হয়েছে', 'ক্ষতি / নষ্ট হয়েছে', 'রিটার্ন দেওয়া হয়েছে', 'গণনা সংশোধন', 'অন্যান্য'];

  return (
    <AppShell title="স্টক সমন্বয়" activeTab="inventory">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Alert cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'মোট পণ্য', v: products.length, c: '#0F4C81', bg: '#EEF1FF' },
            { l: 'কম স্টক', v: lowCount, c: '#F4A261', bg: '#FFF3E0' },
            { l: 'স্টক নেই', v: outCount, c: '#E63946', bg: '#FDECEA' },
          ].map(s => (
            <div key={s.l} style={{ background: s.bg, borderRadius: 14, padding: 12, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: s.c + '99' }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 পণ্যের নাম বা বারকোড..."
          style={{ width: '100%', padding: '12px 16px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[['all', 'সব'], ['low', '⚠️ কম'], ['out', '❌ নেই']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding: '6px 16px', border: `2px solid ${filter === k ? '#0F4C81' : '#DDE4EE'}`, borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === k ? '#0F4C81' : 'white', color: filter === k ? 'white' : '#5E6E8A', fontFamily: 'inherit' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Product List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 16 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span style={{ fontSize: 48 }}>📦</span>
            <p style={{ color: '#8A9AB5', fontWeight: 600, marginTop: 12 }}>কোনো পণ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(p => {
              const st = stockStatus(p);
              return (
                <div key={p.id} className="card" style={{ padding: '13px 16px', cursor: 'pointer' }} onClick={() => { setSelected(p); setAdjustType('add'); setQty(''); setReason(''); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {p.main_photo ? <img src={p.main_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>📦</span>}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#141D28' }}>{p.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#8A9AB5' }}>{p.brand || p.unit} · সর্বনিম্ন: {p.min_stock_alert}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: st.color }}>{p.current_stock}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.72)', zIndex: 900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelected(null)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '22px 20px 28px', width: '100%', maxWidth: 480, animation: 'slideUp 0.3s', fontFamily: "'Hind Siliguri', sans-serif" }} onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#141D28' }}>📦 স্টক সমন্বয়</p>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, background: '#F0F4F8', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {/* Product info */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden' }}>
                {selected.main_photo ? <img src={selected.main_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#141D28' }}>{selected.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#8A9AB5' }}>বর্তমান স্টক: <strong style={{ color: '#0F4C81' }}>{selected.current_stock} {selected.unit}</strong></p>
              </div>
            </div>

            {/* Adjustment type */}
            <p style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>সমন্বয়ের ধরন</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[['add', '➕ যোগ করুন', '#0BAA69'], ['remove', '➖ কমান', '#E63946'], ['set', '🔧 নির্ধারণ', '#0F4C81']].map(([k, l, c]) => (
                <button key={k} onClick={() => setAdjustType(k)}
                  style={{ padding: '10px 4px', border: `2px solid ${adjustType === k ? c : '#DDE4EE'}`, borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: adjustType === k ? c + '15' : 'white', color: adjustType === k ? c : '#5E6E8A', fontFamily: 'inherit' }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                {adjustType === 'set' ? 'নতুন স্টক পরিমাণ' : 'পরিমাণ'} <span style={{ color: '#E63946' }}>*</span>
              </label>
              <input type="number" min="0" value={qty} onChange={e => setQty(e.target.value)} placeholder="০"
                style={{ width: '100%', padding: '13px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 18, fontWeight: 700, fontFamily: 'inherit', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#2E86DE'}
                onBlur={e => e.target.style.borderColor = '#DDE4EE'} />
              {qty !== '' && adjustType !== 'set' && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#5E6E8A', textAlign: 'center' }}>
                  আপডেটের পরে: <strong style={{ color: '#0F4C81', fontSize: 14 }}>
                    {adjustType === 'add' ? selected.current_stock + +qty : Math.max(0, selected.current_stock - +qty)} {selected.unit}
                  </strong>
                </p>
              )}
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>কারণ</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {REASONS.map(r => (
                  <button key={r} onClick={() => setReason(r)}
                    style={{ padding: '5px 12px', border: `1.5px solid ${reason === r ? '#0F4C81' : '#DDE4EE'}`, borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: reason === r ? '#EEF1FF' : 'white', color: reason === r ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setSelected(null)} style={{ padding: 13, background: '#F0F4F8', border: 'none', borderRadius: 12, fontSize: 14, color: '#5E6E8A', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>বাতিল</button>
              <button onClick={doAdjust} disabled={saving}
                style={{ padding: 13, background: saving ? '#8A9AB5' : adjustType === 'remove' ? 'linear-gradient(135deg,#E63946,#FF6B6B)' : 'linear-gradient(135deg,#0F4C81,#2E86DE)', border: 'none', borderRadius: 12, fontSize: 14, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                {saving ? '⏳...' : '✓ আপডেট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
