'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../lib/store';
import { timeAgo, debounce } from '../../lib/utils';

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [showAdd, setShowAdd] = useState(false);
  const [showPayment, setShowPayment] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });

  useEffect(() => { loadCustomers(); }, [filter]);

  const loadCustomers = async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      if (filter === 'due') params.append('hasDue', 'true');
      const res = await fetch('/api/customers?' + params, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  };

  const debouncedSearch = useCallback(debounce((q) => loadCustomers(q), 400), [filter]);

  const handleSearch = (val) => {
    setSearch(val);
    debouncedSearch(val);
  };

  const addCustomer = async () => {
    if (!form.name) { addNotif('গ্রাহকের নাম দিন', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        addNotif('✅ গ্রাহক যোগ হয়েছে!', 'success');
        setShowAdd(false);
        setForm({ name: '', phone: '', address: '', notes: '' });
        loadCustomers(search);
      } else {
        const err = await res.json();
        addNotif(err.error || 'সমস্যা হয়েছে', 'error');
      }
    } catch { addNotif('সার্ভারে সমস্যা', 'error'); }
    setSaving(false);
  };

  const collectPayment = async () => {
    if (!payAmount || !showPayment) return;
    try {
      const res = await fetch(`/api/customers/${showPayment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'pay', amount: +payAmount }),
      });
      if (res.ok) {
        addNotif(`✅ ৳ ${(+payAmount).toLocaleString()} পেমেন্ট নেওয়া হয়েছে!`, 'success');
        setShowPayment(null);
        setPayAmount('');
        loadCustomers(search);
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
  };

  const totalDue = customers.reduce((s, c) => s + (c.due_amount || 0), 0);
  const dueCount = customers.filter(c => c.due_amount > 0).length;

  return (
    <AppShell title="গ্রাহক তালিকা" activeTab="customers">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { l: 'মোট গ্রাহক', v: customers.length + ' জন', c: '#0F4C81', bg: '#EEF1FF' },
            { l: 'বাকি আছে', v: dueCount + ' জন', c: '#E63946', bg: '#FDECEA' },
            { l: 'মোট বাকি', v: '৳ ' + totalDue.toLocaleString(), c: '#F4A261', bg: '#FFF3E0' },
          ].map(s => (
            <div key={s.l} style={{ background: s.bg, borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: s.c }}>{s.v}</p>
              <p style={{ margin: '3px 0 0', fontSize: '10px', color: s.c + '99' }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#8A9AB5' }}>🔍</span>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
            style={{ width: '100%', padding: '12px 14px 12px 40px', border: '2px solid #DDE4EE', borderRadius: '14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'white' }}
            onFocus={e => e.target.style.borderColor = '#2E86DE'}
            onBlur={e => e.target.style.borderColor = '#DDE4EE'}
          />
        </div>

        {/* Filter + Add */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', background: '#F0F4F8', borderRadius: '12px', padding: '3px', gap: '3px', flex: 1 }}>
            {[['all', 'সব'], ['due', '⏳ বাকি']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: filter === k ? 'white' : 'transparent', color: filter === k ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit', boxShadow: filter === k ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>{l}</button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '13px' }}>+ গ্রাহক</button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="card skeleton" style={{ height: '80px' }} />)}
          </div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 16px' }}>
            <span style={{ fontSize: '48px' }}>👥</span>
            <p style={{ color: '#8A9AB5', fontWeight: '600', marginTop: '12px' }}>{search ? 'কোনো গ্রাহক পাওয়া যায়নি' : 'এখনো কোনো গ্রাহক যোগ করা হয়নি'}</p>
            {!search && <button onClick={() => setShowAdd(true)} className="btn btn-primary" style={{ marginTop: '14px' }}>+ প্রথম গ্রাহক যোগ করুন</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {customers.map(c => (
              <div key={c.id} className="card" style={{ padding: '14px 16px', borderLeft: `4px solid ${c.due_amount > 0 ? '#E63946' : '#0BAA69'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}
                    onClick={() => router.push(`/customers/${c.id}`)}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: c.due_amount > 0 ? '#FDECEA' : '#E6F9F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {c.due_amount > 0 ? '⏳' : '✅'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>{c.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#8A9AB5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📱 {c.phone || '—'} {c.address ? `· ${c.address}` : ''}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#5E6E8A' }}>🛒 {c.visit_count || 0} বার</span>
                        {c.last_visit && <span style={{ fontSize: '10px', color: '#8A9AB5' }}>· {timeAgo(c.last_visit)}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                    {c.due_amount > 0 ? (
                      <>
                        <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '800', color: '#E63946' }}>৳ {c.due_amount.toLocaleString()} বাকি</p>
                        <button onClick={e => { e.stopPropagation(); setShowPayment(c); setPayAmount(''); }}
                          style={{ padding: '5px 12px', background: '#0BAA69', border: 'none', borderRadius: '8px', fontSize: '11px', color: 'white', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>
                          💰 নিন
                        </button>
                      </>
                    ) : (
                      <>
                        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#0BAA69' }}>পরিশোধ ✓</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#8A9AB5' }}>৳ {(c.total_spent || 0).toLocaleString()}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>👤 নতুন গ্রাহক</p>
              <button onClick={() => setShowAdd(false)} style={{ background: '#F0F4F8', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            {[
              { l: 'নাম', k: 'name', t: 'text', ph: 'যেমন: রহিম মিয়া', req: true },
              { l: 'ফোন', k: 'phone', t: 'tel', ph: '01X-XXXX-XXXX' },
              { l: 'ঠিকানা', k: 'address', t: 'text', ph: 'এলাকা, জেলা' },
              { l: 'নোট', k: 'notes', t: 'text', ph: 'অতিরিক্ত তথ্য' },
            ].map(f => (
              <div key={f.k} className="input-wrap">
                <label className="input-label">{f.l}{f.req && <span style={{ color: '#E63946' }}> *</span>}</label>
                <input className="input-field" type={f.t} placeholder={f.ph} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={addCustomer} disabled={saving} className="btn btn-primary btn-full">
                {saving ? '⏳ যোগ হচ্ছে...' : '✓ যোগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>💰 পেমেন্ট নিন</p>
              <button onClick={() => setShowPayment(null)} style={{ background: '#F0F4F8', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ background: '#FDECEA', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>{showPayment.name}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#E63946', fontWeight: '600' }}>মোট বাকি: ৳ {showPayment.due_amount?.toLocaleString()}</p>
            </div>
            <div className="input-wrap">
              <label className="input-label">পরিমাণ (৳)</label>
              <input className="input-field" type="number" placeholder={showPayment.due_amount} value={payAmount} onChange={e => setPayAmount(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[showPayment.due_amount, Math.ceil(showPayment.due_amount / 2), 500, 1000]
                .filter((v, i, a) => a.indexOf(v) === i && v > 0)
                .slice(0, 4)
                .map(v => (
                  <button key={v} onClick={() => setPayAmount(v)} style={{ flex: 1, minWidth: '60px', padding: '8px 4px', background: '#EEF1FF', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#0F4C81', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>
                    ৳{v.toLocaleString()}
                  </button>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setShowPayment(null)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={collectPayment} className="btn btn-success btn-full">✓ নিশ্চিত করুন</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
