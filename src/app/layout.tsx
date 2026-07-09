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
  title: "ThesisAI — Asisten Skripsi Gratis untuk Mahasiswa",
  description: "Literature Explorer, Writing Assistant, Sidang Prep, Progress Tracker — semua gratis untuk mahasiswa Indonesia.",
  keywords: ["skripsi", "mahasiswa", "literature review", "writing assistant", "sidang", "gratis"],
  authors: [{ name: "ThesisAI" }],
  openGraph: {
    title: "ThesisAI — Asisten Skripsi Gratis",
    description: "Bantu mahasiswa menyelesaikan skripsi tanpa pusing",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}