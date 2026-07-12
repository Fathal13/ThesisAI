# 🔧 Supabase Email Configuration — Setup Manual

> **Butuh akses:** Supabase Dashboard → Project Settings

---

## 📋 Langkah-langkah

### 1. Buka Supabase Dashboard
```
https://supabase.com/dashboard/project/<PROJECT_ID>
```

### 2. Pergi ke Authentication → URL Configuration
```
Authentication → URL Configuration
```

### 3. Update **Site URL**
```
Site URL: https://thesisai.vercel.app
```

### 4. Update **Redirect URLs** (tambahkan semua berikut):
```
http://localhost:3000/**
https://thesisai.vercel.app/**
https://thesisai.vercel.app/auth/verify/**
https://thesisai.vercel.app/auth/reset-password/**
```

### 5. Save Changes
Klik **Save** di pojok kanan bawah.

---

## ✅ Verifikasi

Setelah save:
1. Daftar akun baru di `https://thesisai.vercel.app/auth/login`
2. Cek email — link konfirmasi seharusnya mengarah ke `https://thesisai.vercel.app/auth/verify?...`
3. Klik link → redirect ke `/auth/verify` → setelah verified redirect ke `/dashboard`

---

## ⚠️ Catatan

- **Site URL** harus production URL (`thesisai.vercel.app`)
- **Redirect URLs** perlu cover dev (`localhost:3000`) DAN production
- Link email akan mengarah ke `Site URL` + `/auth/verify` (karena Supabase default redirect ke verify page)
- Kode di `proxy.ts` sudah handle redirect ke `/auth/verify` kalau `email_confirmed_at` null

---

## 🔗 Related Code

| File | Peran |
|------|-------|
| `src/proxy.ts` | Cek `session.user.email_confirmed_at`, redirect ke `/auth/verify` |
| `src/app/auth/verify/page.tsx` | Halaman verifikasi + tombol kirim ulang |
| `src/app/api/auth/route.ts` | `resend-confirmation` action untuk kirim ulang email |

---

## 📅 Tanggal: 2026-07-12
**Status:** Manual setup required — jalankan di Supabase Dashboard