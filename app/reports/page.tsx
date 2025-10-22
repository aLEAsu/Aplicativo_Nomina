"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSpreadsheet, FileText } from "lucide-react"
import {
  getEmployees,
  getNovelties,
  getPayrollsByPeriod,
  type Employee,
  type PayrollNovelty,
  type Payroll,
} from "@/lib/mock-data"
import { exportToCSV, exportReportToPDF } from "@/lib/export-utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [novelties, setNovelties] = useState<PayrollNovelty[]>([])
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const months = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadPayrolls()
  }, [selectedMonth, selectedYear])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const [empsData, novsData] = await Promise.all([getEmployees(), getNovelties()])
      setEmployees(empsData)
      setNovelties(novsData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPayrolls = async () => {
    try {
      const payrollsData = await getPayrollsByPeriod(selectedMonth, selectedYear)
      setPayrolls(payrollsData)
    } catch (error) {
      console.error("Error al cargar nóminas:", error)
      setPayrolls([])
    }
  }

  const departmentData = employees
    .filter((e) => e.status === "active")
    .reduce(
      (acc, emp) => {
        const dept = emp.department || "Sin Departamento"
        const existing = acc.find((d) => d.name === dept)
        if (existing) {
          existing.value += 1
          existing.salary += emp.base_salary
        } else {
          acc.push({ name: dept, value: 1, salary: emp.base_salary })
        }
        return acc
      },
      [] as { name: string; value: number; salary: number }[],
    )

  const salaryRangeData = [
    {
      range: "< 3M",
      count: employees.filter((e) => e.status === "active" && e.base_salary < 3000000).length,
    },
    {
      range: "3M - 5M",
      count: employees.filter((e) => e.status === "active" && e.base_salary >= 3000000 && e.base_salary < 5000000)
        .length,
    },
    {
      range: "5M - 7M",
      count: employees.filter((e) => e.status === "active" && e.base_salary >= 5000000 && e.base_salary < 7000000)
        .length,
    },
    {
      range: "> 7M",
      count: employees.filter((e) => e.status === "active" && e.base_salary >= 7000000).length,
    },
  ]

  const handleExportEmployeesCSV = () => {
    const data = employees.map((emp) => ({
      Identificación: emp.identification,
      Nombre: emp.first_name,
      Apellido: emp.last_name,
      Email: emp.email,
      Teléfono: emp.phone,
      Cargo: emp.position,
      Departamento: emp.department,
      "Salario Base": emp.base_salary,
      "Fecha Contratación": emp.hire_date,
      Estado: emp.status,
    }))
    exportToCSV(data, "empleados")
  }

  const handleExportNoveltiesCSV = () => {
    const data = novelties.map((nov) => {
      const employee = employees.find((e) => e.id === nov.employee_id)
      return {
        Fecha: nov.date,
        Empleado: `${employee?.first_name} ${employee?.last_name}`,
        Identificación: employee?.identification,
        Tipo: nov.novelty_type,
        Descripción: nov.description,
        Monto: nov.amount,
      }
    })
    exportToCSV(data, `novedades_${selectedMonth}_${selectedYear}`)
  }

  const handleExportPayrollCSV = () => {
    const data = payrolls.map((payroll) => {
      const employee = employees.find((e) => e.id === payroll.employee_id)
      return {
        Empleado: `${employee?.first_name} ${employee?.last_name}`,
        Identificación: employee?.identification,
        "Salario Base": payroll.base_salary,
        Bonos: payroll.bonuses,
        "Horas Extras": payroll.overtime,
        Comisiones: payroll.commissions,
        Deducciones: payroll.deductions,
        "Total Devengado": payroll.total_earnings,
        "Total Deducciones": payroll.total_deductions,
        "Neto a Pagar": payroll.net_salary,
      }
    })
    exportToCSV(data, `nomina_${selectedMonth}_${selectedYear}`)
  }

  const handleExportReportPDF = () => {
    exportReportToPDF(selectedMonth, selectedYear, employees, payrolls)
  }

  const totalEmployees = employees.filter((e) => e.status === "active").length
  const totalPayroll = employees.filter((e) => e.status === "active").reduce((sum, e) => sum + e.base_salary, 0)
  const avgSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
          <p className="text-muted-foreground mt-1">Visualiza estadísticas y exporta información</p>
          <a href="/dashboard">
            <Button className="mt-4">Volver al Dashboard</Button>
          </a>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Empleados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Empleados activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nómina Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayroll.toLocaleString("es-CO")}</div>
            <p className="text-xs text-muted-foreground mt-1">Suma de salarios base</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Salario Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgSalary.toLocaleString("es-CO")}</div>
            <p className="text-xs text-muted-foreground mt-1">Promedio por empleado</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="exports">Exportaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Empleados por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución Salarial</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salaryRangeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Empleados" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nómina por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString("es-CO")}`} />
                    <Legend />
                    <Bar dataKey="salary" fill="#00C49F" name="Salario Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Empleados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exporta la lista completa de empleados con toda su información
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleExportEmployeesCSV} className="flex-1">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reporte de Novedades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exporta las novedades del período seleccionado ({months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear})
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleExportNoveltiesCSV} className="flex-1">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reporte de Nómina</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exporta el detalle de nómina del período seleccionado (
                  {months.find((m) => m.value === selectedMonth)?.label} {selectedYear})
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleExportPayrollCSV} className="flex-1">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reporte Completo PDF</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Genera un reporte completo en PDF con estadísticas y resumen del período
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleExportReportPDF} className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
