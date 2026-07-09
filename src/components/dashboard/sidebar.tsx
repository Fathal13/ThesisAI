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
  ChevronRight,
  Bookmark,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-200",
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
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
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
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={(user?.user_metadata as Record<string, string | undefined>)?.["avatar_url"] ?? ""} alt={user?.user_metadata?.nama ?? ""} />
              <AvatarFallback>
                {user?.user_metadata?.nama?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.nama ?? "Mahasiswa"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar className="size-8">
              <AvatarFallback>
                {user?.user_metadata?.nama?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <Separator className="my-3" />

        {!collapsed ? (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Bookmark className="size-4" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                  <Settings className="size-4" />
                  <span>Pengaturan</span>
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
                  <form action="/api/auth" method="POST">
                    <input type="hidden" name="action" value="signout" />
                    <button type="submit" className="flex w-full items-center gap-2 text-left text-destructive hover:bg-accent hover:text-accent-foreground">
                      <LogOut className="size-4" />
                      Keluar
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
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
                <form action="/api/auth" method="POST">
                  <input type="hidden" name="action" value="signout" />
                  <button type="submit" className="flex w-full items-center gap-2 text-left text-destructive hover:bg-accent hover:text-accent-foreground">
                    <LogOut className="size-4" />
                    Keluar
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  )
}