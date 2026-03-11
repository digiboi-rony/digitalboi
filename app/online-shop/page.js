'use client';
import { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import ImageUpload from '../../components/ui/ImageUpload';
import { useAuthStore, useNotifStore } from '../../lib/store';
import { generateCode } from '../../lib/utils';

const PLATFORMS = ['Facebook Shop', 'Daraz', 'Shajgoj', 'Chaldal', 'Shohoz', 'নিজস্ব ওয়েবসাইট', 'Instagram', 'অন্যান্য'];

export default function OnlineShopPage() {
  const { shop, token, setAuth, user } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('basic');

  const [form, setForm] = useState({
    shopName: shop?.shop_name || '',
    address: shop?.address || '',
    district: shop?.district || '',
    shopLogo: shop?.shop_logo || null,
    shopBanner: shop?.shop_banner || null,
    fbPageUrl: shop?.fb_page_url || '',
    onlinePlatforms: shop?.online_platforms || [],
    tradeLicense: shop?.trade_license || '',
    verifyCode: shop?.verification_code || generateCode(),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/shop', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { addNotif(data.error || 'সমস্যা হয়েছে', 'error'); return; }
      setAuth(user, { ...shop, ...data }, token);
      addNotif('✅ দোকানের তথ্য আপডেট হয়েছে', 'success');
    } finally { setSaving(false); }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(form.verifyCode).then(() => addNotif('✅ কোড কপি হয়েছে', 'success'));
  };

  const togglePlatform = (p) => {
    const list = form.onlinePlatforms;
    set('onlinePlatforms', list.includes(p) ? list.filter(x => x !== p) : [...list, p]);
  };

  const DISTRICTS = ['ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ', 'গাজীপুর', 'নারায়ণগঞ্জ', 'কুমিল্লা', 'ফেনী'];

  return (
    <AppShell title="দোকান সেটিংস" activeTab="settings">
      <div style={{ padding: '0 16px 100px' }}>

        {/* Shop status banner */}
        <div style={{ background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius: 20, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {form.shopLogo ? <img src={form.shopLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏪'}
          </div>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 800, color: 'white' }}>{form.shopName || 'আপনার দোকান'}</p>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{form.address || 'ঠিকানা যোগ করুন'}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: shop?.online_verified ? 'rgba(11,170,105,0.3)' : 'rgba(255,255,255,0.15)', color: 'white' }}>
                {shop?.online_verified ? '✓ অনলাইন যাচাই' : '⏳ যাচাই বাকি'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(240,165,0,0.4)', color: 'white' }}>
                ⭐ {shop?.subscription_plan || 'free'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
          {[['basic', '🏪 মূল তথ্য'], ['media', '🖼️ ছবি'], ['online', '🌐 অনলাইন']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 4px', border: `2px solid ${tab === k ? '#0F4C81' : '#DDE4EE'}`, borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tab === k ? '#EEF1FF' : 'white', color: tab === k ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>

        {/* BASIC INFO */}
        {tab === 'basic' && (
          <div className="card">
            {[
              { label: 'দোকানের নাম', key: 'shopName', placeholder: 'যেমন: রনি জেনারেল স্টোর', required: true },
              { label: 'ঠিকানা', key: 'address', placeholder: 'রাস্তা, এলাকা, উপজেলা' },
              { label: 'ট্রেড লাইসেন্স নম্বর', key: 'tradeLicense', placeholder: 'ট্রেড লাইসেন্স থাকলে লিখুন' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {f.label} {f.required && <span style={{ color: '#E63946' }}>*</span>}
                </label>
                <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#2E86DE'}
                  onBlur={e => e.target.style.borderColor = '#DDE4EE'} />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>জেলা</label>
              <select value={form.district} onChange={e => set('district', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                <option value="">জেলা বেছে নিন</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* MEDIA */}
        {tab === 'media' && (
          <div className="card">
            <ImageUpload label="দোকানের লোগো" value={form.shopLogo} onChange={v => set('shopLogo', v)} hint="স্কয়ার ছবি সবচেয়ে ভালো দেখায়" size="normal" />
            <ImageUpload label="ব্যানার ছবি" value={form.shopBanner} onChange={v => set('shopBanner', v)} hint="১৬:৯ অনুপাতের ছবি সবচেয়ে ভালো" size="large" />
          </div>
        )}

        {/* ONLINE */}
        {tab === 'online' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Verification code */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔑</div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#141D28' }}>যাচাই কোড</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#8A9AB5' }}>আপনার পেজের Bio-তে রাখুন</p>
                </div>
              </div>
              <div style={{ background: '#F0F4F8', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <code style={{ fontSize: 13, fontWeight: 800, color: '#0F4C81', letterSpacing: '1px' }}>{form.verifyCode}</code>
                <button onClick={copyCode} style={{ padding: '6px 14px', background: '#0F4C81', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📋 কপি</button>
              </div>
              {shop?.online_verified ? (
                <div style={{ background: '#E6F9F2', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0BAA69' }}>অনলাইন ব্যবসা যাচাই হয়েছে! "✓ Verified Business" ব্যাজ পেয়েছেন।</p>
                </div>
              ) : (
                <div style={{ background: '#FFF3E0', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#F4A261' }}>কীভাবে যাচাই করবেন:</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#5E6E8A', lineHeight: 1.7 }}>১. উপরের কোডটি কপি করুন<br/>২. আপনার Facebook পেজের About/Bio-তে পেস্ট করুন<br/>৩. নিচে পেজের লিংক ও স্ক্রিনশট দিন<br/>৪. Admin ২৪ ঘন্টার মধ্যে যাচাই করবে</p>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Facebook পেজ / ওয়েবসাইট</label>
                <input value={form.fbPageUrl} onChange={e => set('fbPageUrl', e.target.value)} placeholder="https://facebook.com/yourpage"
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <p style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>প্ল্যাটফর্ম</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => togglePlatform(p)}
                    style={{ padding: '7px 14px', border: `2px solid ${form.onlinePlatforms.includes(p) ? '#0F4C81' : '#DDE4EE'}`, borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: form.onlinePlatforms.includes(p) ? '#EEF1FF' : 'white', color: form.onlinePlatforms.includes(p) ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit' }}>
                    {form.onlinePlatforms.includes(p) ? '✓ ' : ''}{p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <div style={{ position: 'fixed', bottom: 72, left: 0, right: 0, padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
          <button onClick={save} disabled={saving}
            style={{ width: '100%', padding: 15, background: saving ? '#8A9AB5' : 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(15,76,129,0.35)' }}>
            {saving ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 পরিবর্তন সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
