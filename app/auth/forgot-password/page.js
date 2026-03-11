'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=phone, 2=otp, 3=newpass
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestOTP = async () => {
    if (!phone) { setError('ফোন নম্বর দিন'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess('OTP পাঠানো হয়েছে!');
    setStep(2);
  };

  const resetPass = async () => {
    if (!otp) { setError('OTP দিন'); return; }
    if (newPass !== confirmPass) { setError('পাসওয়ার্ড মিলছে না'); return; }
    if (newPass.length < 8) { setError('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ phone, otp, newPassword: newPass }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setStep(3);
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0F4C81 0%,#2E86DE 55%,#60A5FA 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Hind Siliguri',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />

      <div style={{ textAlign:'center', marginBottom:'24px' }}>
        <div style={{ width:'70px', height:'70px', background:'white', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 8px 28px rgba(0,0,0,0.18)', fontSize:'32px' }}>
          {step===3?'✅':'🔑'}
        </div>
        <h1 style={{ color:'white', fontSize:'22px', fontWeight:'800', margin:0 }}>
          {step===1?'পাসওয়ার্ড ভুলে গেছেন?':step===2?'OTP যাচাই করুন':'সফল!'}
        </h1>
        <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'13px', marginTop:'6px' }}>
          {step===1?'ফোন নম্বর দিন — OTP পাঠানো হবে':step===2?`${phone} নম্বরে OTP পাঠানো হয়েছে`:'পাসওয়ার্ড পরিবর্তন সম্পন্ন হয়েছে!'}
        </p>
      </div>

      <div style={{ background:'white', borderRadius:'24px', padding:'24px', width:'100%', maxWidth:'400px', boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>

        {error && <div style={{ background:'#FDECEA', border:'1px solid #E63946', borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', fontSize:'13px', color:'#E63946' }}>⚠️ {error}</div>}
        {success && step===2 && <div style={{ background:'#E6F9F2', borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', fontSize:'13px', color:'#0BAA69' }}>✅ {success}</div>}

        {step===1 && <>
          <div className="input-wrap" style={{ marginBottom:'14px' }}>
            <label className="input-label">ফোন নম্বর <span style={{color:'#E63946'}}>*</span></label>
            <input className="input-field" placeholder="+880 1X-XXXX-XXXX" value={phone} onChange={e=>setPhone(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&requestOTP()} />
          </div>
          <button onClick={requestOTP} disabled={loading} className="btn btn-primary btn-full">
            {loading?'⏳ পাঠানো হচ্ছে...':'OTP পাঠান'}
          </button>
        </>}

        {step===2 && <>
          <div className="input-wrap" style={{ marginBottom:'14px' }}>
            <label className="input-label">৬ ডিজিটের OTP <span style={{color:'#E63946'}}>*</span></label>
            <input className="input-field" placeholder="XXXXXX" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} style={{ textAlign:'center', letterSpacing:'8px', fontSize:'20px', fontWeight:'700' }} />
          </div>
          <div className="input-wrap" style={{ marginBottom:'10px' }}>
            <label className="input-label">নতুন পাসওয়ার্ড <span style={{color:'#E63946'}}>*</span></label>
            <input className="input-field" type="password" placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" value={newPass} onChange={e=>setNewPass(e.target.value)} />
          </div>
          <div className="input-wrap" style={{ marginBottom:'16px' }}>
            <label className="input-label">পাসওয়ার্ড নিশ্চিত করুন</label>
            <input className="input-field" type="password" placeholder="আবার টাইপ করুন" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} />
          </div>
          <button onClick={resetPass} disabled={loading} className="btn btn-success btn-full">
            {loading?'⏳ হচ্ছে...':'✓ পাসওয়ার্ড পরিবর্তন করুন'}
          </button>
          <button onClick={requestOTP} style={{ width:'100%', padding:'10px', background:'none', border:'none', fontSize:'13px', color:'#2E86DE', cursor:'pointer', marginTop:'8px', fontFamily:'inherit' }}>
            🔄 নতুন OTP পাঠান
          </button>
        </>}

        {step===3 && (
          <div style={{ textAlign:'center', padding:'10px 0' }}>
            <p style={{ fontSize:'14px', color:'#5E6E8A', marginBottom:'20px' }}>এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।</p>
            <button onClick={()=>router.push('/auth/login')} className="btn btn-primary btn-full">লগইন পেজে যান</button>
          </div>
        )}

        {step!==3 && (
          <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'14px 0 0' }}>
            <div style={{ flex:1, height:'1px', background:'#DDE4EE' }} />
            <button onClick={()=>router.push('/auth/login')} style={{ fontSize:'12px', color:'#8A9AB5', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>লগইনে ফিরুন</button>
            <div style={{ flex:1, height:'1px', background:'#DDE4EE' }} />
          </div>
        )}
      </div>
    </div>
  );
}
