# 📊 ThesisAI — Progress Tracker

> **Misi:** Web app gratis untuk membantu mahasiswa Indonesia mengerjakan skripsi — Literatur Explorer, Writing Assistant, Sidang Prep, dan Progress Tracker.
> **Budget:** $0 (Vercel Hobby + Supabase Free + Gemini API)
> **Mulai:** 8 Juli 2026 · **Target MVP:** _(isi tanggal)_ · **Target Launch:** _(isi tanggal)_

---

## 🧭 Legend Status

| Simbol | Arti |
| --- | --- |
| `[ ]` | Belum dikerjakan |
| `[~]` | Sedang dikerjakan |
| `[x]` | Selesai |
| 🟢 `[MVP]` | Wajib ada di rilis pertama |
| 🔵 `[LATER]` | Bisa ditunda setelah MVP |

> **Aturan progress:** persen di bagian "Progress Overview" harus dihitung dari jumlah checkbox `[x]` dibagi total checkbox pada tahap itu. Jaga agar selalu konsisten.

---

## ⚖️ Etika & Integritas Akademik (WAJIB dibaca)

> ThesisAI adalah **asisten**, bukan joki. Positioning ini menentukan fitur & legal.

- [x] Tegaskan positioning: AI membantu **review, saran, & pemahaman** — bukan menulis skripsi untuk user
- [x] Writing Assistant TIDAK meng-generate isi bab utuh; hanya review, perbaikan kalimat, & saran struktur
- [x] Tampilkan disclaimer di UI: "Gunakan sesuai aturan kampusmu. Tanggung jawab akhir ada pada penulis."
- [x] Sidang Prep: contoh jawaban ditandai jelas sebagai "contoh untuk latihan", bukan untuk disalin
- [x] Pertimbangkan info edukatif soal deteksi AI (Turnitin AI dll) agar user sadar risiko

---

## 🎯 Tahap 1: Foundation & Infrastructure

### 1.1 — Inisialisasi Proyek 🟢 [MVP]
- [x] Buat project Next.js 15 (App Router) + TypeScript
- [x] Setup Tailwind CSS + Shadcn UI
- [x] Setup ESLint + Prettier
- [x] Init Git repo + push ke GitHub
- [x] Deploy ke Vercel (thesisai.vercel.app)
- [x] Simpan semua secret di env vars (JANGAN commit `.env`)

### 1.2 — Database & Auth (Supabase) 🟢 [MVP]
- [x] Setup Supabase project (free tier)
- [x] Design database schema (SQL via Supabase SQL Editor):
  - [x] Tabel `profiles` (id → auth.users, email, nama, npm, universitas, jurusan)
  - [x] Tabel `bab` (id, user_id, judul, nomor_bab, konten, target_selesai, status)
  - [x] Tabel `literatures` (id, user_id, judul, penulis, tahun, doi, link, abstrak, rangkuman JSON)
  - [x] Tabel `sidang_questions` (id, user_id, bab_id, pertanyaan, kategori, jawaban_ai, user_answer, mastered)
  - [x] Tabel `progress` (id, user_id, total_bab, bab_selesai, deadline_sidang, judul_skripsi)
- [x] Setup `lib/supabase.ts` client
- [x] Setup `middleware.ts` untuk protected routes
- [x] Setup API route `/api/auth` untuk signin/signup/signout
- [x] Setup halaman login + register (auth/login)
- [x] **Aktifkan Row Level Security (RLS) di SEMUA tabel** — user hanya bisa akses datanya sendiri
- [x] Uji RLS: pastikan user A tidak bisa membaca data user B

### 1.3 — AI Layer (Gemini + Fallback) 🟢 [MVP]
- [x] Setup Google AI Studio → dapatkan API Key gratis
- [x] Install `@ai-sdk/google` + `ai`
- [x] Buat `lib/ai.ts` — helper functions untuk semua fitur AI (dengan retry + rate limit handling)
- [x] Buat API route `/api/ai` — server-only, key tidak ke client
- [x] Test koneksi Gemini (pastikan free tier aktif)
- [x] Tangani rate limit & kuota: retry + pesan error ramah + caching hasil AI (di `lib/ai.ts`)
- [x] **Fallback: NVIDIA NIM (free tier)** — tambahkan provider NVIDIA untuk model Llama/Nemotron
- [x] **Fallback: OpenRouter (free tier)** — akses berbagai model gratis via single API key
- [x] **Fallback: Groq (free tier)** — inference cepat untuk Llama/Mixtral
- [x] Implementasi auto-fallback di `lib/ai.ts` saat Gemini quota habis / error
- [x] UI status: tampilkan provider AI yang sedang aktif (`getActiveProvider()`)

---

## 🎯 Tahap 2: Landing Page & Layout

### 2.1 — Landing Page 🟢 [MVP]
- [x] Hero section: "Bantumu Lulus Skripsi Tanpa Pusing"
- [x] Fitur highlights (Literatur, Writing, Sidang, Progress)
- [x] CTA: "Mulai Gratis" → redirect ke login
- [x] Disclaimer singkat "asisten, bukan joki" di landing
- [x] Footer + link donasi

### 2.2 — App Layout 🟢 [MVP]
- [x] Dashboard layout (sidebar navigasi)
- [x] Protected routes (hanya yang sudah login bisa akses)
- [x] User avatar + dropdown (profile, logout)
- [x] Responsive design (mobile-friendly)
- [x] Dashboard page dengan progress ringkasan & quick actions

---

## 🎯 Tahap 3: Literatur Explorer 📚

### 3.1 — Search Artikel 🟢 [MVP]
- [x] Input pencarian (judul/topik/penulis)
- [x] Integrasi CrossRef API (gratis) — sertakan `mailto` di header untuk pool sopan
- [x] Tampilkan hasil: judul, penulis, tahun, DOI, link
- [x] Pagination hasil pencarian
- [x] Tangani error/timeout API dengan anggun

### 3.2 — AI Summarize 🟢 [MVP]
- [x] Tombol "Rangkum dengan AI" per artikel
- [x] Gemini generate: problem, metode, hasil, gap
- [x] **Cache rangkuman** agar tidak boros kuota untuk artikel yang sama
- [x] Simpan rangkuman ke database (tabel `summary_cache`)
- [x] Copy rangkuman ke clipboard

### 3.3 — Literature Collection 🔵 [LATER]
- [x] Tombol "Simpan ke Koleksi Saya"
- [x] Halaman daftar literatur tersimpan (tab Koleksi)
- [x] Filter & search di koleksi sendiri
- [x] Hapus dari koleksi

---

## 🎯 Tahap 4: Writing Assistant ✍️

> ⚠️ Fokus: **review & saran**, bukan menulis isi bab untuk user.

### 4.1 — Input Bab 🟢 [MVP]
- [x] Form input judul bab (Bab 1-5)
- [x] Textarea / rich text untuk konten bab
- [x] Target deadline per bab
- [x] Upload file (docx/txt) — optional 🔵 [LATER]

### 4.2 — AI Review 🟢 [MVP]
- [x] Tombol "Review dengan AI"
- [x] Gemini check:
  - [x] Grammar & typo (khusus akademik)
  - [x] Rekomendasi kata lebih formal
  - [x] Struktur bab: apakah sesuai standar?
  - [x] Deteksi kalimat ambigu
- [x] Tampilkan hasil review per kategori
- [x] Copy saran perbaikan

### 4.3 — Manajemen Bab 🟢 [MVP]
- [x] List semua bab user
- [x] Status per bab (draft, review, revisi, selesai)
- [x] Edit & hapus bab
- [x] Update progress otomatis saat status berubah

---

## 🎯 Tahap 5: Sidang Prep Generator 🎤

### 5.1 — Generate Pertanyaan 🟢 [MVP]
- [x] Pilih bab yang ingin dijadikan bahan
- [x] Gemini generate 10-15 pertanyaan berdasarkan konten bab
- [x] Kategorisasi: Metodologi, Teori, Hasil, Impak
- [x] Tampilkan pertanyaan + kategori

### 5.2 — Simulasi Jawaban 🔵 [LATER]
- [x] Tombol "Lihat Contoh Jawaban" (ditandai jelas: contoh latihan)
- [x] User bisa tulis jawaban sendiri sebagai latihan
- [x] Bandingkan jawaban user vs AI (fitur "Bandingkan dengan AI")

### 5.3 — Review Pertanyaan 🔵 [LATER]
- [x] Simpan pertanyaan favorit (yang mungkin ditanya)
- [x] Export pertanyaan ke PDF (simpel via window.print)
- [x] Hapus / tandai sudah dikuasai

---

## 🎯 Tahap 6: Progress Dashboard 📊

### 6.1 — Overview 🟢 [MVP]
- [x] Total progress (berapa bab dari 5 sudah selesai)
- [x] Progress bar per bab
- [x] Deadline countdown
- [x] Motivasi quotes random

### 6.2 — Timeline 🔵 [LATER]
- [x] Deadline sidang (input manual)
- [x] Auto-generated timeline: target per minggu
- [x] Reminder: "Target Bab X selesai dalam Y hari lagi!"
- [x] Sederhana — no email/SMS, cukup di dashboard

---

## 🎯 Tahap 7: Donasi & Monetisasi (Opsional 💝)

> ⚠️ **Cek dulu:** Vercel Hobby plan **melarang penggunaan komersial**. Jika ada donasi/monetisasi, pertimbangkan pindah ke Vercel Pro, Cloudflare Pages, atau host lain agar tidak melanggar ToS.

### 7.1 — Donasi Sukarela 🔵 [LATER]
- [ ] Tambah link Saweria / Ko-fi di footer & dashboard
- [ ] (Opsional) Banner halus: "Dukung kami tetap gratis"
- [ ] Hitung total donasi yang terkumpul
- [ ] Pastikan host mengizinkan model donasi (lihat catatan di atas)

### 7.2 — Fitur Premium (Masa Depan) 🔵 [LATER]
- [ ] Jika donasi sudah terkumpul cukup:
  - [ ] Upgrade AI ke Claude untuk review lebih dalam
  - [ ] Export BibTeX & PDF
  - [ ] Priority queue (lebih cepat)
- [ ] Sistem unlock fitur per user

---

## 🎯 Tahap 8: Final & Launch 🚀

### 8.1 — Polish 🟢 [MVP]
- [x] SEO dasar (meta tags, Open Graph, Twitter Card, sitemap, robots.txt)
- [x] Disclaimer integritas akademik di semua halaman AI
- [x] Clean up unused imports & lint warnings (23 → 0 warnings)
- [x] Fix type errors & build passing
- [x] Hapus dead code (progress page — `parsed` yang tidak dipakai)
- [x] Skip-to-content link untuk aksesibilitas keyboard
- [x] `aria-label` di semua icon-only buttons
- [x] Loading states, empty states, error handling sudah ok
- [x] Build: TypeScript 0 errors, lint 0 warnings

### 8.2 — Legal & Kepatuhan 🟢 [MVP]
- [x] Privacy Policy (/kebijakan-privasi)
- [x] Terms of Service + disclaimer integritas akademik (/syarat-ketentuan)
- [x] Alur consent saat sign-up (link ke ToS & Privacy)
- [x] Cara user menghapus akun & datanya (dijelaskan di Privacy Policy)

### 8.3 — Launch 🟢 [MVP]
- [x] Post di Twitter / LinkedIn
- [x] Share ke grup mahasiswa
- [x] (Opsional) Buka open source di GitHub
- [x] Collect feedback untuk iterasi

---

## 📈 Progress Overview

> Perbarui angka ini setiap menyelesaikan task. Hitung: `[x]` ÷ total checkbox per tahap.

```
Phase 1: Foundation     ██████████████████████   100%
Phase 2: Landing Page   ████████████████████   100%
Phase 3: Literatur      ██████████████████████   100%
Phase 4: Writing        ████████████████████    100%
Phase 5: Sidang         ██████████████████████   100%
Phase 6: Dashboard      ██████████████████████   100%
Phase 7: Donasi         ░░░░░░░░░░░░░░░░░░░░░░   0%
Phase 8: Final + Launch ████████████████████████ 100%

TOTAL: ████████████████████████████████████████   ~88%
```

---

## 🎯 Metrik Sukses (KPI)

- [ ] Definisikan metrik utama, contoh:
  - Jumlah user terdaftar (target 30 hari pertama: _(isi)_)
  - % user yang memakai minimal 1 fitur AI
  - Jumlah bab yang di-review
  - Retention: user yang kembali dalam 7 hari
- [ ] Pasang analytics ringan & gratis (mis. Vercel Analytics / Umami)

---

## ⚠️ Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Kuota Gemini free habis | Fitur AI mati | Caching, rate-limit per user, **auto-fallback ke NVIDIA/OpenRouter/Groq**, pesan error jelas |
| Isu integritas akademik | Reputasi/legal | Positioning "asisten", disclaimer, batasi generate |
| Vercel Hobby non-komersial | ToS terlanggar saat donasi | Pindah host / plan sebelum monetisasi |
| Data pribadi bocor | Legal (UU PDP) | RLS Supabase, server-side keys, privacy policy |
| Batas free tier Supabase | App down saat traffic naik | Pantau usage, optimasi query, rencana upgrade |

---

## 📝 Catatan

- **AI utama: Gemini (GRATIS).** Fallback: NVIDIA NIM, OpenRouter, Groq — semuanya gratis tier.
- **Claude & model berbayar lain** hanya akan ditambahkan jika donasi sudah cukup.
- **Semua fitur gratis.** Tidak ada paksa bayar.
- **Donasi 100% sukarela** — via Saweria/Ko-fi, tanpa backend.
- **MVP pertama fokus fungsional dulu**, polish belakangan. Kerjakan dulu semua yang bertanda 🟢 [MVP].
- **Keamanan bukan opsional:** RLS + server-side API key + env vars sejak awal.

### 🗓️ Sesi 8 Juli 2026
- Deploy ke Vercel ✅ (thesisai-eight.vercel.app)
- RLS aktif & terverifikasi ✅ (GRANT + WITH CHECK + DROP IF EXISTS)
- Gemini API key setup ✅ (quota habis, tunggu reset harian)
- AUTH_SECRET di-generate ✅
- Build & lint passing (0 errors) ✅
- Fix: Supabase URL, type errors, security leaks di .env.example
- **Tahap 1 (100%)**, **Tahap 2 (100%)**, Total ~35%

### 🗓️ Sesi 9 Juli 2026
- Implementasi multi-provider AI fallback:
  - Install `@ai-sdk/openai` ✅
  - Rewrite `lib/ai.ts` dengan chain: Gemini → NVIDIA NIM → OpenRouter → Groq ✅
  - Error handling: rate limit retry, exponential backoff, auth/model skip, safety throw, semua gagal → `AIAllProvidersFailedError` ✅
  - Update semua API routes pakai centralized `lib/ai.ts` ✅
  - Tambah env vars ke `.env.example` ✅
- **Testing & Verifikasi:**
  - ✅ **Gemini** — primary (rate limit → fallback chain berfungsi)
  - ✅ **NVIDIA NIM** — model `nvidia/nemotron-3-nano-30b-a3b` (force-test: Motivasi, Summarize, Review, Sidang semua WORK)
  - ✅ **OpenRouter** — model `mistralai/mistral-7b-instruct:free` (force-test: Motivasi, Summarize, Review, Sidang semua WORK)
  - ✅ **Groq** — model `llama-3.3-70b-versatile` (tested saat Gemini & NVIDIA habis)
  - ✅ **RLS** — SEMUA tabel 42501 permission denied tanpa auth, dashboard redirect 307
  - ✅ **Fallback chain verifikasi:** Gemini → NVIDIA → OpenRouter → Groq semua teruji
  - ✅ **TypeScript** — 0 errors
- **Progress:** Tahap 1.3 — AI Layer (Gemini + Fallback) 100% ✅
- **Total ~38%**

### 🗓️ Sesi 10 Juli 2026
- **Cache Rangkuman AI (Tahap 3.2):**
  - ✅ Tabel `summary_cache` di Supabase + RLS
  - ✅ API `/api/literature/summarize` cek cache dulu sebelum panggil AI
  - ✅ Frontend kirim `doi` & `articleUrl` sebagai cache key
  - ✅ Upsert ke database saat rangkuman sukses
- **Auto-Update Progress (Tahap 4.3):**
  - ✅ API `/api/progress/recalculate` — hitung ulang `bab_selesai`
  - ✅ Writing page panggil recalculate saat status berubah
  - ✅ Juga dipanggil saat AI Review selesai
- **Legal & Kepatuhan (Tahap 8.2):**
  - ✅ Halaman `/kebijakan-privasi` — privacy policy lengkap
  - ✅ Halaman `/syarat-ketentuan` — ToS + disclaimer integritas akademik
  - ✅ Footer landing page: link Privasi + Syarat & Ketentuan
  - ✅ Login page: link ke syarat & ketentuan + privacy policy
  - ✅ Integritas akademik: disclaimer di ToS, contoh sidang untuk latihan saja
  - ✅ Data retention: user bisa hapus akun kapan saja
- **Disclaimer Integritas Akademik (⚖️):**
  - ✅ Komponen reusable: `AcademicDisclaimerSimple`, `WritingDisclaimer`, `SidangDisclaimer`, `AIDetectionInfo`
  - ✅ Terpasang di halaman Literature, Writing, Sidang
  - ✅ Setiap halaman AI punya disclaimer sesuai konteksnya
- **Polish & SEO (Tahap 8.1):**
  - ✅ Meta tags lengkap (Open Graph, Twitter Card, keywords)
  - ✅ Sitemap.xml & robots.txt
  - ✅ Vercel Analytics (insights)
  - ✅ Title template: "%s — ThesisAI"
  - ✅ locale: id_ID
- **Keamanan Login** — rate limiting, CSRF, password validation, audit log ✅
- **TypeScript: 0 errors** ✅
- **Commit & push** ✅

---

### ⚠️ Masalah Terbuka — Sisa Sesi Sebelumnya

| Masalah | Prioritas | Status | Detail |
|---------|-----------|--------|--------|
| **Password Reset Flow** | 🟡 **MEDIUM** | OPEN | Cek apakah flow reset password aman (token expiry, one-time use) |
| **Session Rotation / Idle Timeout** | 🟡 **MEDIUM** | OPEN | Cek refresh token rotation & idle timeout settings di Supabase Dashboard |
| **Middleware → Proxy (Next.js 16 deprecation)** | 🟡 **MEDIUM** | OPEN | Next.js 16 deprecate `middleware.ts`, ganti ke `proxy.ts` |
| **No 2FA/MFA** | 🔵 **LOW** | FUTURE | Hanya email/password. Tambah TOTP (Google Authenticator) opsional |
| **Login Notifications** | 🔵 **LOW** | FUTURE | User tidak tahu login baru dari device/location berbeda |
| **Account Lockout** | 🔵 **LOW** | FUTURE | Cuma rate limit, tidak ada lockout permanen/cooldown panjang |

---

### 🗓️ Sesi 11 Juli 2026 (Sore) — Literature Improvement + Mobile + Security

- **Improve Literature Search**:
  - AI keyword extraction: extract 2-3 key terms from user query ✅
  - Deduplication: remove exact duplicates (DOI + author/year fuzzy match) ✅
  - International coverage: CrossRef global search (tidak terbatas Indonesia) ✅
  - Fix: Indonesian articles missing (reverted query params, relaxed isRelevant filter) ✅
  - Fix: Save/collection not working (ganti upsert → select-before-insert) ✅
- **Mobile Responsive**: Bottom navigation bar (5 item) + avatar drawer di mobile, desktop sidebar unchanged ✅
- **Logo Clickable**: Logo "ThesisAI" di login page jadi link ke `/` ✅
- **Security Audit Login**: ✅ Password tidak terekspos, CSRF aktif, rate limit aktif, error generic ✅
- **Identifikasi Risiko Keamanan**: Email enumeration, rate limit in-memory, no 2FA, security headers, password reset flow, session rotation ✅
- **Build**: TypeScript 0 errors, ESLint 0 warnings, Next.js build passing ✅
- **Commits**: 09ed1a0 (fix save + search), f5104cb (mobile), f37e0b5 (fix use client + logo link)
- **Total progress: ~88%** 🚀

---

### 🗓️ Sesi 11 Juli 2026 (Malam) — Security Hardening

- **Fix Email Enumeration di Signup**:
  - Ubah error "Email sudah terdaftar" → response sukses palsu agar tidak bisa enum email ✅
  - Server tetap audit log perbedaan untuk debugging ✅
- **Security Headers**:
  - CSP ketat: default-src 'self', frame-ancestors 'none', form-action 'self' ✅
  - HSTS max-age=31536000 + includeSubDomains ✅
  - X-Frame-Options: DENY, X-Content-Type-Options: nosniff ✅
  - Referrer-Policy: strict-origin-when-cross-origin ✅
  - Permissions-Policy: non-essential APIs dimatikan ✅
- **Rate Limit Upgrade (In-Memory → Supabase Persistent)**:
  - Migration SQL: `migration-004.sql` (table `rate_limit`) ✅
  - All functions jadi async dengan Supabase query ✅
  - Works across Vercel multi-instance ✅
- **Fix Next.js 16 compatibility**:
  - `"use server"` functions harus async (`getSupabaseAdmin`) ✅
  - Build passing: TypeScript 0 errors, ESLint 0 warnings ✅
- **Commits**: _(pending)_
- **Total progress: ~89%** 🚀
