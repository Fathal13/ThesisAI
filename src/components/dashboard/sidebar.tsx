"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Edit3,
  Brain,
  BarChart3,
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  ChevronLeft,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function LogoutButton() {
  async function handleLogout() {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout" }),
      })
      if (res.ok) {
        window.location.href = "/auth/login"
      }
    } catch {
      // ignore
    }
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-accent hover:text-accent-foreground"
      onClick={handleLogout}
    >
      <LogOut className="size-4" />
      <span>Keluar</span>
    </Button>
  )
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Literatur", href: "/dashboard/literature", icon: BookOpen },
  { name: "Writing", href: "/dashboard/writing", icon: Edit3 },
  { name: "Sidang", href: "/dashboard/sidang", icon: Brain },
  { name: "Progress", href: "/dashboard/progress", icon: BarChart3 },
]

export function DashboardSidebar({ user }: { user: { email?: string; user_metadata?: { nama?: string } } | null }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <>
      {/* ─── MOBILE: Bottom Navigation Bar ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden flex items-center justify-around px-1 safe-area-bottom"
        aria-label="Mobile navigation"
      >
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 text-[10px] font-medium transition-colors rounded-md",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              <span className="truncate max-w-full">{item.name}</span>
            </Link>
          )
        })}

        {/* Menu toggle untuk Profile/Logout */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-2 text-[10px] font-medium transition-colors rounded-md",
            mobileOpen ? "text-primary" : "text-muted-foreground"
          )}
          aria-label="Menu pengguna"
        >
          <Avatar className="size-5">
            <AvatarImage
              src={(user?.user_metadata as Record<string, string | undefined>)?.["avatar_url"] ?? ""}
              alt=""
            />
            <AvatarFallback className="text-[8px]">
              {user?.user_metadata?.nama?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span>Profil</span>
        </button>
      </nav>

      {/* Mobile profile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t rounded-t-xl p-4 md:hidden animate-in slide-in-from-bottom">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="size-10">
                <AvatarImage
                  src={(user?.user_metadata as Record<string, string | undefined>)?.["avatar_url"] ?? ""}
                  alt={user?.user_metadata?.nama ?? ""}
                />
                <AvatarFallback>
                  {user?.user_metadata?.nama?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.user_metadata?.nama ?? "Mahasiswa"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Tutup">
                <X className="size-4" />
              </Button>
            </div>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <Settings className="size-4" />
              <span>Pengaturan</span>
            </Link>
            <Separator className="my-2" />
            <LogoutButton />
          </div>
        </>
      )}

      {/* ─── DESKTOP: Sidebar ─── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-200 hidden md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
              <BookOpen className="size-6" />
              <span>ThesisAI</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronLeft className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation desktop">
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="size-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: User Profile + Logout */}
        <div className="border-t p-4">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="size-8">
                  <AvatarImage
                    src={(user?.user_metadata as Record<string, string | undefined>)?.["avatar_url"] ?? ""}
                    alt={user?.user_metadata?.nama ?? ""}
                  />
                  <AvatarFallback>
                    {user?.user_metadata?.nama?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.user_metadata?.nama ?? "Mahasiswa"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors mb-2"
              >
                <Settings className="size-4" />
                <span>Pengaturan</span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback>
                  {user?.user_metadata?.nama?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                    <Settings className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem>
                    <Link href="/dashboard/settings" className="flex items-center gap-2">
                      <User className="size-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => {
                      fetch("/api/auth", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "signout" }),
                      }).then(() => { window.location.href = "/auth/login" })
                    }}>
                      <LogOut className="size-4 mr-2" />
                      Keluar
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
