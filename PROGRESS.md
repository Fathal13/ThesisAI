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

- [ ] Tegaskan positioning: AI membantu **review, saran, & pemahaman** — bukan menulis skripsi untuk user
- [ ] Writing Assistant TIDAK meng-generate isi bab utuh; hanya review, perbaikan kalimat, & saran struktur
- [ ] Tampilkan disclaimer di UI: "Gunakan sesuai aturan kampusmu. Tanggung jawab akhir ada pada penulis."
- [ ] Sidang Prep: contoh jawaban ditandai jelas sebagai "contoh untuk latihan", bukan untuk disalin
- [ ] Pertimbangkan info edukatif soal deteksi AI (Turnitin AI dll) agar user sadar risiko

---

## 🎯 Tahap 1: Foundation & Infrastructure

### 1.1 — Inisialisasi Proyek 🟢 [MVP]
- [x] Buat project Next.js 15 (App Router) + TypeScript
- [x] Setup Tailwind CSS + Shadcn UI
- [x] Setup ESLint + Prettier
- [x] Init Git repo + push ke GitHub
- [ ] Deploy ke Vercel (thesisai.vercel.app)
- [ ] Simpan semua secret di env vars (JANGAN commit `.env`)

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
- [x] **Aktifkan Row Level Security (RLS) di SEMUA tabel** — user hanya bisa akses datanya sendiri (SQL siap di `supabase/migration.sql`)
- [ ] Uji RLS: pastikan user A tidak bisa membaca data user B

### 1.3 — AI Layer (Gemini) 🟢 [MVP]
- [ ] Setup Google AI Studio → dapatkan API Key gratis
- [x] Install `@ai-sdk/google` + `ai`
- [x] Buat `lib/ai.ts` — helper functions untuk semua fitur AI (dengan retry + rate limit handling)
- [x] Buat API route `/api/ai` — server-only, key tidak ke client
- [ ] Test koneksi Gemini (pastikan free tier aktif)
- [x] Tangani rate limit & kuota: retry + pesan error ramah + caching hasil AI (di `lib/ai.ts`)

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
- [ ] Input pencarian (judul/topik/penulis)
- [ ] Integrasi CrossRef API (gratis) — sertakan `mailto` di header untuk pool sopan
- [ ] Tampilkan hasil: judul, penulis, tahun, DOI, link
- [ ] Pagination hasil pencarian
- [ ] Tangani error/timeout API dengan anggun

### 3.2 — AI Summarize 🟢 [MVP]
- [ ] Tombol "Rangkum dengan AI" per artikel
- [ ] Gemini generate: problem, metode, hasil, gap
- [ ] **Cache rangkuman** agar tidak boros kuota untuk artikel yang sama
- [ ] Simpan rangkuman ke database
- [ ] Copy rangkuman ke clipboard

### 3.3 — Literature Collection 🔵 [LATER]
- [ ] Tombol "Simpan ke Koleksi Saya"
- [ ] Halaman daftar literatur tersimpan
- [ ] Filter & search di koleksi sendiri
- [ ] Hapus dari koleksi

---

## 🎯 Tahap 4: Writing Assistant ✍️

> ⚠️ Fokus: **review & saran**, bukan menulis isi bab untuk user.

### 4.1 — Input Bab 🟢 [MVP]
- [ ] Form input judul bab (Bab 1-5)
- [ ] Textarea / rich text untuk konten bab
- [ ] Target deadline per bab
- [ ] Upload file (docx/txt) — optional 🔵 [LATER]

### 4.2 — AI Review 🟢 [MVP]
- [ ] Tombol "Review dengan AI"
- [ ] Gemini check:
  - [ ] Grammar & typo (khusus akademik)
  - [ ] Rekomendasi kata lebih formal
  - [ ] Struktur bab: apakah sesuai standar?
  - [ ] Deteksi kalimat ambigu
- [ ] Tampilkan hasil review per kategori
- [ ] Copy saran perbaikan

### 4.3 — Manajemen Bab 🟢 [MVP]
- [ ] List semua bab user
- [ ] Status per bab (draft, review, revisi, selesai)
- [ ] Edit & hapus bab
- [ ] Update progress otomatis saat status berubah

---

## 🎯 Tahap 5: Sidang Prep Generator 🎤

### 5.1 — Generate Pertanyaan 🟢 [MVP]
- [ ] Pilih bab yang ingin dijadikan bahan
- [ ] Gemini generate 10-15 pertanyaan berdasarkan konten bab
- [ ] Kategorisasi: Metodologi, Teori, Hasil, Impak
- [ ] Tampilkan pertanyaan + kategori

### 5.2 — Simulasi Jawaban 🔵 [LATER]
- [ ] Tombol "Lihat Contoh Jawaban" (ditandai jelas: contoh latihan)
- [ ] Gemini generate jawaban akademik yang baik
- [ ] User bisa tulis jawaban sendiri sebagai latihan
- [ ] Bandingkan jawaban user vs AI

### 5.3 — Review Pertanyaan 🔵 [LATER]
- [ ] Simpan pertanyaan favorit (yang mungkin ditanya)
- [ ] Export pertanyaan ke PDF (sederhana)
- [ ] Hapus / tandai sudah dikuasai

---

## 🎯 Tahap 6: Progress Dashboard 📊

### 6.1 — Overview 🟢 [MVP]
- [ ] Total progress (berapa bab dari 5 sudah selesai)
- [ ] Progress bar per bab
- [ ] Deadline countdown
- [ ] Motivasi quotes random

### 6.2 — Timeline 🔵 [LATER]
- [ ] Deadline sidang (input manual)
- [ ] Auto-generated timeline: target per minggu
- [ ] Reminder: "Target Bab 1 selesai dalam 3 hari lagi!"
- [ ] Sederhana — no email/SMS, cukup di dashboard

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
- [ ] Testing semua fitur
- [ ] Fix bug & edge cases
- [ ] Optimasi loading & UX
- [ ] SEO dasar (meta tags, Open Graph)
- [ ] Uji aksesibilitas dasar (kontras, keyboard, alt text)

### 8.2 — Legal & Kepatuhan 🟢 [MVP]
- [ ] Privacy Policy (jelaskan data apa yang disimpan & kenapa)
- [ ] Terms of Service + disclaimer integritas akademik
- [ ] Alur consent saat sign-up
- [ ] Cara user menghapus akun & datanya (hak atas data)

### 8.3 — Launch 🟢 [MVP]
- [ ] Post di Twitter / LinkedIn
- [ ] Share ke grup mahasiswa
- [ ] (Opsional) Buka open source di GitHub
- [ ] Collect feedback untuk iterasi

---

## 📈 Progress Overview

> Perbarui angka ini setiap menyelesaikan task. Hitung: `[x]` ÷ total checkbox per tahap.

```
Phase 1: Foundation     ███████░░░░░░░░░░░░░░░   ~68%
Phase 2: Landing Page   ████████████████████   100%
Phase 3: Literatur      ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: Writing        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Sidang         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: Dashboard      ░░░░░░░░░░░░░░░░░░░░   0%
Phase 7: Donasi         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 8: Final + Launch ░░░░░░░░░░░░░░░░░░░░   0%

TOTAL: ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ~24%
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
| Kuota Gemini free habis | Fitur AI mati | Caching, rate-limit per user, pesan error jelas |
| Isu integritas akademik | Reputasi/legal | Positioning "asisten", disclaimer, batasi generate |
| Vercel Hobby non-komersial | ToS terlanggar saat donasi | Pindah host / plan sebelum monetisasi |
| Data pribadi bocor | Legal (UU PDP) | RLS Supabase, server-side keys, privacy policy |
| Batas free tier Supabase | App down saat traffic naik | Pantau usage, optimasi query, rencana upgrade |

---

## 📝 Catatan

- **AI hanya pakai Gemini (GRATIS).** Claude hanya akan ditambahkan jika donasi sudah cukup.
- **Semua fitur gratis.** Tidak ada paksa bayar.
- **Donasi 100% sukarela** — via Saweria/Ko-fi, tanpa backend.
- **MVP pertama fokus fungsional dulu**, polish belakangan. Kerjakan dulu semua yang bertanda 🟢 [MVP].
- **Keamanan bukan opsional:** RLS + server-side API key + env vars sejak awal.

---

> "Selesai tepat waktu bukan mimpi — tinggal dibantu dikit." 🎓
