import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "ThesisAI — Asisten Skripsi Gratis untuk Mahasiswa Indonesia",
    template: "%s — ThesisAI",
  },
  description:
    "Literature Explorer, Writing Assistant, Sidang Prep, Progress Tracker — semua gratis untuk mahasiswa Indonesia. Bantu kamu lulus skripsi tanpa pusing.",
  keywords: [
    "skripsi",
    "tugas akhir",
    "mahasiswa",
    "literature review",
    "writing assistant",
    "sidang skripsi",
    "AI gratis",
    "thesis",
    "Indonesia",
  ],
  authors: [{ name: "ThesisAI" }],
  creator: "ThesisAI",
  openGraph: {
    title: "ThesisAI — Asisten Skripsi Gratis",
    description: "Bantu mahasiswa menyelesaikan skripsi tanpa pusing — Literatur Explorer, Writing Assistant, Sidang Prep, Progress Tracker.",
    type: "website",
    locale: "id_ID",
    siteName: "ThesisAI",
    url: "https://thesisai.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThesisAI — Asisten Skripsi Gratis",
    description: "Bantu mahasiswa menyelesaikan skripsi tanpa pusing.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Vercel Analytics — lightweight, gratis */}
        <script defer src="/_vercel/insights/script.js" />
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
