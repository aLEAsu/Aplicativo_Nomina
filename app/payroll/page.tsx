"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Download, FileText } from "lucide-react"
import {
  getEmployees,
  getNovelties,
  getPayrollsByPeriod,
  createBulkPayrolls,
  deletePayrollsByPeriod,
  type Payroll,
  type Employee,
  type PayrollNovelty
} from "@/lib/mock-data"
import { calculatePayroll } from "@/lib/payroll-calculator"
import { generatePayrollPDF } from "@/lib/pdf-generator"

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [calculatedPayrolls, setCalculatedPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [novelties, setNovelties] = useState<PayrollNovelty[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const months = useMemo(() => [
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
  ], [])

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i),
    []
  )

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        const [empsData, novsData] = await Promise.all([getEmployees(), getNovelties()])
        setEmployees(empsData)
        setNovelties(novsData)
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        alert("Error al cargar los datos iniciales")
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  const loadPayrolls = useCallback(async () => {
    setIsLoading(true)
    try {
      const payrolls = await getPayrollsByPeriod(selectedMonth, selectedYear)
      setCalculatedPayrolls(payrolls)
    } catch (error) {
      console.error("Error al cargar nóminas:", error)
      setCalculatedPayrolls([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    loadPayrolls()
  }, [loadPayrolls])

  const handleCalculatePayroll = async () => {
    try {
      setIsCalculating(true)

      if (calculatedPayrolls.length > 0) {
        const confirmReplace = window.confirm(
          `Ya existen ${calculatedPayrolls.length} nóminas para ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}. ¿Deseas recalcular y reemplazarlas?`
        )
        if (!confirmReplace) return
        await deletePayrollsByPeriod(selectedMonth, selectedYear)
      }

      const activeEmployees = employees.filter(e => e.status === "active")
      if (!activeEmployees.length) {
        alert("No hay empleados activos para procesar")
        return
      }

      const newPayrolls = activeEmployees.map(e => calculatePayroll(e, novelties, selectedMonth, selectedYear))
      await createBulkPayrolls(newPayrolls)

      const updatedPayrolls = await getPayrollsByPeriod(selectedMonth, selectedYear)
      setCalculatedPayrolls(updatedPayrolls)
    } catch (error: any) {
      console.error("Error al calcular nómina:", error)
      alert(`Error al calcular nómina: ${error?.message || "Error desconocido"}`)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleDeletePayrolls = async () => {
    if (!calculatedPayrolls.length) {
      alert("No hay nóminas para eliminar en este período")
      return
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar ${calculatedPayrolls.length} nóminas de ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}?`
    )
    if (!confirmDelete) return

    try {
      setIsLoading(true)
      await deletePayrollsByPeriod(selectedMonth, selectedYear)
      setCalculatedPayrolls([])
      alert("✅ Nóminas eliminadas exitosamente")
    } catch (error: any) {
      console.error("Error al eliminar nóminas:", error)
      alert(`Error al eliminar nóminas: ${error?.message || "Error desconocido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = (payroll: Payroll) => {
    const employee = employees.find(e => e.id === payroll.employee_id)
    if (employee) generatePayrollPDF(payroll, employee)
  }

  const handleDownloadAllPDFs = () => {
    calculatedPayrolls.forEach((payroll, index) => {
      const employee = employees.find(e => e.id === payroll.employee_id)
      if (employee) setTimeout(() => generatePayrollPDF(payroll, employee), index * 400)
    })
  }

  const totalEarnings = useMemo(() => calculatedPayrolls.reduce((sum, p) => sum + p.total_earnings, 0), [calculatedPayrolls])
  const totalDeductions = useMemo(() => calculatedPayrolls.reduce((sum, p) => sum + p.total_deductions, 0), [calculatedPayrolls])
  const totalPayroll = useMemo(() => calculatedPayrolls.reduce((sum, p) => sum + p.net_salary, 0), [calculatedPayrolls])

  if (isLoading && !employees.length) {
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Cálculo de Nómina</h1>
        <p className="text-muted-foreground mt-1">Procesa la nómina mensual y genera comprobantes</p>
      </div>

      <a href="/dashboard">
        <Button variant="secondary">Volver al Dashboard</Button>
      </a>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Mes</label>
              <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Año</label>
              <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCalculatePayroll} disabled={isCalculating} className="mt-6">
              <Calculator className="mr-2 h-4 w-4" />
              {isCalculating ? "Calculando..." : "Calcular Nómina"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculatedPayrolls.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <SummaryCard title="Total Devengado" value={totalEarnings} color="text-green-600" />
            <SummaryCard title="Total Deducciones" value={totalDeductions} color="text-red-600" />
            <SummaryCard title="Neto a Pagar" value={totalPayroll} />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nómina Calculada</CardTitle>
                <Button onClick={handleDownloadAllPDFs} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Salario Base</TableHead>
                    <TableHead>Bonos</TableHead>
                    <TableHead>H. Extras</TableHead>
                    <TableHead>Deducciones</TableHead>
                    <TableHead>Neto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedPayrolls.map(payroll => {
                    const employee = employees.find(e => e.id === payroll.employee_id)
                    return (
                      <TableRow key={payroll.id}>
                        <TableCell className="font-medium">{employee?.first_name} {employee?.last_name}</TableCell>
                        <TableCell>${payroll.base_salary.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-green-600">${payroll.bonuses.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-green-600">${payroll.overtime.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-red-600">${payroll.deductions.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="font-bold">${payroll.net_salary.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(payroll)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function SummaryCard({ title, value, color }: { title: string; value: number; color?: string }) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color ?? ""}`}>${value.toLocaleString("es-CO")}</div>
      </CardContent>
    </Card>
  )
}
