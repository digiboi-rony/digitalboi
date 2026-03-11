'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore } from '../../lib/store';

export default function LowStockPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('low'); // low | out | all

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=500', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const filtered = products.filter(p => {
    if (filter === 'out') return p.current_stock <= 0;
    if (filter === 'low') return p.current_stock > 0 && p.current_stock <= p.min_stock_alert;
    return p.current_stock <= p.min_stock_alert;
  });

  const outCount = products.filter(p => p.current_stock <= 0).length;
  const lowCount = products.filter(p => p.current_stock > 0 && p.current_stock <= p.min_stock_alert).length;

  return (
    <AppShell title="স্টক সতর্কতা" activeTab="inventory">
      <div style={{ padding:'0 16px 90px' }}>

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
          <div style={{ background:'#FDECEA', borderRadius:'16px', padding:'14px', textAlign:'center' }}>
            <p style={{ margin:0, fontSize:'28px', fontWeight:'800', color:'#E63946' }}>{outCount}</p>
            <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#E63946' }}>🚨 স্টক শেষ</p>
          </div>
          <div style={{ background:'#FFF3E0', borderRadius:'16px', padding:'14px', textAlign:'center' }}>
            <p style={{ margin:0, fontSize:'28px', fontWeight:'800', color:'#F4A261' }}>{lowCount}</p>
            <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#F4A261' }}>⚠️ কম স্টক</p>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display:'flex', background:'#F0F4F8', borderRadius:'14px', padding:'4px', gap:'4px', marginBottom:'14px' }}>
          {[['low','⚠️ কম স্টক'],['out','🚨 স্টক শেষ'],['all','📦 সব']].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ flex:1, padding:'9px 6px', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'600', cursor:'pointer', background:filter===k?'white':'transparent', color:filter===k?'#0F4C81':'#5E6E8A', fontFamily:'inherit', boxShadow:filter===k?'0 2px 8px rgba(0,0,0,0.08)':'none' }}>{l}</button>
          ))}
        </div>

        {/* Quick action buttons */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
          <button onClick={()=>router.push('/stock')} style={{ flex:1, padding:'11px', background:'#EEF1FF', border:'none', borderRadius:'12px', fontSize:'13px', color:'#0F4C81', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>📦 স্টক যোগ করুন</button>
          <button onClick={()=>router.push('/suppliers')} style={{ flex:1, padding:'11px', background:'#E6F9F2', border:'none', borderRadius:'12px', fontSize:'13px', color:'#0BAA69', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>🏭 ক্রয় অর্ডার দিন</button>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'40px' }}>
            <div style={{ width:'36px', height:'36px', border:'3px solid #0F4C81', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'50px 16px' }}>
            <span style={{ fontSize:'52px' }}>✅</span>
            <p style={{ color:'#0BAA69', fontWeight:'700', marginTop:'14px', fontSize:'16px' }}>সব পণ্যের পর্যাপ্ত স্টক আছে!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {filtered.map(p => (
              <div key={p.id} onClick={()=>router.push(`/inventory/${p.id}`)} className="card" style={{ padding:'14px 16px', borderLeft:`4px solid ${p.current_stock<=0?'#E63946':'#F4A261'}`, cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:'0 0 3px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>{p.name}</p>
                    <p style={{ margin:'0 0 6px', fontSize:'11px', color:'#8A9AB5' }}>
                      {p.brand && `${p.brand} · `}{p.categories?.name || 'সাধারণ'}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ height:'6px', flex:1, maxWidth:'120px', background:'#F0F4F8', borderRadius:'10px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.min(100, (p.current_stock/p.min_stock_alert)*100)}%`, background: p.current_stock<=0?'#E63946':'#F4A261', borderRadius:'10px', transition:'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize:'11px', color:'#8A9AB5' }}>min: {p.min_stock_alert}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', marginLeft:'12px' }}>
                    <p style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'900', color:p.current_stock<=0?'#E63946':'#F4A261' }}>
                      {p.current_stock}
                    </p>
                    <p style={{ margin:'0 0 8px', fontSize:'11px', color:'#8A9AB5' }}>{p.unit}</p>
                    <span className="pill" style={{ background:p.current_stock<=0?'#FDECEA':'#FFF3E0', color:p.current_stock<=0?'#E63946':'#F4A261' }}>
                      {p.current_stock<=0?'🚨 শেষ':'⚠️ কম'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
