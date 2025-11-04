"use client"

import { useState, useEffect, useMemo } from "react"
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
import Link from "next/link"
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

const MONTHS = [
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

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [novelties, setNovelties] = useState<PayrollNovelty[]>([])
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setIsLoading(true)
        const [empData, novData] = await Promise.all([getEmployees(), getNovelties()])
        setEmployees(empData)
        setNovelties(novData)
      } catch (err) {
        console.error("Error al cargar datos:", err)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getPayrollsByPeriod(selectedMonth, selectedYear)
        setPayrolls(data)
      } catch (err) {
        console.error("Error al cargar nóminas:", err)
        setPayrolls([])
      }
    })()
  }, [selectedMonth, selectedYear])

  // 👇 Optimizaciones con useMemo para evitar cálculos en cada render
  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active"), [employees])

  const departmentData = useMemo(() => {
    return activeEmployees.reduce((acc, emp) => {
      const dept = emp.department || "Sin Departamento"
      const existing = acc.find((d) => d.name === dept)
      existing ? (existing.value++, (existing.salary += emp.base_salary)) : acc.push({ name: dept, value: 1, salary: emp.base_salary })
      return acc
    }, [] as { name: string; value: number; salary: number }[])
  }, [activeEmployees])

  const salaryRangeData = useMemo(
    () => [
      { range: "< 3M", count: activeEmployees.filter((e) => e.base_salary < 3_000_000).length },
      { range: "3M - 5M", count: activeEmployees.filter((e) => e.base_salary >= 3_000_000 && e.base_salary < 5_000_000).length },
      { range: "5M - 7M", count: activeEmployees.filter((e) => e.base_salary >= 5_000_000 && e.base_salary < 7_000_000).length },
      { range: "> 7M", count: activeEmployees.filter((e) => e.base_salary >= 7_000_000).length },
    ],
    [activeEmployees]
  )

  const totalEmployees = activeEmployees.length
  const totalPayroll = useMemo(() => activeEmployees.reduce((sum, e) => sum + e.base_salary, 0), [activeEmployees])
  const avgSalary = totalEmployees ? totalPayroll / totalEmployees : 0

  const handleExportEmployeesCSV = () => {
    exportToCSV(
      employees.map((e) => ({
        Identificación: e.identification,
        Nombre: e.first_name,
        Apellido: e.last_name,
        Email: e.email,
        Teléfono: e.phone,
        Cargo: e.position,
        Departamento: e.department,
        "Salario Base": e.base_salary,
        "Fecha Contratación": e.hire_date,
        Estado: e.status,
      })),
      "empleados"
    )
  }

  const handleExportNoveltiesCSV = () => {
    exportToCSV(
      novelties.map((n) => {
        const emp = employees.find((e) => e.id === n.employee_id)
        return {
          Fecha: n.date,
          Empleado: `${emp?.first_name || ""} ${emp?.last_name || ""}`,
          Identificación: emp?.identification,
          Tipo: n.novelty_type,
          Descripción: n.description,
          Monto: n.amount,
        }
      }),
      `novedades_${selectedMonth}_${selectedYear}`
    )
  }

  const handleExportPayrollCSV = () => {
    exportToCSV(
      payrolls.map((p) => {
        const emp = employees.find((e) => e.id === p.employee_id)
        return {
          Empleado: `${emp?.first_name || ""} ${emp?.last_name || ""}`,
          Identificación: emp?.identification,
          "Salario Base": p.base_salary,
          Bonos: p.bonuses,
          "Horas Extras": p.overtime,
          Comisiones: p.commissions,
          Deducciones: p.deductions,
          "Total Devengado": p.total_earnings,
          "Total Deducciones": p.total_deductions,
          "Neto a Pagar": p.net_salary,
        }
      }),
      `nomina_${selectedMonth}_${selectedYear}`
    )
  }

  if (isLoading)
    return (
      <div className="p-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="animate-spin h-12 w-12 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Cargando datos del sistema...</p>
        </div>
      </div>
    )

  return (
    <div className="p-8 space-y-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Análisis</h1>
          <p className="text-muted-foreground">Visualiza estadísticas y exporta información</p>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-4">Volver al Dashboard</Button>
          </Link>
        </div>

        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Mes" /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue placeholder="Año" /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-6 md:grid-cols-3">
        {[{
          title: "Total Empleados",
          value: totalEmployees,
          desc: "Empleados activos",
        },
        {
          title: "Nómina Total",
          value: `$${totalPayroll.toLocaleString("es-CO")}`,
          desc: "Suma de salarios base",
        },
        {
          title: "Salario Promedio",
          value: `$${avgSalary.toLocaleString("es-CO")}`,
          desc: "Promedio por empleado",
        }].map((item, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{item.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TABS */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="charts">📊 Gráficos</TabsTrigger>
          <TabsTrigger value="exports">📦 Exportaciones</TabsTrigger>
        </TabsList>

        {/* === GRÁFICOS === */}
        <TabsContent value="charts" className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Empleados por Departamento</CardTitle></CardHeader>
            <CardContent><ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={departmentData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                  {departmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip />
              </PieChart>
            </ResponsiveContainer></CardContent></Card>

          <Card><CardHeader><CardTitle>Distribución Salarial</CardTitle></CardHeader>
            <CardContent><ResponsiveContainer width="100%" height={300}>
              <BarChart data={salaryRangeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="range" /><YAxis /><Tooltip /><Legend /><Bar dataKey="count" fill="#8884d8" name="Empleados" /></BarChart>
            </ResponsiveContainer></CardContent></Card>

          <Card className="lg:col-span-2"><CardHeader><CardTitle>Nómina por Departamento</CardTitle></CardHeader>
            <CardContent><ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => `$${Number(v).toLocaleString("es-CO")}`} /><Legend /><Bar dataKey="salary" fill="#00C49F" name="Salario Total" /></BarChart>
            </ResponsiveContainer></CardContent></Card>
        </TabsContent>

        {/* === EXPORTACIONES === */}
        <TabsContent value="exports" className="grid gap-6 md:grid-cols-2">
          {[
            { title: "Reporte de Empleados", desc: "Exporta la lista completa de empleados con toda su información.", icon: <FileSpreadsheet className="mr-2 h-4 w-4" />, action: handleExportEmployeesCSV },
            { title: "Reporte de Novedades", desc: `Exporta las novedades del período seleccionado (${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear})`, icon: <FileSpreadsheet className="mr-2 h-4 w-4" />, action: handleExportNoveltiesCSV },
            { title: "Reporte de Nómina", desc: `Exporta el detalle de nómina del período seleccionado (${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear})`, icon: <FileSpreadsheet className="mr-2 h-4 w-4" />, action: handleExportPayrollCSV },
            { title: "Reporte Completo PDF", desc: "Genera un reporte consolidado con estadísticas y resumen del período.", icon: <FileText className="mr-2 h-4 w-4" />, action: () => exportReportToPDF(selectedMonth, selectedYear, employees, payrolls) },
          ].map((r, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader><CardTitle>{r.title}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{r.desc}</p>
                <Button onClick={r.action} className="w-full">{r.icon}Exportar</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
