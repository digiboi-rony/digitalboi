'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const MONTHS = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
const COLORS = ['#0F4C81','#0BAA69','#F0A500','#E63946','#8B5CF6','#F4A261','#2E86DE'];

export default function ReportsPage() {
  const { token } = useAuthStore();
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getPeriodDates = () => {
    const now = new Date();
    if (period === 'today') {
      const d = now.toISOString().split('T')[0];
      return { from: d, to: d };
    }
    if (period === 'weekly') {
      const from = new Date(now - 6 * 86400000).toISOString().split('T')[0];
      return { from, to: now.toISOString().split('T')[0] };
    }
    if (period === 'monthly') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { from, to: now.toISOString().split('T')[0] };
    }
    const from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    return { from, to: now.toISOString().split('T')[0] };
  };

  useEffect(() => { loadReports(); }, [period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { from, to } = getPeriodDates();
      const [overviewRes, topRes, monthlyRes] = await Promise.all([
        fetch(`/api/reports?type=overview&from=${from}&to=${to}T23:59:59`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/reports?type=top_products&from=${from}&to=${to}T23:59:59`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/reports?type=monthly`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const overview = await overviewRes.json();
      const top = await topRes.json();
      const monthly = await monthlyRes.json();
      setData({ overview, top, monthly });
    } catch { }
    finally { setLoading(false); }
  };

  const ov = data?.overview || {};
  const monthly = data?.monthly?.monthly || [];
  const topProducts = data?.top?.products || [];
  const catData = data?.overview?.byCategory || [];

  const printReport = () => {
    window.print();
  };

  return (
    <AppShell title="রিপোর্ট ও বিশ্লেষণ" activeTab="reports">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Period Filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[['today','আজ'],['weekly','সপ্তাহ'],['monthly','মাস'],['yearly','বছর']].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriod(k)} style={{ padding:'7px 18px', border:`2px solid ${period===k?'#0F4C81':'#DDE4EE'}`, borderRadius:'20px', fontSize:'13px', fontWeight:'600', cursor:'pointer', background:period===k?'#EEF1FF':'white', color:period===k?'#0F4C81':'#5E6E8A', fontFamily:'inherit', flexShrink:0 }}>{l}</button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'#F0F4F8', borderRadius:'14px', padding:'4px', marginBottom:'14px', gap:'4px' }}>
          {[['overview','📊 সংক্ষিপ্ত'],['products','📦 পণ্য'],['chart','📈 চার্ট']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:'9px 4px', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'600', cursor:'pointer', background:tab===k?'white':'transparent', color:tab===k?'#0F4C81':'#5E6E8A', fontFamily:'inherit', boxShadow:tab===k?'0 2px 8px rgba(0,0,0,0.08)':'none' }}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {[1,2,3,4].map(i=><div key={i} className="card skeleton" style={{ height:'80px' }} />)}
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab==='overview' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  {[
                    { l:'মোট বিক্রয়', v:'৳ '+(ov.totalSales||0).toLocaleString(), c:'#0BAA69', bg:'#E6F9F2', i:'📈' },
                    { l:'মোট মুনাফা', v:'৳ '+(ov.totalProfit||0).toLocaleString(), c:'#0F4C81', bg:'#EEF1FF', i:'💰' },
                    { l:'মোট খরচ', v:'৳ '+(ov.totalExpenses||0).toLocaleString(), c:'#E63946', bg:'#FDECEA', i:'💸' },
                    { l:'বিক্রয় সংখ্যা', v:(ov.totalOrders||0)+' টি', c:'#8B5CF6', bg:'#F3F0FF', i:'🧾' },
                    { l:'গড় বিক্রয়', v:'৳ '+(ov.avgOrderValue||0).toLocaleString(), c:'#F4A261', bg:'#FFF3E0', i:'📊' },
                    { l:'বাকি পাওনা', v:'৳ '+(ov.totalDue||0).toLocaleString(), c:'#E63946', bg:'#FDECEA', i:'⏳' },
                  ].map(s=>(
                    <div key={s.l} style={{ background:s.bg, borderRadius:'16px', padding:'14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                        <span style={{ fontSize:'18px' }}>{s.i}</span>
                        <span style={{ fontSize:'11px', color:s.c+'aa', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.l}</span>
                      </div>
                      <p style={{ margin:0, fontSize:'18px', fontWeight:'800', color:s.c }}>{s.v}</p>
                    </div>
                  ))}
                </div>

                {catData.length > 0 && (
                  <div className="card">
                    <p style={{ margin:'0 0 14px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>🏷️ ক্যাটাগরি অনুযায়ী বিক্রয়</p>
                    {catData.map((c, i) => (
                      <div key={i} style={{ marginBottom:'10px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                          <span style={{ fontSize:'12px', color:'#5E6E8A', fontWeight:'600' }}>{c.name}</span>
                          <span style={{ fontSize:'12px', color:'#141D28', fontWeight:'700' }}>৳ {c.revenue?.toLocaleString()}</span>
                        </div>
                        <div style={{ height:'6px', background:'#F0F4F8', borderRadius:'10px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:c.percentage+'%', background:COLORS[i%COLORS.length], borderRadius:'10px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={printReport} className="btn btn-outline btn-full" style={{ marginTop:'4px' }}>🖨️ রিপোর্ট প্রিন্ট করুন</button>
              </div>
            )}

            {/* TOP PRODUCTS */}
            {tab==='products' && (
              <div>
                {topProducts.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>
                    <span style={{ fontSize:'40px' }}>📦</span>
                    <p style={{ marginTop:'12px' }}>এই সময়ে কোনো বিক্রয় নেই</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    <p style={{ margin:'0 0 10px', fontSize:'13px', fontWeight:'600', color:'#5E6E8A' }}>সর্বাধিক বিক্রিত পণ্য</p>
                    {topProducts.map((p, i) => (
                      <div key={i} className="card" style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1 }}>
                            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:COLORS[i%COLORS.length]+'18', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', color:COLORS[i%COLORS.length], fontSize:'14px' }}>#{i+1}</div>
                            <div>
                              <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:'700', color:'#141D28' }}>{p.name}</p>
                              <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5' }}>{p.sold} {p.unit || 'pcs'} বিক্রি</p>
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <p style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:'800', color:'#0F4C81' }}>৳ {p.revenue?.toLocaleString()}</p>
                            <p style={{ margin:0, fontSize:'10px', color:'#0BAA69', fontWeight:'600' }}>মুনাফা: ৳ {p.profit?.toLocaleString()}</p>
                          </div>
                        </div>
                        <div style={{ marginTop:'8px', height:'4px', background:'#F0F4F8', borderRadius:'10px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:Math.min(100, ((p.revenue||0)/(topProducts[0]?.revenue||1))*100)+'%', background:COLORS[i%COLORS.length], borderRadius:'10px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHART */}
            {tab==='chart' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {monthly.length > 0 ? (
                  <>
                    <div className="card">
                      <p style={{ margin:'0 0 16px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>📊 মাসিক বিক্রয় ও মুনাফা (৳)</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={monthly} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                          <XAxis dataKey="name" tick={{ fontSize:10, fill:'#8A9AB5' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip formatter={v=>['৳ '+v.toLocaleString()]} contentStyle={{ borderRadius:'10px', border:'1px solid #DDE4EE', fontSize:'12px', fontFamily:"'Hind Siliguri',sans-serif" }} />
                          <Bar dataKey="sales" fill="#0F4C81" radius={[4,4,0,0]} name="বিক্রয়" />
                          <Bar dataKey="profit" fill="#0BAA69" radius={[4,4,0,0]} name="মুনাফা" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{ display:'flex', gap:'16px', justifyContent:'center', marginTop:'8px' }}>
                        <span style={{ fontSize:'11px', color:'#0F4C81', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:'12px', height:'12px', background:'#0F4C81', borderRadius:'3px', display:'inline-block' }} />বিক্রয়</span>
                        <span style={{ fontSize:'11px', color:'#0BAA69', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:'12px', height:'12px', background:'#0BAA69', borderRadius:'3px', display:'inline-block' }} />মুনাফা</span>
                      </div>
                    </div>

                    {catData.length > 0 && (
                      <div className="card">
                        <p style={{ margin:'0 0 16px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>🍕 ক্যাটাগরি চার্ট</p>
                        <div style={{ display:'flex', justifyContent:'center' }}>
                          <PieChart width={220} height={160}>
                            <Pie data={catData} cx={110} cy={80} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                              {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={v=>[v+'%']} contentStyle={{ borderRadius:'10px', fontSize:'12px', fontFamily:"'Hind Siliguri',sans-serif" }} />
                          </PieChart>
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
                          {catData.map((c,i)=>(
                            <span key={i} style={{ fontSize:'11px', color:'#5E6E8A', display:'flex', alignItems:'center', gap:'4px' }}>
                              <span style={{ width:'10px', height:'10px', background:COLORS[i%COLORS.length], borderRadius:'2px', display:'inline-block' }} />
                              {c.name} ({c.value}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>
                    <span style={{ fontSize:'40px' }}>📈</span>
                    <p style={{ marginTop:'12px' }}>পর্যাপ্ত ডেটা নেই</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
