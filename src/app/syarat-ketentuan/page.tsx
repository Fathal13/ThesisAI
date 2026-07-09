import type { Metadata } from "next"
import { BookOpen } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — ThesisAI",
  description: "Syarat dan ketentuan penggunaan ThesisAI — asisten skripsi gratis untuk mahasiswa Indonesia.",
}

export default function TermsPage() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="container mx-auto px-4 py-6 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
          <BookOpen className="size-6 text-primary" />
          <span>ThesisAI</span>
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Syarat & Ketentuan</h1>
        <p className="text-sm text-muted-foreground mb-8">Terakhir diperbarui: 10 Juli 2026</p>

        <div className="space-y-6">
          {/* ⚖️ Integritas Akademik — PENTING */}
          <section className="p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Integritas Akademik
            </h2>
            <p className="font-medium mb-2">
              ThesisAI adalah <strong>asisten</strong>, bukan joki skripsi.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>AI memberikan <strong>review, saran, dan bantuan pemahaman</strong> — bukan menulis skripsi untukmu</li>
              <li>Kamu bertanggung jawab penuh atas isi skripsi yang kamu tulis</li>
              <li>Gunakan sesuai aturan dan kebijakan kampusmu</li>
              <li>Kami tidak bertanggung jawab jika penggunaan ThesisAI melanggar aturan institusi pendidikanmu</li>
              <li>Contoh jawaban sidang hanya untuk latihan, bukan untuk dihafal atau disalin mentah-mentah</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Layanan</h2>
            <p>
              ThesisAI menyediakan alat bantu gratis untuk mahasiswa Indonesia dalam mengerjakan skripsi:
              Literatur Explorer, Writing Assistant, Sidang Prep Generator, dan Progress Tracker.
              Semua fitur menggunakan AI untuk memberikan saran dan review — bukan untuk menghasilkan konten final.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Akun Pengguna</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kamu harus mendaftar dengan data yang benar untuk menggunakan layanan</li>
              <li>Kamu bertanggung jawab menjaga kerahasiaan password akunmu</li>
              <li>Satu orang hanya boleh memiliki satu akun</li>
              <li>Kami berhak menonaktifkan akun yang digunakan untuk penyalahgunaan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Penggunaan yang Wajar</h2>
            <p>Untuk menjaga layanan tetap gratis untuk semua, kamu setuju untuk:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tidak melakukan spam atau request berlebihan ke API</li>
              <li>Tidak menggunakan layanan untuk tujuan ilegal atau melanggar aturan akademik</li>
              <li>Tidak mencoba meretas, mengeksploitasi, atau membebani sistem</li>
              <li>Tidak menggunakannya untuk menghasilkan konten yang melanggar hukum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Batasan Tanggung Jawab</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>ThesisAI disediakan &quot;apa adanya&quot; tanpa jaminan uptime 100%</li>
              <li>Rangkuman dan review AI <strong>tidak 100% akurat</strong> — verifikasi dengan sumber asli</li>
              <li>Kami tidak bertanggung jawab atas keputusan akademik yang didasarkan pada saran AI</li>
              <li>Layanan bisa berubah atau dihentikan sewaktu-waktu (tapi kami akan usahakan tetap gratis!)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Hak Kekayaan Intelektual</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Konten skripsi yang kamu tulis tetap sepenuhnya milikmu</li>
              <li>Kami tidak mengklaim hak kepemilikan atas tulisanmu</li>
              <li>Kode dan desain ThesisAI dilindungi hak cipta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Donasi & Monetisasi</h2>
            <p>
              ThesisAI saat ini gratis. Donasi sukarela via Saweria/Ko-fi diterima untuk biaya operasional.
              Donasi <strong>tidak</strong> memberikan hak istimewa atau akses eksklusif.
              Jika donasi mencukupi, kami berencana menambah fitur premium opsional — fitur dasar tetap gratis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Perubahan Syarat</h2>
            <p>
              Kami dapat mengubah syarat dan ketentuan ini sewaktu-waktu.
              Perubahan akan diumumkan melalui aplikasi. Dengan terus menggunakan ThesisAI setelah perubahan,
              kamu dianggap menyetujui syarat yang baru.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <Link href="/kebijakan-privasi" className="underline hover:text-primary">Kebijakan Privasi</Link>
          <span className="mx-3">·</span>
          <Link href="/" className="underline hover:text-primary">Beranda</Link>
        </div>
      </main>
    </div>
  )
}
