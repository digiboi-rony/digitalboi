'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const STEPS = ['পরিচয়', 'মালিক', 'NID', 'দোকান', 'পাসওয়ার্ড'];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bizType, setBizType] = useState('physical');
  const [form, setForm] = useState({
    phone:'', email:'', password:'', confirmPass:'',
    ownerName:'', nidNumber:'',
    ownerPhoto:null, nidFront:null, nidBack:null,
    shopName:'', shopAddress:'', shopPhoto:null, tradeLicense:'',
    fbPageUrl:'', onlinePlatforms:[], onlineProof:null,
  });

  const set = (k, v) => setForm(f => ({...f, [k]:v}));
  const progress = (step / STEPS.length) * 100;
  const PLATFORMS = ['Facebook Shop','Daraz','Shajgoj','Chaldal','Shohoz','নিজস্ব ওয়েবসাইট','অন্যান্য'];

  const handlePhoto = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(key, reader.result);
    reader.readAsDataURL(file);
  };

  const PhotoBox = ({ label, photoKey, hint }) => {
    const ref = useRef();
    return (
      <div style={{ marginBottom:'14px' }}>
        <p style={{ fontSize:'12px', fontWeight:'600', color:'#5E6E8A', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label} <span style={{color:'#E63946'}}>*</span></p>
        <div onClick={()=>ref.current.click()} style={{ border:`2px dashed ${form[photoKey]?'#0BAA69':'#B8C5D6'}`, borderRadius:'14px', padding: form[photoKey]?'0':'20px', background:form[photoKey]?'transparent':'#F8FAFC', cursor:'pointer', textAlign:'center', minHeight:'90px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
          {form[photoKey] ? (
            <>
              <img src={form[photoKey]} alt="" style={{ width:'100%', maxHeight:'120px', objectFit:'cover', borderRadius:'12px', display:'block' }} />
              <div style={{ position:'absolute', bottom:'8px', left:'8px', background:'#0BAA69', borderRadius:'20px', padding:'3px 10px' }}>
                <span style={{ color:'white', fontSize:'10px', fontWeight:'700' }}>✓ আপলোড হয়েছে</span>
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontSize:'32px', marginBottom:'8px' }}>📷</div>
              <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'#5E6E8A' }}>ছবি আপলোড করুন</p>
              {hint && <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#8A9AB5' }}>{hint}</p>}
            </div>
          )}
        </div>
        <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handlePhoto(photoKey,e)} />
      </div>
    );
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPass) { setError('পাসওয়ার্ড মিলছে না'); return; }
    if (form.password.length < 8) { setError('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, businessType: bizType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'সমস্যা হয়েছে'); return; }
      setAuth(data.user, data.shop, data.token);
      router.push('/dashboard');
    } catch { setError('সার্ভারে সমস্যা হয়েছে'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F4F7FB', fontFamily:"'Hind Siliguri',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0F4C81,#2E86DE)', padding:'16px 20px 32px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
          <div style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.2)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:'800', fontSize:'18px' }}>D</span>
          </div>
          <div>
            <p style={{ margin:0, color:'white', fontWeight:'700', fontSize:'16px' }}>Digiboi</p>
            <p style={{ margin:0, color:'rgba(255,255,255,0.7)', fontSize:'11px' }}>নতুন অ্যাকাউন্ট তৈরি করুন</p>
          </div>
        </div>
        {/* Progress */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.8)' }}>ধাপ {step}/{STEPS.length}: {STEPS[step-1]}</span>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.8)' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height:'6px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:'white', borderRadius:'10px', transition:'width 0.4s ease' }} />
        </div>
      </div>

      {/* Form Card */}
      <div style={{ margin:'-20px 16px 0', background:'white', borderRadius:'20px', boxShadow:'0 4px 24px rgba(15,40,80,0.1)', padding:'20px', marginBottom:'20px' }}>

        {error && <div style={{ background:'#FDECEA', border:'1px solid #E63946', borderRadius:'10px', padding:'10px 14px', marginBottom:'16px', fontSize:'13px', color:'#E63946' }}>⚠️ {error}</div>}

        {/* STEP 1 */}
        {step===1 && (
          <div>
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#5E6E8A', margin:'0 0 14px', textTransform:'uppercase' }}>ব্যবসার ধরন বেছে নিন</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'20px' }}>
              {[['physical','🏪','ফিজিক্যাল'],['online','🌐','অনলাইন'],['both','🔄','উভয়']].map(([k,e,l])=>(
                <div key={k} onClick={()=>setBizType(k)} style={{ border:`2px solid ${bizType===k?'#0F4C81':'#DDE4EE'}`, borderRadius:'14px', padding:'14px 8px', textAlign:'center', cursor:'pointer', background:bizType===k?'#EEF1FF':'white' }}>
                  <span style={{ fontSize:'24px' }}>{e}</span>
                  <p style={{ margin:'6px 0 0', fontSize:'11px', fontWeight:'600', color:bizType===k?'#0F4C81':'#5E6E8A' }}>{l}</p>
                </div>
              ))}
            </div>
            <div className="input-wrap">
              <label className="input-label">ফোন নম্বর <span style={{color:'#E63946'}}>*</span></label>
              <input className="input-field" placeholder="+880 1X-XXXX-XXXX" value={form.phone} onChange={e=>set('phone',e.target.value)} />
            </div>
            <div className="input-wrap">
              <label className="input-label">ইমেইল</label>
              <input className="input-field" placeholder="email@example.com" value={form.email} onChange={e=>set('email',e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <div>
            <PhotoBox label="মালিকের ছবি" photoKey="ownerPhoto" hint="স্পষ্ট সেলফি বা পাসপোর্ট সাইজ ছবি" />
            <div className="input-wrap">
              <label className="input-label">মালিকের পূর্ণ নাম <span style={{color:'#E63946'}}>*</span></label>
              <input className="input-field" placeholder="যেমন: মোঃ রাকিবুল হাসান" value={form.ownerName} onChange={e=>set('ownerName',e.target.value)} />
            </div>
            <div className="input-wrap">
              <label className="input-label">NID / জন্ম সনদ নম্বর <span style={{color:'#E63946'}}>*</span></label>
              <input className="input-field" placeholder="১০ বা ১৭ ডিজিটের নম্বর" value={form.nidNumber} onChange={e=>set('nidNumber',e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step===3 && (
          <div>
            <div style={{ background:'#FFF8E7', borderRadius:'14px', padding:'12px 14px', marginBottom:'16px', display:'flex', gap:'10px' }}>
              <span style={{ fontSize:'18px' }}>ℹ️</span>
              <p style={{ margin:0, fontSize:'12px', color:'#5E6E8A', lineHeight:'1.6' }}>NID-এর সামনে ও পেছনের ছবি আলাদা আলাদা দিন। Admin ৭২ ঘন্টার মধ্যে যাচাই করবে।</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <PhotoBox label="NID সামনে" photoKey="nidFront" />
              <PhotoBox label="NID পেছনে" photoKey="nidBack" />
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step===4 && (
          <div>
            {(bizType==='physical'||bizType==='both') && <>
              <PhotoBox label="দোকানের ছবি" photoKey="shopPhoto" hint="দোকানের বাইরে বা ভেতরের ছবি" />
              <div className="input-wrap">
                <label className="input-label">দোকানের নাম <span style={{color:'#E63946'}}>*</span></label>
                <input className="input-field" placeholder="যেমন: রনি জেনারেল স্টোর" value={form.shopName} onChange={e=>set('shopName',e.target.value)} />
              </div>
              <div className="input-wrap">
                <label className="input-label">ঠিকানা</label>
                <input className="input-field" placeholder="এলাকা, উপজেলা, জেলা" value={form.shopAddress} onChange={e=>set('shopAddress',e.target.value)} />
              </div>
            </>}
            {(bizType==='online'||bizType==='both') && <>
              {bizType==='both'&&<div style={{ height:'1px', background:'#DDE4EE', margin:'10px 0 16px' }} />}
              <div style={{ background:'#EEF1FF', borderRadius:'12px', padding:'12px', marginBottom:'14px' }}>
                <p style={{ margin:'0 0 6px', fontSize:'13px', fontWeight:'700', color:'#4361EE' }}>🔍 অনলাইন ব্যবসা যাচাই</p>
                <p style={{ margin:'0 0 10px', fontSize:'12px', color:'#5E6E8A', lineHeight:'1.6' }}>এই কোডটি আপনার পেজের Bio-তে রাখুন, Admin যাচাই করবে:</p>
                <div style={{ background:'white', borderRadius:'8px', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <code style={{ fontSize:'13px', fontWeight:'700', color:'#0F4C81' }}>DIGIBOI-VRF-{Math.random().toString(36).slice(2,8).toUpperCase()}</code>
                  <button style={{ background:'#0F4C81', color:'white', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', cursor:'pointer', fontFamily:'inherit' }}>কপি</button>
                </div>
              </div>
              <p style={{ fontSize:'12px', fontWeight:'600', color:'#5E6E8A', margin:'0 0 10px' }}>প্ল্যাটফর্ম বেছে নিন:</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'14px' }}>
                {PLATFORMS.map(p=>(
                  <button key={p} onClick={()=>set('onlinePlatforms', form.onlinePlatforms.includes(p)?form.onlinePlatforms.filter(x=>x!==p):[...form.onlinePlatforms,p])}
                    style={{ padding:'6px 14px', border:`2px solid ${form.onlinePlatforms.includes(p)?'#0F4C81':'#DDE4EE'}`, borderRadius:'20px', fontSize:'12px', fontWeight:'500', cursor:'pointer', background:form.onlinePlatforms.includes(p)?'#EEF1FF':'white', color:form.onlinePlatforms.includes(p)?'#0F4C81':'#5E6E8A', fontFamily:'inherit' }}>{p}</button>
                ))}
              </div>
              <div className="input-wrap">
                <label className="input-label">Facebook পেজ / ওয়েবসাইট</label>
                <input className="input-field" placeholder="https://facebook.com/yourpage" value={form.fbPageUrl} onChange={e=>set('fbPageUrl',e.target.value)} />
              </div>
              <PhotoBox label="পেজের স্ক্রিনশট" photoKey="onlineProof" hint="Facebook বা ওয়েবসাইটের স্ক্রিনশট" />
            </>}
          </div>
        )}

        {/* STEP 5 */}
        {step===5 && (
          <div>
            <div style={{ background:'#E6F9F2', borderRadius:'16px', padding:'16px', marginBottom:'18px', textAlign:'center' }}>
              <span style={{ fontSize:'36px' }}>🎉</span>
              <p style={{ margin:'8px 0 4px', fontSize:'16px', fontWeight:'700', color:'#141D28' }}>প্রায় শেষ!</p>
              <p style={{ margin:0, fontSize:'13px', color:'#5E6E8A' }}>পাসওয়ার্ড সেট করুন</p>
            </div>
            {[['পাসওয়ার্ড','password'],['পাসওয়ার্ড নিশ্চিত করুন','confirmPass']].map(([l,k])=>(
              <div key={k} className="input-wrap">
                <label className="input-label">{l} <span style={{color:'#E63946'}}>*</span></label>
                <input className="input-field" type="password" placeholder="••••••••" value={form[k]} onChange={e=>set(k,e.target.value)} />
              </div>
            ))}
            {form.password && (
              <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
                {[
                  ['কমপক্ষে ৮ অক্ষর', form.password.length>=8],
                  ['পাসওয়ার্ড মিলেছে', form.password===form.confirmPass&&form.confirmPass.length>0],
                ].map(([l,ok])=>(
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0' }}>
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:ok?'#0BAA69':'#DDE4EE', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {ok&&<span style={{ color:'white', fontSize:'10px' }}>✓</span>}
                    </div>
                    <span style={{ fontSize:'12px', color:ok?'#0BAA69':'#8A9AB5', fontWeight:ok?'600':'400' }}>{l}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
          {step>1 && <button onClick={()=>setStep(s=>s-1)} style={{ padding:'12px 20px', background:'#F0F4F8', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'600', color:'#5E6E8A', cursor:'pointer', fontFamily:'inherit' }}>← পেছনে</button>}
          {step<STEPS.length
            ? <button onClick={()=>setStep(s=>s+1)} className="btn btn-primary" style={{ flex:1, padding:'14px' }}>পরবর্তী ধাপ →</button>
            : <button onClick={handleSubmit} disabled={loading} className="btn btn-success" style={{ flex:1, padding:'14px', fontSize:'15px' }}>
                {loading?'⏳ হচ্ছে...':'✓ নিবন্ধন সম্পন্ন করুন'}
              </button>}
        </div>
        <p style={{ textAlign:'center', marginTop:'12px', fontSize:'13px', color:'#8A9AB5' }}>
          ইতিমধ্যে অ্যাকাউন্ট আছে? <a href="/auth/login" style={{ color:'#0F4C81', fontWeight:'600', textDecoration:'none' }}>লগইন করুন</a>
        </p>
      </div>
    </div>
  );
}
