import { Inter } from 'next/font/google';
import './globals.css';

export const metadata = {
  title: 'Digiboi — আপনার ব্যবসার ডিজিটাল সহকারী',
  description: 'বাংলাদেশের ছোট ব্যবসার জন্য সম্পূর্ণ ডিজিটাল ম্যানেজমেন্ট সিস্টেম',
  manifest: '/manifest.json',
  themeColor: '#0F4C81',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Digiboi',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body style={{ margin: 0, padding: 0, overflowX: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
