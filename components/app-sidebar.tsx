"use client"

import { Home, Users, FileText, Calculator, BarChart3, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Empleados", href: "/employees", icon: Users },
  { name: "Novedades", href: "/novelties", icon: FileText },
  { name: "Calcular Nómina", href: "/payroll", icon: Calculator },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    router.push("/login")
  }
  return (
    <div className="flex h-full w-64 flex-col border-r bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
            <span className="text-sm font-bold">FP</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Nómina</p>
            <h1 className="text-lg font-semibold">FUPADESO</h1>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className={cn(
                "grid h-7 w-7 place-items-center rounded-md",
                isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground/70 group-hover:text-foreground"
              )}>
                <item.icon className="h-4 w-4" />
              </span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-muted">
            <LogOut className="h-4 w-4" />
          </span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
