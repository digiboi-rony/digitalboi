'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

function ReceiptContent() {
  const params = useSearchParams();
  const saleId = params.get('id');
  const { token, shop } = useAuthStore();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!saleId) { setError('কোনো বিক্রয় ID পাওয়া যায়নি।'); setLoading(false); return; }
    loadSale();
  }, [saleId]);

  const loadSale = async () => {
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('বিক্রয় পাওয়া যায়নি');
      const data = await res.json();
      setSale(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'Hind Siliguri',sans-serif", flexDirection:'column', gap:'12px' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid #0F4C81', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'#8A9AB5', fontSize:'14px' }}>রসিদ লোড হচ্ছে...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !sale) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'Hind Siliguri',sans-serif", flexDirection:'column', gap:'12px', padding:'24px', textAlign:'center' }}>
      <span style={{ fontSize:'52px' }}>😕</span>
      <p style={{ color:'#E63946', fontWeight:'700', fontSize:'16px' }}>{error || 'রসিদ পাওয়া যায়নি'}</p>
      <button onClick={()=>window.history.back()} style={{ padding:'10px 20px', background:'#0F4C81', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }}>← ফিরে যান</button>
    </div>
  );

  const shopName  = shop?.shop_name  || sale.shops?.shop_name  || 'Digiboi Shop';
  const shopAddr  = shop?.address    || sale.shops?.address    || '';
  const shopPhone = shop?.phone      || sale.shops?.phone      || '';
  const shopLogo  = shop?.shop_logo  || sale.shops?.shop_logo  || null;
  const METHOD_LABEL = { cash:'নগদ', bkash:'bKash', nagad:'Nagad', bank:'ব্যাংক', card:'কার্ড', due:'বাকি' };

  return (
    <div style={{ fontFamily:"'Hind Siliguri',Arial,sans-serif", maxWidth:'320px', margin:'0 auto', padding:'16px 16px 24px', background:'white', minHeight:'100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Shop Header */}
      <div style={{ textAlign:'center', borderBottom:'2px dashed #DDE4EE', paddingBottom:'14px', marginBottom:'12px' }}>
        {shopLogo
          ? <img src={shopLogo} alt="logo" style={{ width:'52px', height:'52px', borderRadius:'14px', objectFit:'cover', margin:'0 auto 8px', display:'block' }} />
          : <div style={{ width:'50px', height:'50px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', fontSize:'24px', color:'white', fontWeight:'800' }}>D</div>
        }
        <h2 style={{ margin:'0 0 3px', fontSize:'17px', fontWeight:'800', color:'#141D28' }}>{shopName}</h2>
        {shopAddr  && <p style={{ margin:'0 0 2px', fontSize:'11px', color:'#5E6E8A' }}>{shopAddr}</p>}
        {shopPhone && <p style={{ margin:0, fontSize:'11px', color:'#5E6E8A' }}>📱 {shopPhone}</p>}
      </div>

      {/* Invoice Info */}
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#5E6E8A', marginBottom:'10px', paddingBottom:'10px', borderBottom:'1px dashed #DDE4EE' }}>
        <div>
          <p style={{ margin:'0 0 3px' }}>ইনভয়েস: <strong style={{ color:'#141D28' }}>{sale.invoice_number}</strong></p>
          {sale.customers?.name && <p style={{ margin:0 }}>গ্রাহক: <strong style={{ color:'#141D28' }}>{sale.customers.name}</strong></p>}
        </div>
        <p style={{ margin:0, textAlign:'right', fontSize:'10px' }}>
          {new Date(sale.created_at).toLocaleString('bn-BD', { dateStyle:'short', timeStyle:'short' })}
        </p>
      </div>

      {/* Items */}
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'10px' }}>
        <thead>
          <tr style={{ borderBottom:'1px solid #DDE4EE' }}>
            {['পণ্য', 'পরিমাণ', 'মোট'].map(h=>(
              <th key={h} style={{ padding:'5px 0', fontSize:'11px', color:'#8A9AB5', textAlign:h==='মোট'?'right':'left', fontWeight:'600' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(sale.sale_items || []).map((item, i) => (
            <tr key={i} style={{ borderBottom:'1px dotted #F0F4F8' }}>
              <td style={{ padding:'7px 0', fontSize:'12px', color:'#141D28', maxWidth:'140px' }}>
                <div style={{ fontWeight:'600', lineHeight:'1.3' }}>{item.product_name}</div>
                <div style={{ fontSize:'10px', color:'#8A9AB5' }}>৳{item.unit_price}/{item.unit||'pcs'}</div>
              </td>
              <td style={{ padding:'7px 0', fontSize:'12px', color:'#5E6E8A', textAlign:'center' }}>{item.quantity}</td>
              <td style={{ padding:'7px 0', fontSize:'12px', color:'#141D28', textAlign:'right', fontWeight:'700' }}>৳{(item.total||0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ borderTop:'2px dashed #DDE4EE', paddingTop:'10px', marginBottom:'14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#5E6E8A', marginBottom:'4px' }}>
          <span>উপমোট</span><span>৳ {(sale.subtotal||sale.total||0).toLocaleString()}</span>
        </div>
        {(sale.discount||0) > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#E63946', marginBottom:'4px' }}>
            <span>ছাড়</span><span>−৳ {sale.discount.toLocaleString()}</span>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'17px', fontWeight:'800', color:'#141D28', padding:'8px 0', borderTop:'1px solid #141D28', marginTop:'6px' }}>
          <span>সর্বমোট</span><span>৳ {(sale.total||0).toLocaleString()}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#5E6E8A', marginTop:'2px' }}>
          <span>পরিশোধ ({METHOD_LABEL[sale.payment_method]||sale.payment_method})</span>
          <span style={{ color:'#0BAA69', fontWeight:'700' }}>৳ {(sale.paid_amount||0).toLocaleString()}</span>
        </div>
        {(sale.due_amount||0) > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#E63946', fontWeight:'800', marginTop:'4px' }}>
            <span>বাকি</span><span>৳ {sale.due_amount.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', borderTop:'2px dashed #DDE4EE', paddingTop:'14px' }}>
        <p style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>ধন্যবাদ! আবার আসবেন 🙏</p>
        <p style={{ margin:'0 0 16px', fontSize:'11px', color:'#8A9AB5' }}>Powered by Digiboi</p>
        <button onClick={()=>window.print()} className="no-print" style={{ padding:'11px 28px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', color:'white', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', width:'100%', marginBottom:'8px' }}>🖨️ প্রিন্ট করুন</button>
        <button onClick={()=>window.history.back()} className="no-print" style={{ padding:'10px 20px', background:'#F0F4F8', color:'#5E6E8A', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', width:'100%' }}>← ফিরে যান</button>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media print { .no-print { display:none !important; } body { max-width:100%; } }
      `}</style>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'Hind Siliguri',sans-serif" }}>লোড হচ্ছে...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}
