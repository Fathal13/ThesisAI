import type { Metadata } from "next"
import { BookOpen } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Kebijakan Privasi — ThesisAI",
  description: "Kebijakan privasi ThesisAI — bagaimana kami mengelola dan melindungi data pengguna.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="container mx-auto px-4 py-6 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
          <BookOpen className="size-6 text-primary" />
          <span>ThesisAI</span>
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Kebijakan Privasi</h1>
        <p className="text-sm text-muted-foreground mb-8">Terakhir diperbarui: 10 Juli 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Data yang Kami Kumpulkan</h2>
            <p>Untuk memberikan layanan ThesisAI, kami mengumpulkan data berikut:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Data Akun:</strong> nama, email (saat pendaftaran)</li>
              <li><strong>Data Skripsi:</strong> konten bab, judul skripsi, target deadline yang kamu masukkan</li>
              <li><strong>Data Literatur:</strong> daftar literatur yang kamu simpan dan rangkuman AI</li>
              <li><strong>Data Penggunaan:</strong> halaman yang dikunjungi, fitur yang digunakan (via Vercel Analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Bagaimana Data Digunakan</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Menyediakan fitur AI: merangkum literatur, mereview tulisan, generate pertanyaan sidang</li>
              <li>Menyimpan progress skripsi agar bisa diakses kapan saja</li>
              <li>Meningkatkan kualitas layanan berdasarkan pola penggunaan</li>
              <li><strong>Kami tidak menjual data kamu ke pihak ketiga.</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Penyimpanan Data</h2>
            <p>
              Semua data disimpan di <strong>Supabase</strong> (database PostgreSQL) yang berlokasi di region AS.
              Kami menggunakan keamanan <strong>Row Level Security (RLS)</strong> untuk memastikan setiap user
              hanya bisa mengakses datanya sendiri.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Layanan Pihak Ketiga</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Google Gemini / NVIDIA NIM / OpenRouter / Groq:</strong> Pemrosesan AI (teks dikirim ke API, tidak digunakan untuk training)</li>
              <li><strong>CrossRef:</strong> Pencarian literatur akademik</li>
              <li><strong>Vercel:</strong> Hosting aplikasi</li>
              <li><strong>Supabase:</strong> Database & autentikasi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Hak Pengguna</h2>
            <p>Kamu berhak untuk:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Mengakses</strong> semua data yang kami simpan tentang kamu</li>
              <li><strong>Memperbaiki</strong> data yang tidak akurat</li>
              <li><strong>Menghapus</strong> akun dan semua data kamu kapan saja</li>
              <li><strong>Mengekspor</strong> data kamu</li>
            </ul>
            <p className="mt-3">
              Untuk menghapus akun, kirim email ke <code className="bg-muted px-2 py-0.5 rounded text-sm">thesisai.app@email.com</code>
              atau gunakan fitur hapus akun di halaman Pengaturan (segera hadir).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Keamanan</h2>
            <p>
              Kami menerapkan langkah-langkah keamanan standar industri:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Semua koneksi menggunakan HTTPS (enkripsi TLS)</li>
              <li>API key AI disimpan di server-side (tidak bocor ke client)</li>
              <li>RLS (Row Level Security) di seluruh tabel database</li>
              <li>Rate limiting untuk mencegah abuse</li>
              <li>Password: minimum 8 karakter, wajib kombinasi huruf & angka</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Kontak</h2>
            <p>
              Jika ada pertanyaan tentang kebijakan privasi ini, hubungi:
              <br />
              Email: <code className="bg-muted px-2 py-0.5 rounded text-sm">thesisai.app@email.com</code>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <Link href="/syarat-ketentuan" className="underline hover:text-primary">Syarat & Ketentuan</Link>
          <span className="mx-3">·</span>
          <Link href="/" className="underline hover:text-primary">Beranda</Link>
        </div>
      </main>
    </div>
  )
}
