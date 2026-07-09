import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/**
 * Disclaimer integritas akademik — tampilkan di halaman yang menggunakan AI.
 * Peringatan kalau AI hanya asisten, bukan pengganti kerja ilmiah.
 */
export function AcademicDisclaimerSimple() {
  return (
    <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
      <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-sm font-semibold text-amber-800 dark:text-amber-300">
        ⚖️ Integritas Akademik
      </AlertTitle>
      <AlertDescription className="text-xs text-amber-700 dark:text-amber-400 mt-1">
        AI adalah <strong>asisten</strong>, bukan joki. Gunakan saran dari AI sebagai referensi,
        bukan untuk disalin mentah-mentah. Tanggung jawab akhir atas skripsi ada di tangan kamu.
        Pastikan penggunaanmu sesuai aturan kampus.
      </AlertDescription>
    </Alert>
  )
}

/**
 * Disclaimer spesifik untuk Writing Assistant — review & saran, bukan generate konten.
 */
export function WritingDisclaimer() {
  return (
    <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <AlertTriangle className="size-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-sm font-semibold text-blue-800 dark:text-blue-300">
        ✍️ Fungsi Writing Assistant
      </AlertTitle>
      <AlertDescription className="text-xs text-blue-700 dark:text-blue-400 mt-1">
        AI <strong>hanya me-review dan memberi saran</strong> — tidak meng-generate isi bab.
        Semua konten harus ditulis sendiri oleh kamu. Review AI bisa salah, selalu cek kembali.
      </AlertDescription>
    </Alert>
  )
}

/**
 * Disclaimer spesifik untuk Sidang Prep — contoh jawaban hanya latihan.
 */
export function SidangDisclaimer() {
  return (
    <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
      <AlertTriangle className="size-4 text-purple-600 dark:text-purple-400" />
      <AlertTitle className="text-sm font-semibold text-purple-800 dark:text-purple-300">
        🎤 Untuk Latihan Sidang
      </AlertTitle>
      <AlertDescription className="text-xs text-purple-700 dark:text-purple-400 mt-1">
        Contoh jawaban AI adalah <strong>simulasi untuk latihan</strong>, bukan jawaban resmi.
        Jawaban asli di sidang harus berdasarkan pemahaman dan penelitianmu sendiri.
        Jangan hafal mentah-mentah — pahami konsepnya.
      </AlertDescription>
    </Alert>
  )
}

/**
 * Info edukatif tentang deteksi AI (Turnitin, dll).
 */
export function AIDetectionInfo() {
  return (
    <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
      <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-sm font-semibold text-red-800 dark:text-red-300">
        🤖 Deteksi AI
      </AlertTitle>
      <AlertDescription className="text-xs text-red-700 dark:text-red-400 mt-1">
        Banyak kampus menggunakan alat deteksi AI seperti Turnitin AI Detection atau GPTZero.
        Konten yang di-generate AI <strong>dapat terdeteksi</strong> dan berisiko melanggar
        aturan akademik. Gunakan ThesisAI untuk <strong>membantu memahami dan mereview</strong>,
        bukan untuk menulis.
      </AlertDescription>
    </Alert>
  )
}
