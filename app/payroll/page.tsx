"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Download, FileText, MapPin } from "lucide-react"
import {
  getEmployees,
  getNovelties,
  getPayrollsByPeriod,
  createBulkPayrolls,
  deletePayrollsByPeriod,
  getUniqueMunicipalities,
  getActiveEmployees,
  type Payroll,
  type Employee,
  type PayrollNovelty
} from "@/lib/mock-data"
import { calculatePayroll } from "@/lib/payroll-calculator"
import { generatePayrollPDF } from "@/lib/pdf-generator"

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("all")
  const [municipalities, setMunicipalities] = useState<string[]>([])
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
        const [empsData, novsData, municsData] = await Promise.all([
          getEmployees(), 
          getNovelties(),
          getUniqueMunicipalities()
        ])
        setEmployees(empsData)
        setNovelties(novsData)
        setMunicipalities(municsData)
        console.log('📋 Datos iniciales cargados:', {
          empleados: empsData.length,
          novedades: novsData.length,
          municipios: municsData.length
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
        total: payrolls.length
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

  // Filtrar nóminas mostradas según municipio seleccionado
  const displayedPayrolls = useMemo(() => {
    if (selectedMunicipality === "all") {
      return calculatedPayrolls
    }
    
    return calculatedPayrolls.filter(payroll => {
      const employee = employees.find(e => e.id === payroll.employee_id)
      return employee?.department === selectedMunicipality
    })
  }, [calculatedPayrolls, selectedMunicipality, employees])

  const handleCalculatePayroll = async () => {
    try {
      setIsCalculating(true)
      console.log(`\n📊 === INICIANDO CÁLCULO DE NÓMINA ===`)
      console.log(`📅 Período: ${selectedMonth}/${selectedYear}`)
      console.log(`📍 Municipio: ${selectedMunicipality === "all" ? "TODOS" : selectedMunicipality}`)

      // Obtener empleados activos según filtro de municipio
      const activeEmployees = await getActiveEmployees(
        selectedMunicipality === "all" ? undefined : selectedMunicipality
      )
      
      console.log(`👥 Empleados a procesar: ${activeEmployees.length}`)
      
      if (!activeEmployees.length) {
        alert(selectedMunicipality === "all" 
          ? "No hay empleados activos para procesar"
          : `No hay empleados activos en el municipio "${selectedMunicipality}"`)
        setIsCalculating(false)
        return
      }

      // Verificar nóminas existentes
      const existingPayrolls = await getPayrollsByPeriod(selectedMonth, selectedYear)
      
      if (existingPayrolls.length > 0) {
        const confirmMessage = selectedMunicipality === "all"
          ? `Ya existen ${existingPayrolls.length} nóminas para ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}.\n\n¿Deseas ELIMINARLAS TODAS y crear nuevas?\n\n⚠️ Esta acción eliminará TODAS las nóminas del período, no solo las del municipio seleccionado.`
          : `Ya existen ${existingPayrolls.length} nóminas para ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}.\n\nAl calcular solo "${selectedMunicipality}", se ELIMINARÁN TODAS las nóminas del período (incluyendo otros municipios).\n\n¿Deseas continuar?\n\n⚠️ Se recomienda calcular todos los municipios juntos.`
        
        const confirmReplace = window.confirm(confirmMessage)
        if (!confirmReplace) {
          console.log('❌ Operación cancelada por el usuario')
          setIsCalculating(false)
          return
        }
        
        console.log(`🗑️ Eliminando ${existingPayrolls.length} nóminas existentes...`)
        await deletePayrollsByPeriod(selectedMonth, selectedYear)
        console.log('✅ Nóminas anteriores eliminadas')
      }

      console.log(`\n💰 === CALCULANDO NÓMINAS ===`)
      const newPayrolls = activeEmployees.map((e, index) => {
        const payroll = calculatePayroll(e, novelties, selectedMonth, selectedYear)
        console.log(`  ${index + 1}. ${e.first_name} ${e.last_name} (${e.department}):`, {
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

      // Recargar todas las nóminas del período
      console.log(`\n🔄 === RECARGANDO DATOS DEL PERÍODO ${selectedMonth}/${selectedYear} ===`)
      const freshPayrolls = await getPayrollsByPeriod(selectedMonth, selectedYear)
      console.log(`📊 Nóminas recargadas: ${freshPayrolls.length}`)

      setCalculatedPayrolls(freshPayrolls)
      
      console.log(`\n✅ === PROCESO COMPLETADO ===\n`)
      
      const totalAmount = newPayrolls.reduce((sum, p) => sum + p.net_salary, 0)
      const municipalityInfo = selectedMunicipality === "all" 
        ? "" 
        : `\n📍 Municipio: ${selectedMunicipality}`
      
      alert(
        `✅ Nómina procesada exitosamente\n\n` +
        `📅 Período: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}` +
        municipalityInfo +
        `\n👥 Empleados procesados: ${newPayrolls.length}` +
        `\n💰 Total: $${totalAmount.toLocaleString('es-CO')}`
      )
    } catch (error: any) {
      console.error("\n❌ === ERROR EN EL PROCESO ===")
      console.error(error)
      alert(`❌ Error al calcular nómina:\n\n${error?.message || "Error desconocido"}`)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleDownloadPDF = (payroll: Payroll) => {
    const employee = employees.find(e => e.id === payroll.employee_id)
    const periodNovelties = novelties.filter(n => n.employee_id === payroll.employee_id && n.date)
    if (employee) generatePayrollPDF(payroll, employee, periodNovelties)
  }

  const handleDownloadAllPDFs = () => {
    displayedPayrolls.forEach((payroll, index) => {
      const employee = employees.find(e => e.id === payroll.employee_id)
      const periodNovelties = novelties.filter(n => n.employee_id === payroll.employee_id && n.date)
      if (employee) setTimeout(() => generatePayrollPDF(payroll, employee, periodNovelties), index * 400)
    })
  }

  const totalEarnings = useMemo(() => 
    displayedPayrolls.reduce((sum, p) => sum + p.total_earnings, 0), 
    [displayedPayrolls]
  )
  
  const totalDeductions = useMemo(() => 
    displayedPayrolls.reduce((sum, p) => sum + p.total_deductions, 0), 
    [displayedPayrolls]
  )
  
  const totalPayroll = useMemo(() => 
    displayedPayrolls.reduce((sum, p) => sum + p.net_salary, 0), 
    [displayedPayrolls]
  )

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
          <CardTitle>Seleccionar Período y Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
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

            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Municipio (opcional)
              </label>
              <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="font-semibold">Todos los municipios</span>
                  </SelectItem>
                  {municipalities.map(mun => (
                    <SelectItem key={mun} value={mun}>
                      {mun}
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
          
          {selectedMunicipality !== "all" && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  Filtrando por municipio: <strong>{selectedMunicipality}</strong>
                </span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                ⚠️ Al calcular, se procesarán solo los empleados de este municipio
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {calculatedPayrolls.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <SummaryCard 
              title="Total Devengado" 
              value={totalEarnings} 
              color="text-green-600" 
              subtitle={displayedPayrolls.length < calculatedPayrolls.length ? `(${displayedPayrolls.length} empleados filtrados)` : undefined}
            />
            <SummaryCard 
              title="Total Deducciones" 
              value={totalDeductions} 
              color="text-red-600" 
            />
            <SummaryCard 
              title="Neto a Pagar" 
              value={totalPayroll} 
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Nómina Calculada - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mostrando {displayedPayrolls.length} de {calculatedPayrolls.length} registros
                    {selectedMunicipality !== "all" && ` (Municipio: ${selectedMunicipality})`}
                  </p>
                </div>
                <Button onClick={handleDownloadAllPDFs} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar {selectedMunicipality === "all" ? "Todos" : "Filtrados"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Municipio</TableHead>
                    <TableHead>Salario Base</TableHead>
                    <TableHead>Bonos</TableHead>
                    <TableHead>H. Extras</TableHead>
                    <TableHead>Deducciones</TableHead>
                    <TableHead>Neto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPayrolls.map(payroll => {
                    const employee = employees.find(e => e.id === payroll.employee_id)
                    return (
                      <TableRow key={payroll.id}>
                        <TableCell className="font-medium">
                          {employee?.first_name} {employee?.last_name}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {employee?.department}
                          </span>
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

function SummaryCard({ 
  title, 
  value, 
  color,
  subtitle 
}: { 
  title: string
  value: number
  color?: string
  subtitle?: string
}) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color ?? ""}`}>
          ${value.toLocaleString("es-CO")}
        </div>
      </CardContent>
    </Card>
  )
}