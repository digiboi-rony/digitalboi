'use client';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }) {
  useEffect(() => { console.error('App error:', error); }, [error]);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Hind Siliguri',sans-serif", background:'#F4F7FB' }}>
      <div style={{ background:'white', borderRadius:'24px', padding:'32px 24px', maxWidth:'380px', width:'100%', textAlign:'center', boxShadow:'0 10px 40px rgba(15,40,80,0.12)' }}>
        <span style={{ fontSize:'56px', display:'block', marginBottom:'16px' }}>😕</span>
        <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#141D28', margin:'0 0 10px' }}>কিছু একটা সমস্যা হয়েছে</h2>
        <p style={{ fontSize:'13px', color:'#8A9AB5', margin:'0 0 24px', lineHeight:'1.6' }}>
          একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। পেজটি রিলোড করুন অথবা হোমে ফিরে যান।
        </p>
        {error?.message && (
          <div style={{ background:'#F0F4F8', borderRadius:'10px', padding:'10px 14px', marginBottom:'20px', textAlign:'left' }}>
            <code style={{ fontSize:'11px', color:'#5E6E8A', wordBreak:'break-all' }}>{error.message}</code>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <button onClick={reset} style={{ padding:'12px', background:'#EEF1FF', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:'600', color:'#0F4C81', cursor:'pointer', fontFamily:'inherit' }}>
            🔄 আবার চেষ্টা
          </button>
          <a href="/dashboard" style={{ padding:'12px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:'600', color:'white', cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
            🏠 হোম
          </a>
        </div>
      </div>
    </div>
  );
}
