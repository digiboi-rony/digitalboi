'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [loginType, setLoginType] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) { setError('সব তথ্য পূরণ করুন'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'লগইন ব্যর্থ হয়েছে'); return; }
      setAuth(data.user, data.shop, data.token);
      router.push('/dashboard');
    } catch {
      setError('সার্ভারে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0F4C81 0%,#2E86DE 55%,#60A5FA 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Hind Siliguri',sans-serif" }}>

      {/* Logo */}
      <div className="fade-in" style={{ textAlign:'center', marginBottom:'28px' }}>
        <div style={{ width:'80px', height:'80px', background:'white', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
          <span style={{ fontWeight:'800', fontSize:'38px', color:'#0F4C81', fontFamily:"'Syne',sans-serif" }}>D</span>
        </div>
        <h1 style={{ color:'white', fontSize:'30px', fontWeight:'800', margin:0, fontFamily:"'Syne',sans-serif", letterSpacing:'-0.5px' }}>Digiboi</h1>
        <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'13px', marginTop:'5px' }}>আপনার ব্যবসার ডিজিটাল সহকারী</p>
      </div>

      {/* Card */}
      <div className="fade-in" style={{ background:'white', borderRadius:'28px', padding:'28px 24px', width:'100%', maxWidth:'400px', boxShadow:'0 24px 60px rgba(0,0,0,0.22)', animationDelay:'0.1s' }}>

        {/* Toggle */}
        <div style={{ display:'flex', background:'#F0F4F8', borderRadius:'14px', padding:'5px', marginBottom:'22px' }}>
          {[['phone','📱 ফোন'],['email','✉️ ইমেইল']].map(([k,l]) => (
            <button key={k} onClick={() => setLoginType(k)} style={{ flex:1, padding:'10px', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer', background:loginType===k?'white':'transparent', color:loginType===k?'#0F4C81':'#5E6E8A', boxShadow:loginType===k?'0 2px 8px rgba(0,0,0,0.1)':'none', transition:'all 0.2s', fontFamily:'inherit' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Identifier */}
        <div className="input-wrap">
          <label className="input-label">{loginType==='phone'?'ফোন নম্বর':'ইমেইল'} <span style={{color:'#E63946'}}>*</span></label>
          <input className="input-field" placeholder={loginType==='phone'?'+880 1X-XXXX-XXXX':'email@example.com'} value={identifier} onChange={e=>setIdentifier(e.target.value)} />
        </div>

        {/* Password */}
        <div className="input-wrap">
          <label className="input-label">পাসওয়ার্ড <span style={{color:'#E63946'}}>*</span></label>
          <div style={{ position:'relative' }}>
            <input className="input-field" type={showPass?'text':'password'} placeholder="আপনার পাসওয়ার্ড" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()} style={{ paddingRight:'44px' }} />
            <button onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#8A9AB5', fontSize:'16px' }}>
              {showPass?'🙈':'👁️'}
            </button>
          </div>
        </div>

        <p style={{ textAlign:'right', fontSize:'13px', color:'#2E86DE', cursor:'pointer', marginBottom:'20px', fontWeight:'500' }}>পাসওয়ার্ড ভুলে গেছেন?</p>

        {error && (
          <div style={{ background:'#FDECEA', border:'1px solid #E63946', borderRadius:'10px', padding:'10px 14px', marginBottom:'16px', fontSize:'13px', color:'#E63946', fontWeight:'500' }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading} className="btn btn-primary btn-full">
          {loading ? <span className="spin" style={{width:'18px',height:'18px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block'}} /> : 'লগইন করুন →'}
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'18px 0' }}>
          <div style={{ flex:1, height:'1px', background:'#DDE4EE' }} />
          <span style={{ fontSize:'12px', color:'#8A9AB5' }}>অথবা</span>
          <div style={{ flex:1, height:'1px', background:'#DDE4EE' }} />
        </div>

        <Link href="/auth/register">
          <button className="btn btn-ghost btn-full">নতুন অ্যাকাউন্ট তৈরি করুন</button>
        </Link>
      </div>

      <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'11px', marginTop:'20px' }}>© 2025 Digiboi — MD. Rakibul Hasan Rony</p>
    </div>
  );
}
