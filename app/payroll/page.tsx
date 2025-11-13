"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Download, FileText, Bug } from "lucide-react"
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

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        const [empsData, novsData] = await Promise.all([getEmployees(), getNovelties()])
        setEmployees(empsData)
        setNovelties(novsData)
        console.log('📋 Datos iniciales cargados:', {
          empleados: empsData.length,
          novedades: novsData.length
        })
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        alert("Error al cargar los datos iniciales")
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Cargar nóminas cuando cambia el período
  const loadPayrolls = useCallback(async () => {
    console.log(`🔄 Cargando nóminas para ${selectedMonth}/${selectedYear}...`)
    setIsLoading(true)
    try {
      const payrolls = await getPayrollsByPeriod(selectedMonth, selectedYear)
      console.log(`✅ Nóminas cargadas:`, {
        mes: selectedMonth,
        año: selectedYear,
        total: payrolls.length,
        registros: payrolls.map(p => ({
          id: p.id.substring(0, 8),
          employee_id: p.employee_id.substring(0, 8),
          mes: p.period_month,
          año: p.period_year,
          neto: p.net_salary
        }))
      })
      setCalculatedPayrolls(payrolls)
    } catch (error) {
      console.error("❌ Error al cargar nóminas:", error)
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
      console.log(`\n📊 === INICIANDO CÁLCULO DE NÓMINA ===`)
      console.log(`📅 Período seleccionado: ${selectedMonth}/${selectedYear}`)

      // Verificar si ya existe nómina para este período
      const existingPayrolls = await getPayrollsByPeriod(selectedMonth, selectedYear)
      console.log(`🔍 Nóminas existentes: ${existingPayrolls.length}`)
      
      if (existingPayrolls.length > 0) {
        console.log(`⚠️ Ya hay ${existingPayrolls.length} nóminas para ${selectedMonth}/${selectedYear}`)
        const confirmReplace = window.confirm(
          `Ya existen ${existingPayrolls.length} nóminas para ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}.\n\n¿Deseas ELIMINARLAS y crear nuevas?\n\n⚠️ Esta acción no se puede deshacer.`
        )
        if (!confirmReplace) {
          console.log('❌ Operación cancelada por el usuario')
          setIsCalculating(false)
          return
        }
        
        console.log(`🗑️ Eliminando ${existingPayrolls.length} nóminas existentes...`)
        await deletePayrollsByPeriod(selectedMonth, selectedYear)
        console.log('✅ Nóminas anteriores eliminadas')
      }

      const activeEmployees = employees.filter(e => e.status === "active")
      console.log(`👥 Empleados activos: ${activeEmployees.length}`)
      
      if (!activeEmployees.length) {
        alert("No hay empleados activos para procesar")
        setIsCalculating(false)
        return
      }

      console.log(`\n💰 === CALCULANDO NÓMINAS ===`)
      const newPayrolls = activeEmployees.map((e, index) => {
        const payroll = calculatePayroll(e, novelties, selectedMonth, selectedYear)
        console.log(`  ${index + 1}. ${e.first_name} ${e.last_name}:`, {
          mes: payroll.period_month,
          año: payroll.period_year,
          base: payroll.base_salary,
          neto: payroll.net_salary
        })
        return payroll
      })

      console.log(`\n💾 === GUARDANDO EN BASE DE DATOS ===`)
      const savedPayrolls = await createBulkPayrolls(newPayrolls)
      console.log(`✅ ${savedPayrolls.length} nóminas guardadas`)

      // CRÍTICO: Recargar SOLO las nóminas del período actual
      console.log(`\n🔄 === RECARGANDO DATOS DEL PERÍODO ${selectedMonth}/${selectedYear} ===`)
      const freshPayrolls = await getPayrollsByPeriod(selectedMonth, selectedYear)
      console.log(`📊 Nóminas recargadas:`, {
        cantidad: freshPayrolls.length,
        total: freshPayrolls.reduce((sum, p) => sum + p.net_salary, 0),
        registros: freshPayrolls.map(p => ({
          id: p.id.substring(0, 8),
          employee: p.employee_id.substring(0, 8),
          mes: p.period_month,
          año: p.period_year,
          neto: p.net_salary
        }))
      })

      // Actualizar el estado con los datos frescos
      setCalculatedPayrolls(freshPayrolls)
      
      console.log(`\n✅ === PROCESO COMPLETADO ===\n`)
      
      const totalAmount = freshPayrolls.reduce((sum, p) => sum + p.net_salary, 0)
      alert(
        `✅ Nómina procesada exitosamente\n\n` +
        `📅 Período: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}\n` +
        `👥 Empleados: ${freshPayrolls.length}\n` +
        `💰 Total: $${totalAmount.toLocaleString('es-CO')}`
      )
    } catch (error: any) {
      console.error("\n❌ === ERROR EN EL PROCESO ===")
      console.error(error)
      alert(`❌ Error al calcular nómina:\n\n${error?.message || "Error desconocido"}`)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleDebug = async () => {
    console.log('\n🔍 === DEBUG: ESTADO ACTUAL ===')
    console.log('Período seleccionado:', { mes: selectedMonth, año: selectedYear })
    console.log('Nóminas en estado React:', calculatedPayrolls.length)
    console.log('Detalle de nóminas en estado:', calculatedPayrolls.map(p => ({
      id: p.id.substring(0, 8),
      employee_id: p.employee_id.substring(0, 8),
      mes: p.period_month,
      año: p.period_year,
      neto: p.net_salary
    })))
    
    const freshData = await getPayrollsByPeriod(selectedMonth, selectedYear)
    console.log('\nNóminas en Base de Datos:', freshData.length)
    console.log('Detalle de nóminas en BD:', freshData.map(p => ({
      id: p.id.substring(0, 8),
      employee_id: p.employee_id.substring(0, 8),
      mes: p.period_month,
      año: p.period_year,
      neto: p.net_salary
    })))
    
    console.log('\n¿Coinciden?', calculatedPayrolls.length === freshData.length)
    
    alert(
      `🐛 Debug Info:\n\n` +
      `📅 Período: ${selectedMonth}/${selectedYear}\n` +
      `📊 En React State: ${calculatedPayrolls.length} nóminas\n` +
      `💾 En Base de Datos: ${freshData.length} nóminas\n\n` +
      `${calculatedPayrolls.length === freshData.length ? '✅ Coinciden' : '❌ NO COINCIDEN'}\n\n` +
      `Revisa la consola (F12) para más detalles`
    )
  }

  const handleDownloadPDF = (payroll: Payroll) => {
    const employee = employees.find(e => e.id === payroll.employee_id)
    const periodNovelties = novelties.filter(n => n.employee_id === payroll.employee_id && n.date)
    if (employee) generatePayrollPDF(payroll, employee, periodNovelties)
  }

  const handleDownloadAllPDFs = () => {
    calculatedPayrolls.forEach((payroll, index) => {
      const employee = employees.find(e => e.id === payroll.employee_id)
      const periodNovelties = novelties.filter(n => n.employee_id === payroll.employee_id && n.date)
      if (employee) setTimeout(() => generatePayrollPDF(payroll, employee, periodNovelties), index * 400)
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
        <h1 className="text-3xl font-bold">Cálculo de Nómina Mensual FUPADESO</h1>
        <p className="text-muted-foreground mt-1">Procesa la nómina mensual y genera comprobantes</p>
      </div>
      <div className="pb-2">
        <a href="/dashboard">
          <Button variant="secondary">Volver al Dashboard</Button>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
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

            <Button onClick={handleCalculatePayroll} disabled={isCalculating} className="mt-6 ml-4">
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
                <CardTitle>
                  Nómina Calculada - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </CardTitle>
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