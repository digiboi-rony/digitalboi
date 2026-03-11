'use client';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import ImageUpload from '../../components/ui/ImageUpload';
import { useAuthStore, useNotifStore } from '../../lib/store';

export default function ProfilePage() {
  const { user, token, setAuth, shop } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [tab, setTab] = useState('info');
  const [saving, setSaving] = useState(false);

  const [info, setInfo] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    profilePhoto: user?.profile_photo || null,
  });

  const [pass, setPass] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const saveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: info.fullName, phone: info.phone, email: info.email, profilePhoto: info.profilePhoto }),
      });
      const data = await res.json();
      if (!res.ok) { addNotif(data.error || 'সমস্যা হয়েছে', 'error'); return; }
      setAuth({ ...user, ...data }, shop, token);
      addNotif('✅ প্রোফাইল আপডেট হয়েছে', 'success');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pass.current) { addNotif('বর্তমান পাসওয়ার্ড দিন', 'error'); return; }
    if (pass.newPass.length < 8) { addNotif('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর', 'error'); return; }
    if (pass.newPass !== pass.confirm) { addNotif('পাসওয়ার্ড মিলছে না', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pass.current, newPassword: pass.newPass }),
      });
      const data = await res.json();
      if (!res.ok) { addNotif(data.error, 'error'); return; }
      addNotif('✅ পাসওয়ার্ড পরিবর্তন হয়েছে', 'success');
      setPass({ current: '', newPass: '', confirm: '' });
    } finally { setSaving(false); }
  };

  const passStrength = (p) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = passStrength(pass.newPass);
  const strengthLabel = ['', 'দুর্বল', 'মাঝারি', 'ভালো', 'শক্তিশালী'][strength];
  const strengthColor = ['', '#E63946', '#F4A261', '#0BAA69', '#0BAA69'][strength];

  return (
    <AppShell title="আমার প্রোফাইল" activeTab="settings">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Profile Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <div style={{ width: 88, height: 88, borderRadius: 26, background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid white', boxShadow: '0 6px 24px rgba(15,76,129,0.25)' }}>
              {info.profilePhoto
                ? <img src={info.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 38, color: 'white' }}>👤</span>}
            </div>
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, background: '#0F4C81', borderRadius: '50%', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✏️</div>
          </div>
          <p style={{ margin: '0 0 3px', fontSize: 18, fontWeight: 800, color: '#141D28' }}>{user?.full_name}</p>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#8A9AB5' }}>{user?.phone}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {user?.nid_verified && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#E6F9F2', color: '#0BAA69' }}>✓ NID যাচাই</span>}
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#EEF1FF', color: '#4361EE' }}>
              {user?.role === 'super_admin' ? '👑 Super Admin' : user?.role === 'owner' ? '🏪 মালিক' : '👤 কর্মচারী'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#F0F4F8', borderRadius: 14, padding: 4, marginBottom: 16, gap: 4 }}>
          {[['info', '👤 তথ্য'], ['password', '🔑 পাসওয়ার্ড']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === k ? 'white' : 'transparent', color: tab === k ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit', boxShadow: tab === k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>{l}</button>
          ))}
        </div>

        {/* INFO TAB */}
        {tab === 'info' && (
          <div className="card">
            <ImageUpload label="প্রোফাইল ছবি" value={info.profilePhoto} onChange={v => setInfo({ ...info, profilePhoto: v })} hint="স্পষ্ট সেলফি বা পাসপোর্ট সাইজ ছবি" />

            {[
              { label: 'পূর্ণ নাম', key: 'fullName', placeholder: 'আপনার পূর্ণ নাম', type: 'text', required: true },
              { label: 'ফোন নম্বর', key: 'phone', placeholder: '+880 1X-XXXX-XXXX', type: 'tel' },
              { label: 'ইমেইল', key: 'email', placeholder: 'email@example.com', type: 'email' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {f.label} {f.required && <span style={{ color: '#E63946' }}>*</span>}
                </label>
                <input
                  type={f.type}
                  value={info[f.key]}
                  onChange={e => setInfo({ ...info, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#2E86DE'}
                  onBlur={e => e.target.style.borderColor = '#DDE4EE'}
                />
              </div>
            ))}

            {/* Read-only info */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#8A9AB5', textTransform: 'uppercase' }}>অ্যাকাউন্ট তথ্য</p>
              {[
                ['ভূমিকা', user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'owner' ? 'মালিক' : 'কর্মচারী'],
                ['সদস্য হয়েছেন', user?.created_at ? new Date(user.created_at).toLocaleDateString('bn-BD') : '—'],
                ['NID অবস্থা', user?.nid_verified ? '✓ যাচাই হয়েছে' : '⏳ যাচাই বাকি'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0F4F8' }}>
                  <span style={{ fontSize: 13, color: '#8A9AB5' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#141D28' }}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={saveInfo} disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#8A9AB5' : 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(15,76,129,0.3)' }}>
              {saving ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 পরিবর্তন সংরক্ষণ করুন'}
            </button>
          </div>
        )}

        {/* PASSWORD TAB */}
        {tab === 'password' && (
          <div className="card">
            <div style={{ background: '#EEF1FF', borderRadius: 12, padding: '12px 14px', marginBottom: 18, display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🔐</span>
              <p style={{ margin: 0, fontSize: 12, color: '#4361EE', lineHeight: 1.6 }}>শক্তিশালী পাসওয়ার্ড ব্যবহার করুন: বড় হাতের অক্ষর, সংখ্যা এবং বিশেষ চিহ্ন মিলিয়ে কমপক্ষে ৮ অক্ষর।</p>
            </div>

            {[
              { label: 'বর্তমান পাসওয়ার্ড', key: 'current', showKey: 'current' },
              { label: 'নতুন পাসওয়ার্ড', key: 'newPass', showKey: 'new' },
              { label: 'নতুন পাসওয়ার্ড নিশ্চিত করুন', key: 'confirm', showKey: 'confirm' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label} <span style={{ color: '#E63946' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass[f.showKey] ? 'text' : 'password'}
                    value={pass[f.key]}
                    onChange={e => setPass({ ...pass, [f.key]: e.target.value })}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '12px 44px 12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#2E86DE'}
                    onBlur={e => e.target.style.borderColor = '#DDE4EE'}
                  />
                  <button onClick={() => setShowPass(s => ({ ...s, [f.showKey]: !s[f.showKey] }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#8A9AB5' }}>
                    {showPass[f.showKey] ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>
            ))}

            {/* Strength indicator */}
            {pass.newPass.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= strength ? strengthColor : '#DDE4EE', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 11, color: strengthColor, fontWeight: 600 }}>পাসওয়ার্ড: {strengthLabel}</p>
              </div>
            )}

            {/* Checklist */}
            {pass.newPass && (
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                {[
                  ['কমপক্ষে ৮ অক্ষর', pass.newPass.length >= 8],
                  ['বড় হাতের অক্ষর আছে', /[A-Z]/.test(pass.newPass)],
                  ['সংখ্যা আছে', /[0-9]/.test(pass.newPass)],
                  ['পাসওয়ার্ড মিলেছে', pass.newPass === pass.confirm && pass.confirm.length > 0],
                ].map(([l, ok]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: ok ? '#0BAA69' : '#DDE4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {ok && <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, color: ok ? '#0BAA69' : '#8A9AB5', fontWeight: ok ? 600 : 400 }}>{l}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={changePassword} disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#8A9AB5' : 'linear-gradient(135deg,#E63946,#FF6B6B)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? '⏳ পরিবর্তন হচ্ছে...' : '🔑 পাসওয়ার্ড পরিবর্তন করুন'}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
