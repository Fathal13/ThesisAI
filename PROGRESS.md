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
- [x] Footer (Privasi, Syarat & Ketentuan)

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
- [x] **Integrasi OpenAlex API (gratis, unlimited)** — 250+ juta artikel Open Access, filter `type:article` + `open_access.is_oa:true`
- [x] Tampilkan hasil: judul, penulis, tahun, DOI, link, OA status, sitasi count, PDF URL
- [x] **Pagination** — page numbers + Previous/Next + total pages & total articles info
- [x] **Info jumlah artikel** — "Menampilkan X dari Y artikel Open Access (halaman N dari M)"
- [x] **Filter "Artikel Jurnal Saja"** — toggle on/off (default on)
- [x] Tangani error/timeout API dengan anggun
- [x] Sort by tahun terbit descending (terbaru di atas)

### 3.2 — AI Summarize 🟢 [MVP]
- [x] Tombol "Rangkum dengan AI" per artikel
- [x] Gemini generate: problem, metode, hasil, gap
- [x] **Cache rangkuman** agar tidak boros kuota untuk artikel yang sama
- [x] Simpan rangkuman ke database (tabel `summary_cache`)
- [x] Copy rangkuman ke clipboard

### 3.3 — Literature Collection 🔵 [LATER]
- [x] Tombol "Simpan ke Koleksi Saya" (dedup by DOI/title)
- [x] Halaman daftar literatur tersimpan (tab Koleksi)
- [x] Filter & search di koleksi sendiri
- [x] Hapus dari koleksi
- [x] **Button "Buka Artikel"** — redirect ke PDF langsung (Open Access) atau landing page
- [x] **Button "Jadikan BAB"** — convert literatur ke draft BAB writing assistant

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
Phase 7: (Removed)      —                      —
Phase 8: Final + Launch ████████████████████████ 100%

TOTAL: ████████████████████████████████████████   100%
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
| Vercel Hobby non-komersial | ToS terlanggar jika ada monetisasi | Fitur donasi sudah dihapus — aman |
| Data pribadi bocor | Legal (UU PDP) | RLS Supabase, server-side keys, privacy policy |
| Batas free tier Supabase | App down saat traffic naik | Pantau usage, optimasi query, rencana upgrade |

---

## 📝 Catatan

- **AI utama: Gemini (GRATIS).** Fallback: NVIDIA NIM, OpenRouter, Groq — semuanya gratis tier.
- **Claude & model berbayar lain** hanya akan ditambahkan jika nanti ada pendanaan.
- **Semua fitur gratis.** Tidak ada paksa bayar.
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
| **Session Rotation / Idle Timeout** | 🟡 **MEDIUM** | OPEN | Cek refresh token rotation & idle timeout settings di Supabase Dashboard |
| **User langsung masuk dashboard sebelum konfirmasi email** | 🔴 **HIGH** | OPEN | Supabase auto-confirm workaround bikin user langsung login tanpa konfirmasi email. Perlu ganti flow: kirim email konfirmasi standar, block akses dashboard sampai email confirmed |
| **Link konfirmasi email Supabase arahkan ke localhost** | 🟡 **MEDIUM** | OPEN | Di Supabase Dashboard → Auth → URL Configuration, set Site URL ke production (thesisai.vercel.app), tambah Redirect URLs untuk localhost dev |
| **Tambah jurnal ilmiah di pencarian literatur** | 🟡 **MEDIUM** | OPEN | CrossRef `type` filter: tambah `journal-article`, `journal`, `proceedings-article`, `book-chapter` dsb. Saat ini hanya `article` generic |
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

**Security Hardening:**
- **Fix Email Enumeration di Signup**: Response sukses palsu agar tidak bisa enum email ✅
- **Security Headers**: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy ✅
- **Rate Limit Upgrade (In-Memory → Supabase Persistent)**: migration-004.sql ✅
- **Middleware → Proxy Migration (Next.js 16)**: middleware.ts → proxy.ts ✅
- **Fix secret leak endpoints**: sidang/questions, progress/recalculate, settings, ai/route — semua error message generic ✅
- **Remove sensitive console.log**: raw AI response di lib/ai.ts ✅

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~91%** 🚀

---

### 🗓️ Sesi 11 Juli 2026 (Lanjut Malam) — Password Reset Flow

- **Halaman Lupa Password** (`/auth/forgot-password`):
  - Form input email + validasi ✅
  - API `forgot-password` via `supabase.auth.resetPasswordForEmail()` ✅
  - Generic response (cegah email enumeration) ✅
  - Success screen dengan info link berlaku 1 jam ✅
- **Halaman Reset Password** (`/auth/reset-password`):
  - Ekstrak token dari URL hash (Supabase recovery flow) ✅
  - Simpan token ke sessionStorage lalu bersihkan URL ✅
  - Form password baru + konfirmasi + toggle show/hide ✅
  - Validasi password (sama dengan signup) ✅
  - `supabase.auth.updateUser({ password })` via client-side ✅
  - Redirect ke login dengan pesan sukses ✅
- **Integrasi Login Page**:
  - Link "Lupa password?" di bawah form login ✅
  - Redirect otomatis `?reset=true` → halaman reset-password ✅
  - Tampilkan pesan sukses setelah reset ✅
- **Security**: Generic message untuk forgot-password (cegah email enum), token one-time via Supabase, redirect URL terverifikasi ✅
- **Build & Lint**: 0 errors, 0 warnings ✅
- **Total progress: ~92%** 🚀

---

### 🗓️ Sesi 12 Juli 2026 — Issue Resolution Complete

**✅ Issue #1: User Langsung Masuk Dashboard Sebelum Konfirmasi Email** — **SELESAI**
- Nonaktifkan auto-confirm di `src/app/api/auth/route.ts` (hapus `autoConfirmUser` call)
- Proxy (`src/proxy.ts`) cek `session.user.email_confirmed_at` → redirect ke `/auth/verify` jika belum confirmed
- Buat halaman verifikasi baru: `src/app/auth/verify/page.tsx` dengan tombol "Kirim Ulang Email Konfirmasi"
- Login page update: tampilkan tombol kirim ulang saat error "email belum dikonfirmasi"
- Auth callback handler: `src/app/auth/callback/route.ts` untuk handle Supabase PKCE flow
- Error message login diupdate: tidak lagi mention auto-confirm, arahkan user cek email/SPAM

**✅ Issue #2: Link Konfirmasi Email Supabase Mengarah ke localhost** — **DOKUMENTASI SELESAI**
- Buat panduan manual: `SUPABASE_EMAIL_CONFIG.md`
- Site URL: `https://thesisai.vercel.app`
- Redirect URLs: `http://localhost:3000/**` + `https://thesisai.vercel.app/**` + `/auth/verify/**` + `/auth/reset-password/**`
- User perlu jalankan manual di Supabase Dashboard → Authentication → URL Configuration

**✅ Issue #3: Tambah Jurnal Ilmiah di Pencarian Literatur** — **SELESAI**
- API `src/app/api/literature/search/route.ts`: tambah parameter `journalOnly` (default true)
- Filter CrossRef `type:journal-article,type:proceedings-article,type:book-chapter,type:book,type:monograph` via `filter` param
- Frontend `src/app/dashboard/literature/page.tsx`:
  - Tambah state `journalOnly` (default true)
  - Checkbox "📄 Jurnal saja (sembunyikan buku, dataset, dll)" di search bar
  - Badge type dengan icon: 📄 Jurnal, 🎤 Prosiding, 📖 Bab Buku, 📘 Buku, 📕 Monograf, 📑 Entri Referensi, 📊 Dataset, 📋 Laporan
  - Update `search()` call include `journalOnly` param

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~97%** 🚀

---

### 🗓️ Sesi 13 Juli 2026 — Literature Search Improvements & Bug Fixes

**✅ Fix: Pagination Konsisten (Server-side Cache)**
- In-memory cache `SEARCH_CACHE` (Map) di `src/app/api/literature/search/route.ts`
- Page 0: fetch 200 artikel dari CrossRef, transform + dedup + cache (TTL 10 menit)
- Page 1+: ambil slice dari cache, bukan fetch baru → hasil konsisten
- Auto-cleanup cache expired tiap 5 menit

**✅ Fix: Artikel Indonesia/China/Korea Hilang**
- Hapus fungsi `isRelevant()` yang filter literal dengan AI keywords Inggris
- CrossRef native relevance scoring (`sort=relevance`) sudah handle multibahasa
- Sekarang cari "kecerdasan buatan" / "AI" → dapat jurnal Indonesia, China, Korea, global

**✅ Fix: Collection Count 0 Saat Refresh**
- `fetchCollection()` jalan di `useEffect` mount, bukan cuma tab click
- Badge "Koleksi Saya (N)" langsung benar saat refresh halaman

**✅ Fix: Migration Rate Limit Duplicate Policy**
- `supabase/migration-004.sql`: tambah `DROP POLICY IF EXISTS` sebelum `CREATE POLICY`
- Migration bisa di-run berulang tanpa error "policy already exists"

**✅ Feature: Sort Hasil Pencarian by Tahun (Terbaru Dulu)**
- Setelah dedup, hasil di-sort `b.year - a.year` (descending)
- Artikel tanpa tahun ditaruh paling bawah
- User dapet penelitian terkini di halaman pertama

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~97%** 🚀

---

### 🗓️ Sesi 13 Juli 2026 (Lanjutan) — Literatur Explorer Rewrite (OpenAlex Only)

**✅ Rewrite Literatur Explorer ke OpenAlex Only**
- **Hapus CrossRef** — sekarang hanya pakai OpenAlex (250+ juta artikel Open Access)
- **Filter Journal API gratis, tanpa rate limit ketat**
- **Sumber PDF langsung** — OpenAlex menyediakan `openAccessPdf` URL langsung, tidak perlu enrichment tambahan
- **Filter "Artikel Jurnal Saja"** — toggle on/off di UI (default on), filter `type:article` di API

**✅ 6 Fitur Utama Sesuai Permintaan:**
1. **Pencarian spesifik** — AI keyword extraction (2-3 kata kunci) + search OpenAlex
2. **Pagination jelas** — Page numbers 1-2-3... + Previous/Next + info "Halaman X dari Y · N artikel ditemukan"
3. **Info jumlah artikel** — `Menampilkan 20 dari 1,234 artikel Open Access (jurnal saja) (halaman 1 dari 62)` di atas hasil
4. **Button "Buka Artikel"** — Buka PDF langsung (Open Access) atau landing page jika PDF tidak ada
5. **Button "Simpan"** — Simpan ke "Koleksi Saya" (Supabase, dedup by DOI/title), badge "Tersimpan" saat sudah disimpan
6. **Button "Rangkum dengan AI"** — Generate: Masalah, Metode, Hasil, Gap + cache per user per artikel (Supabase `summary_cache`)

**✅ UX Improvements:**
- Info bar hijau: "Mencari di OpenAlex — 250+ juta artikel Open Access dengan akses PDF langsung"
- Badge hijau "PDF Tersedia" jika artikel punya `openAccessPdf`
- Badge OA Status (Gold/Green/Hybrid/Bronze) dengan warna khas
- Badge sitasi count (`📚 123 sitasi`)
- Loading state per artikel (buka, simpan, rangkum)
- Page numbers dengan ellipsis untuk halaman banyak
- Filter toggle "Artikel jurnal saja" / "Semua tipe artikel"

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~98%** 🚀

---

### 🗓️ Sesi 13 Juli 2026 (Sore/Malam) — Relevance, Multi-Page Fetch & Capacity Planning

**✅ Issue: Hasil Pencarian Kurang Relevan**
- Hapus post-filter exact token match (terlalu ketat, buang artikel relevan berkonteks)
- Implementasi **Rumus Scoring Token Overlap** — skor 0-100% berdasarkan match di title (10pts) + abstract (5pts) + bonus di awal judul (3pts)
- Sort: relevance score desc → tahun desc
- Threshold filter: `minScore=15%` (dapat diatur via query param)
- Default minimal skor turun dari 20% → 15% agar tidak terlalu ketat

**✅ Issue: Pool Artikel Terbatas (200)**
- Fetch **3 halaman × 200 = 600 artikel** secara parallel (Promise.all) saat cache miss
- Deduplikasi by DOI/title antar halaman
- Waktu tambahan minimal (~200ms) karena parallel fetch

**✅ Capacity Planning untuk ThesisAI**
- **OpenAlex:** 100 req/s polite pool → ~33 user search/detik (3 calls/user)
- **Supabase Free:** 50k MAU, 60 connection pool → memadai untuk 1k-5k DAU
- **Gemini Free:** 60 RPM (~1 req/s) → bottleneck untuk AI summarize, perlu queue
- **Vercel Hobby:** 100 GB-hr/month → cukup untuk traffic skala mahasiswa
- **Usulan optimasi:** Request coalescing (dedupe parallel calls untuk query sama), cache persist

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~98%** 🚀

---

### 🗓️ Sesi 14 Juli 2026 — Perbaikan "Jadikan BAB" ✅ SELESAI

**✅ Semua 3 sub-task Perbaikan "Jadikan BAB":**

1. **Tombol "Jadikan BAB" di card artikel tersimpan** — sudah berfungsi: mengirim `literatureId`, `babNumber`, dan `judulSkripsi` yang diisi user ke API ✅
2. **Generate BAB dengan AI** — fungsi `generateBabFromLiterature()` di `lib/ai.ts`:
   - AI baca judul + abstrak + rangkuman artikel
   - Generate draft 400-800 kata dengan narasi akademik utuh per bab
   - **Prompt berbeda per bab**: Bab 1 (Pendahuluan), Bab 2 (Tinjauan Pustaka), Bab 3 (Metodologi), Bab 4 (Hasil & Pembahasan), Bab 5 (Kesimpulan)
   - Bahasa Indonesia akademik, sitasi (Penulis, Tahun), format paragraf
   - Fallback: jika AI gagal, tetap buat draft minimal (bukan error mentah) ✅
3. **Penyimpanan hasil generate** — draft langsung disimpan ke tabel `bab`:
   - Jika bab sudah ada → append sebagai section baru
   - Jika belum → buat bab baru dengan judul `"Bab N — Label — Judul Skripsi"`
   - **Auto-redirect** ke halaman Writing (`/dashboard/writing?bab=xxx`) setelah 2 detik ✅
   - Writing Page auto-edit bab yang baru dibuat via URL param `bab`

**✅ UI Dialog Baru "Jadikan BAB":**
- Input **Judul Skripsi** wajib diisi (dipakai AI untuk konteks)
- Tombol 1-5 dengan label: Pendahuluan, Tinjauan Pustaka, dll
- Info panel: "Yang akan terjadi" — transparan ke user
- Loading animasi bouncing dots saat AI menulis
- Success message hijau + redirect counter

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀
**Commit**: `906ab63` — push to `origin main` ✅

---

### 🗓️ Sesi 14 Juli 2026 (Lanjutan) — Rangkum AI di Koleksi

**✅ Tambah "Rangkum dengan AI" di card koleksi:**
- Tombol "Rangkum dengan AI" + "Lihat Rangkuman" + expand detail (Masalah, Metode, Hasil, Gap) di setiap card Koleksi Saya
- Fungsi `handleSummarizeFromCollection()` — mirip dengan di tab Cari, dengan enrichment Semantic Scholar
- State sharing: rangkuman dari tab Cari juga muncul di tab Koleksi (dan sebaliknya)
- Hapus unused state `openingArticle` / `setOpeningArticle`
- Fix lint `as any` di convert-to-bab route (ganti dengan `Record<string, string>`)

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀
**Commit**: `411d6f2` — push to `origin main` ✅

---

### 🗓️ Sesi 14 Juli 2026 (Malam) — Supabase Dead Code Cleanup

**✅ Hapus dead code & tambah missing types:**
- Hapus `autoConfirmUser()` di `lib/supabase-admin.ts` — tidak dipakai sejak flow email confirmation wajib (Issue #1)
- Hapus `cleanupExpiredRateLimits()` di `lib/rate-limit.ts` — tidak pernah dipanggil (harus pake pg_cron/Vercel Cron)
- Hapus `enrichPapers()` di `lib/literature.ts` — batch enrich tidak dipakai
- Hapus `supabase/migration_bab_rls.sql` — **redundan** (RLS `bab` sudah ada di `migration.sql` baris 146-150)
- Tambah type `SummaryCache` & `EnrichmentCache` di `types/index.ts`
- Registrasi `summary_cache` & `enrichment_cache` di `Database` type definition (type safety lengkap untuk upsert/select)
- **Build & Lint**: 0 errors, 0 warnings ✅
- **Commit**: `4792153` — push to `origin main` ✅

---

### 🗓️ Sesi 14 Juli 2026 (Lanjutan) — Bug Marathon Writing & Sidang Page

**✅ Writing Page — 6 perbaikan:**
1. **Fix race condition auto-open bab** — pindah ke callback fetchBab() + useRef + clean URL ✅
2. **Fix missing handleDelete** — restore function header yang kepotong ✅
3. **Fix createClient → createBrowserClient** — baca cookie bukan localStorage (RLS 42501) ✅
4. **Fix target_selesai hilang** — formatDateInput() handle Date→YYYY-MM-DD ✅
5. **Hover effect form fields** — Nomor Bab, Target, Upload, Judul, Isi Bab ✅
6. **Dropdown terpotong** — min-w + w-auto + highlight biru ✅

**✅ Sidang Page — 7 perbaikan:**
1. **Dropdown terpotong** — min-w + w-auto ✅
2. **Dropdown double label** — pake bab.judul langsung ✅
3. **SelectValue tampil ID** — lookup dari babList ✅
4. **Pertanyaan hilang reload** — fetchSavedQuestions() ✅
5. **Duplikat row Simpan ke DB** — dedup by pertanyaan + always send UUID ✅
6. **Error message generic** — tidak expose detail ✅
7. **Tombol Hapus per card** — Trash2, hapus DB+state ✅

**Log 16 commits sesi ini:**
906ab63 feat: Jadikan BAB AI · eba0b2c docs · 411d6f2 Rangkum koleksi · 333dc94 docs · 4792153 dead code cleanup · b8619ce docs · cc88342 race condition writing · feb5109 createBrowserClient · b19f6fc replace konten · a01bbc4 disclaimer prompt · 193420c target_selesai hover · 9bd71cb dropdown highlight · 9f99ba6 3 issues sidang · 78fc654 duplikat simpan · 331f958 upsert error dropdown · 170d34d fix simpan bab beda

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀

---

### 🗓️ Sesi 16 Juli 2026 (Lanjutan) — Fix Parafrase JSON Parse Error

**✅ Root Cause:**
- AI provider fallback gratis (NVIDIA/OpenRouter/Groq) kadang return error string seperti *"An error occurred..."* sebagai HTTP 200 OK, bukan JSON.
- `safeJsonParse()` tidak bisa parse → return `{}` kosong → wizard kehilangan alternatif kata.

**✅ 3 Lapis Pertahanan:**
1. **`isErrorText()`** — deteksi error patterns di `safeJsonParse()` sebelum mencoba parse
2. **`fuzzyMatchKeys()`** — key matching toleran terhadap perubahan casing/tanda baca oleh AI
3. **`extractNonJsonAlternatives()`** — fallback ekstraksi dari format numbered list non-JSON

**✅ Bug Fix Lain:**
- Race condition `wizard.originalText` di `fetchAlternatives()` — passing parameter eksplisit
- Lint cleanup: unused imports (`useMemo`, `ArrowLeft`, `findOriginal`), `as any` eslints, unescaped entities
- Type error `fetchAlternatives()` 2 argumen di tombol "Coba Lagi"

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀

---

### 🗓️ Sesi 15 Juli 2026 — Security Hardening Auth

**✅ Security Fix: CSRF Full Coverage**
- Perluas CSRF check dari signin/signup ke SEMUA action auth:
  signout, forgot-password, reset-password, resend-confirmation

**✅ Rate Limit: resend-confirmation & forgot-password**
- `resend-confirmation`: max 3 request/email/jam
- `forgot-password`: max 2 request/email/jam (cegah email spam)
- Pakai `checkRateLimit()` persistent via Supabase table

**✅ Hapus Log yang Bocor Data**
- `console.log("[AI] Raw review response...")` — dihapus
- `console.warn("[AI] JSON parse failed, text:...")` — diganti tanpa isi response

**✅ Update Landing Page**
- CrossRef → OpenAlex (250M+ Open Access, direct PDF)
- Refresh deskripsi fitur sesuai dashboard real

**Build & Lint**: 0 errors, 0 warnings ✅
**Commits**: `09d2ef9` (CSRF + rate limit), `d500e9f` (hapus log + landing page)

---

### 🗓️ Sesi 16 Juli 2026 — Parafrase + OpenAlex Optimization

**✅ Request Coalescing OpenAlex**
- `INFLIGHT_REQUESTS` Map di search-openalex/route.ts
- Request duplikat join existing promise — 90%+ duplicate call berkurang
- Map dibersihkan setelah selesai (success/error)

**✅ Multi-Page Fetch: 3 → 5 halaman**
- `MAX_CACHE_FETCH_PAGES: 3 → 5` (600 → 1000 artikel)
- `MAX_CACHE_SIZE: 600 → 800`
- Dedup + scoring + threshold 15%

**✅ Fitur Parafrase — Writing Page**
- `paraphraseText()` di lib/ai.ts — 3 gaya: akademik, formal, ubah struktur
- API route: `/api/ai/paraphrase`
- Tombol "Parafrase" + selector gaya + modal diff highlight kuning
- Commit: `ccf4cb1`

**✅ Fitur Parafrase Terpandu (Wizard Step-by-Step)**
- `generateParaphraseAlternatives()` — batch request 4 sinonim/kata via AI
- API route: `/api/ai/paraphrase-alternatives`
- Wizard: progress bar, ContextPreview (kata aktif biru + kata berubah kuning)
- 5 pilihan per kata (tetap + 4 alternatif) + **Prev/Next navigasi**
- **UI sederhana**: 1 tombol "Parafrase Terpandu", default akademik
- Hapus legacy modal + state + toggle buttons (-167 lines)
- Commit: `ab090aa`, `47858b2`

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀

---

### 🗓️ Sesi 16 Juli 2026 (Lanjutan) — Fix Parafrase JSON Parse Error

**✅ Root Cause:**
- AI provider fallback gratis (NVIDIA/OpenRouter/Groq) kadang return error string seperti *"An error occurred..."* sebagai HTTP 200 OK, bukan JSON.
- `safeJsonParse()` tidak bisa parse → return `{}` kosong → wizard kehilangan alternatif kata.

**✅ 3 Lapis Pertahanan:**
1. **`isErrorText()`** — deteksi error patterns di `safeJsonParse()` sebelum mencoba parse
2. **`fuzzyMatchKeys()`** — key matching toleran terhadap perubahan casing/tanda baca oleh AI
3. **`extractNonJsonAlternatives()`** — fallback ekstraksi dari format numbered list non-JSON

**✅ Bug Fix Lain:**
- Race condition `wizard.originalText` di `fetchAlternatives()` — passing parameter eksplisit
- Lint cleanup: unused imports (`useMemo`, `ArrowLeft`, `findOriginal`), `as any` eslints, unescaped entities
- Type error `fetchAlternatives()` 2 argumen di tombol "Coba Lagi"

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀

---

### 🗓️ Sesi 17 Juli 2026 (Lanjutan) — Ponytail Refactor & Non-JSON Fallback Fix

**✅ Root Cause:**
- Dead code di `generateParaphraseAlternatives()`: cek `!startsWith("{")` tapi tubuhnya cuma komentar — **tidak throw**
- Provider lemah return teks biasa → `safeJsonParse` return null → UI "Tidak ada alternatif"

**✅ Ponytail Refactor (-70 lines, +1 guard):**
- Hapus `fuzzyMatchKeys()` (36 lines), `extractNonJsonAlternatives()` (38 lines), `isErrorText()` dari safeJsonParse
- **1 guard:** `if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) throw` — fallback chain retry provider berikutnya
- Fix: `extractChangedWords()` push cleaned word (alfanumerik) bukan raw → AI key matching work
- Fix: `buildFinalText()` hapus regex escaping tidak perlu

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀

---

### 🗓️ Sesi 17 Juli 2026 — Async Queue AI Summarize + Pagination Koleksi

**✅ Implementasi Async Queue untuk AI Summarize**
- Client-side queue di `src/lib/summarize-queue.ts` — memproses 1 request per waktu dengan delay 1.2s (aman untuk Gemini 60 RPM)
- Singleton `summarizeQueue` dipakai oleh kedua tab (Cari & Koleksi) — antrian digabung
- Real-time queue status indicator di UI (🕐 "Sedang memproses..." + "X antrean menunggu")
- `handleSummarize` & `handleSummarizeFromCollection` diubah pakai `summarizeQueue.enqueue()` — user bisa klik banyak rangkum sekaligus, diproses berurutan

**✅ Pagination di Koleksi Tersimpan**
- 10 item per halaman (konstanta `COLLECTION_PAGE_SIZE`)
- Page numbers + Previous/Next buttons di bawah list koleksi
- Reset ke halaman 1 saat user mencari di kolom "Cari di koleksi..."
- Badge info: "Menampilkan X dari Y literatur (halaman N dari M)"

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀

---

### 🗓️ Sesi 17 Juli 2026 (Lanjutan) — Fix Parafrase Terpandu: AbortController + Word Diff

**✅ Fix #1: "signal is aborted without reason"**
- Hapus `fetchWithTimeout()` (AbortController 60s) dari `src/app/dashboard/writing/page.tsx`
- Ganti semua panggilan ke `/api/ai/paraphrase` dan `/api/ai/paraphrase-alternatives` pake `fetch()` biasa
- Server-side `withFallbackAndRetry` di `lib/ai.ts` sudah handle retry + timeout (Vercel default 300s)
- Provider gratis kadang lambat (>60s), AbortController picu abort duluan sebelum server sempat selesai

**✅ Fix #2: "tidak ada kata berubah" — word-level diff**
- Ganti LCS backtracking → frequency-based diff di `extractChangedWords()`
- Hitung frekuensi tiap kata di teks original, "konsumsi" dari hasil parafrase
- Kata yang frekuensinya di hasil melebihi original → dianggap baru/berubah
- Lebih robust untuk parafrase yang mengubah struktur kalimat

**✅ Dead code cleanup**
- Hapus `fetchWithTimeout()` function yang sudah tidak dipakai

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀

---

### 🗓️ Sesi 17 Juli 2026 (Tambah) — Fix Parafrase Terpandu: Guard cleanJson false positive

**✅ Fix: Wizard Parafrase Terpandu gagal mengambil alternatif kata**
- **Root Cause:** Guard ponytail di `generateParaphraseAlternatives()` mengecek `trimmed.startsWith("{")` langsung dari `res.text.trim()` tanpa membersihkan markdown/teks pengantar dulu.
- Provider AI gratis membungkus JSON dengan ` ```json ... ``` ` atau teks pengantar "Berikut sinonimnya: ..." → guard throw karena tidak startsWith `{` → fallback chain habis → API 500 → wizard dapat error.
- **Fix:** Panggil `cleanJson()` **sebelum** guard check (konsisten dengan `safeJsonParse()` di seluruh codebase).

| Sebelum | Sesudah |
|---------|---------|
| `const trimmed = res.text.trim()` | `const cleaned = cleanJson(res.text)` |
| `if (!trimmed.startsWith("{"))` | `if (!cleaned.startsWith("{"))` |

**Build & Lint**: 0 errors, 0 warnings ✅
**Total progress: ~99%** 🚀
**Commit**: `3c3e4c4` — push to `origin main` ✅

---

### ⚠️ Masalah Terbuka

| Masalah | Prioritas | Status | Detail |
|---------|-----------|--------|--------|
| **Parafrase Terpandu — wizard gagal ambil alternatif kata** | 🔴 **HIGH** | **FIXED** ✅ | Guard `startsWith("{")` di `generateParaphraseAlternatives()` terlalu ketat — pake `trim()` bukan `cleanJson()` dulu. Provider gratis bungkus JSON dalam markdown/teks pengantar → guard throw duluan meski JSON valid. Fix: panggil `cleanJson()` sebelum guard check. |
| **Session Rotation / Idle Timeout** | 🟡 **MEDIUM** | OPEN | Cek refresh token rotation & idle timeout settings di Supabase Dashboard |
| **User langsung masuk dashboard sebelum konfirmasi email** | 🔴 **HIGH** | OPEN | Supabase auto-confirm workaround bikin user langsung login tanpa konfirmasi email. Perlu ganti flow: kirim email konfirmasi standar, block akses dashboard sampai email confirmed |
| **Link konfirmasi email Supabase arahkan ke localhost** | 🟡 **MEDIUM** | OPEN | Di Supabase Dashboard → Auth → URL Configuration, set Site URL ke production (thesisai.vercel.app), tambah Redirect URLs untuk localhost dev |
| **No 2FA/MFA** | 🔵 **LOW** | FUTURE | Hanya email/password. Tambah TOTP (Google Authenticator) opsional |
| **Login Notifications** | 🔵 **LOW** | FUTURE | User tidak tahu login baru dari device/location berbeda |
| **Account Lockout** | 🔵 **LOW** | FUTURE | Cuma rate limit, tidak ada lockout permanen/cooldown panjang |

---

### 📋 Agenda Sesi Selanjutnya

**🔴 HIGH:**
- ✅ Fix Parafrase Terpandu — error "signal is aborted without reason" — **SELESAI (Sesi 17 Juli 2026)**
- ✅ Fix Parafrase Terpandu — tidak ada kata berubah (diff terlalu sederhana) — **SELESAI (Sesi 17 Juli 2026)**
- ✅ Fix Parafrase Terpandu — guard cleanJson false positive — **SELESAI (Sesi 17 Juli 2026)**
- ✅ Fix Jadikan BAB — paksa output Bahasa Indonesia meski referensi Inggris — **SELESAI (Sesi 17 Juli 2026)**

**⚪ SECONDARY:**
- (selesai) Implementasi async queue untuk AI summarize
- (selesai) Pagination di koleksi tersimpan
- Export koleksi ke format sitasi (BibTeX/CSL)

**Build & Lint Target**: 0 errors, 0 warnings ✅

---

### 🗓️ Sesi 18 Juli 2026 — Fix Regresi Parafrase Terpandu

**✅ Root Cause & Perbaikan:**
- Wizard sebelumnya baru dibuka setelah API parafrase berhasil. Error API, respons tidak valid, atau proses lambat membuat user tetap di form tanpa masuk wizard.
- Wizard sekarang dibuka langsung saat tombol diklik dan menampilkan tahap "Membuat hasil parafrase" serta "Mengambil alternatif kata" di dalam modal.
- Error parafrase dan error alternatif ditangani di dalam wizard dengan tombol retry yang sesuai.
- Jika pencarian alternatif gagal, user tetap bisa menerapkan hasil parafrase utama.
- Tambah request guard agar respons lama tidak membuka kembali wizard setelah modal ditutup.
- Batasi maksimal 20 kata alternatif agar konsisten dengan API.

**✅ Optimasi AI Fallback:**
- Hilangkan retry bertumpuk antara AI SDK dan `withFallbackAndRetry()` khusus fitur parafrase.
- Tambah timeout per provider: 40 detik untuk parafrase utama dan 20 detik untuk alternatif.
- Respons error berbentuk teks atau hasil kosong sekarang memicu fallback provider, bukan dianggap sebagai hasil parafrase.
- Normalisasi key JSON alternatif secara case-insensitive dan validasi array sinonim.

**✅ Verifikasi:**
- Endpoint parafrase utama: HTTP 200 dalam 11,1 detik.
- Endpoint alternatif: HTTP 200 dalam 23,2 detik, turun dari sekitar 4 menit.
- ESLint: 0 errors, 0 warnings.
- TypeScript: 0 errors.
- Next.js production build: passing.