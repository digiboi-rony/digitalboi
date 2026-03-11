'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../../lib/store';
import { formatCurrency, timeAgo } from '../../../lib/utils';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`/api/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/sales?customerId=${id}&limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cRes.status === 404) { setNotFound(true); setLoading(false); return; }
      const cData = await cRes.json();
      const sData = await sRes.json();
      setCustomer(cData);
      setForm({ name:cData.name||'', phone:cData.phone||'', address:cData.address||'', notes:cData.notes||'' });
      setSales(Array.isArray(sData) ? sData : []);
    } catch {}
    setLoading(false);
  };

  const collectPayment = async () => {
    const amount = +payAmount || customer?.due_amount;
    if (!amount) { addNotif('পরিমাণ দিন', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'pay', amount, paymentMethod: payMethod }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
        setShowPayment(false);
        setPayAmount('');
        addNotif(`✅ ৳ ${amount.toLocaleString()} পেমেন্ট রেকর্ড হয়েছে!`, 'success');
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setSaving(false);
  };

  const saveCustomer = async () => {
    if (!form.name) { addNotif('নাম দিন', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, phone: form.phone, address: form.address, notes: form.notes }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
        setShowEdit(false);
        addNotif('✅ গ্রাহকের তথ্য আপডেট হয়েছে!', 'success');
      }
    } catch {}
    setSaving(false);
  };

  const deleteCustomer = async () => {
    if (!window.confirm('এই গ্রাহককে মুছে ফেলবেন?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addNotif('গ্রাহক মুছে ফেলা হয়েছে', 'success');
        router.push('/customers');
      }
    } catch {}
  };

  if (loading) return (
    <AppShell title="গ্রাহকের বিবরণ" activeTab="customers">
      <div style={{ padding:'80px 16px', textAlign:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid #0F4C81', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  );

  if (notFound || !customer) return (
    <AppShell title="গ্রাহকের বিবরণ" activeTab="customers">
      <div style={{ padding:'60px 24px', textAlign:'center' }}>
        <span style={{ fontSize:'52px' }}>😕</span>
        <p style={{ color:'#E63946', fontWeight:'700', fontSize:'16px', marginTop:'14px' }}>গ্রাহক পাওয়া যায়নি</p>
        <button onClick={()=>router.push('/customers')} className="btn btn-primary" style={{ marginTop:'16px' }}>← গ্রাহক তালিকায় ফিরুন</button>
      </div>
    </AppShell>
  );

  const c = customer;
  const statusStyle = {
    paid:    { bg:'#E6F9F2', c:'#0BAA69', l:'✓ পরিশোধ' },
    due:     { bg:'#FDECEA', c:'#E63946', l:'⏳ বাকি' },
    partial: { bg:'#FFF3E0', c:'#F4A261', l:'~ আংশিক' },
  };

  return (
    <AppShell title="গ্রাহকের বিবরণ" activeTab="customers">
      <div style={{ padding:'0 16px 90px' }}>

        {/* Customer Header */}
        <div style={{ background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'22px', padding:'20px', marginBottom:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
            <div style={{ width:'60px', height:'60px', borderRadius:'18px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0 }}>
              {c.due_amount > 0 ? '⏳' : '✅'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:'0 0 3px', fontSize:'18px', fontWeight:'800', color:'white' }}>{c.name}</p>
              {c.phone && <p style={{ margin:'0 0 3px', fontSize:'12px', color:'rgba(255,255,255,0.75)' }}>📱 {c.phone}</p>}
              {c.address && <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>📍 {c.address}</p>}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px' }}>
            {[
              [c.due_amount>0 ? formatCurrency(c.due_amount) : 'পরিশোধ ✓', 'বাকি', c.due_amount>0?'#FF8A8A':'#98F4C8'],
              [formatCurrency(c.total_spent||0), 'মোট কেনা', 'rgba(255,255,255,0.9)'],
              [(c.visit_count||0)+' বার', 'ভিজিট', 'rgba(255,255,255,0.9)'],
              [c.last_visit ? timeAgo(c.last_visit) : '—', 'শেষ ক্রয়', 'rgba(255,255,255,0.9)'],
            ].map(([v,l,cl])=>(
              <div key={l} style={{ background:'rgba(255,255,255,0.12)', borderRadius:'10px', padding:'10px 6px', textAlign:'center' }}>
                <p style={{ margin:0, fontSize:'12px', fontWeight:'800', color:cl }}>{v}</p>
                <p style={{ margin:'2px 0 0', fontSize:'9px', color:'rgba(255,255,255,0.6)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Due Alert */}
        {c.due_amount > 0 && (
          <div style={{ background:'#FDECEA', border:'1px solid rgba(230,57,70,0.3)', borderRadius:'14px', padding:'12px 16px', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#E63946' }}>⏳ বাকি আছে</p>
              <p style={{ margin:0, fontSize:'13px', color:'#5E6E8A' }}>৳ {c.due_amount.toLocaleString()} পরিশোধ বাকি</p>
            </div>
            <button onClick={()=>{ setShowPayment(true); setPayAmount(c.due_amount); }} className="btn btn-success" style={{ padding:'9px 16px', fontSize:'13px' }}>💰 নিন</button>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'14px' }}>
          <button onClick={()=>setShowEdit(true)} style={{ padding:'12px 8px', background:'#EEF1FF', border:'none', borderRadius:'12px', fontSize:'12px', color:'#0F4C81', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>✏️ এডিট</button>
          <button onClick={()=>router.push(`/pos?customerId=${id}`)} style={{ padding:'12px 8px', background:'#E6F9F2', border:'none', borderRadius:'12px', fontSize:'12px', color:'#0BAA69', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>🛒 বিক্রয়</button>
          <button onClick={deleteCustomer} style={{ padding:'12px 8px', background:'#FDECEA', border:'none', borderRadius:'12px', fontSize:'12px', color:'#E63946', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>🗑️ মুছুন</button>
        </div>

        {/* Notes */}
        {c.notes && (
          <div className="card" style={{ background:'#FFF3E0', border:'none', marginBottom:'14px' }}>
            <p style={{ margin:'0 0 4px', fontSize:'12px', fontWeight:'700', color:'#F4A261' }}>📝 নোট</p>
            <p style={{ margin:0, fontSize:'13px', color:'#5E6E8A' }}>{c.notes}</p>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <p style={{ margin:'0 0 12px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>📋 লেনদেনের ইতিহাস ({sales.length} টি)</p>
          {sales.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#8A9AB5' }}>
              <span style={{ fontSize:'40px' }}>🛒</span>
              <p style={{ marginTop:'10px' }}>কোনো লেনদেন নেই</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {sales.map(s => {
                const ss = statusStyle[s.payment_status] || statusStyle.paid;
                return (
                  <div key={s.id} onClick={()=>router.push(`/sales/${s.id}`)}
                    className="card" style={{ padding:'14px 16px', borderLeft:`4px solid ${ss.c}`, cursor:'pointer' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <p style={{ margin:'0 0 3px', fontSize:'13px', fontWeight:'700', color:'#141D28' }}>{s.invoice_number}</p>
                        <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5' }}>
                          {timeAgo(s.created_at)} ·
                          {s.payment_method === 'cash' ? ' নগদ' : s.payment_method === 'bkash' ? ' bKash' : s.payment_method === 'nagad' ? ' Nagad' : s.payment_method === 'due' ? ' বাকি' : ' ব্যাংক'}
                        </p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ margin:'0 0 4px', fontSize:'15px', fontWeight:'800', color:'#141D28' }}>৳ {(s.total||0).toLocaleString()}</p>
                        <span className="pill" style={{ background:ss.bg, color:ss.c }}>
                          {ss.l}{s.due_amount > 0 ? ` ৳${s.due_amount.toLocaleString()}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={()=>setShowPayment(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <p style={{ margin:0, fontSize:'17px', fontWeight:'700' }}>💰 পেমেন্ট নিন</p>
              <button onClick={()=>setShowPayment(false)} style={{ background:'#F0F4F8', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            <div style={{ background:'#FDECEA', borderRadius:'12px', padding:'12px', marginBottom:'14px' }}>
              <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:'700', color:'#141D28' }}>{c.name}</p>
              <p style={{ margin:0, fontSize:'13px', color:'#E63946', fontWeight:'600' }}>মোট বাকি: ৳ {c.due_amount.toLocaleString()}</p>
            </div>
            <div className="input-wrap">
              <label className="input-label">পরিমাণ (৳)</label>
              <input className="input-field" type="number" placeholder={c.due_amount} value={payAmount} onChange={e=>setPayAmount(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' }}>
              {[c.due_amount, Math.round(c.due_amount/2), 500, 1000]
                .filter((v,i,a)=>a.indexOf(v)===i&&v>0).slice(0,4)
                .map(v=>(
                  <button key={v} onClick={()=>setPayAmount(v)} style={{ flex:1, minWidth:'60px', padding:'8px 4px', background:'#EEF1FF', border:'none', borderRadius:'8px', fontSize:'11px', color:'#0F4C81', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>৳{v.toLocaleString()}</button>
                ))}
            </div>
            <div className="input-wrap">
              <label className="input-label">পেমেন্ট পদ্ধতি</label>
              <select className="input-field" value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
                <option value="cash">💵 নগদ</option>
                <option value="bkash">📱 bKash</option>
                <option value="nagad">🟠 Nagad</option>
                <option value="bank">🏦 ব্যাংক</option>
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setShowPayment(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={collectPayment} disabled={saving} className="btn btn-success btn-full">{saving?'⏳...':'✓ নিশ্চিত করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={()=>setShowEdit(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <p style={{ margin:0, fontSize:'17px', fontWeight:'700' }}>✏️ তথ্য সম্পাদনা</p>
              <button onClick={()=>setShowEdit(false)} style={{ background:'#F0F4F8', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            {[['নাম','name','text',true],['ফোন','phone','tel'],['ঠিকানা','address','text'],['নোট','notes','text']].map(([l,k,t,req])=>(
              <div key={k} className="input-wrap">
                <label className="input-label">{l}{req&&<span style={{color:'#E63946'}}> *</span>}</label>
                <input className="input-field" type={t||'text'} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setShowEdit(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={saveCustomer} disabled={saving} className="btn btn-primary btn-full">{saving?'⏳...':'✓ সংরক্ষণ'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
