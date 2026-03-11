'use client';
import { useState } from 'react';
import { useAuthStore } from '../../lib/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { id:'dashboard', label:'হোম',     icon:'🏠', href:'/dashboard' },
  { id:'pos',       label:'বিক্রয়', icon:'🛒', href:'/pos' },
  { id:'inventory', label:'পণ্য',    icon:'📦', href:'/inventory' },
  { id:'customers', label:'গ্রাহক',  icon:'👥', href:'/customers' },
  { id:'more',      label:'আরো',     icon:'☰',  href:'#' },
];

const MORE_ITEMS = [
  { label:'বিক্রয় ইতিহাস', icon:'📋', href:'/sales',       color:'#4361EE' },
  { label:'স্টক সমন্বয়',  icon:'🔄', href:'/stock',       color:'#0BAA69' },
  { label:'সরবরাহকারী',    icon:'🏭', href:'/suppliers',   color:'#F4A261' },
  { label:'হিসাব',         icon:'💵', href:'/accounts',    color:'#0F4C81' },
  { label:'রিপোর্ট',      icon:'📊', href:'/reports',     color:'#8B5CF6' },
  { label:'ক্যাটাগরি',    icon:'🏷️', href:'/categories',  color:'#0BAA69' },
  { label:'অনলাইন শপ',   icon:'🌐', href:'/online-shop',  color:'#2E86DE' },
  { label:'পেমেন্ট',      icon:'💳', href:'/payments',    color:'#F4A261' },
  { label:'প্রোফাইল',     icon:'👤', href:'/profile',     color:'#5E6E8A' },
  { label:'নোটিফিকেশন',   icon:'🔔', href:'/notifications',color:'#E63946' },
  { label:'অ্যাডমিন',     icon:'🛡️', href:'/admin',       color:'#E63946', adminOnly:true },
  { label:'সেটিংস',       icon:'⚙️', href:'/settings',    color:'#5E6E8A' },
];

export default function AppShell({ children, title }) {
  const { user, shop, lang, setLang } = useAuthStore();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const activeTab = NAV.find(n => n.href !== '#' && pathname.startsWith(n.href))?.id || 'more';

  return (
    <div style={{ maxWidth:'480px', margin:'0 auto', height:'100vh', display:'flex', flexDirection:'column', background:'#F4F7FB', fontFamily:"'Hind Siliguri',sans-serif", position:'relative', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ background:'white', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #F0F4F8', boxShadow:'0 2px 10px rgba(15,40,80,0.06)', flexShrink:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:'800', fontSize:'16px' }}>D</span>
          </div>
          <div>
            <p style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#141D28', lineHeight:1.2 }}>{title}</p>
            <p style={{ margin:0, fontSize:'10px', color:'#8A9AB5' }}>{user?.role==='super_admin'?'👑 Super Admin':'🏪 '+(shop?.shop_name||'দোকান')}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <button onClick={()=>setLang(lang==='bn'?'en':'bn')} style={{ padding:'4px 10px', background:'#F0F4F8', border:'none', borderRadius:'20px', fontSize:'11px', fontWeight:'600', cursor:'pointer', color:'#5E6E8A', fontFamily:'inherit' }}>{lang==='bn'?'EN':'বাং'}</button>
          <Link href="/notifications">
            <button style={{ width:'34px', height:'34px', background:'#F0F4F8', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'16px', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
              🔔
              <span style={{ position:'absolute', top:'6px', right:'6px', width:'7px', height:'7px', background:'#E63946', borderRadius:'50%', border:'1.5px solid white' }} />
            </button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', paddingTop:'12px' }}>{children}</div>

      {/* Bottom Nav */}
      <div style={{ background:'white', borderTop:'1px solid #F0F4F8', display:'flex', boxShadow:'0 -4px 16px rgba(15,40,80,0.08)', flexShrink:0, paddingBottom:'env(safe-area-inset-bottom,0px)', zIndex:90 }}>
        {NAV.map(item => {
          const isActive = item.id === 'more' ? showMore || activeTab === 'more' : activeTab === item.id;
          return (
            <div key={item.id} onClick={item.href==='#'?()=>setShowMore(s=>!s):()=>setShowMore(false)} style={{ flex:1, textDecoration:'none' }}>
              {item.href !== '#' ? (
                <Link href={item.href} style={{ textDecoration:'none', display:'block' }}>
                  <NavItem item={item} isActive={isActive} />
                </Link>
              ) : (
                <NavItem item={item} isActive={isActive} />
              )}
            </div>
          );
        })}
      </div>

      {/* More Drawer Overlay */}
      {showMore && (
        <>
          <div onClick={()=>setShowMore(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:95, backdropFilter:'blur(2px)' }} />
          <div style={{ position:'fixed', bottom:'64px', left:'50%', transform:'translateX(-50%)', width:'calc(100% - 24px)', maxWidth:'456px', background:'white', borderRadius:'22px', boxShadow:'0 -8px 40px rgba(15,40,80,0.18)', padding:'16px', zIndex:96, maxHeight:'70vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
              <p style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#141D28' }}>সব ফিচার</p>
              <button onClick={()=>setShowMore(false)} style={{ background:'#F0F4F8', border:'none', borderRadius:'8px', width:'28px', height:'28px', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
              {MORE_ITEMS.filter(i=>!i.adminOnly||user?.role==='super_admin').map(i=>(
                <Link key={i.href} href={i.href} onClick={()=>setShowMore(false)} style={{ textDecoration:'none' }}>
                  <div style={{ background:'#F8FAFC', borderRadius:'14px', padding:'14px 8px', textAlign:'center', border:'1px solid #F0F4F8', transition:'all 0.15s' }}>
                    <span style={{ fontSize:'24px', display:'block' }}>{i.icon}</span>
                    <span style={{ fontSize:'10px', fontWeight:'600', color:'#3D4E63', display:'block', marginTop:'6px', lineHeight:'1.2' }}>{i.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ item, isActive }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'10px 4px 8px', cursor:'pointer', position:'relative' }}>
      {isActive && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'28px', height:'3px', background:'linear-gradient(90deg,#0F4C81,#2E86DE)', borderRadius:'0 0 3px 3px' }} />}
      <div style={{ width:'38px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'10px', background:isActive?'#EEF1FF':'transparent', transition:'background 0.15s' }}>
        <span style={{ fontSize:'20px' }}>{item.icon}</span>
      </div>
      <span style={{ fontSize:'10px', fontWeight:isActive?'700':'500', color:isActive?'#0F4C81':'#8A9AB5' }}>{item.label}</span>
    </div>
  );
}
