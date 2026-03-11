export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Hind Siliguri', Arial, sans-serif" }}>
      <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 8px 28px rgba(15,76,129,0.3)', animation: 'pulse 1.5s ease infinite' }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: 26 }}>D</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0.1, 0.2, 0.3].map((d, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F4C81', opacity: 0.4, animation: `bounce 1s ease ${d}s infinite` }} />
        ))}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri&display=swap');
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-6px);opacity:1} }
      `}</style>
    </div>
  );
}
