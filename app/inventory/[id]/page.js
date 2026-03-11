'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../../lib/store';
import { formatCurrency, timeAgo } from '../../../lib/utils';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [showStockAdj, setShowStockAdj] = useState(false);
  const [adjType, setAdjType] = useState('add');
  const [adjQty, setAdjQty] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProduct(data);
      setForm(data);
    } catch {}
    setLoading(false);
  };

  const saveProduct = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setEditing(false);
        addNotif('✅ পণ্য আপডেট হয়েছে!', 'success');
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setSaving(false);
  };

  const adjustStock = async () => {
    if (!adjQty) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: adjType, quantity: +adjQty }),
      });
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setShowStockAdj(false);
        setAdjQty('');
        addNotif('✅ স্টক আপডেট হয়েছে!', 'success');
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
  };

  const deleteProduct = async () => {
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotif('🗑️ পণ্য মুছে ফেলা হয়েছে', 'success');
      router.push('/inventory');
    } catch {}
  };

  if (loading) return (
    <AppShell title="পণ্যের বিবরণ" activeTab="inventory">
      <div style={{ padding:'60px 16px', textAlign:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid #0F4C81', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'#8A9AB5' }}>লোড হচ্ছে...</p>
      </div>
    </AppShell>
  );

  if (!product) return (
    <AppShell title="পণ্যের বিবরণ" activeTab="inventory">
      <div style={{ padding:'60px 16px', textAlign:'center' }}>
        <span style={{ fontSize:'48px' }}>😕</span>
        <p style={{ color:'#8A9AB5', marginTop:'12px' }}>পণ্য পাওয়া যায়নি</p>
        <button onClick={()=>router.back()} className="btn btn-primary" style={{ marginTop:'16px' }}>← ফিরে যান</button>
      </div>
    </AppShell>
  );

  const isLowStock = product.current_stock <= product.min_stock_alert;
  const profit = product.selling_price - product.purchase_price;
  const profitPct = product.purchase_price > 0 ? ((profit / product.purchase_price) * 100).toFixed(1) : 0;

  return (
    <AppShell title={editing ? 'পণ্য সম্পাদনা' : 'পণ্যের বিবরণ'} activeTab="inventory">
      <div style={{ padding:'0 16px 90px' }}>

        {/* Product Card */}
        <div className="card" style={{ marginBottom:'14px', borderTop: isLowStock ? '4px solid #E63946' : '4px solid #0BAA69' }}>
          <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
            <div style={{ width:'70px', height:'70px', borderRadius:'16px', background:'#F0F4F8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px', flexShrink:0, overflow:'hidden' }}>
              {product.main_photo ? <img src={product.main_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '📦'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:'0 0 3px', fontSize:'17px', fontWeight:'800', color:'#141D28' }}>{product.name}</p>
              {product.brand && <p style={{ margin:'0 0 4px', fontSize:'12px', color:'#8A9AB5' }}>🏷️ {product.brand}</p>}
              {product.barcode && <p style={{ margin:'0 0 4px', fontSize:'11px', color:'#5E6E8A', fontFamily:'monospace', background:'#F0F4F8', padding:'2px 8px', borderRadius:'4px', display:'inline-block' }}>📊 {product.barcode}</p>}
              <div style={{ marginTop:'8px', display:'flex', gap:'6px', flexWrap:'wrap' }}>
                <span className="pill" style={{ background: isLowStock?'#FDECEA':'#E6F9F2', color: isLowStock?'#E63946':'#0BAA69' }}>
                  {isLowStock?'⚠️':'✓'} স্টক: {product.current_stock} {product.unit}
                </span>
                {product.categories && (
                  <span className="pill" style={{ background:'#EEF1FF', color:'#4361EE' }}>{product.categories.icon} {product.categories.name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginTop:'14px' }}>
            {[
              { l:'বিক্রয় মূল্য', v:'৳ '+product.selling_price.toLocaleString(), c:'#0F4C81' },
              { l:'ক্রয় মূল্য', v:'৳ '+product.purchase_price.toLocaleString(), c:'#5E6E8A' },
              { l:'মুনাফা', v:`৳ ${profit.toLocaleString()} (${profitPct}%)`, c:'#0BAA69' },
            ].map(s=>(
              <div key={s.l} style={{ background:'#F8FAFC', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
                <p style={{ margin:'0 0 2px', fontSize:'11px', color:'#8A9AB5' }}>{s.l}</p>
                <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {!editing && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'14px' }}>
            <button onClick={()=>setEditing(true)} className="btn btn-outline btn-full" style={{ padding:'11px' }}>✏️ এডিট</button>
            <button onClick={()=>setShowStockAdj(true)} className="btn btn-full" style={{ background:'#EEF1FF', color:'#0F4C81', padding:'11px', border:'none' }}>📦 স্টক</button>
            <button onClick={()=>setShowDelete(true)} className="btn btn-full" style={{ background:'#FDECEA', color:'#E63946', padding:'11px', border:'none' }}>🗑️ মুছুন</button>
          </div>
        )}

        {/* Edit Form */}
        {editing && (
          <div className="card" style={{ marginBottom:'14px' }}>
            <p style={{ margin:'0 0 16px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>✏️ পণ্য সম্পাদনা</p>
            {[
              { label:'পণ্যের নাম', key:'name', type:'text' },
              { label:'ব্র্যান্ড', key:'brand', type:'text' },
              { label:'বিক্রয় মূল্য (৳)', key:'selling_price', type:'number' },
              { label:'ক্রয় মূল্য (৳)', key:'purchase_price', type:'number' },
              { label:'সর্বনিম্ন স্টক সতর্কতা', key:'min_stock_alert', type:'number' },
              { label:'বারকোড', key:'barcode', type:'text' },
            ].map(f=>(
              <div key={f.key} className="input-wrap">
                <label className="input-label">{f.label}</label>
                <input className="input-field" type={f.type} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:f.type==='number'?+e.target.value:e.target.value})} />
              </div>
            ))}
            <div className="input-wrap">
              <label className="input-label">একক</label>
              <select className="input-field" value={form.unit||'pcs'} onChange={e=>setForm({...form,unit:e.target.value})}>
                {['pcs','kg','liter','dozen','box','meter','packet','gram','ml'].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setEditing(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={saveProduct} disabled={saving} className="btn btn-primary btn-full">
                {saving?'⏳ সংরক্ষণ...':'✓ সংরক্ষণ'}
              </button>
            </div>
          </div>
        )}

        {/* Product Stats */}
        <div className="card">
          <p style={{ margin:'0 0 14px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>📊 পণ্যের তথ্য</p>
          {[
            ['📋 বিবরণ', product.description||'—'],
            ['📅 মেয়াদ', product.expiry_date||'—'],
            ['📅 যোগের তারিখ', timeAgo(product.created_at)],
            ['🔄 শেষ আপডেট', timeAgo(product.updated_at)],
            ['🟢 অবস্থা', product.is_active?'সক্রিয়':'নিষ্ক্রিয়'],
          ].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F0F4F8' }}>
              <span style={{ fontSize:'13px', color:'#8A9AB5' }}>{k}</span>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#141D28' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showStockAdj && (
        <div className="modal-overlay" onClick={()=>setShowStockAdj(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <p style={{ margin:0, fontSize:'17px', fontWeight:'700' }}>📦 স্টক সমন্বয়</p>
              <button onClick={()=>setShowStockAdj(false)} style={{ background:'#F0F4F8', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            <p style={{ margin:'0 0 14px', fontSize:'13px', color:'#5E6E8A' }}>বর্তমান স্টক: <strong style={{color:'#141D28'}}>{product.current_stock} {product.unit}</strong></p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
              {[['add','➕ যোগ করুন'],['subtract','➖ বাদ দিন']].map(([t,l])=>(
                <button key={t} onClick={()=>setAdjType(t)} style={{ padding:'12px', border:`2px solid ${adjType===t?'#0F4C81':'#DDE4EE'}`, borderRadius:'12px', background:adjType===t?'#EEF1FF':'white', fontSize:'13px', fontWeight:'600', color:adjType===t?'#0F4C81':'#5E6E8A', cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
              ))}
            </div>
            <div className="input-wrap">
              <label className="input-label">পরিমাণ ({product.unit})</label>
              <input className="input-field" type="number" placeholder="০" value={adjQty} onChange={e=>setAdjQty(e.target.value)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setShowStockAdj(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={adjustStock} className="btn btn-primary btn-full">✓ আপডেট করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={()=>setShowDelete(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{ textAlign:'center', padding:'10px 0 20px' }}>
              <span style={{ fontSize:'48px' }}>🗑️</span>
              <p style={{ margin:'12px 0 6px', fontSize:'17px', fontWeight:'700', color:'#141D28' }}>পণ্য মুছে ফেলবেন?</p>
              <p style={{ margin:0, fontSize:'13px', color:'#8A9AB5' }}>"{product.name}" নিষ্ক্রিয় হয়ে যাবে। ইতিহাস সংরক্ষিত থাকবে।</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setShowDelete(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={deleteProduct} className="btn btn-danger btn-full">হ্যাঁ, মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
