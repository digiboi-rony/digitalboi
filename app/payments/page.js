'use client';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore } from '../../lib/store';
import { formatCurrency, timeAgo } from '../../lib/utils';

export default function PaymentsPage() {
  const { token } = useAuthStore();
  const [tab, setTab] = useState('all');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadPayments(); }, [tab, dateFrom, dateTo]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: dateFrom, to: dateTo });
      if (tab !== 'all') params.append('type', tab);
      const res = await fetch('/api/payments?' + params, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch { setPayments([]); }
    finally { setLoading(false); }
  };

  const received = payments.filter(p => p.entity_type === 'sale' || p.direction === 'in');
  const paid = payments.filter(p => p.entity_type !== 'sale' || p.direction === 'out');
  const displayed = tab === 'sale' ? received : tab === 'expense' || tab === 'purchase' ? paid : payments;

  const totalIn  = received.reduce((s, p) => s + (p.amount || 0), 0);
  const totalOut = paid.reduce((s, p) => s + (p.amount || 0), 0);
  const balance  = totalIn - totalOut;

  const METHOD_ICON  = { cash:'💵', bkash:'📱', nagad:'🟠', card:'💳', bank:'🏦', due:'📋' };
  const METHOD_LABEL = { cash:'নগদ', bkash:'bKash', nagad:'Nagad', card:'কার্ড', bank:'ব্যাংক', due:'বাকি' };
  const TYPE_LABEL   = { sale:'বিক্রয়', purchase:'ক্রয়', expense:'খরচ', customer_payment:'পেমেন্ট' };
  const TYPE_ICON    = { sale:'🛒', purchase:'📦', expense:'💸', customer_payment:'💰' };

  return (
    <AppShell title="পেমেন্ট লেনদেন" activeTab="accounts">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Date Filter */}
        <div style={{ background:'white', borderRadius:'16px', padding:'12px', marginBottom:'12px', boxShadow:'0 2px 10px rgba(15,40,80,0.06)', display:'flex', gap:'8px' }}>
          <div style={{ flex:1 }}>
            <label className="input-label">তারিখ থেকে</label>
            <input className="input-field" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <label className="input-label">তারিখ পর্যন্ত</label>
            <input className="input-field" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
          </div>
        </div>

        {/* Balance Card */}
        <div style={{ background: 'linear-gradient(135deg,#0F2D50,#0F4C81)', borderRadius: 22, padding: '18px 20px', marginBottom: 14 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: 'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'1px' }}>নেট ব্যালেন্স</p>
          <p style={{ margin: '0 0 14px', fontSize: 32, fontWeight: 800, color: balance >= 0 ? '#7AF9C6' : '#FF8B8B' }}>
            {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(11,170,105,0.2)', borderRadius: 12, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>আয় হয়েছে</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#7AF9C6' }}>+{formatCurrency(totalIn)}</p>
            </div>
            <div style={{ background: 'rgba(230,57,70,0.2)', borderRadius: 12, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>খরচ হয়েছে</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#FF8B8B' }}>−{formatCurrency(totalOut)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#F0F4F8', borderRadius: 14, padding: 4, marginBottom: 14, gap: 4 }}>
          {[['all','সব'],['sale','বিক্রয়'],['purchase','ক্রয়'],['expense','খরচ']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{ flex:1, padding:'9px 4px', border:'none', borderRadius:10, fontSize:11, fontWeight:600, cursor:'pointer', background:tab===k?'white':'transparent', color:tab===k?'#0F4C81':'#5E6E8A', fontFamily:'inherit', boxShadow:tab===k?'0 2px 8px rgba(0,0,0,0.08)':'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[1,2,3,4].map(i=><div key={i} className="card skeleton" style={{ height:'72px' }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign:'center', padding:'50px 16px' }}>
            <span style={{ fontSize:'48px' }}>💳</span>
            <p style={{ color:'#8A9AB5', marginTop:'12px', fontWeight:'600' }}>এই সময়ে কোনো লেনদেন নেই</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map(p => {
              const isIncome = p.entity_type === 'sale' || p.entity_type === 'customer_payment';
              return (
                <div key={p.id} className="card" style={{ padding: '13px 16px', borderLeft:`3px solid ${isIncome?'#0BAA69':'#E63946'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width:42, height:42, borderRadius:13, background:isIncome?'#E6F9F2':'#FDECEA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                        {TYPE_ICON[p.entity_type] || METHOD_ICON[p.payment_method] || '💵'}
                      </div>
                      <div>
                        <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'#141D28' }}>
                          {TYPE_LABEL[p.entity_type] || 'লেনদেন'}
                          {p.notes ? ` — ${p.notes}` : ''}
                        </p>
                        <p style={{ margin:0, fontSize:11, color:'#8A9AB5' }}>
                          {timeAgo(p.created_at)} · {METHOD_LABEL[p.payment_method] || p.payment_method}
                        </p>
                      </div>
                    </div>
                    <p style={{ margin:0, fontSize:16, fontWeight:800, color:isIncome?'#0BAA69':'#E63946' }}>
                      {isIncome ? '+' : '−'}{formatCurrency(p.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
