'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore, useNotifStore } from '@/lib/store';

export default function SettingsPage() {
  const { user, shop, token, lang, setLang, logout, setAuth } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [tab, setTab] = useState('profile');

  // Staff state
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name:'', phone:'', password:'', role:'cashier', permissions:{ can_sale:true, can_add:false, can_report:false, can_discount:false } });
  const [staffSaving, setStaffSaving] = useState(false);

  // Password state
  const [showChangePass, setShowChangePass] = useState(false);
  const [passForm, setPassForm] = useState({ current:'', newPass:'', confirm:'' });
  const [passSaving, setPassSaving] = useState(false);

  // Shop settings
  const [shopForm, setShopForm] = useState({ shopName: shop?.shop_name||'', address: shop?.address||'', fbPageUrl: shop?.fb_page_url||'' });
  const [shopSaving, setShopSaving] = useState(false);

  // Notif settings (local only – future: save to DB)
  const [notif, setNotif] = useState({ lowStock:true, dueReminder:true, newSale:false, dailyReport:true });

  const roleLabel = { manager:'ম্যানেজার', cashier:'ক্যাশিয়ার', stock_manager:'স্টক ম্যানেজার', viewer:'শুধু দেখতে পারবে' };
  const roleBg    = { manager:'#EEF1FF', cashier:'#E6F9F2', stock_manager:'#FFF3E0', viewer:'#F0F4F8' };
  const roleColor = { manager:'#4361EE', cashier:'#0BAA69', stock_manager:'#F4A261', viewer:'#5E6E8A' };

  useEffect(() => { if (tab === 'staff') loadStaff(); }, [tab]);

  const loadStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch {}
    setStaffLoading(false);
  };

  const addStaff = async () => {
    if (!staffForm.name || !staffForm.phone || !staffForm.password) {
      addNotif('নাম, ফোন ও পাসওয়ার্ড দিন', 'error'); return;
    }
    setStaffSaving(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: staffForm.name, phone: staffForm.phone, password: staffForm.password, role: staffForm.role, permissions: staffForm.permissions }),
      });
      if (res.ok) {
        addNotif('✅ কর্মচারী যোগ হয়েছে!', 'success');
        setShowAddStaff(false);
        setStaffForm({ name:'', phone:'', password:'', role:'cashier', permissions:{ can_sale:true, can_add:false, can_report:false, can_discount:false } });
        loadStaff();
      } else {
        const err = await res.json();
        addNotif(err.error || 'সমস্যা হয়েছে', 'error');
      }
    } catch { addNotif('সার্ভারে সমস্যা', 'error'); }
    setStaffSaving(false);
  };

  const changePassword = async () => {
    if (!passForm.current || !passForm.newPass) { addNotif('পুরনো ও নতুন পাসওয়ার্ড দিন', 'error'); return; }
    if (passForm.newPass !== passForm.confirm) { addNotif('নতুন পাসওয়ার্ড মিলছে না', 'error'); return; }
    if (passForm.newPass.length < 8) { addNotif('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে', 'error'); return; }
    setPassSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.newPass }),
      });
      if (res.ok) {
        addNotif('✅ পাসওয়ার্ড পরিবর্তন হয়েছে!', 'success');
        setShowChangePass(false);
        setPassForm({ current:'', newPass:'', confirm:'' });
      } else {
        const err = await res.json();
        addNotif(err.error || 'পাসওয়ার্ড ভুল', 'error');
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setPassSaving(false);
  };

  const saveShopSettings = async () => {
    if (!shopForm.shopName) { addNotif('দোকানের নাম দিন', 'error'); return; }
    setShopSaving(true);
    try {
      const res = await fetch('/api/shop', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopName: shopForm.shopName, address: shopForm.address, fbPageUrl: shopForm.fbPageUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuth(user, data, token);
        addNotif('✅ দোকানের তথ্য আপডেট হয়েছে!', 'success');
      }
    } catch {}
    setShopSaving(false);
  };

  const handleLogout = () => {
    if (window.confirm('লগআউট করবেন?')) logout();
  };

  return (
    <AppShell title="সেটিংস" activeTab="settings">
      <div style={{ padding:'0 16px 90px' }}>

        {/* Profile Header */}
        <div style={{ background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'22px', padding:'20px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'20px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0, overflow:'hidden' }}>
            {user?.profile_photo ? <img src={user.profile_photo} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="profile" /> : '👤'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:'0 0 3px', fontSize:'17px', fontWeight:'700', color:'white' }}>{user?.full_name || 'মালিক'}</p>
            <p style={{ margin:'0 0 8px', fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>{user?.phone || user?.email}</p>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              <span className="pill" style={{ background:user?.nid_verified?'rgba(11,170,105,0.4)':'rgba(255,255,255,0.15)', color:'white' }}>
                {user?.nid_verified ? '✓ NID যাচাই' : '⏳ NID বাকি'}
              </span>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS TAB */}
        {tab==='notif' && (
          <div className="card">
            <p style={{ margin:'0 0 14px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>🔔 নোটিফিকেশন সেটিংস</p>
            {[
              { k:'lowStock', l:'কম স্টক সতর্কতা', d:'পণ্যের স্টক কমে গেলে জানাবে' },
              { k:'dueReminder', l:'বাকি পরিশোধ রিমাইন্ডার', d:'গ্রাহকের বাকি মনে করিয়ে দেবে' },
              { k:'newSale', l:'নতুন বিক্রয়', d:'প্রতিটি বিক্রয়ে notification' },
              { k:'dailyReport', l:'দৈনিক রিপোর্ট', d:'রাত ১০টায় দিনের সারসংক্ষেপ' },
            ].map((n,i)=>(
              <div key={n.k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:i<3?'1px solid #F0F4F8':'none' }}>
                <div>
                  <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'#141D28' }}>{n.l}</p>
                  <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5' }}>{n.d}</p>
                </div>
                <div onClick={()=>setNotif(s=>({...s,[n.k]:!s[n.k]}))}
                  style={{ width:'48px', height:'26px', borderRadius:'13px', background:notif[n.k]?'#0F4C81':'#DDE4EE', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', width:'20px', height:'20px', background:'white', borderRadius:'50%', top:'3px', left:notif[n.k]?'25px':'3px', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECURITY TAB */}
        {tab==='security' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div className="card">
              <p style={{ margin:'0 0 14px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>🔐 নিরাপত্তা সেটিংস</p>
              {[
                { icon:'🔑', label:'পাসওয়ার্ড পরিবর্তন', action:()=>setShowChangePass(true), color:'#0F4C81' },
                { icon:'📋', label:'লগইন ইতিহাস', action:()=>addNotif('শীঘ্রই আসছে!', 'info'), color:'#5E6E8A' },
                { icon:'🚪', label:'সব ডিভাইস থেকে লগআউট', action:handleLogout, color:'#E63946' },
              ].map((a,i)=>(
                <button key={a.label} onClick={a.action} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderTop:'none', borderLeft:'none', borderRight:'none', borderBottom:i<2?'1px solid #F0F4F8':'none', background:'none', cursor:'pointer', fontFamily:'inherit' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:a.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{a.icon}</div>
                    <span style={{ fontSize:'13px', fontWeight:'600', color:a.color }}>{a.label}</span>
                  </div>
                  <span style={{ color:'#B8C5D6', fontSize:'18px' }}>›</span>
                </button>
              ))}
            </div>

            <div className="card">
              <p style={{ margin:'0 0 12px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>💾 ডেটা ব্যবস্থাপনা</p>
              <p style={{ margin:'0 0 12px', fontSize:'12px', color:'#8A9AB5' }}>আপনার দোকানের সব ডেটা ব্যাকআপ বা এক্সপোর্ট করুন।</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <button onClick={()=>addNotif('শীঘ্রই আসছে!', 'info')} style={{ padding:'12px', background:'#E6F9F2', border:'none', borderRadius:'12px', fontSize:'12px', color:'#0BAA69', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>📥 ব্যাকআপ</button>
                <button onClick={()=>addNotif('শীঘ্রই আসছে!', 'info')} style={{ padding:'12px', background:'#EEF1FF', border:'none', borderRadius:'12px', fontSize:'12px', color:'#0F4C81', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>📤 Excel এক্সপোর্ট</button>
              </div>
            </div>

            <div className="card" style={{ background:'#FDECEA', border:'none' }}>
              <p style={{ margin:'0 0 8px', fontSize:'13px', fontWeight:'700', color:'#E63946' }}>⚠️ বিপজ্জনক এলাকা</p>
              <p style={{ margin:'0 0 12px', fontSize:'12px', color:'#5E6E8A' }}>এই কাজগুলো করলে পূর্বাবস্থায় ফেরা সম্ভব নয়।</p>
              <button onClick={()=>addNotif('এই ফিচার শীঘ্রই আসছে।', 'info')} style={{ padding:'10px 14px', background:'#E63946', border:'none', borderRadius:'10px', fontSize:'12px', color:'white', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>🗑️ অ্যাকাউন্ট মুছে ফেলুন</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="modal-overlay" onClick={()=>setShowAddStaff(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()} style={{ maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <p style={{ margin:0, fontSize:'17px', fontWeight:'700' }}>👥 নতুন কর্মচারী</p>
              <button onClick={()=>setShowAddStaff(false)} style={{ background:'#F0F4F8', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            {[['নাম','name','text','পূর্ণ নাম',true],['ফোন','phone','tel','০১XXXXXXXXX',true],['পাসওয়ার্ড','password','password','কমপক্ষে ৮ অক্ষর',true]].map(([l,k,t,p,req])=>(
              <div key={k} className="input-wrap">
                <label className="input-label">{l}{req&&<span style={{color:'#E63946'}}> *</span>}</label>
                <input className="input-field" type={t} placeholder={p} value={staffForm[k]} onChange={e=>setStaffForm({...staffForm,[k]:e.target.value})} />
              </div>
            ))}
            <div className="input-wrap">
              <label className="input-label">ভূমিকা (Role)</label>
              <select className="input-field" value={staffForm.role} onChange={e=>setStaffForm({...staffForm,role:e.target.value})}>
                {Object.entries(roleLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ background:'#FFF3E0', borderRadius:'12px', padding:'12px', marginBottom:'14px' }}>
              <p style={{ margin:'0 0 10px', fontSize:'12px', fontWeight:'700', color:'#F4A261' }}>⚙️ অনুমতি</p>
              {[['বিক্রয় করতে পারবে','can_sale'],['পণ্য যোগ করতে পারবে','can_add'],['রিপোর্ট দেখতে পারবে','can_report'],['ছাড় দিতে পারবে','can_discount']].map(([l,k])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0' }}>
                  <span style={{ fontSize:'12px', color:'#3D4E63' }}>{l}</span>
                  <div onClick={()=>setStaffForm(f=>({...f,permissions:{...f.permissions,[k]:!f.permissions[k]}}))}
                    style={{ width:'40px', height:'22px', borderRadius:'11px', background:staffForm.permissions[k]?'#0F4C81':'#DDE4EE', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', width:'17px', height:'17px', background:'white', borderRadius:'50%', top:'2.5px', left:staffForm.permissions[k]?'20.5px':'2.5px', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setShowAddStaff(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={addStaff} disabled={staffSaving} className="btn btn-primary btn-full">{staffSaving?'⏳...':'✓ যোগ করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePass && (
        <div className="modal-overlay" onClick={()=>setShowChangePass(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <p style={{ margin:0, fontSize:'17px', fontWeight:'700' }}>🔑 পাসওয়ার্ড পরিবর্তন</p>
              <button onClick={()=>setShowChangePass(false)} style={{ background:'#F0F4F8', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            {[['বর্তমান পাসওয়ার্ড','current'],['নতুন পাসওয়ার্ড','newPass'],['নিশ্চিত করুন','confirm']].map(([l,k])=>(
              <div key={k} className="input-wrap">
                <label className="input-label">{l} <span style={{color:'#E63946'}}>*</span></label>
                <input className="input-field" type="password" placeholder="••••••••" value={passForm[k]} onChange={e=>setPassForm({...passForm,[k]:e.target.value})} />
              </div>
            ))}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setShowChangePass(false)} className="btn btn-ghost btn-full">বাতিল</button>
              <button onClick={changePassword} disabled={passSaving} className="btn btn-primary btn-full">{passSaving?'⏳...':'✓ পরিবর্তন করুন'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
