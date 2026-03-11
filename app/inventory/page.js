'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../lib/store';

export default function InventoryPage() {
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', brand:'', selling_price:'', purchase_price:'', current_stock:'', unit:'pcs', barcode:'' });

  useEffect(() => { loadProducts(); }, [search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  const addProduct = async () => {
    if (!form.name || !form.selling_price) { addNotif('পণ্যের নাম ও দাম দিন', 'error'); return; }
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, sellingPrice: +form.selling_price, purchasePrice: +form.purchase_price, currentStock: +form.current_stock })
      });
      if (res.ok) {
        addNotif('✅ পণ্য যোগ হয়েছে!', 'success');
        setShowAdd(false);
        setForm({ name:'', brand:'', selling_price:'', purchase_price:'', current_stock:'', unit:'pcs', barcode:'' });
        loadProducts();
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('পণ্যটি নিষ্ক্রিয় করবেন?')) return;
    try {
      await fetch(`/api/products/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      addNotif('🗑️ পণ্য মুছে ফেলা হয়েছে', 'success');
      loadProducts();
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
  };

  const catColors = { 'খাদ্য':'#0BAA69', 'তেল':'#F4A261', 'দুগ্ধ':'#4361EE', 'সাবান':'#2E86DE' };

  return (
    <AppShell title="ইনভেন্টরি" activeTab="inventory">
      <div style={{ padding:'0 16px 100px' }}>

        {/* Quick Actions */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
          {[
            { icon:'🏷️', label:'ক্যাটাগরি', href:'/categories' },
            { icon:'📊', label:'স্টক সমন্বয়', href:'/stock' },
            { icon:'📦', label:'কম স্টক', href:'/stock?filter=low' },
          ].map(a => (
            <Link key={a.label} href={a.href} style={{ textDecoration:'none' }}>
              <div style={{ background:'white', border:'1px solid #DDE4EE', borderRadius:12, padding:'10px 8px', textAlign:'center', cursor:'pointer' }}>
                <span style={{ fontSize:20, display:'block' }}>{a.icon}</span>
                <span style={{ fontSize:10, fontWeight:600, color:'#5E6E8A', display:'block', marginTop:4 }}>{a.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Search + Add */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 পণ্য খুঁজুন..."
            style={{ flex:1, padding:'12px 16px', border:'2px solid #DDE4EE', borderRadius:'12px', fontSize:'14px', fontFamily:'inherit', outline:'none' }} />
          <button onClick={() => setShowAdd(true)} className="btn btn-primary" style={{ padding:'12px 16px', fontSize:'13px' }}>➕ যোগ করুন</button>
        </div>

        {/* Low stock alert */}
        {products.some(p => p.current_stock <= p.min_stock_alert) && (
          <div style={{ background:'#FDECEA', border:'1px solid rgba(230,57,70,0.3)', borderRadius:'14px', padding:'12px 16px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'20px' }}>⚠️</span>
            <div>
              <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:'#E63946' }}>কিছু পণ্যের স্টক কম!</p>
              <p style={{ margin:0, fontSize:'11px', color:'#5E6E8A' }}>দ্রুত অর্ডার দিন</p>
            </div>
          </div>
        )}

        {/* Product List */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:'88px', borderRadius:'18px' }} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 24px' }}>
            <span style={{ fontSize:'48px' }}>📦</span>
            <p style={{ fontSize:'15px', fontWeight:'600', color:'#5E6E8A', marginTop:'12px' }}>কোনো পণ্য নেই</p>
            <p style={{ fontSize:'13px', color:'#8A9AB5' }}>প্রথম পণ্য যোগ করুন</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {products.map(p => (
              <div key={p.id} className="card" style={{ padding:'16px', border:`1px solid ${p.current_stock <= p.min_stock_alert ? 'rgba(230,57,70,0.3)' : '#F0F4F8'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                      <p style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#141D28' }}>{p.name}</p>
                      {p.current_stock <= p.min_stock_alert && (
                        <span className="pill" style={{ background:'#FDECEA', color:'#E63946' }}>⚠ কম!</span>
                      )}
                    </div>
                    <p style={{ margin:'0 0 8px', fontSize:'11px', color:'#8A9AB5' }}>
                      {p.brand && `${p.brand} · `}{p.barcode}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span className="pill" style={{ background:'#EEF1FF', color:'#4361EE' }}>{p.categories?.name || 'সাধারণ'}</span>
                      <span style={{ fontSize:'12px', color:'#5E6E8A' }}>৳ {p.selling_price}/{p.unit}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800', color:p.current_stock<=p.min_stock_alert?'#E63946':'#141D28' }}>
                      {p.current_stock}
                    </p>
                    <p style={{ margin:'0 0 10px', fontSize:'11px', color:'#8A9AB5' }}>{p.unit}</p>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <Link href={`/inventory/${p.id}`} style={{ textDecoration:'none' }}>
                        <button style={{ width:'28px', height:'28px', borderRadius:'8px', background:'#EEF1FF', border:'none', cursor:'pointer', fontSize:'14px' }}>✏️</button>
                      </Link>
                      <button onClick={()=>deleteProduct(p.id)} style={{ width:'28px', height:'28px', borderRadius:'8px', background:'#FDECEA', border:'none', cursor:'pointer', fontSize:'14px' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <p style={{ margin:0, fontSize:'17px', fontWeight:'700', color:'#141D28' }}>➕ নতুন পণ্য যোগ করুন</p>
              <button onClick={()=>setShowAdd(false)} style={{ background:'#F0F4F8', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>

            {[
              { label:'পণ্যের নাম', key:'name', placeholder:'যেমন: বাসমতি চাল', required:true },
              { label:'ব্র্যান্ড', key:'brand', placeholder:'যেমন: প্রাণ' },
              { label:'বিক্রয় মূল্য (৳)', key:'selling_price', placeholder:'০.০০', type:'number', required:true },
              { label:'ক্রয় মূল্য (৳)', key:'purchase_price', placeholder:'০.০০', type:'number' },
              { label:'স্টক পরিমাণ', key:'current_stock', placeholder:'০', type:'number' },
              { label:'বারকোড', key:'barcode', placeholder:'স্ক্যান করুন বা টাইপ করুন' },
            ].map(f => (
              <div key={f.key} className="input-wrap">
                <label className="input-label">{f.label}{f.required&&<span style={{color:'#E63946'}}> *</span>}</label>
                <input className="input-field" type={f.type||'text'} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} />
              </div>
            ))}

            <div className="input-wrap">
              <label className="input-label">একক</label>
              <select className="input-field" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>
                {['pcs','kg','liter','dozen','box','meter','packet'].map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'8px' }}>
              <button onClick={()=>setShowAdd(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={addProduct} className="btn btn-primary btn-full">✓ যোগ করুন</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
