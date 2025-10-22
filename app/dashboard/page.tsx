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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  ),
)
StatCard.displayName = "StatCard"

const DashboardSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="h-10 w-64 bg-muted animate-pulse rounded" />
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
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
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)

        // Verificar autenticación primero
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        if (!currentUser) {
          router.replace("/login")
          return
        }

        // Cargar todos los datos en paralelo (mucho más rápido que secuencial)
        const [empsData, novsData, payrollsData] = await Promise.all([getEmployees(), getNovelties(), getPayrolls()])

        setEmployees(empsData)
        setNovelties(novsData)
        setPayrolls(payrollsData)
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Bienvenido, {user?.fullName || "Usuario"}</p>
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
          description={`Procesada el ${stats.lastPayroll ? new Date(stats.lastPayroll.processedAt).toLocaleDateString("es-CO") : "N/A"}`}
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
        <Card>
          <CardHeader>
            <CardTitle>Empleados Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay empleados registrados</p>
              ) : (
                recentEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between">
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
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Ver Todos los Empleados
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novedades Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNovelties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay novedades registradas</p>
              ) : (
                recentNovelties.map((novelty) => {
                  const employee = employees.find((e) => e.id === novelty.employee_id)
                  return (
                    <div key={novelty.id} className="flex items-center justify-between">
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
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Ver Todas las Novedades
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Link href="/employees">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Empleados</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/novelties">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Novedades</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/payroll">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Nómina</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Reportes</h3>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
