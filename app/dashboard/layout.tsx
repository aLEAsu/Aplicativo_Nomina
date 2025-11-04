import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="relative flex-1 overflow-y-auto bg-background">
        {/* Background aesthetic layer */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="h-full w-full bg-[radial-gradient(1200px_600px_at_80%_-10%,hsl(var(--primary)/0.15),transparent_60%),radial-gradient(1000px_500px_at_-10%_10%,hsl(var(--muted-foreground)/0.08),transparent_60%)]" />
        </div>
        <div className="mx-auto max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  )
}
