"use client"

import { useEffect, useState, useMemo, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, DollarSign, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"
import { getEmployees, getNovelties, getPayrolls } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const StatCard = memo(
  ({
    title,
    value,
    description,
    icon: Icon,
  }: {
    title: string
    value: string | number
    description: string
    icon: any
  }) => (
    <Card className="group relative overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:scale-110" />
    </Card>
  ),
)
StatCard.displayName = "StatCard"

const DashboardSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="h-9 w-72 animate-pulse rounded-md bg-muted/70" />
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl border bg-card" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-80 animate-pulse rounded-xl border bg-card" />
      <div className="h-80 animate-pulse rounded-xl border bg-card" />
    </div>
  </div>
)

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [novelties, setNovelties] = useState<any[]>([])
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)

        // Verificar autenticación primero (usa caché para evitar llamadas repetidas)
        const currentUser = await getCurrentUser()
        if (!isMounted) return
        
        setUser(currentUser)

        if (!currentUser) {
          router.replace("/login")
          return
        }

        // Cargar todos los datos en paralelo (mucho más rápido que secuencial)
        const [empsData, novsData, payrollsData] = await Promise.all([getEmployees(), getNovelties(), getPayrolls()])
        
        if (!isMounted) return
        
        setEmployees(empsData)
        setNovelties(novsData)
        setPayrolls(payrollsData)
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardData()
    
    return () => {
      isMounted = false
    }
  }, [router])

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === "active").length
    const totalPayroll = payrolls.reduce((sum, p) => sum + p.net_salary, 0)
    const lastPayroll = payrolls[0]

    return {
      activeEmployees,
      totalNovelties: novelties.length,
      lastPayroll,
      totalPayroll,
    }
  }, [employees, novelties, payrolls])

  const recentEmployees = useMemo(() => employees.slice(0, 3), [employees])

  const recentNovelties = useMemo(() => novelties.slice(0, 3), [novelties])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Resumen general</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Panel Administrativo de Nómina</h1>
            <p className="mt-1 text-sm text-muted-foreground">Bienvenido, {user?.fullName || "Usuario"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/payroll">
              <Button className="shadow-sm">Procesar nómina</Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="bg-transparent">Ver reportes</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Empleados Activos"
          value={stats.activeEmployees}
          description="Total de empleados en nómina"
          icon={Users}
        />

        <StatCard
          title="Novedades del Mes"
          value={stats.totalNovelties}
          description="Bonos, deducciones y otros"
          icon={FileText}
        />

        <StatCard
          title="Última Nómina"
          value={`$${stats.lastPayroll?.net_salary?.toLocaleString("es-CO") || "0"}`}
          description={`Procesada el ${stats.lastPayroll ? new Date(stats.lastPayroll.processed_at).toLocaleDateString("es-CO") : "N/A"}`}
          icon={DollarSign}
        />

        <StatCard
          title="Total Nómina"
          value={`$${stats.totalPayroll.toLocaleString("es-CO")}`}
          description="Suma total procesada"
          icon={TrendingUp}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Empleados Recientes</span>
              <span className="text-xs font-normal text-muted-foreground">Últimos 3</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay empleados registrados</p>
              ) : (
                recentEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(employee.base_salary || 0).toLocaleString("es-CO")}</p>
                      <p className="text-sm text-muted-foreground">{employee.department}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/employees">
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Ver Todos los Empleados
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Novedades Recientes</span>
              <span className="text-xs font-normal text-muted-foreground">Últimos 3</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNovelties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay novedades registradas</p>
              ) : (
                recentNovelties.map((novelty) => {
                  const employee = employees.find((e) => e.id === novelty.employee_id)
                  return (
                    <div key={novelty.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">
                          {employee?.first_name} {employee?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{novelty.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${Number(novelty.amount || 0).toLocaleString("es-CO")}</p>
                        <p className="text-sm text-muted-foreground capitalize">{novelty.novelty_type}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <Link href="/novelties">
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Ver Todas las Novedades
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Link href="/employees">
          <Card className="cursor-pointer border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="font-semibold">Empleados</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/novelties">
          <Card className="cursor-pointer border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="font-semibold">Novedades</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/payroll">
          <Card className="cursor-pointer border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="font-semibold">Nómina</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="cursor-pointer border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="font-semibold">Reportes</h3>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
