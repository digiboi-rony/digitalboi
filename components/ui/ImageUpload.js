'use client';
import { useRef, useState } from 'react';
import { compressImage } from '../../lib/utils';

export default function ImageUpload({ label, value, onChange, hint, required, size = 'normal' }) {
  const ref = useRef();
  const [preview, setPreview] = useState(value || null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('ছবির সাইজ ৫MB-এর বেশি হতে পারবে না'); return; }
    setLoading(true);
    try {
      const compressed = await compressImage(file, size === 'large' ? 1200 : 800);
      setPreview(compressed);
      onChange?.(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => { setPreview(reader.result); onChange?.(reader.result); };
      reader.readAsDataURL(file);
    } finally { setLoading(false); }
  };

  const remove = (e) => { e.stopPropagation(); setPreview(null); onChange?.(null); ref.current.value = ''; };

  const height = size === 'large' ? 180 : size === 'small' ? 80 : 110;

  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <p style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label} {required && <span style={{ color: '#E63946' }}>*</span>}
        </p>
      )}
      <div
        onClick={() => !loading && ref.current.click()}
        style={{
          border: `2px dashed ${preview ? '#0BAA69' : '#B8C5D6'}`,
          borderRadius: 14,
          height,
          background: preview ? 'transparent' : '#F8FAFC',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #DDE4EE', borderTopColor: '#0F4C81', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 6px' }} />
            <p style={{ margin: 0, fontSize: 12, color: '#5E6E8A' }}>আপলোড হচ্ছে...</p>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
              <button onClick={remove} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(230,57,70,0.9)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(11,170,105,0.9)', borderRadius: 20, padding: '2px 10px' }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓ আপলোড হয়েছে</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
            <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: '#5E6E8A' }}>ছবি আপলোড করুন</p>
            {hint && <p style={{ margin: 0, fontSize: 11, color: '#8A9AB5' }}>{hint}</p>}
            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#B8C5D6' }}>JPG, PNG · সর্বোচ্চ ৫MB</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}

// Multi-image upload
export function MultiImageUpload({ label, values = [], onChange, max = 5 }) {
  const ref = useRef();
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const files = Array.from(e.target.files).slice(0, max - values.length);
    if (!files.length) return;
    setLoading(true);
    try {
      const compressed = await Promise.all(files.map(f => compressImage(f, 1000)));
      onChange?.([...values, ...compressed]);
    } finally { setLoading(false); }
  };

  const remove = (i) => onChange?.(values.filter((_, idx) => idx !== i));

  return (
    <div style={{ marginBottom: 14 }}>
      {label && <p style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {values.map((img, i) => (
          <div key={i} style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative', border: '2px solid #DDE4EE' }}>
            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => remove(i)} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 6, background: 'rgba(230,57,70,0.9)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 12 }}>✕</button>
          </div>
        ))}
        {values.length < max && (
          <div onClick={() => ref.current.click()} style={{ width: 72, height: 72, borderRadius: 10, border: '2px dashed #B8C5D6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC', gap: 3 }}>
            {loading ? <div style={{ width: 20, height: 20, border: '2px solid #DDE4EE', borderTopColor: '#0F4C81', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <>
              <span style={{ fontSize: 20 }}>+</span>
              <span style={{ fontSize: 9, color: '#8A9AB5' }}>যোগ করুন</span>
            </>}
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFile} />
      <p style={{ margin: '4px 0 0', fontSize: 10, color: '#B8C5D6' }}>সর্বোচ্চ {max}টি ছবি</p>
    </div>
  );
}
