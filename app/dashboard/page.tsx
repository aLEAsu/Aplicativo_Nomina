"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, DollarSign, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"
import { getEmployees, getNovelties, getPayrolls } from "@/lib/mock-data"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [novelties, setNovelties] = useState<any[]>([])
  const [activeEmployees, setActiveEmployees] = useState(0)
  const [totalNovelties, setTotalNovelties] = useState(0)
  const [lastPayroll, setLastPayroll] = useState<any>(null)
  const [totalPayroll, setTotalPayroll] = useState(0)

  useEffect(() => {
    getCurrentUser().then((u) => {
      console.log("[DASHBOARD] getCurrentUser result:", u)
      setUser(u)
      if (!u) {
        router.replace("/login")
      }
    })
    getEmployees().then((emps) => {
      setEmployees(emps)
      setActiveEmployees(emps.filter((e: any) => e.status === "active").length)
    })
    getNovelties().then((novs) => {
      setNovelties(novs)
      setTotalNovelties(novs.length)
    })
    getPayrolls().then((payrolls) => {
      setLastPayroll(payrolls[0])
      setTotalPayroll(payrolls.reduce((sum, p) => sum + p.netSalary, 0))
    })
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Bienvenido, {user?.fullName || "Usuario"}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Total de empleados en nómina</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Novedades del Mes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNovelties}</div>
            <p className="text-xs text-muted-foreground mt-1">Bonos, deducciones y otros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Última Nómina</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${lastPayroll?.netSalary.toLocaleString("es-CO")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Procesada el {lastPayroll ? new Date(lastPayroll.processedAt).toLocaleDateString("es-CO") : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Nómina</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayroll.toLocaleString("es-CO")}</div>
            <p className="text-xs text-muted-foreground mt-1">Suma total procesada</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Empleados Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.slice(0, 3).map((employee) => (
                console.log(employee),
                <div key={employee.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$ {Number(employee.base_salary || 0).toLocaleString("es-CO")}</p>
                    <p className="text-sm text-muted-foreground">{employee.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novedades Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {novelties.slice(0, 3).map((novelty) => {
                console.log(novelty)
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
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
