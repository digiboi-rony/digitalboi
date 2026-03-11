'use client';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../lib/store';
import { generateCode } from '../../lib/utils';

const PLATFORMS = ['Facebook Shop','Daraz','Shajgoj','Chaldal','Shohoz','Instagram','নিজস্ব ওয়েবসাইট','অন্যান্য'];

export default function VerifyBusinessPage() {
  const { shop, token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [step, setStep] = useState(1); // 1=copy-code, 2=submit, 3=done
  const [saving, setSaving] = useState(false);
  const [verifyCode] = useState(shop?.verification_code || generateCode('DIGIBOI-VRF'));
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    fbPageUrl: shop?.fb_page_url || '',
    platforms: shop?.online_platforms || [],
    proofPhoto: null,
  });

  const copyCode = () => {
    navigator.clipboard?.writeText(verifyCode).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    });
  };

  const submitVerification = async () => {
    if (!form.fbPageUrl) { addNotif('পেজের লিংক দিন', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/shop', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fb_page_url: form.fbPageUrl,
          online_platforms: form.platforms,
          online_proof_photo: form.proofPhoto,
          verification_code: verifyCode,
        }),
      });
      if (res.ok) {
        setStep(3);
        addNotif('✅ যাচাইয়ের আবেদন পাঠানো হয়েছে!', 'success');
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setSaving(false);
  };

  const handleProof = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f=>({...f, proofPhoto: reader.result}));
    reader.readAsDataURL(file);
  };

  // Already verified
  if (shop?.online_verified) return (
    <AppShell title="অনলাইন ব্যবসা যাচাই" activeTab="settings">
      <div style={{ padding:'40px 16px', textAlign:'center' }}>
        <div style={{ width:'90px', height:'90px', background:'#E6F9F2', borderRadius:'26px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'44px' }}>✅</div>
        <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#141D28', margin:'0 0 8px' }}>যাচাই সম্পন্ন!</h2>
        <p style={{ fontSize:'14px', color:'#5E6E8A', margin:'0 0 24px' }}>আপনার অনলাইন ব্যবসা সফলভাবে যাচাই হয়েছে। প্রোফাইলে "✓ Verified" ব্যাজ যোগ হয়েছে।</p>
        <div style={{ background:'#E6F9F2', borderRadius:'16px', padding:'16px', display:'inline-flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'24px' }}>🏅</span>
          <p style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#0BAA69' }}>✓ Verified Online Business</p>
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell title="অনলাইন ব্যবসা যাচাই" activeTab="settings">
      <div style={{ padding:'0 16px 90px' }}>

        {/* Steps indicator */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:'20px', gap:'0' }}>
          {['কোড কপি','ফর্ম পূরণ','সম্পন্ন'].map((s,i)=>(
            <div key={s} style={{ display:'flex', alignItems:'center', flex:1 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:0 }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:step>i?'#0F4C81':step===i+1?'#0F4C81':'#DDE4EE', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'13px', fontWeight:'700' }}>
                  {step>i+1?'✓':i+1}
                </div>
                <p style={{ margin:'4px 0 0', fontSize:'10px', color:step>=i+1?'#0F4C81':'#8A9AB5', fontWeight:step===i+1?'700':'400', whiteSpace:'nowrap' }}>{s}</p>
              </div>
              {i<2 && <div style={{ flex:1, height:'2px', background:step>i+1?'#0F4C81':'#DDE4EE', margin:'0 4px 20px' }} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Copy Code */}
        {step===1 && (
          <div>
            <div style={{ background:'#EEF1FF', borderRadius:'20px', padding:'20px', marginBottom:'16px' }}>
              <p style={{ margin:'0 0 6px', fontSize:'16px', fontWeight:'700', color:'#141D28' }}>🔑 ধাপ ১: Bio-তে কোড রাখুন</p>
              <p style={{ margin:'0 0 16px', fontSize:'13px', color:'#5E6E8A', lineHeight:'1.7' }}>
                নিচের কোডটি আপনার Facebook পেজ বা ওয়েবসাইটের <strong>Bio/About</strong> সেকশনে অবশ্যই রাখতে হবে। এটি দিয়ে আমরা যাচাই করব যে পেজটি আপনার।
              </p>
              <div style={{ background:'white', borderRadius:'14px', padding:'16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', border:'2px solid #DDE4EE' }}>
                <code style={{ fontSize:'14px', fontWeight:'700', color:'#0F4C81', wordBreak:'break-all' }}>{verifyCode}</code>
                <button onClick={copyCode} style={{ padding:'8px 16px', background:copied?'#0BAA69':'#0F4C81', color:'white', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', flexShrink:0, transition:'background 0.2s' }}>
                  {copied?'✓ কপি!':'📋 কপি'}
                </button>
              </div>
            </div>

            <div className="card" style={{ marginBottom:'16px' }}>
              <p style={{ margin:'0 0 12px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>📖 কিভাবে Bio-তে রাখবেন</p>
              {[
                { n:'1', t:'Facebook পেজ খুলুন', d:'পেজ Admin হিসেবে লগইন করুন' },
                { n:'2', t:'About বা Bio সেকশনে যান', d:'Edit → About/Story → এ কোড পেস্ট করুন' },
                { n:'3', t:'Save করুন', d:'Save বা Confirm চাপুন' },
                { n:'4', t:'Screenshot নিন', d:'পেজে কোড দেখা যাচ্ছে — স্ক্রিনশট নিন' },
              ].map(s=>(
                <div key={s.n} style={{ display:'flex', gap:'12px', padding:'10px 0', borderBottom:'1px solid #F0F4F8', alignItems:'flex-start' }}>
                  <div style={{ width:'26px', height:'26px', borderRadius:'8px', background:'#EEF1FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#0F4C81', flexShrink:0 }}>{s.n}</div>
                  <div>
                    <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:'600', color:'#141D28' }}>{s.t}</p>
                    <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5' }}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={()=>setStep(2)} className="btn btn-primary btn-full">পরের ধাপে যান →</button>
          </div>
        )}

        {/* STEP 2: Submit form */}
        {step===2 && (
          <div>
            <div className="card" style={{ marginBottom:'14px' }}>
              <p style={{ margin:'0 0 16px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>📝 ধাপ ২: যাচাইয়ের তথ্য দিন</p>

              <div className="input-wrap">
                <label className="input-label">পেজ/ওয়েবসাইটের লিংক <span style={{color:'#E63946'}}>*</span></label>
                <input className="input-field" placeholder="https://facebook.com/yourpage" value={form.fbPageUrl} onChange={e=>setForm(f=>({...f,fbPageUrl:e.target.value}))} />
              </div>

              <div style={{ marginBottom:'14px' }}>
                <label className="input-label">প্ল্যাটফর্ম বেছে নিন</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'8px' }}>
                  {PLATFORMS.map(p=>(
                    <button key={p} onClick={()=>setForm(f=>({...f, platforms: f.platforms.includes(p)?f.platforms.filter(x=>x!==p):[...f.platforms,p]}))}
                      style={{ padding:'6px 14px', border:`2px solid ${form.platforms.includes(p)?'#0F4C81':'#DDE4EE'}`, borderRadius:'20px', fontSize:'12px', fontWeight:'500', cursor:'pointer', background:form.platforms.includes(p)?'#EEF1FF':'white', color:form.platforms.includes(p)?'#0F4C81':'#5E6E8A', fontFamily:'inherit' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:'14px' }}>
                <label className="input-label">পেজের স্ক্রিনশট আপলোড করুন</label>
                <div onClick={()=>document.getElementById('proof-upload').click()} style={{ border:`2px dashed ${form.proofPhoto?'#0BAA69':'#B8C5D6'}`, borderRadius:'14px', padding:form.proofPhoto?'0':'20px', background:form.proofPhoto?'transparent':'#F8FAFC', cursor:'pointer', textAlign:'center', minHeight:'100px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', marginTop:'8px' }}>
                  {form.proofPhoto
                    ? <img src={form.proofPhoto} alt="" style={{ width:'100%', maxHeight:'160px', objectFit:'cover', borderRadius:'12px' }} />
                    : <div><div style={{ fontSize:'32px' }}>📸</div><p style={{ margin:'8px 0 0', fontSize:'13px', color:'#8A9AB5' }}>ক্লিক করে স্ক্রিনশট আপলোড করুন</p></div>}
                  {form.proofPhoto && <div style={{ position:'absolute', bottom:'8px', left:'8px', background:'#0BAA69', borderRadius:'20px', padding:'3px 10px' }}><span style={{ color:'white', fontSize:'10px', fontWeight:'700' }}>✓ আপলোড হয়েছে</span></div>}
                </div>
                <input id="proof-upload" type="file" accept="image/*" style={{ display:'none' }} onChange={handleProof} />
              </div>
            </div>

            <div style={{ background:'#FFF3E0', borderRadius:'14px', padding:'12px 14px', marginBottom:'14px', display:'flex', gap:'10px' }}>
              <span style={{ fontSize:'18px' }}>⏱️</span>
              <p style={{ margin:0, fontSize:'12px', color:'#5E6E8A', lineHeight:'1.6' }}>Admin সাধারণত ২৪-৭২ ঘন্টার মধ্যে যাচাই করে দেন। যাচাই হলে "✓ Verified" ব্যাজ পাবেন।</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>setStep(1)} className="btn btn-ghost btn-full">← পেছনে</button>
              <button onClick={submitVerification} disabled={saving} className="btn btn-primary btn-full">
                {saving?'⏳ পাঠানো হচ্ছে...':'📤 আবেদন পাঠান'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Done */}
        {step===3 && (
          <div style={{ textAlign:'center', padding:'30px 0' }}>
            <div style={{ width:'90px', height:'90px', background:'#E6F9F2', borderRadius:'26px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'44px' }}>🎉</div>
            <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#141D28', margin:'0 0 10px' }}>আবেদন সফলভাবে পাঠানো হয়েছে!</h2>
            <p style={{ fontSize:'13px', color:'#5E6E8A', margin:'0 0 24px', lineHeight:'1.7' }}>
              Admin ২৪-৭২ ঘন্টার মধ্যে আপনার অনলাইন পেজ পরীক্ষা করে যাচাই দেবেন।<br/>
              যাচাই হলে আপনি notification পাবেন।
            </p>
            <div style={{ background:'#EEF1FF', borderRadius:'14px', padding:'14px', textAlign:'left', marginBottom:'20px' }}>
              <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:'700', color:'#4361EE' }}>কোড মনে রাখুন:</p>
              <code style={{ fontSize:'13px', color:'#0F4C81', fontWeight:'700' }}>{verifyCode}</code>
              <p style={{ margin:'6px 0 0', fontSize:'11px', color:'#8A9AB5' }}>এই কোড Bio-তে রাখা থাকতে হবে যাচাই না হওয়া পর্যন্ত।</p>
            </div>
            <a href="/settings" className="btn btn-primary btn-full" style={{ display:'block', textDecoration:'none', textAlign:'center' }}>← সেটিংসে ফিরুন</a>
          </div>
        )}
      </div>
    </AppShell>
  );
}
