'use client';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../lib/store';
import { timeAgo } from '../../lib/utils';

export default function AdminPage() {
  const { user, token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [tab, setTab] = useState('users');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [sysStats, setSysStats] = useState({ totalUsers: 0, activeToday: 0, pendingNID: 0, pendingOnline: 0 });
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) {
        setShops(data);
        setSysStats({
          totalUsers: data.length,
          activeToday: data.filter(s => s.users?.is_active).length,
          pendingNID: data.filter(s => !s.users?.nid_verified).length,
          pendingOnline: data.filter(s => s.online_verification_status === 'pending').length,
        });
      }
    } catch {}
    finally { setLoading(false); }
  };

  const doAction = async (type, targetId, action) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, targetId, action }),
      });
      if (res.ok) {
        const label = type === 'nid' ? 'NID' : type === 'online' ? 'অনলাইন' : 'ব্লক';
        addNotif(`✅ ${label} ${action === 'approve' ? 'অনুমোদিত' : action === 'reject' ? 'বাতিল' : action === 'block' ? 'ব্লক' : 'আনব্লক'} করা হয়েছে!`, 'success');
        loadData();
        setSelected(null);
      }
    } catch { addNotif('সমস্যা হয়েছে', 'error'); }
    setSaving(false);
  };

  if (user?.role !== 'super_admin') {
    return (
      <AppShell title="অ্যাডমিন" activeTab="admin">
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: '52px' }}>🔒</span>
          <p style={{ color: '#E63946', fontWeight: '700', fontSize: '16px', marginTop: '14px' }}>শুধুমাত্র Super Admin এর অ্যাক্সেস আছে</p>
        </div>
      </AppShell>
    );
  }

  const filtered = shops.filter(s =>
    !search ||
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.users?.phone?.includes(search)
  );

  const planColor = { premium: '#F0A500', basic: '#0F4C81', free: '#5E6E8A' };
  const planBg = { premium: '#FFF8E7', basic: '#EEF1FF', free: '#F0F4F8' };

  return (
    <AppShell title="সুপার অ্যাডমিন" activeTab="admin">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Admin Hero */}
        <div style={{ background: 'linear-gradient(135deg,#0F2D50,#0F4C81)', borderRadius: '22px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: '#F0A500', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛡️</div>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'white' }}>Super Admin</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{user?.full_name}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {[
              [sysStats.totalUsers, 'মোট শপ', '🏪'],
              [sysStats.activeToday, 'সক্রিয়', '🟢'],
              [sysStats.pendingNID, 'NID বাকি', '🪪'],
              [sysStats.pendingOnline, 'অনলাইন বাকি', '🌐'],
            ].map(([v, l, i]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 6px', textAlign: 'center' }}>
                <span style={{ fontSize: '16px' }}>{i}</span>
                <p style={{ margin: '4px 0 2px', fontSize: '18px', fontWeight: '800', color: 'white' }}>{loading ? '—' : v}</p>
                <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#F0F4F8', borderRadius: '14px', padding: '4px', marginBottom: '14px', gap: '4px' }}>
          {[['users', '🏪 শপ তালিকা'], ['verify', '🔍 যাচাই বাকি'], ['announce', '📢 ঘোষণা']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '9px 4px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: tab === k ? 'white' : 'transparent', color: tab === k ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit', boxShadow: tab === k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>{l}</button>
          ))}
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          <>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#8A9AB5' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম, ফোন বা শপ দিয়ে খুঁজুন..."
                style={{ width: '100%', padding: '11px 14px 11px 40px', border: '2px solid #DDE4EE', borderRadius: '13px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#2E86DE'} onBlur={e => e.target.style.borderColor = '#DDE4EE'} />
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: '90px' }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8A9AB5' }}>
                <span style={{ fontSize: '40px' }}>🏪</span>
                <p style={{ marginTop: '12px' }}>কোনো শপ পাওয়া যায়নি</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map(s => (
                  <div key={s.id} onClick={() => setSelected(s)} className="card" style={{ padding: '14px 16px', cursor: 'pointer', borderLeft: `4px solid ${s.users?.is_active !== false ? '#0BAA69' : '#E63946'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#141D28' }}>{s.shop_name}</p>
                          {s.users?.nid_verified && <span style={{ fontSize: '12px' }}>🪪</span>}
                          {s.online_verified && <span style={{ fontSize: '12px' }}>🌐</span>}
                        </div>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#8A9AB5' }}>👤 {s.users?.full_name} · 📱 {s.users?.phone}</p>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <span className="pill" style={{ background: planBg[s.subscription_plan] || '#F0F4F8', color: planColor[s.subscription_plan] || '#5E6E8A' }}>
                            {s.subscription_plan === 'premium' ? '⭐' : '🆓'} {s.subscription_plan || 'free'}
                          </span>
                          <span className="pill" style={{ background: s.business_type === 'online' ? '#EEF1FF' : s.business_type === 'both' ? '#FFF3E0' : '#E6F9F2', color: '#5E6E8A' }}>
                            {s.business_type === 'online' ? '🌐 অনলাইন' : s.business_type === 'both' ? '🏪🌐 উভয়' : '🏪 ফিজিক্যাল'}
                          </span>
                          {s.users?.is_active === false && <span className="pill" style={{ background: '#FDECEA', color: '#E63946' }}>🚫 ব্লক</span>}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#8A9AB5' }}>{timeAgo(s.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* VERIFY TAB */}
        {tab === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Pending NID */}
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#5E6E8A' }}>🪪 NID যাচাই বাকি</p>
            {loading ? <div className="card skeleton" style={{ height: '80px' }} /> :
              shops.filter(s => !s.users?.nid_verified).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', background: '#E6F9F2', borderRadius: '14px' }}>
                  <p style={{ margin: 0, color: '#0BAA69', fontWeight: '600', fontSize: '13px' }}>✅ সব NID যাচাই সম্পন্ন</p>
                </div>
              ) : shops.filter(s => !s.users?.nid_verified).map(s => (
                <div key={s.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#141D28' }}>{s.users?.full_name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#8A9AB5' }}>{s.shop_name} · {s.users?.phone}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => doAction('nid', s.owner_id, 'approve')} disabled={saving}
                        style={{ padding: '7px 12px', background: '#0BAA69', border: 'none', borderRadius: '8px', fontSize: '11px', color: 'white', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>✓ অনুমোদন</button>
                      <button onClick={() => doAction('nid', s.owner_id, 'reject')} disabled={saving}
                        style={{ padding: '7px 12px', background: '#FDECEA', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#E63946', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>✕</button>
                    </div>
                  </div>
                </div>
              ))
            }

            {/* Pending Online */}
            <p style={{ margin: '8px 0 8px', fontSize: '13px', fontWeight: '700', color: '#5E6E8A' }}>🌐 অনলাইন যাচাই বাকি</p>
            {loading ? <div className="card skeleton" style={{ height: '80px' }} /> :
              shops.filter(s => s.online_verification_status === 'pending').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', background: '#E6F9F2', borderRadius: '14px' }}>
                  <p style={{ margin: 0, color: '#0BAA69', fontWeight: '600', fontSize: '13px' }}>✅ সব অনলাইন যাচাই সম্পন্ন</p>
                </div>
              ) : shops.filter(s => s.online_verification_status === 'pending').map(s => (
                <div key={s.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#141D28' }}>{s.shop_name}</p>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#8A9AB5' }}>{s.users?.full_name} · {s.fb_page_url || '—'}</p>
                    {s.verification_code && (
                      <p style={{ margin: 0, fontSize: '11px' }}>কোড: <code style={{ background: '#F0F4F8', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{s.verification_code}</code></p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {s.fb_page_url && (
                      <a href={s.fb_page_url} target="_blank" rel="noreferrer"
                        style={{ flex: 1, padding: '8px', background: '#EEF1FF', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#0F4C81', cursor: 'pointer', fontWeight: '600', textDecoration: 'none', textAlign: 'center' }}>
                        🔗 পেজ দেখুন
                      </a>
                    )}
                    <button onClick={() => doAction('online', s.id, 'approve')} disabled={saving}
                      style={{ flex: 1, padding: '8px', background: '#0BAA69', border: 'none', borderRadius: '8px', fontSize: '11px', color: 'white', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>✓ অনুমোদন</button>
                    <button onClick={() => doAction('online', s.id, 'reject')} disabled={saving}
                      style={{ flex: 1, padding: '8px', background: '#FDECEA', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#E63946', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>✕ বাতিল</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ANNOUNCE TAB */}
        {tab === 'announce' && (
          <div>
            <div className="card" style={{ marginBottom: '14px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>📢 সব ব্যবহারকারীকে বার্তা পাঠান</p>
              <div className="input-wrap">
                <label className="input-label">বার্তা লিখুন</label>
                <textarea className="input-field" rows={4} placeholder="সব দোকানদারকে এই বার্তাটি নোটিফিকেশন হিসেবে পাঠানো হবে..."
                  value={announcement} onChange={e => setAnnouncement(e.target.value)}
                  style={{ resize: 'none', lineHeight: '1.6' }} />
              </div>
              <button onClick={() => { if (announcement.trim()) { addNotif('✅ ঘোষণা পাঠানো হয়েছে!', 'success'); setAnnouncement(''); } }}
                disabled={!announcement.trim()}
                className="btn btn-primary btn-full">📤 পাঠান ({shops.length} জনকে)</button>
            </div>

            <div className="card">
              <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: '#141D28' }}>📊 সিস্টেম তথ্য</p>
              {[
                ['🏪 মোট শপ', shops.length],
                ['✅ সক্রিয় শপ', shops.filter(s => s.users?.is_active !== false).length],
                ['🚫 ব্লক করা', shops.filter(s => s.users?.is_active === false).length],
                ['🌐 অনলাইন শপ', shops.filter(s => ['online', 'both'].includes(s.business_type)).length],
                ['⭐ Premium', shops.filter(s => s.subscription_plan === 'premium').length],
                ['🆓 Free', shops.filter(s => s.subscription_plan === 'free' || !s.subscription_plan).length],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F0F4F8' }}>
                  <span style={{ fontSize: '13px', color: '#5E6E8A' }}>{l}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#141D28' }}>{loading ? '—' : v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>🏪 {selected.shop_name}</p>
              <button onClick={() => setSelected(null)} style={{ background: '#F0F4F8', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            {[
              ['মালিক', selected.users?.full_name],
              ['ফোন', selected.users?.phone],
              ['ব্যবসার ধরন', selected.business_type],
              ['জেলা', selected.district || '—'],
              ['প্ল্যান', selected.subscription_plan || 'free'],
              ['যোগদান', timeAgo(selected.created_at)],
              ['NID যাচাই', selected.users?.nid_verified ? '✅ হয়েছে' : '⏳ বাকি'],
              ['অনলাইন যাচাই', selected.online_verified ? '✅ হয়েছে' : selected.online_verification_status === 'pending' ? '⏳ পেন্ডিং' : '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F0F4F8' }}>
                <span style={{ fontSize: '12px', color: '#8A9AB5' }}>{l}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#141D28' }}>{v}</span>
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
              {!selected.users?.nid_verified && (
                <button onClick={() => doAction('nid', selected.owner_id, 'approve')} className="btn btn-success btn-full" style={{ fontSize: '12px' }}>🪪 NID অনুমোদন</button>
              )}
              {selected.online_verification_status === 'pending' && !selected.online_verified && (
                <button onClick={() => doAction('online', selected.id, 'approve')} className="btn btn-primary btn-full" style={{ fontSize: '12px' }}>🌐 অনলাইন অনুমোদন</button>
              )}
              <button onClick={() => doAction('block', selected.owner_id, selected.users?.is_active === false ? 'unblock' : 'block')}
                className={`btn btn-full ${selected.users?.is_active === false ? 'btn-success' : 'btn-danger'}`} style={{ fontSize: '12px' }}>
                {selected.users?.is_active === false ? '✅ আনব্লক' : '🚫 ব্লক'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
