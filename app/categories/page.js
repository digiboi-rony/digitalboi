'use client';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore, useNotifStore } from '../../lib/store';

const ICONS = ['📦','🍚','🛒','🧴','🫙','🥛','🥩','🍞','🧹','💊','📱','👕','🏠','⚡','🚗','🎮','📚','🔧','💐','🍎'];
const COLORS = ['#0F4C81','#0BAA69','#E63946','#F4A261','#8B5CF6','#4361EE','#F0A500','#06B6D4','#EC4899','#84CC16'];

export default function CategoriesPage() {
  const { token } = useAuthStore();
  const { addNotif } = useNotifStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '📦', color: '#0F4C81' });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const addCategory = async () => {
    if (!form.name) { addNotif('নাম দিন', 'error'); return; }
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      addNotif('✅ ক্যাটাগরি যোগ হয়েছে', 'success');
      setShowAdd(false);
      setForm({ name: '', icon: '📦', color: '#0F4C81' });
      loadCategories();
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('এই ক্যাটাগরি মুছবেন?')) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { addNotif('✅ মুছে ফেলা হয়েছে', 'success'); loadCategories(); }
  };

  return (
    <AppShell title="পণ্য ক্যাটাগরি" activeTab="inventory">
      <div style={{ padding: '0 16px 90px' }}>

        <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit' }}>
          ➕ নতুন ক্যাটাগরি যোগ করুন
        </button>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />)}
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span style={{ fontSize: 48 }}>🏷️</span>
            <p style={{ color: '#8A9AB5', fontWeight: 600, marginTop: 12 }}>কোনো ক্যাটাগরি নেই</p>
            <p style={{ color: '#B8C5D6', fontSize: 13 }}>প্রথম ক্যাটাগরি যোগ করুন</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categories.map(c => (
              <div key={c.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: c.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `2px solid ${c.color}30` }}>
                    {c.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#141D28' }}>{c.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#8A9AB5' }}>
                      {c.products?.[0]?.count || 0} টি পণ্য
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.color }} />
                  <button onClick={() => deleteCategory(c.id)} style={{ width: 32, height: 32, borderRadius: 8, background: '#FDECEA', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.72)', zIndex: 900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '22px 20px 28px', width: '100%', maxWidth: 480, animation: 'slideUp 0.3s', fontFamily: "'Hind Siliguri', sans-serif" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>🏷️ নতুন ক্যাটাগরি</p>
              <button onClick={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 8, background: '#F0F4F8', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>নাম <span style={{ color: '#E63946' }}>*</span></label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="যেমন: খাদ্যদ্রব্য"
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>আইকন</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ICONS.map(i => (
                  <button key={i} onClick={() => setForm({ ...form, icon: i })}
                    style={{ width: 42, height: 42, borderRadius: 10, border: `2px solid ${form.icon === i ? '#0F4C81' : '#DDE4EE'}`, background: form.icon === i ? '#EEF1FF' : 'white', cursor: 'pointer', fontSize: 20 }}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>রং</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: `3px solid ${form.color === c ? '#141D28' : 'transparent'}`, cursor: 'pointer', boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: form.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: `2px solid ${form.color}30` }}>{form.icon}</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: form.color }}>{form.name || 'ক্যাটাগরির নাম'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: 12, background: '#F0F4F8', border: 'none', borderRadius: 12, fontSize: 14, color: '#5E6E8A', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>বাতিল</button>
              <button onClick={addCategory} style={{ padding: 12, background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', border: 'none', borderRadius: 12, fontSize: 14, color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>✓ যোগ করুন</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
