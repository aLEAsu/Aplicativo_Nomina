"use client"

import { useState, useEffect } from "react"
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
import DashboardPage from "../dashboard/page"


export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [calculatedPayrolls, setCalculatedPayrolls] = useState<Payroll[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [novelties, setNovelties] = useState<PayrollNovelty[]>([])
  
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
    loadData()
  }, [])
  //CARGAR NOMINAS CUANDO CAMBIA EL PERIODO
  useEffect(() => {
    loadPayrolls()
  }, [selectedMonth, selectedYear])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [empsData, novsData] = await Promise.all([
        getEmployees(),
        getNovelties()
      ])
      setEmployees(empsData)
      setNovelties(novsData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      alert("Error al cargar los datos iniciales")
    } finally {
      setIsLoading(false)
    }
  }
   const loadPayrolls = async () => {
    try {
      setIsLoading(true)
      const payrolls = await getPayrollsByPeriod(selectedMonth, selectedYear)
      setCalculatedPayrolls(payrolls)
    } catch (error) {
      console.error("Error al cargar nóminas:", error)
      setCalculatedPayrolls([])
    } finally {
      setIsLoading(false)
    }
  }
   const handleCalculatePayroll = async () => {
    try {
      setIsCalculating(true)
      
      // Confirmar si ya existen nóminas para este período
      if (calculatedPayrolls.length > 0) {
        const confirm = window.confirm(
          `Ya existen ${calculatedPayrolls.length} nóminas para ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}. ¿Deseas recalcular y reemplazarlas?`
        )
        if (!confirm) {
          setIsCalculating(false)
          return
        }
        
        // Eliminar nóminas existentes
        await deletePayrollsByPeriod(selectedMonth, selectedYear)
        setCalculatedPayrolls([])
      }

      // Calcular nóminas para empleados activos
      const activeEmployees = employees.filter((e) => e.status === "active")
      
      if (activeEmployees.length === 0) {
        alert("No hay empleados activos para procesar")
        setIsCalculating(false)
        return
      }

      const newPayrolls = activeEmployees.map((employee) =>
        calculatePayroll(employee, novelties, selectedMonth, selectedYear)
      )

      // Guardar en Supabase
      await createBulkPayrolls(newPayrolls)

      // 🔁 Luego recarga desde la base real
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
    if (calculatedPayrolls.length === 0) {
      alert("No hay nóminas para eliminar en este período")
      return
    }

    const confirm = window.confirm(
      `¿Estás seguro de eliminar ${calculatedPayrolls.length} nóminas de ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}?`
    )
    
    if (!confirm) return

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
    const employee = employees.find((e) => e.id === payroll.employee_id)
    if (employee) {
      generatePayrollPDF(payroll, employee)
    }
  }

  const handleDownloadAllPDFs = () => {
    calculatedPayrolls.forEach((payroll, index) => {
      const employee = employees.find((e) => e.id === payroll.employee_id)
      if (employee) {
        setTimeout(() => generatePayrollPDF(payroll, employee), index * 500)
      }
    })
  }


  const totalPayroll = calculatedPayrolls.reduce((sum, p) => sum + p.net_salary, 0)
  const totalEarnings = calculatedPayrolls.reduce((sum, p) => sum + p.total_earnings, 0)
  const totalDeductions = calculatedPayrolls.reduce((sum, p) => sum + p.total_deductions, 0)
   if (isLoading && employees.length === 0) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cálculo de Nómina</h1>
        <p className="text-muted-foreground mt-1">Procesa la nómina mensual y genera comprobantes</p>
      </div>
    <a href="/dashboard">
      <Button className="mb-4">
        Volver al Dashboard
      </Button>
    </a> 
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Mes</label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}>
                <SelectTrigger>
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
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Año</label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
                <SelectTrigger>
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
            <Button onClick={handleCalculatePayroll} disabled={isCalculating} className="flex-1">
              <Calculator className="mr-2 h-4 w-4" />
              {isCalculating ? "Calculando..." : "Calcular Nómina"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculatedPayrolls.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Devengado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${totalEarnings.toLocaleString("es-CO")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deducciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${totalDeductions.toLocaleString("es-CO")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Neto a Pagar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalPayroll.toLocaleString("es-CO")}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nómina Calculada</CardTitle>
                <Button onClick={handleDownloadAllPDFs} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Todos los PDFs
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
                  {calculatedPayrolls.map((payroll) => {
                    const employee = employees.find((e) => e.id === payroll.employee_id)
                    return (
                      <TableRow key={payroll.id}>
                        <TableCell className="font-medium">
                          {employee?.first_name} {employee?.last_name}
                        </TableCell>
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
