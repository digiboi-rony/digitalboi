'use client';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../lib/store';
import { timeAgo } from '../../lib/utils';

const EXP_CATS = ['ভাড়া', 'বিদ্যুৎ', 'বেতন', 'পরিবহন', 'রক্ষণাবেক্ষণ', 'টেলিফোন', 'পানি', 'বিবিধ'];

export default function AccountsPage() {
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [tab, setTab] = useState('cashbook');
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [eForm, setEForm] = useState({ category: 'ভাড়া', amount: '', description: '', paymentMethod: 'cash' });

  useEffect(() => { loadData(); }, [dateFrom, dateTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const from = dateFrom;
      const to = dateTo + 'T23:59:59';
      const [sRes, eRes, rRes] = await Promise.all([
        fetch(`/api/sales?from=${from}&to=${to}&limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/expenses?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/reports?type=overview&from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const sData = await sRes.json();
      const eData = await eRes.json();
      const rData = await rRes.json();
      setSales(Array.isArray(sData) ? sData : []);
      setExpenses(Array.isArray(eData) ? eData : []);
      setReportData(rData);
    } catch { }
    finally { setLoading(false); }
  };

  const addExpense = async () => {
    if (!eForm.amount || +eForm.amount <= 0) { addNotif('পরিমাণ দিন', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(eForm),
      });
      if (res.ok) {
        addNotif('✅ খরচ সংরক্ষণ হয়েছে!', 'success');
        setShowAddExpense(false);
        setEForm({ category: 'ভাড়া', amount: '', description: '', paymentMethod: 'cash' });
        loadData();
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setSaving(false);
  };

  // Build cashbook from sales + expenses
  const cashbook = [
    ...sales.map(s => ({ type: 'income', label: `বিক্রয় ${s.invoice_number}`, amount: s.total, method: s.payment_method, time: s.created_at, customer: s.customers?.name })),
    ...expenses.map(e => ({ type: 'expense', label: e.category, amount: e.amount, method: e.payment_method, time: e.created_at, desc: e.description })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  const totalIncome = sales.reduce((s, x) => s + x.total, 0);
  const totalExpense = expenses.reduce((s, x) => s + x.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const isToday = dateFrom === dateTo && dateFrom === new Date().toISOString().split('T')[0];

  return (
    <AppShell title="হিসাব ও টালিখাতা" activeTab="accounts">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Date Filter */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '14px', marginBottom: '14px', boxShadow: '0 2px 10px rgba(15,40,80,0.06)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              ['আজ', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]],
              ['গতকাল', new Date(Date.now() - 86400000).toISOString().split('T')[0], new Date(Date.now() - 86400000).toISOString().split('T')[0]],
              ['এই সপ্তাহ', new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], new Date().toISOString().split('T')[0]],
              ['এই মাস', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], new Date().toISOString().split('T')[0]],
            ].map(([l, f, t]) => (
              <button key={l} onClick={() => { setDateFrom(f); setDateTo(t); }}
                style={{ padding: '6px 14px', border: `2px solid ${dateFrom === f && dateTo === t ? '#0F4C81' : '#DDE4EE'}`, borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: dateFrom === f && dateTo === t ? '#EEF1FF' : 'white', color: dateFrom === f && dateTo === t ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit', flexShrink: 0 }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label className="input-label">তারিখ থেকে</label>
              <input className="input-field" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="input-label">তারিখ পর্যন্ত</label>
              <input className="input-field" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { l: 'মোট আয়', v: '৳ ' + totalIncome.toLocaleString(), c: '#0BAA69', bg: '#E6F9F2' },
            { l: 'মোট খরচ', v: '৳ ' + totalExpense.toLocaleString(), c: '#E63946', bg: '#FDECEA' },
            { l: 'নেট ব্যালেন্স', v: '৳ ' + netBalance.toLocaleString(), c: netBalance >= 0 ? '#0F4C81' : '#E63946', bg: netBalance >= 0 ? '#EEF1FF' : '#FDECEA' },
          ].map(s => (
            <div key={s.l} style={{ background: s.bg, borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: s.c }}>{s.v}</p>
              <p style={{ margin: '3px 0 0', fontSize: '10px', color: s.c + '99' }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#F0F4F8', borderRadius: '14px', padding: '4px', marginBottom: '14px', gap: '4px' }}>
          {[['cashbook', '💵 ক্যাশবুক'], ['pl', '📊 লাভ-ক্ষতি'], ['expenses', '💸 খরচ']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '9px 4px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: tab === k ? 'white' : 'transparent', color: tab === k ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit', boxShadow: tab === k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>{l}</button>
          ))}
        </div>

        {/* CASHBOOK */}
        {tab === 'cashbook' && (
          loading ? <div className="card skeleton" style={{ height: '200px' }} /> :
          cashbook.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8A9AB5' }}>
              <span style={{ fontSize: '40px' }}>📒</span>
              <p style={{ marginTop: '12px' }}>এই সময়ে কোনো লেনদেন নেই</p>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#141D28' }}>📒 {isToday ? 'আজকের' : ''} লেনদেন</p>
                <span style={{ fontSize: '12px', color: '#8A9AB5' }}>{cashbook.length} টি এন্ট্রি</span>
              </div>
              {cashbook.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < cashbook.length - 1 ? '1px solid #F0F4F8' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: e.type === 'income' ? '#E6F9F2' : '#FDECEA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {e.type === 'income' ? '⬆️' : '⬇️'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#141D28' }}>{e.label}{e.customer ? ` — ${e.customer}` : e.desc ? ` — ${e.desc}` : ''}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#8A9AB5' }}>
                        {timeAgo(e.time)} ·
                        {e.method === 'cash' ? ' নগদ' : e.method === 'bkash' ? ' bKash' : e.method === 'nagad' ? ' Nagad' : e.method === 'due' ? ' বাকি' : ' ব্যাংক'}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: e.type === 'income' ? '#0BAA69' : '#E63946' }}>
                    {e.type === 'income' ? '+' : '−'}৳ {e.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {/* P&L */}
        {tab === 'pl' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>📈 আয়</p>
              {[
                ['বিক্রয় আয়', totalIncome],
                ['পেইড', sales.filter(s => s.payment_status === 'paid').reduce((a, s) => a + s.total, 0)],
                ['বাকি', sales.filter(s => s.payment_status === 'due').reduce((a, s) => a + s.total, 0)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F0F4F8' }}>
                  <span style={{ fontSize: '13px', color: '#5E6E8A' }}>{l}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0BAA69' }}>৳ {v.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>মোট আয়</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#0BAA69' }}>৳ {totalIncome.toLocaleString()}</span>
              </div>
            </div>

            <div className="card">
              <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>📉 ব্যয়</p>
              {Object.entries(expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {})).map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F0F4F8' }}>
                  <span style={{ fontSize: '13px', color: '#5E6E8A' }}>{cat}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#E63946' }}>৳ {amt.toLocaleString()}</span>
                </div>
              ))}
              {expenses.length === 0 && <p style={{ fontSize: '13px', color: '#8A9AB5', textAlign: 'center', padding: '10px 0' }}>কোনো খরচ নেই</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>মোট ব্যয়</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#E63946' }}>৳ {totalExpense.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ background: `linear-gradient(135deg,${netBalance >= 0 ? '#0F4C81,#2E86DE' : '#E63946,#FF6B6B'})`, borderRadius: '18px', padding: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>নেট মুনাফা / লোকসান</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: 'white' }}>৳ {Math.abs(netBalance).toLocaleString()}</p>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{netBalance >= 0 ? '✓ মুনাফা' : '✗ লোকসান'}</p>
            </div>
          </div>
        )}

        {/* EXPENSES */}
        {tab === 'expenses' && (
          <>
            <button onClick={() => setShowAddExpense(true)} className="btn btn-primary" style={{ width: '100%', marginBottom: '14px' }}>+ নতুন খরচ এন্ট্রি</button>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: '72px' }} />)}
              </div>
            ) : expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <span style={{ fontSize: '48px' }}>💸</span>
                <p style={{ color: '#8A9AB5', marginTop: '12px' }}>এই সময়ে কোনো খরচ রেকর্ড নেই</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {expenses.map(e => (
                  <div key={e.id} className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FDECEA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💸</div>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#141D28' }}>{e.category}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#8A9AB5' }}>{e.description || '—'} · {timeAgo(e.created_at)}</p>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#E63946' }}>৳ {e.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>💸 খরচ এন্ট্রি</p>
              <button onClick={() => setShowAddExpense(false)} style={{ background: '#F0F4F8', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div className="input-wrap">
              <label className="input-label">ক্যাটাগরি</label>
              <select className="input-field" value={eForm.category} onChange={e => setEForm({ ...eForm, category: e.target.value })}>
                {EXP_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-wrap">
              <label className="input-label">পরিমাণ (৳) <span style={{ color: '#E63946' }}>*</span></label>
              <input className="input-field" type="number" placeholder="০.০০" value={eForm.amount} onChange={e => setEForm({ ...eForm, amount: e.target.value })} />
            </div>
            <div className="input-wrap">
              <label className="input-label">বিবরণ</label>
              <input className="input-field" placeholder="খরচের বিবরণ লিখুন" value={eForm.description} onChange={e => setEForm({ ...eForm, description: e.target.value })} />
            </div>
            <div className="input-wrap">
              <label className="input-label">পেমেন্ট পদ্ধতি</label>
              <select className="input-field" value={eForm.paymentMethod} onChange={e => setEForm({ ...eForm, paymentMethod: e.target.value })}>
                <option value="cash">💵 নগদ</option>
                <option value="bkash">📱 bKash</option>
                <option value="bank">🏦 ব্যাংক</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setShowAddExpense(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={addExpense} disabled={saving} className="btn btn-primary btn-full">{saving ? '⏳...' : '✓ সংরক্ষণ'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
