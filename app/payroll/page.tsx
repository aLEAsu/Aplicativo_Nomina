"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Download, FileText } from "lucide-react"
import { MOCK_EMPLOYEES, MOCK_NOVELTIES, MOCK_PAYROLLS, type Payroll } from "@/lib/mock-data"
import { calculatePayroll } from "@/lib/payroll-calculator"
import { generatePayrollPDF } from "@/lib/pdf-generator"

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [calculatedPayrolls, setCalculatedPayrolls] = useState<Payroll[]>([])
  const [isCalculating, setIsCalculating] = useState(false)

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
    // Cargar nóminas ya procesadas para el período seleccionado
    const existingPayrolls = MOCK_PAYROLLS.filter(
      (p) => p.periodMonth === selectedMonth && p.periodYear === selectedYear,
    )
    setCalculatedPayrolls(existingPayrolls)
  }, [selectedMonth, selectedYear])

  const handleCalculatePayroll = () => {
    setIsCalculating(true)

    // Simular cálculo
    setTimeout(() => {
      const activeEmployees = MOCK_EMPLOYEES.filter((e) => e.status === "active")
      const newPayrolls = activeEmployees.map((employee) =>
        calculatePayroll(employee, MOCK_NOVELTIES, selectedMonth, selectedYear),
      )

      setCalculatedPayrolls(newPayrolls)
      setIsCalculating(false)
    }, 1000)
  }

  const handleDownloadPDF = (payroll: Payroll) => {
    const employee = MOCK_EMPLOYEES.find((e) => e.id === payroll.employeeId)
    if (employee) {
      generatePayrollPDF(payroll, employee)
    }
  }

  const handleDownloadAllPDFs = () => {
    calculatedPayrolls.forEach((payroll) => {
      const employee = MOCK_EMPLOYEES.find((e) => e.id === payroll.employeeId)
      if (employee) {
        setTimeout(() => generatePayrollPDF(payroll, employee), 100)
      }
    })
  }

  const totalPayroll = calculatedPayrolls.reduce((sum, p) => sum + p.netSalary, 0)
  const totalEarnings = calculatedPayrolls.reduce((sum, p) => sum + p.totalEarnings, 0)
  const totalDeductions = calculatedPayrolls.reduce((sum, p) => sum + p.totalDeductions, 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cálculo de Nómina</h1>
        <p className="text-muted-foreground mt-1">Procesa la nómina mensual y genera comprobantes</p>
      </div>

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
                    const employee = MOCK_EMPLOYEES.find((e) => e.id === payroll.employeeId)
                    return (
                      <TableRow key={payroll.id}>
                        <TableCell className="font-medium">
                          {employee?.firstName} {employee?.lastName}
                        </TableCell>
                        <TableCell>${payroll.baseSalary.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-green-600">${payroll.bonuses.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-green-600">${payroll.overtime.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-red-600">${payroll.deductions.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="font-bold">${payroll.netSalary.toLocaleString("es-CO")}</TableCell>
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
