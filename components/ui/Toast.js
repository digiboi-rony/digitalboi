'use client';
import { useNotifStore } from '../../lib/store';

export default function Toast() {
  const { notifications } = useNotifStore();
  if (!notifications.length) return null;
  return (
    <div style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', padding: '0 16px' }}>
      {notifications.map(n => (
        <div key={n.id} style={{
          background: n.type === 'success' ? '#0BAA69' : n.type === 'error' ? '#E63946' : n.type === 'warning' ? '#F4A261' : '#0F4C81',
          color: 'white',
          padding: '11px 18px',
          borderRadius: 14,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 420,
          width: '100%',
          pointerEvents: 'auto',
          fontFamily: "'Hind Siliguri', sans-serif",
        }}>
          <span style={{ fontSize: 16 }}>
            {n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          {n.msg}
        </div>
      ))}
    </div>
  );
}

// Modal component
export function Modal({ show, onClose, title, children, size = 'normal' }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.72)', zIndex: 900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '24px 24px 0 0',
          padding: '22px 20px 28px',
          width: '100%',
          maxWidth: 480,
          maxHeight: size === 'large' ? '90vh' : '80vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s ease',
          fontFamily: "'Hind Siliguri', sans-serif",
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#141D28' }}>{title}</p>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#F0F4F8', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Confirm dialog
export function Confirm({ show, onConfirm, onCancel, title, message, danger }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.72)', zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 24, maxWidth: 360, width: '100%', animation: 'slideUp 0.3s ease', fontFamily: "'Hind Siliguri', sans-serif" }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 40 }}>{danger ? '🗑️' : '❓'}</span>
          <p style={{ margin: '10px 0 4px', fontSize: 17, fontWeight: 700, color: '#141D28' }}>{title || 'নিশ্চিত করুন'}</p>
          {message && <p style={{ margin: 0, fontSize: 13, color: '#5E6E8A', lineHeight: 1.6 }}>{message}</p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '12px', background: '#F0F4F8', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#5E6E8A', cursor: 'pointer', fontFamily: 'inherit' }}>বাতিল</button>
          <button onClick={onConfirm} style={{ padding: '12px', background: danger ? '#E63946' : '#0F4C81', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
            {danger ? '🗑️ মুছুন' : '✓ নিশ্চিত'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader
export function Skeleton({ count = 3, height = 80 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, borderRadius: 16 }} />
      ))}
    </div>
  );
}

// Empty state
export function Empty({ icon = '📭', title, subtitle, action, actionLabel }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#3D4E63' }}>{title}</p>
      {subtitle && <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8A9AB5' }}>{subtitle}</p>}
      {action && <button onClick={action} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{actionLabel}</button>}
    </div>
  );
}
