'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '../../components/layout/AppShell';
import { useCartStore, useAuthStore, useNotifStore } from '../../lib/store';
const BarcodeScanner = dynamic(() => import('../../components/ui/BarcodeScanner'), { ssr: false });

export default function POSPage() {
  const { items, addItem, removeItem, updateQty, discount, setDiscount, paymentMethod, setPaymentMethod, clearCart, getTotal, getSubtotal } = useCartStore();
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();

  // Scan barcode
  const scanProduct = async (barcode) => {
    if (!barcode.trim()) return;
    try {
      const res = await fetch(`/api/products?barcode=${barcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.length) {
        addItem(data[0]);
        addNotif(`✅ "${data[0].name}" কার্টে যোগ হয়েছে!`, 'success');
        setBarcodeInput('');
      } else {
        addNotif('❌ পণ্য পাওয়া যায়নি — নতুন পণ্য যোগ করুন', 'error');
      }
    } catch {
      addNotif('সার্ভারে সমস্যা', 'error');
    }
  };

  // Complete sale
  const completeSale = async () => {
    if (!items.length) { addNotif('কার্ট খালি!', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, name: i.name, selling_price: i.selling_price, qty: i.qty })),
          discount,
          paymentMethod,
          paidAmount: paymentMethod === 'due' ? 0 : total,
        })
      });
      if (res.ok) {
        clearCart();
        setShowComplete(true);
        addNotif('✅ বিক্রয় সম্পন্ন!', 'success');
        setTimeout(() => setShowComplete(false), 3000);
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <AppShell title="বিক্রয় / POS" activeTab="pos">

      {/* Toast notifications */}
      <ToastArea />

      {/* Success overlay */}
      {showComplete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(11,170,105,0.95)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
          <div style={{ fontSize:'80px' }}>✅</div>
          <p style={{ color:'white', fontSize:'24px', fontWeight:'700' }}>বিক্রয় সম্পন্ন!</p>
          <button onClick={()=>setShowComplete(false)} className="btn" style={{ background:'white', color:'#0BAA69', padding:'12px 32px' }}>নতুন বিক্রয়</button>
        </div>
      )}

      <div style={{ padding:'0 16px 100px' }}>

        {/* Scan Area */}
        <div style={{ background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'18px', padding:'18px 20px', marginBottom:'16px', boxShadow:'0 6px 20px rgba(15,76,129,0.35)' }}>
          <p style={{ color:'white', fontSize:'15px', fontWeight:'700', margin:'0 0 12px', display:'flex', alignItems:'center', gap:'8px' }}>
            📷 QR / Barcode স্ক্যান করুন
          </p>
          <div style={{ display:'flex', gap:'8px' }}>
            <input
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && scanProduct(barcodeInput)}
              placeholder="বারকোড নম্বর লিখুন বা স্ক্যান করুন..."
              style={{ flex:1, padding:'11px 16px', borderRadius:'12px', border:'none', fontSize:'14px', fontFamily:'inherit', outline:'none' }}
            />
            <button onClick={() => setCameraOpen(true)} style={{ background:'rgba(255,255,255,0.25)', border:'none', borderRadius:'12px', padding:'11px 14px', cursor:'pointer', fontSize:'20px' }}>
              📷
            </button>
            <button onClick={() => scanProduct(barcodeInput)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'12px', padding:'11px 16px', color:'white', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
              খুঁজুন
            </button>
          </div>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'11px', marginTop:'8px' }}>📷 ক্যামেরা বা USB বারকোড স্ক্যানার ব্যবহার করুন</p>
        </div>

        {/* Cart */}
        <div className="card" style={{ marginBottom:'14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <p style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#141D28' }}>🛒 কার্ট ({items.length} পণ্য)</p>
            {items.length > 0 && (
              <button onClick={clearCart} style={{ background:'#FDECEA', border:'none', borderRadius:'8px', padding:'5px 10px', fontSize:'11px', color:'#E63946', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>
                সব মুছুন
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0' }}>
              <div style={{ fontSize:'48px', marginBottom:'10px' }}>🛒</div>
              <p style={{ color:'#8A9AB5', fontSize:'13px' }}>কার্ট খালি — স্ক্যান করুন বা পণ্য যোগ করুন</p>
            </div>
          ) : (
            items.map((item, i) => (
              <div key={item.id} style={{ padding:'12px 0', borderBottom: i < items.length - 1 ? '1px solid #F0F4F8' : 'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:'600', color:'#141D28' }}>{item.name}</p>
                    <p style={{ margin:'0 0 8px', fontSize:'11px', color:'#8A9AB5' }}>৳ {item.selling_price} / {item.unit}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width:'28px', height:'28px', borderRadius:'8px', border:'1.5px solid #DDE4EE', background:'white', cursor:'pointer', fontSize:'16px', fontWeight:'700', color:'#5E6E8A' }}>−</button>
                      <span style={{ fontSize:'15px', fontWeight:'700', color:'#141D28', minWidth:'24px', textAlign:'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width:'28px', height:'28px', borderRadius:'8px', border:'1.5px solid #0F4C81', background:'#EEF1FF', cursor:'pointer', fontSize:'16px', fontWeight:'700', color:'#0F4C81' }}>+</button>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px' }}>
                    <p style={{ margin:0, fontSize:'16px', fontWeight:'800', color:'#141D28' }}>৳ {(item.selling_price * item.qty).toLocaleString()}</p>
                    <button onClick={() => removeItem(item.id)} style={{ width:'28px', height:'28px', borderRadius:'8px', background:'#FDECEA', border:'none', cursor:'pointer', fontSize:'14px' }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary */}
        {items.length > 0 && (
          <>
            <div className="card" style={{ marginBottom:'14px' }}>
              {[['উপমোট', `৳ ${subtotal.toLocaleString()}`]].map(([l, v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #F0F4F8' }}>
                  <span style={{ fontSize:'13px', color:'#5E6E8A' }}>{l}</span>
                  <span style={{ fontSize:'13px', fontWeight:'600', color:'#3D4E63' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F0F4F8' }}>
                <span style={{ fontSize:'13px', color:'#5E6E8A' }}>ছাড় (৳)</span>
                <input type="number" value={discount} onChange={e => setDiscount(+e.target.value)} min="0" style={{ width:'80px', padding:'6px 10px', border:'1.5px solid #DDE4EE', borderRadius:'8px', fontSize:'13px', fontFamily:'inherit', textAlign:'right', outline:'none' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0' }}>
                <span style={{ fontSize:'16px', fontWeight:'800', color:'#141D28' }}>সর্বমোট</span>
                <span style={{ fontSize:'22px', fontWeight:'800', color:'#0F4C81' }}>৳ {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method */}
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#5E6E8A', margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'0.5px' }}>পেমেন্ট পদ্ধতি</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'14px' }}>
              {[['cash','💵','নগদ'],['bkash','📱','bKash'],['nagad','🟠','নগদ'],['due','📋','বাকি']].map(([id,e,l]) => (
                <div key={id} onClick={() => setPaymentMethod(id)} style={{ border:`2px solid ${paymentMethod===id?'#0F4C81':'#DDE4EE'}`, borderRadius:'12px', padding:'10px 6px', textAlign:'center', cursor:'pointer', background:paymentMethod===id?'#EEF1FF':'white', transition:'all 0.15s' }}>
                  <span style={{ fontSize:'20px' }}>{e}</span>
                  <p style={{ margin:'4px 0 0', fontSize:'10px', fontWeight:'600', color:paymentMethod===id?'#0F4C81':'#5E6E8A' }}>{l}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button className="btn btn-outline" onClick={() => window.print()}>🖨️ প্রিন্ট রসিদ</button>
              <button onClick={completeSale} disabled={loading} className="btn btn-success" style={{ fontSize:'15px' }}>
                {loading ? '⏳ প্রসেস হচ্ছে...' : '✓ বিক্রয় সম্পন্ন'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Camera Barcode Scanner Modal */}
      {cameraOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:950, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ width:'100%', maxWidth:480, animation:'slideUp 0.3s ease' }}>
            <BarcodeScanner
              onScan={(code) => { scanProduct(code); setCameraOpen(false); }}
              onClose={() => setCameraOpen(false)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ToastArea() {
  const { notifications } = useNotifStore();
  return (
    <>
      {notifications.map(n => (
        <div key={n.id} className={`toast toast-${n.type}`} style={{ maxWidth:'480px', left:'50%', transform:'translateX(-50%)' }}>
          {n.msg}
        </div>
      ))}
    </>
  );
}
