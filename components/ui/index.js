'use client';

// Input field
export function Input({ label, required, icon, error, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
          {label} {required && <span style={{ color: '#E63946' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A9AB5', pointerEvents: 'none' }}>{icon}</span>}
        <input
          {...props}
          style={{
            width: '100%',
            padding: icon ? '12px 14px 12px 40px' : '12px 14px',
            border: `2px solid ${error ? '#E63946' : '#DDE4EE'}`,
            borderRadius: 12,
            fontSize: 14,
            fontFamily: "'Hind Siliguri', sans-serif",
            color: '#141D28',
            outline: 'none',
            boxSizing: 'border-box',
            background: 'white',
            ...props.style,
          }}
          onFocus={e => e.target.style.borderColor = '#2E86DE'}
          onBlur={e => e.target.style.borderColor = error ? '#E63946' : '#DDE4EE'}
        />
      </div>
      {error && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#E63946' }}>{error}</p>}
    </div>
  );
}

// Select/Dropdown
export function Select({ label, required, options = [], ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
          {label} {required && <span style={{ color: '#E63946' }}>*</span>}
        </label>
      )}
      <select
        {...props}
        style={{ width: '100%', padding: '12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: "'Hind Siliguri', sans-serif", color: '#141D28', outline: 'none', background: 'white', appearance: 'none', boxSizing: 'border-box', ...props.style }}
      >
        {options.map(opt => (
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Button variants
export function Btn({ variant = 'primary', size = 'md', full, loading, children, ...props }) {
  const variants = {
    primary:  { background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', boxShadow: '0 4px 14px rgba(15,76,129,0.3)' },
    success:  { background: 'linear-gradient(135deg,#0BAA69,#0ECF80)', color: 'white', boxShadow: '0 4px 14px rgba(11,170,105,0.3)' },
    danger:   { background: 'linear-gradient(135deg,#E63946,#FF6B6B)', color: 'white', boxShadow: '0 4px 14px rgba(230,57,70,0.3)' },
    ghost:    { background: '#F0F4F8', color: '#5E6E8A' },
    outline:  { background: 'white', color: '#0F4C81', border: '2px solid #0F4C81' },
    warning:  { background: 'linear-gradient(135deg,#F4A261,#F77F00)', color: 'white' },
  };
  const sizes = {
    sm: { padding: '7px 14px', fontSize: 12, borderRadius: 10 },
    md: { padding: '12px 18px', fontSize: 14, borderRadius: 12 },
    lg: { padding: '14px 24px', fontSize: 15, borderRadius: 14 },
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        border: 'none',
        fontFamily: "'Hind Siliguri', sans-serif",
        fontWeight: 600,
        cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: full ? '100%' : 'auto',
        opacity: props.disabled ? 0.6 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        ...variants[variant],
        ...sizes[size],
        ...props.style,
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> : children}
    </button>
  );
}

// Search bar
export function SearchBar({ value, onChange, placeholder = 'খুঁজুন...', onClear }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#8A9AB5' }}>🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '12px 40px 12px 40px', border: '2px solid #DDE4EE', borderRadius: 14, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'white' }}
        onFocus={e => e.target.style.borderColor = '#2E86DE'}
        onBlur={e => e.target.style.borderColor = '#DDE4EE'}
      />
      {value && (
        <button onClick={onClear || (() => onChange(''))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: '#DDE4EE', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, color: '#5E6E8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      )}
    </div>
  );
}

// Pill badge
export function Badge({ label, color = '#0F4C81', bg = '#EEF1FF' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// Stat card
export function StatCard({ icon, label, value, sub, color = '#0F4C81', bg, onClick }) {
  return (
    <div onClick={onClick} className="card" style={{ padding: 14, cursor: onClick ? 'pointer' : 'default', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg || color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
        <p style={{ margin: 0, fontSize: 11, color: '#8A9AB5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      </div>
      <p style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 800, color: '#141D28' }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: color, fontWeight: 600 }}>{sub}</p>}
    </div>
  );
}
