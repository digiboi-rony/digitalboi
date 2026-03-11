'use client';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore } from '../../lib/store';
import { timeAgo } from '../../lib/utils';

const typeStyle = {
  warning: { bg:'#FFF3E0', border:'rgba(244,162,97,0.3)', c:'#F4A261' },
  success: { bg:'#E6F9F2', border:'rgba(11,170,105,0.3)', c:'#0BAA69' },
  info:    { bg:'#EEF1FF', border:'rgba(67,97,238,0.3)',  c:'#4361EE' },
  danger:  { bg:'#FDECEA', border:'rgba(230,57,70,0.3)',  c:'#E63946' },
};

const typeIcon = { warning:'⚠️', success:'✅', info:'ℹ️', danger:'🚨' };

export default function NotificationsPage() {
  const { token } = useAuthStore();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadNotifs(); }, []);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
    } catch { setNotifs([]); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifs(n => n.map(x => ({ ...x, is_read: true })));
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
    } catch {}
  };

  const remove = async (id) => {
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifs(n => n.filter(x => x.id !== id));
    } catch {}
  };

  const clearRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifs(n => n.filter(x => !x.is_read));
    } catch {}
  };

  const unread = notifs.filter(n => !n.is_read).length;
  const filtered = notifs.filter(n => filter === 'all' || !n.is_read);

  return (
    <AppShell title="নোটিফিকেশন" activeTab="notifications">
      <div style={{ padding: '0 16px 90px' }}>

        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', background: '#F0F4F8', borderRadius: '12px', padding: '3px', gap: '3px' }}>
            {[['all', 'সব'], ['unread', `অপঠিত (${unread})`]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ padding: '7px 14px', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: filter === k ? 'white' : 'transparent', color: filter === k ? '#0F4C81' : '#5E6E8A', fontFamily: 'inherit', boxShadow: filter === k ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ padding: '7px 12px', background: '#EEF1FF', border: 'none', borderRadius: '10px', fontSize: '11px', color: '#0F4C81', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>
                ✓ সব পড়া
              </button>
            )}
            <button onClick={clearRead} style={{ padding: '7px 12px', background: '#FDECEA', border: 'none', borderRadius: '10px', fontSize: '11px', color: '#E63946', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>
              🗑️ পরিষ্কার
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="card skeleton" style={{ height: '80px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <span style={{ fontSize: '52px' }}>🔔</span>
            <p style={{ color: '#8A9AB5', fontWeight: '600', marginTop: '14px', fontSize: '14px' }}>
              {filter === 'unread' ? 'কোনো অপঠিত নোটিফিকেশন নেই' : 'কোনো নোটিফিকেশন নেই'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(n => {
              const st = typeStyle[n.type] || typeStyle.info;
              const icon = typeIcon[n.type] || '🔔';
              return (
                <div key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{ background: n.is_read ? 'white' : st.bg, border: `1px solid ${n.is_read ? '#F0F4F8' : st.border}`, borderRadius: '16px', padding: '14px 16px', position: 'relative', cursor: !n.is_read ? 'pointer' : 'default', transition: 'opacity 0.2s' }}>
                  {!n.is_read && (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', width: '8px', height: '8px', borderRadius: '50%', background: st.c }} />
                  )}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: n.is_read ? '#F0F4F8' : st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, marginLeft: !n.is_read ? '8px' : '0' }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: n.is_read ? '600' : '700', color: '#141D28', paddingRight: '8px' }}>
                          {n.title}
                        </p>
                        <button onClick={e => { e.stopPropagation(); remove(n.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#8A9AB5', flexShrink: 0, padding: '0', lineHeight: 1 }}>✕</button>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#5E6E8A', lineHeight: '1.5' }}>{n.message}</p>
                      <span style={{ fontSize: '10px', color: '#8A9AB5' }}>{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
