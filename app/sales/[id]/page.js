'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore, useNotifStore } from '@/lib/store';
import { timeAgo } from '@/lib/utils';

export default function SaleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, shop } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCollect, setShowCollect] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSale(); }, [id]);

  const loadSale = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json();
      setSale(data);
    } catch {}
    finally { setLoading(false); }
  };

  const collectDue = async () => {
    const amount = +collectAmount || sale?.due_amount;
    if (!amount) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'collect_due', amount }),
      });
      if (res.ok) {
        addNotif(`✅ ৳ ${amount.toLocaleString()} বাকি আদায় হয়েছে!`, 'success');
        setShowCollect(false);
        setCollectAmount('');
        loadSale();
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setSaving(false);
  };

  const printReceipt = () => {
    if (!sale) return;
    const shopName  = shop?.shop_name || 'Digiboi Shop';
    const shopAddr  = shop?.address || '';
    const shopPhone = shop?.phone || '';
    const METHOD_L  = { cash:'নগদ', bkash:'bKash', nagad:'Nagad', bank:'ব্যাংক', due:'বাকি' };

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body{font-family:'Hind Siliguri',Arial;max-width:320px;margin:0 auto;padding:16px;background:white;font-size:13px;}
  h2{text-align:center;margin:0 0 3px;font-size:17px;font-weight:800;}
  .center{text-align:center;} .dashed{border-top:2px dashed #ccc;margin:10px 0;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;font-size:11px;color:#666;padding:5px 0;border-bottom:1px solid #ddd;}
  td{padding:7px 0;font-size:12px;border-bottom:1px dotted #eee;} .right{text-align:right;}
  .tot{font-size:17px;font-weight:800;} .sub{font-size:11px;color:#666;}
  @media print{.noprint{display:none!important;}}
</style></head><body>
<div class="center">
  <div style="width:48px;height:48px;background:linear-gradient(135deg,#0F4C81,#2E86DE);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:22px;color:white;font-weight:800;line-height:48px;">D</div>
  <h2>${shopName}</h2>
  ${shopAddr ? `<p class="sub">${shopAddr}</p>` : ''}
  ${shopPhone ? `<p class="sub">📱 ${shopPhone}</p>` : ''}
</div>
<div class="dashed"></div>
<div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:6px;">
  <span>ইনভয়েস: <b style="color:#000">${sale.invoice_number}</b></span>
  <span>${new Date(sale.created_at).toLocaleString('bn-BD',{dateStyle:'short',timeStyle:'short'})}</span>
</div>
${sale.customers?.name ? `<p class="sub" style="margin:3px 0;">গ্রাহক: <b style="color:#000">${sale.customers.name}</b></p>` : ''}
<div class="dashed"></div>
<table><thead><tr><th>পণ্য</th><th class="right">পরিমাণ</th><th class="right">মোট</th></tr></thead><tbody>
${(sale.sale_items||[]).map(i=>`
<tr>
  <td>${i.product_name}<br><span class="sub">৳${i.unit_price}/${i.unit||'pcs'}</span></td>
  <td class="right">${i.quantity}</td>
  <td class="right" style="font-weight:700;">৳${(i.total||0).toLocaleString()}</td>
</tr>`).join('')}
</tbody></table>
<div class="dashed"></div>
<div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:3px;"><span>উপমোট</span><span>৳ ${(sale.subtotal||sale.total||0).toLocaleString()}</span></div>
${(sale.discount||0)>0?`<div style="display:flex;justify-content:space-between;font-size:11px;color:#E63946;margin-bottom:3px;"><span>ছাড়</span><span>−৳ ${sale.discount.toLocaleString()}</span></div>`:''}
<div style="display:flex;justify-content:space-between;margin:8px 0;padding:8px 0;border-top:2px solid #000;">
  <span class="tot">সর্বমোট</span><span class="tot">৳ ${(sale.total||0).toLocaleString()}</span>
</div>
<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;">
  <span>পরিশোধ (${METHOD_L[sale.payment_method]||sale.payment_method})</span>
  <span style="color:#0BAA69;font-weight:700;">৳ ${(sale.paid_amount||0).toLocaleString()}</span>
</div>
${(sale.due_amount||0)>0?`<div style="display:flex;justify-content:space-between;font-size:13px;color:#E63946;font-weight:800;margin-top:3px;"><span>বাকি</span><span>৳ ${sale.due_amount.toLocaleString()}</span></div>`:''}
<div class="dashed"></div>
<div class="center">
  <p style="font-size:14px;font-weight:700;">ধন্যবাদ! আবার আসবেন 🙏</p>
  <p class="sub">Powered by Digiboi</p>
</div>
<button class="noprint" onclick="window.print()" style="display:block;width:100%;padding:12px;background:#0F4C81;color:white;border:none;border-radius:10px;font-size:14px;cursor:pointer;font-family:inherit;margin-top:14px;">🖨️ প্রিন্ট</button>
</body></html>`;

    const w = window.open('', '_blank', 'width=400,height=650');
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 700);
  };

  if (loading) return (
    <AppShell title="বিক্রয়ের বিবরণ" activeTab="pos">
      <div style={{ padding:'80px 16px', textAlign:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid #0F4C81', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  );

  if (notFound || !sale) return (
    <AppShell title="বিক্রয়ের বিবরণ" activeTab="pos">
      <div style={{ padding:'60px 24px', textAlign:'center' }}>
        <span style={{ fontSize:'52px' }}>😕</span>
        <p style={{ color:'#E63946', fontWeight:'700', fontSize:'16px', marginTop:'14px' }}>বিক্রয়টি পাওয়া যায়নি</p>
        <button onClick={()=>router.push('/sales')} className="btn btn-primary" style={{ marginTop:'16px' }}>← বিক্রয় তালিকায় ফিরুন</button>
      </div>
    </AppShell>
  );

  const statusStyle = {
    paid:    { bg:'#E6F9F2', c:'#0BAA69', l:'✓ পরিশোধ' },
    due:     { bg:'#FDECEA', c:'#E63946', l:'⏳ বাকি' },
    partial: { bg:'#FFF3E0', c:'#F4A261', l:'~ আংশিক' },
  };

  const ss = statusStyle[sale.payment_status] || statusStyle.due;
  const METHOD_LABEL = { cash:'💵 নগদ', bkash:'📱 bKash', nagad:'📱 Nagad', bank:'🏦 ব্যাংক', due:'📋 বাকি' };

  return (
    <AppShell title="বিক্রয়ের বিবরণ" activeTab="pos">
      <div style={{ padding:'0 16px 90px' }}>

        {/* Invoice Header */}
        <div style={{ background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'22px', padding:'20px', marginBottom:'14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
            <div>
              <p style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:'800', color:'white' }}>{sale.invoice_number}</p>
              <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>
                {new Date(sale.created_at).toLocaleString('bn-BD', { dateStyle:'medium', timeStyle:'short' })}
              </p>
            </div>
            <span style={{ background:ss.bg, color:ss.c, padding:'5px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'700', flexShrink:0 }}>{ss.l}</span>
          </div>
          {sale.customers?.name && (
            <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'20px' }}>👤</span>
              <div>
                <p style={{ margin:'0 0 1px', color:'white', fontSize:'14px', fontWeight:'600' }}>{sale.customers.name}</p>
                {sale.customers.phone && <p style={{ margin:0, color:'rgba(255,255,255,0.7)', fontSize:'11px' }}>📱 {sale.customers.phone}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
          {[
            { l:'সর্বমোট', v:'৳ '+(sale.total||0).toLocaleString(), c:'#0F4C81', bg:'#EEF1FF' },
            { l:'পরিশোধ', v:'৳ '+(sale.paid_amount||0).toLocaleString(), c:'#0BAA69', bg:'#E6F9F2' },
            { l:'বাকি', v:(sale.due_amount||0)>0?'৳ '+sale.due_amount.toLocaleString():'—', c:'#E63946', bg:'#FDECEA' },
            { l:'পেমেন্ট', v:METHOD_LABEL[sale.payment_method]||sale.payment_method, c:'#5E6E8A', bg:'#F8FAFC' },
          ].map(x=>(
            <div key={x.l} style={{ background:x.bg, borderRadius:'14px', padding:'12px', textAlign:'center' }}>
              <p style={{ margin:0, fontSize:'15px', fontWeight:'800', color:x.c }}>{x.v}</p>
              <p style={{ margin:'3px 0 0', fontSize:'10px', color:x.c+'99' }}>{x.l}</p>
            </div>
          ))}
        </div>

        {/* Due Alert */}
        {(sale.due_amount||0) > 0 && (
          <div style={{ background:'#FDECEA', border:'1px solid rgba(230,57,70,0.3)', borderRadius:'14px', padding:'12px 16px', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:'#E63946' }}>⏳ বাকি আছে</p>
              <p style={{ margin:0, fontSize:'11px', color:'#5E6E8A' }}>৳ {sale.due_amount.toLocaleString()} পরিশোধ বাকি</p>
            </div>
            <button onClick={()=>{ setShowCollect(true); setCollectAmount(sale.due_amount); }}
              className="btn btn-success" style={{ padding:'8px 16px', fontSize:'13px' }}>💰 নিন</button>
          </div>
        )}

        {/* Items */}
        <div className="card" style={{ marginBottom:'14px' }}>
          <p style={{ margin:'0 0 14px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>🛒 পণ্য তালিকা ({sale.sale_items?.length || 0} টি)</p>
          {(sale.sale_items || []).map((item, i) => (
            <div key={i} style={{ padding:'11px 0', borderBottom:i<(sale.sale_items.length-1)?'1px solid #F0F4F8':'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:'600', color:'#141D28' }}>{item.product_name}</p>
                <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5' }}>
                  ৳{item.unit_price?.toLocaleString()} × {item.quantity} {item.unit||'pcs'}
                </p>
              </div>
              <p style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#0F4C81' }}>৳ {(item.total||0).toLocaleString()}</p>
            </div>
          ))}

          {/* Bill Summary */}
          <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'2px dashed #DDE4EE' }}>
            {[
              ['উপমোট', '৳ '+(sale.subtotal||sale.total||0).toLocaleString(), '#5E6E8A'],
              ...(sale.discount>0 ? [['ছাড়', '−৳ '+sale.discount.toLocaleString(), '#E63946']] : []),
            ].map(([l,v,c])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontSize:'12px', color:'#8A9AB5' }}>{l}</span>
                <span style={{ fontSize:'12px', color:c, fontWeight:'600' }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'8px', borderTop:'1px solid #DDE4EE', marginTop:'4px' }}>
              <span style={{ fontSize:'16px', fontWeight:'800', color:'#141D28' }}>সর্বমোট</span>
              <span style={{ fontSize:'20px', fontWeight:'800', color:'#0F4C81' }}>৳ {(sale.total||0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="card" style={{ marginBottom:'14px', background:'#FFF3E0', border:'none' }}>
            <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:'700', color:'#F4A261' }}>📝 নোট</p>
            <p style={{ margin:0, fontSize:'13px', color:'#5E6E8A' }}>{sale.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <button onClick={printReceipt} style={{ padding:'14px', background:'#EEF1FF', border:'none', borderRadius:'14px', fontSize:'13px', color:'#0F4C81', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>🖨️ প্রিন্ট রসিদ</button>
          <a href={`/receipt?id=${sale.id}`} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
            <button style={{ width:'100%', padding:'14px', background:'#E6F9F2', border:'none', borderRadius:'14px', fontSize:'13px', color:'#0BAA69', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>📄 রসিদ পেজ</button>
          </a>
        </div>
      </div>

      {/* Collect Due Modal */}
      {showCollect && (
        <div className="modal-overlay" onClick={()=>setShowCollect(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <p style={{ margin:0, fontSize:'17px', fontWeight:'700' }}>💰 বাকি আদায়</p>
              <button onClick={()=>setShowCollect(false)} style={{ background:'#F0F4F8', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            <div style={{ background:'#FDECEA', borderRadius:'12px', padding:'12px', marginBottom:'14px' }}>
              <p style={{ margin:'0 0 2px', fontSize:'13px', color:'#5E6E8A' }}>মোট বাকি</p>
              <p style={{ margin:0, fontSize:'22px', fontWeight:'800', color:'#E63946' }}>৳ {sale.due_amount?.toLocaleString()}</p>
            </div>
            <div className="input-wrap">
              <label className="input-label">পরিমাণ (৳)</label>
              <input className="input-field" type="number" placeholder={sale.due_amount} value={collectAmount} onChange={e=>setCollectAmount(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
              {[sale.due_amount, Math.round(sale.due_amount/2), 500, 1000]
                .filter((v,i,a)=>a.indexOf(v)===i&&v>0).slice(0,4)
                .map(v=>(
                  <button key={v} onClick={()=>setCollectAmount(v)}
                    style={{ flex:1, padding:'8px 4px', background:'#EEF1FF', border:'none', borderRadius:'8px', fontSize:'11px', color:'#0F4C81', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>
                    ৳{v.toLocaleString()}
                  </button>
                ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setShowCollect(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={collectDue} disabled={saving} className="btn btn-success btn-full">{saving?'⏳...':'✓ নিশ্চিত করুন'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
