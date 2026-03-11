import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Hind Siliguri',sans-serif", background:'#F4F7FB' }}>
      <div style={{ background:'white', borderRadius:'24px', padding:'32px 24px', maxWidth:'380px', width:'100%', textAlign:'center', boxShadow:'0 10px 40px rgba(15,40,80,0.12)' }}>
        <span style={{ fontSize:'64px', display:'block', marginBottom:'16px' }}>🔍</span>
        <h2 style={{ fontSize:'22px', fontWeight:'800', color:'#141D28', margin:'0 0 8px' }}>পেজ পাওয়া যায়নি</h2>
        <p style={{ fontSize:'13px', color:'#8A9AB5', margin:'0 0 24px' }}>আপনি যে পেজটি খুঁজছেন সেটি নেই বা সরিয়ে ফেলা হয়েছে।</p>
        <Link href="/dashboard" style={{ display:'block', padding:'13px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'14px', fontSize:'14px', fontWeight:'600', color:'white', textDecoration:'none' }}>
          🏠 ড্যাশবোর্ডে ফিরুন
        </Link>
      </div>
    </div>
  );
}
