'use client';
import { useEffect, useRef, useState } from 'react';

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const rafRef = useRef();
  const [status, setStatus] = useState('starting'); // starting | scanning | error
  const [lastCode, setLastCode] = useState('');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStatus('scanning');
          scanLoop();
        };
      }
    } catch (e) {
      setStatus('error');
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // Use BarcodeDetector API if available, else fall back to canvas pattern
  const scanLoop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'] });
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          if (code !== lastCode) {
            setLastCode(code);
            vibrate();
            onScan(code);
            setTimeout(() => setLastCode(''), 2000);
          }
        }
      } catch {}
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  };

  const vibrate = () => { try { navigator.vibrate?.(100); } catch {} };

  const handleManual = () => {
    if (manualInput.trim()) { onScan(manualInput.trim()); setManualInput(''); }
  };

  return (
    <div style={{ background: '#000', borderRadius: '24px 24px 0 0', overflow: 'hidden', fontFamily: "'Hind Siliguri', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(0,0,0,0.8)', position: 'relative', zIndex: 10 }}>
        <p style={{ margin: 0, color: 'white', fontSize: 15, fontWeight: 700 }}>📷 বারকোড স্ক্যান</p>
        <button onClick={() => { stopCamera(); onClose(); }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 16 }}>✕</button>
      </div>

      {/* Camera View */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '65%', background: '#111' }}>
        {status === 'error' ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: 20 }}>
            <span style={{ fontSize: 40, marginBottom: 10 }}>📵</span>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>ক্যামেরা অ্যাক্সেস পাওয়া যাচ্ছে না</p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>নিচে ম্যানুয়ালি নম্বর লিখুন</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {/* Scan overlay */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '72%', height: '38%', border: '2px solid rgba(255,255,255,0.8)', borderRadius: 12, position: 'relative', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}>
                {/* Corner marks */}
                {[['0,0'], ['0,auto'], ['auto,0'], ['auto,auto']].map(([t, b], i) => (
                  <div key={i} style={{ position: 'absolute', width: 20, height: 20, borderColor: '#2E86DE', borderStyle: 'solid', borderWidth: i < 2 ? '2px 0 0 2px' : i === 2 ? '2px 2px 0 0' : '0 2px 2px 0', top: i < 2 ? (i === 0 ? -2 : 'auto') : -2, bottom: i === 1 ? -2 : i === 3 ? -2 : 'auto', left: i % 2 === 0 ? -2 : 'auto', right: i % 2 !== 0 ? -2 : 'auto', borderRadius: i === 0 ? '2px 0 0 0' : i === 1 ? '0 0 0 2px' : i === 2 ? '0 2px 0 0' : '0 0 2px 0' }} />
                ))}
                {/* Scan line */}
                {status === 'scanning' && (
                  <div className="scan-line" style={{ position: 'absolute', left: 4, right: 4, height: 2, background: 'linear-gradient(90deg, transparent, #2E86DE, transparent)', borderRadius: 2 }} />
                )}
              </div>
            </div>
            {/* Status */}
            <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center' }}>
              {status === 'starting' ? (
                <p style={{ margin: 0, color: 'white', fontSize: 12, opacity: 0.8 }}>ক্যামেরা চালু হচ্ছে...</p>
              ) : lastCode ? (
                <div style={{ background: 'rgba(11,170,105,0.9)', borderRadius: 20, padding: '6px 16px', display: 'inline-block' }}>
                  <p style={{ margin: 0, color: 'white', fontSize: 13, fontWeight: 700 }}>✅ স্ক্যান হয়েছে: {lastCode}</p>
                </div>
              ) : (
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>বারকোড বা QR কোড ফ্রেমের মধ্যে রাখুন</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Manual Input */}
      <div style={{ background: 'white', padding: '16px 20px 24px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#5E6E8A' }}>অথবা ম্যানুয়ালি লিখুন:</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManual()}
            placeholder="বারকোড নম্বর লিখুন..."
            style={{ flex: 1, padding: '12px 14px', border: '2px solid #DDE4EE', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          />
          <button onClick={handleManual} style={{ padding: '12px 18px', background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>খুঁজুন</button>
        </div>
      </div>
    </div>
  );
}
