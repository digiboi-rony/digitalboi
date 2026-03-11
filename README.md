# Digiboi — আপনার ব্যবসার ডিজিটাল সহকারী

## 🚀 Vercel Deploy করার সঠিক পদ্ধতি

### ধাপ ১: GitHub Repository তৈরি করুন

1. ZIP ফাইলটি extract করুন
2. **`digiboi` ফোল্ডারের ভেতরের সব ফাইল** GitHub-এ আপলোড করুন
   - ⚠️ `digiboi` ফোল্ডারটি আপলোড করবেন না — ভেতরের ফাইলগুলো করুন
   - GitHub repository-তে দেখতে হবে: `app/`, `lib/`, `components/`, `package.json` ইত্যাদি

### ধাপ ২: Vercel-এ সঠিক Settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `./` (ডিফল্ট) |
| Build Command | `npm run build` |

### ধাপ ৩: Environment Variables (সঠিক নাম)

```
NEXT_PUBLIC_SUPABASE_URL=https://gpurqnqecdeppkzonvhn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
JWT_SECRET=digiboi2025secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=Rony
CLOUDINARY_API_KEY=455187862121157
CLOUDINARY_API_SECRET=YrKLhTMJCCs1t-C6Ff4y7CShei4
```

⚠️ **সাবধান:** Vercel-এ যে নামগুলো দেওয়া ছিল সেগুলো ভুল ছিল:
- ❌ `SUPABASE_SERVICE_KEY` → ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `NEXTAUTH_SECRET` → ✅ `JWT_SECRET`
- ❌ `CLOUDINARY_CLOUD_NAME` → ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

### ধাপ ৪: Supabase Schema চালান

Supabase Dashboard → SQL Editor → `supabase_schema.sql` ফাইলটি paste করে Run করুন

## Super Admin Login
- Phone: `+8801700000000`
- Password: `Digiboi@2025`
