@AGENTS.md

# AI Agent Safety Rules

## Prinsip Umum
- Jangan pernah menjalankan perintah destruktif tanpa konfirmasi eksplisit dari user.
- Selalu tampilkan perintah lengkap sebelum dieksekusi dan jelaskan efeknya.
- Jika ragu, BERHENTI dan tanya. Jangan berasumsi.
- Batasi semua operasi pada direktori proyek ini saja.

## Perintah yang DILARANG (tanpa izin eksplisit)
- `rm -rf`, `rm` rekursif, atau menghapus di luar folder proyek
- `sudo` / eskalasi privilege apa pun
- `chmod -R`, `chown -R` pada path sistem
- `git push --force`, `git reset --hard`, menghapus branch
- Menulis ulang / menghapus history git
- `dd`, format disk, mengubah partisi
- Mengubah file sistem: `/etc`, `~/.ssh`, `~/.bashrc`, dll.
- `curl ... | bash` atau `wget ... | sh` (eksekusi skrip dari internet)
- Meng-install package global tanpa izin
- Mematikan proses sistem (`kill -9` pada PID sistem)

## Wajib Konfirmasi Dulu
- Menghapus file atau folder apa pun
- Mengubah dependency (`package.json`, lockfile)
- Menjalankan migrasi database atau perintah yang menyentuh DB produksi
- Operasi jaringan yang mengirim data keluar
- Commit atau push ke remote

## Rahasia & Kredensial
- Jangan pernah membaca, mencetak, atau meng-commit file rahasia:
  `.env`, `*.key`, `*.pem`, kredensial, token, API key.
- Jangan kirim isi file ke layanan eksternal.
- Jika menemukan secret di kode, laporkan — jangan tampilkan nilainya.

## Lingkungan
- Asumsikan ini environment produksi kecuali dinyatakan sebaliknya.
- Jangan sentuh resource di luar scope proyek.
- Jalankan hal berisiko hanya di sandbox/branch terpisah.

## Saat Terjadi Error
- Berhenti setelah error; jangan "brute-force" dengan mencoba banyak perintah.
- Jelaskan apa yang gagal sebelum mencoba solusi lain.

---

# ThesisAI Project Rules

## Project Overview
- **Nama:** ThesisAI — Web app gratis bantu mahasiswa skripsi
- **Budget:** $0 (Vercel Hobby + Supabase Free + Gemini API Free)
- **Stack:** Next.js 15 + TypeScript + Tailwind + Supabase + Gemini API
- **URL:** thesisai.vercel.app

## Development Rules

### 1. Zero-Budget Enforcement
- SEMUA teknologi harus pakai free tier (Vercel, Supabase, Gemini API)
- JANGAN pernah suggest layanan berbayar kecuali user minta eksplisit
- Jika butuh fitur premium → tambah ke Phase 7+ (donasi-based)

### 2. AI Usage (Gemini Only untuk MVP)
- Hanya pakai Google Gemini (gratis via `@ai-sdk/google`)
- TIDAK pakai Claude API kecuali: user minta, ATAU donasi sudah cukup untuk cover cost
- Prompt engineering di `lib/ai.ts` — centralized, reusable
- Cache response kalau bisa (rate limit 60 RPM)

### 3. Database (Supabase)
- Semua migration via Supabase Dashboard / SQL Editor
- JANGAN commit `.env.local` atau supabase keys
- RLS (Row Level Security) WAJIB di semua tabel user data

### 4. Authentication
- NextAuth.js (Auth.js v5) dengan Supabase adapter
- Provider: Google OAuth + Email/Password
- Protected routes: middleware check session

### 5. Deployment
- Deploy ke Vercel otomatis via GitHub push
- Environment variables di Vercel Dashboard (bukan .env)
- Preview deployment untuk setiap PR

### 6. Code Style
- TypeScript strict mode
- ESLint + Prettier (auto-fix on save)
- Component: functional, server-first (RSC)
- API: tRPC atau Next.js API Routes

### 7. File Structure
```
app/
  (auth)/login, register
  (dashboard)/dashboard, literature, writing, sidang, progress
  api/ai/...
  layout.tsx, page.tsx
components/
  ui/ (shadcn)
  dashboard/
  literature/
  writing/
  sidang/
lib/
  ai.ts          # SEMUA logika AI di sini
  supabase/
  utils.ts
types/
```

### 8. Git Workflow
- Branch: `main` (production), `dev` (staging)
- Feature branch: `feat/nama-fitur`
- Commit message: conventional commits (`feat:`, `fix:`, `docs:`)
- PR wajib review sebelum merge ke main

### 9. Testing & Quality
- Manual test di preview deployment
- Lint check sebelum commit (`npm run lint`)
- Type check (`npm run type-check`)

### 10. Documentation
- Update PROGRESS.md setiap selesai task
- Komentar kode untuk logic kompleks (AI prompt, DB query)
- README.md update kalau ada setup baru