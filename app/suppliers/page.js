'use client';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../lib/store';
import { timeAgo } from '../../lib/utils';

export default function SuppliersPage() {
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [tab, setTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sForm, setSForm] = useState({ name: '', phone: '', address: '', email: '' });
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', notes: '', paymentMethod: 'cash' });
  const [purchaseItems, setPurchaseItems] = useState([{ productName: '', qty: 1, price: '' }]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/purchases?limit=30', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const sData = await sRes.json();
      const pData = await pRes.json();
      setSuppliers(Array.isArray(sData) ? sData : []);
      setPurchases(Array.isArray(pData) ? pData : []);
    } catch { }
    finally { setLoading(false); }
  };

  const addSupplier = async () => {
    if (!sForm.name) { addNotif('নাম দিন', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sForm),
      });
      if (res.ok) {
        addNotif('✅ সরবরাহকারী যোগ হয়েছে!', 'success');
        setShowAddSupplier(false);
        setSForm({ name: '', phone: '', address: '', email: '' });
        loadData();
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setSaving(false);
  };

  const addPurchase = async () => {
    const validItems = purchaseItems.filter(i => i.productName && i.qty > 0 && i.price);
    if (!purchaseForm.supplierId) { addNotif('সরবরাহকারী বেছে নিন', 'error'); return; }
    if (!validItems.length) { addNotif('কমপক্ষে একটি পণ্য যোগ করুন', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          supplierId: purchaseForm.supplierId,
          notes: purchaseForm.notes,
          paymentMethod: purchaseForm.paymentMethod,
          items: validItems.map(i => ({ productName: i.productName, quantity: +i.qty, unitPrice: +i.price })),
        }),
      });
      if (res.ok) {
        addNotif('✅ ক্রয় এন্ট্রি সম্পন্ন!', 'success');
        setShowAddPurchase(false);
        setPurchaseItems([{ productName: '', qty: 1, price: '' }]);
        setPurchaseForm({ supplierId: '', notes: '', paymentMethod: 'cash' });
        loadData();
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setSaving(false);
  };

  const addItem = () => setPurchaseItems(i => [...i, { productName: '', qty: 1, price: '' }]);
  const removeItem = (i) => setPurchaseItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => setPurchaseItems(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const purchaseTotal = purchaseItems.reduce((s, i) => s + (+i.qty * (+i.price || 0)), 0);

  const totalDue = suppliers.reduce((s, x) => s + (x.due_amount || 0), 0);
  const totalPurchased = purchases.reduce((s, x) => s + (x.total || 0), 0);

  return (
    <AppShell title="সরবরাহকারী ও ক্রয়" activeTab="suppliers">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { l: 'সরবরাহকারী', v: suppliers.length + ' জন', c: '#0F4C81' },
            { l: 'বাকি দিতে হবে', v: '৳ ' + totalDue.toLocaleString(), c: '#E63946' },
            { l: 'মোট ক্রয়', v: '৳ ' + totalPurchased.toLocaleString(), c: '#0BAA69' },
          ].map(s => (
            <div key={s.l} className="card" style={{ padding: '12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: s.c }}>{s.v}</p>
              <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#8A9AB5' }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#F0F4F8', borderRadius: '14px', padding: '4px', marginBottom: '14px', gap: '4px' }}>
          {[['suppliers', '🏭 সরবরাহকারী'], ['purchases', '📦 ক্রয় তালিকা']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: tab === k ? 'white' : 'transparent', color: tab === k ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit', boxShadow: tab === k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>{l}</button>
          ))}
        </div>

        {/* SUPPLIERS TAB */}
        {tab === 'suppliers' && (
          <>
            <button onClick={() => setShowAddSupplier(true)} className="btn btn-primary" style={{ width: '100%', marginBottom: '14px' }}>+ নতুন সরবরাহকারী</button>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: '80px' }} />)}
              </div>
            ) : suppliers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <span style={{ fontSize: '48px' }}>🏭</span>
                <p style={{ color: '#8A9AB5', marginTop: '12px' }}>কোনো সরবরাহকারী নেই</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {suppliers.map(s => (
                  <div key={s.id} className="card" style={{ padding: '14px 16px', borderLeft: `4px solid ${s.due_amount > 0 ? '#E63946' : '#0BAA69'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>{s.name}</p>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#8A9AB5' }}>📱 {s.phone || '—'}{s.address ? ` · ${s.address}` : ''}</p>
                        <span className="pill" style={{ background: s.due_amount > 0 ? '#FDECEA' : '#E6F9F2', color: s.due_amount > 0 ? '#E63946' : '#0BAA69' }}>
                          {s.due_amount > 0 ? `⏳ ৳${s.due_amount.toLocaleString()} বাকি` : '✓ পরিশোধ'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#5E6E8A' }}>মোট ক্রয়</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#141D28' }}>৳ {(s.total_purchased || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PURCHASES TAB */}
        {tab === 'purchases' && (
          <>
            <button onClick={() => setShowAddPurchase(true)} className="btn btn-primary" style={{ width: '100%', marginBottom: '14px' }}>+ নতুন ক্রয় এন্ট্রি</button>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: '80px' }} />)}
              </div>
            ) : purchases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <span style={{ fontSize: '48px' }}>📦</span>
                <p style={{ color: '#8A9AB5', marginTop: '12px' }}>কোনো ক্রয় রেকর্ড নেই</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {purchases.map(p => (
                  <div key={p.id} className="card" style={{ padding: '14px 16px', borderLeft: `4px solid ${p.due_amount > 0 ? '#E63946' : '#0BAA69'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#141D28' }}>{p.suppliers?.name || 'অজ্ঞাত'}</p>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#8A9AB5' }}>{p.invoice_number} · {timeAgo(p.created_at)}</p>
                        <span className="pill" style={{ background: p.due_amount > 0 ? '#FDECEA' : '#E6F9F2', color: p.due_amount > 0 ? '#E63946' : '#0BAA69' }}>
                          {p.due_amount > 0 ? `⏳ বাকি ৳${p.due_amount.toLocaleString()}` : '✓ পরিশোধ'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#141D28' }}>৳ {p.total?.toLocaleString()}</p>
                        <span className="pill" style={{ background: '#EEF1FF', color: '#4361EE' }}>{p.purchase_items?.length || 0} পণ্য</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="modal-overlay" onClick={() => setShowAddSupplier(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>🏭 নতুন সরবরাহকারী</p>
              <button onClick={() => setShowAddSupplier(false)} style={{ background: '#F0F4F8', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            {[['নাম', 'name', 'text', 'মেঘনা ট্রেডার্স', true], ['ফোন', 'phone', 'tel', '01X-XXXX-XXXX'], ['ঠিকানা', 'address', 'text', 'ঢাকা'], ['ইমেইল', 'email', 'email', 'email@example.com']].map(([l, k, t, ph, req]) => (
              <div key={k} className="input-wrap">
                <label className="input-label">{l}{req && <span style={{ color: '#E63946' }}> *</span>}</label>
                <input className="input-field" type={t} placeholder={ph} value={sForm[k]} onChange={e => setSForm({ ...sForm, [k]: e.target.value })} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setShowAddSupplier(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={addSupplier} disabled={saving} className="btn btn-primary btn-full">{saving ? '⏳...' : '✓ যোগ করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {showAddPurchase && (
        <div className="modal-overlay" onClick={() => setShowAddPurchase(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>📦 ক্রয় এন্ট্রি</p>
              <button onClick={() => setShowAddPurchase(false)} style={{ background: '#F0F4F8', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div className="input-wrap">
              <label className="input-label">সরবরাহকারী <span style={{ color: '#E63946' }}>*</span></label>
              <select className="input-field" value={purchaseForm.supplierId} onChange={e => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}>
                <option value="">— বেছে নিন —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#141D28' }}>পণ্য তালিকা</p>
            {purchaseItems.map((item, i) => (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#5E6E8A' }}>পণ্য {i + 1}</p>
                  {purchaseItems.length > 1 && (
                    <button onClick={() => removeItem(i)} style={{ background: '#FDECEA', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: '#E63946', cursor: 'pointer', fontFamily: 'inherit' }}>✕ বাদ</button>
                  )}
                </div>
                <input className="input-field" placeholder="পণ্যের নাম" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)} style={{ marginBottom: '8px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label className="input-label">পরিমাণ</label>
                    <input className="input-field" type="number" min="1" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label">একক মূল্য (৳)</label>
                    <input className="input-field" type="number" placeholder="০" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                  </div>
                </div>
                {item.productName && item.price && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#0F4C81', fontWeight: '600' }}>
                    মোট: ৳ {(+item.qty * +item.price).toLocaleString()}
                  </p>
                )}
              </div>
            ))}

            <button onClick={addItem} style={{ width: '100%', padding: '10px', border: '2px dashed #B8C5D6', borderRadius: '12px', background: 'transparent', fontSize: '13px', color: '#5E6E8A', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '14px' }}>+ আরো পণ্য যোগ করুন</button>

            {purchaseTotal > 0 && (
              <div style={{ background: '#EEF1FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#141D28' }}>মোট</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#0F4C81' }}>৳ {purchaseTotal.toLocaleString()}</span>
              </div>
            )}

            <div className="input-wrap">
              <label className="input-label">পেমেন্ট</label>
              <select className="input-field" value={purchaseForm.paymentMethod} onChange={e => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })}>
                <option value="cash">💵 নগদ</option>
                <option value="bkash">📱 bKash</option>
                <option value="bank">🏦 ব্যাংক</option>
                <option value="due">📋 বাকি</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setShowAddPurchase(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={addPurchase} disabled={saving} className="btn btn-primary btn-full">{saving ? '⏳...' : '✓ সংরক্ষণ'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
