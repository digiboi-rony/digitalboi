# 🚀 Digiboi — সম্পূর্ণ প্রজেক্ট
> আপনার ব্যবসার ডিজিটাল সহকারী

## ✅ সম্পূর্ণ হয়েছে (44 ফাইল)

### UI Pages
Login · Register(৫-ধাপ) · Forgot Password · Dashboard · POS+Barcode · Inventory · Customers · Suppliers+Purchase · Accounts/হিসাব · Reports+Print · Admin Panel · Settings+Staff · Notifications · Receipt Print

### Backend APIs (14টি)
auth/login · auth/register · auth/forgot-password · products · sales · customers · suppliers · purchases · expenses · reports · dashboard · admin · staff · upload

### Features
✅ JWT + bcrypt auth | ✅ Supabase PostgreSQL + RLS | ✅ Cloudinary photos
✅ NID verification | ✅ Online business verification | ✅ Barcode scanner
✅ Auto stock triggers | ✅ Bangla/English toggle | ✅ PWA manifest
✅ Thermal receipt print | ✅ A4 invoice | ✅ Staff permissions

## 🚀 Deploy (৩ ধাপ)

### 1. Supabase
supabase.com → New Project → SQL Editor → supabase_schema.sql paste করুন → Run

### 2. Cloudinary
cloudinary.com → Free account → Cloud Name + API Key + Secret নিন

### 3. Vercel
vercel.com → GitHub import → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=digiboi-your-secret-2025
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123
```
Deploy → Done! ✅

## প্রথম Login
- Phone: +8801700000000
- Password: Digiboi@2025

---
**MD. Rakibul Hasan Rony** | Digiboi © 2025
