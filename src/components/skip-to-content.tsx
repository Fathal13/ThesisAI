/**
 * Skip-to-content link untuk aksesibilitas keyboard.
 * Tersembunyi secara visual, muncul saat di-focus oleh Tab.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:text-sm focus:font-medium"
    >
      Langsung ke konten utama
    </a>
  )
}
