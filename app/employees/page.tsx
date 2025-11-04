"use client"

import { useState, useEffect, useCallback, useMemo, useDeferredValue, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Upload, Download, Users } from "lucide-react"
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee } from "@/lib/mock-data"
import { createBulkEmployees } from "@/lib/mock-data"
import { getCurrentUser } from "@/lib/auth"
import { EmployeeDialog } from "@/components/employee-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import Link from "next/link"

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<Partial<Employee>[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importCountSaved, setImportCountSaved] = useState(0)
  const [showAllPreview, setShowAllPreview] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const handleClickImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])
  function getDisplaySalary(emp: Employee): string {
  if (emp.contract_type === 'daily') {
    const monthlyEstimate = emp.daily_rate * emp.working_days
    return `$${emp.daily_rate.toLocaleString('es-CO')}/día (${emp.working_days}d = $${monthlyEstimate.toLocaleString('es-CO')})`
  }
  return `$${emp.base_salary.toLocaleString('es-CO')}/mes`
}
  const handleExportEmployeesCSV = useCallback(async () => {
    try {
      const Papa = (await import("papaparse")).default
      const csv = Papa.unparse(
        employees.map((e) => ({
          identification: e.identification,
          first_name: e.first_name,
          last_name: e.last_name,
          email: e.email,
          phone: e.phone,
          position: e.position,
          department: e.department,
          base_salary: e.base_salary,
          hire_date: e.hire_date,
          status: e.status,
        })),
      )
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "empleados_export.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert("Error exportando CSV: " + (err?.message || err))
    }
  }, [employees])

  const loadEmployees = useCallback(async () => {
    const emps = await getEmployees()
    setEmployees(emps)
  }, [])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const user = await getCurrentUser()
      if (!isMounted) return

      if (!user) {
        router.replace("/login")
        return
      }
      await loadEmployees()
    }
    init()

    return () => {
      isMounted = false
    }
  }, [router, loadEmployees])

  const filteredEmployees = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase()
    return employees.filter(
      (emp) =>
        emp.first_name.toLowerCase().includes(term) ||
        emp.last_name.toLowerCase().includes(term) ||
        emp.identification.includes(term) ||
        emp.email.toLowerCase().includes(term),
    )
  }, [employees, deferredSearchTerm])

  const displayedEmployees = useMemo(() => {
    if (itemsPerPage === -1) {
      return filteredEmployees
    }
    return filteredEmployees.slice(0, itemsPerPage)
  }, [filteredEmployees, itemsPerPage])

  const handleAddEmployee = useCallback(() => {
    setSelectedEmployee(null)
    setDialogOpen(true)
  }, [])

  const handleEditEmployee = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteDialogOpen(true)
  }, [])

  const handleSaveEmployee = useCallback(
    async (employee: Employee) => {
      try {
        const data = {
          identification: employee.identification,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          position: employee.position,
          department: employee.department,
          base_salary: employee.base_salary,
          hire_date: employee.hire_date,
          status: employee.status,
          contract_type: employee.contract_type,
          daily_rate: employee.daily_rate ??0,
          working_days: employee.working_days ??0,
        }

        selectedEmployee ? await updateEmployee(employee.id, data) : await createEmployee(data)
        await loadEmployees()
        setDialogOpen(false)
      } catch (err: any) {
        alert("Error al guardar empleado: " + (err?.message || JSON.stringify(err)))
      }
    },
    [selectedEmployee, loadEmployees],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!employeeToDelete) return
    await deleteEmployee(employeeToDelete.id)
    await loadEmployees()
    setDeleteDialogOpen(false)
    setEmployeeToDelete(null)
  }, [employeeToDelete, loadEmployees])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="px-6 py-4 sm:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Gestión de Empleados
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">Administra y organiza la información de tu equipo</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleAddEmployee}
                className="shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-r from-primary to-secondary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Empleado
              </Button>
              <Button
                type="button"
                variant="outline"
                className="shadow-md hover:shadow-lg transition-all bg-transparent"
                onClick={handleClickImport}
              >
                <Upload className="mr-2 h-4 w-4" /> Importar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="shadow-md hover:shadow-lg transition-all bg-transparent"
                onClick={handleExportEmployeesCSV}
              >
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ID o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2 bg-input border-border/50 focus:border-primary/50 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-8 sm:px-8 space-y-6">
        <Card className="shadow-lg border-border/50 hover:shadow-xl transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/30 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
                Tabla de Empleados
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {filteredEmployees.length} empleado{filteredEmployees.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <label className="text-sm font-medium text-foreground/70">Mostrar:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1 text-sm rounded-md border border-border/50 bg-background hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>Todos ({filteredEmployees.length})</option>
              </select>
              <span className="text-xs text-muted-foreground">empleados por página</span>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground/80">Identificación</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Nombre Completo</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Cargo</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Departamento</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Salario Base</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Estado</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Tipo Contrato</TableHead>
                  <TableHead className="text-right font-semibold text-foreground/80">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">No se encontraron empleados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedEmployees.map((emp, idx) => (
                    <TableRow
                      key={emp.id}
                      className="border-border/30 hover:bg-primary/5 transition-colors duration-200 animate-slide-in-right"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <TableCell className="font-semibold text-foreground/90">{emp.identification}</TableCell>
                      <TableCell className="text-foreground/80">
                        {emp.first_name} {emp.last_name}
                      </TableCell>
                      <TableCell className="text-foreground/80">{emp.position}</TableCell>
                      <TableCell className="text-foreground/80">{emp.department}</TableCell>
          
                      <TableCell className="font-medium text-foreground/85">
                        <div className="flex flex-col">
                            <span className="text-sm">{getDisplaySalary(emp)}</span>
                            {emp.contract_type === 'daily' && (
                                <span className="text-xs text-muted-foreground">Trabajador por día</span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={emp.status === "active" ? "default" : "secondary"}
                          className={
                            emp.status === "active"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800"
                          }
                        >
                          {emp.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.contract_type === 'monthly' ? 'default' : 'secondary'}>
                          {emp.contract_type === 'monthly' ? '💼 Mensual' : '📅 Por Día'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEmployee(emp)}
                            className="hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(emp)}
                            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {importPreview.length > 0 && (
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-border/30 pb-4">
              <CardTitle className="text-lg font-semibold">📤 Vista Previa de Importación</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {importPreview.length} registros válidos para guardar
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {importErrors.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-semibold mb-2">⚠️ Errores encontrados:</p>
                  {importErrors.slice(0, 5).map((e, i) => (
                    <div key={i} className="text-xs">
                      {e}
                    </div>
                  ))}
                  {importErrors.length > 5 && <div className="text-xs mt-2">… y {importErrors.length - 5} más</div>}
                </div>
              )}
              <div className="space-y-2">
                <div className="max-h-64 overflow-auto rounded-lg border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {[
                          "identification",
                          "first_name",
                          "last_name",
                          "email",
                          "position",
                          "department",
                          "base_salary",
                          "hire_date",
                          "status",
                        ].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-foreground/80 text-xs">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllPreview ? importPreview : importPreview.slice(0, 10)).map((r, i) => (
                        <tr key={i} className="border-t border-border/30 hover:bg-primary/5 transition-colors">
                          <td className="px-3 py-2 text-xs">{r.identification as string}</td>
                          <td className="px-3 py-2 text-xs">{r.first_name as string}</td>
                          <td className="px-3 py-2 text-xs">{r.last_name as string}</td>
                          <td className="px-3 py-2 text-xs">{r.email as string}</td>
                          <td className="px-3 py-2 text-xs">{r.position as string}</td>
                          <td className="px-3 py-2 text-xs">{r.department as string}</td>
                          <td className="px-3 py-2 text-xs">${Number(r.base_salary || 0).toLocaleString("es-CO")}</td>
                          <td className="px-3 py-2 text-xs">{r.hire_date as string}</td>
                          <td className="px-3 py-2 text-xs">{r.status as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreview.length > 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllPreview(!showAllPreview)}
                    className="w-full"
                  >
                    {showAllPreview ? `Mostrar menos` : `Mostrar todos (${importPreview.length - 10} más)`}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Se guardarán en lotes para evitar saturar el servicio.
                </div>
                <Button
                  disabled={isImporting}
                  onClick={async () => {
                    setIsImporting(true)
                    setImportCountSaved(0)
                    try {
                      const batchSize = 100
                      const errors: string[] = []
                      let totalSaved = 0
                      for (let i = 0; i < importPreview.length; i += batchSize) {
                        const chunk = importPreview.slice(i, i + batchSize).map((e, chunkIdx) => {
                          const phoneValue = String((e as any).phone || "").trim()
                          const cleanPhone = phoneValue.replace(/[\s\-$$$$]/g, "").substring(0, 20)
                          return {
                            identification: String(e.identification || "").substring(0, 50),
                            first_name: String(e.first_name || "").substring(0, 100),
                            last_name: String(e.last_name || "").substring(0, 100),
                            email: String(e.email || "").substring(0, 255),
                            phone: cleanPhone,
                            position: String(e.position || "").substring(0, 100),
                            department: String(e.department || "").substring(0, 100),
                            base_salary: Number(e.base_salary || 0),
                            hire_date: String(e.hire_date || ""),
                            status: (e.status as any) || "active",
                          }
                        })

                        try {
                          await createBulkEmployees(chunk as any)
                          totalSaved += chunk.length
                          setImportCountSaved(totalSaved)
                        } catch (chunkError: any) {
                          const errorMsg = chunkError?.message || String(chunkError)
                          for (let j = 0; j < chunk.length; j++) {
                            try {
                              await createBulkEmployees([chunk[j] as any])
                              totalSaved += 1
                              setImportCountSaved(totalSaved)
                            } catch (singleError: any) {
                              const singleMsg = singleError?.message || String(singleError)
                              const recordNum = i + j + 1
                              errors.push(
                                `Registro ${recordNum} (${chunk[j].identification} - ${chunk[j].first_name} ${chunk[j].last_name}): ${singleMsg}`,
                              )
                            }
                          }
                        }
                      }

                      if (errors.length > 0) {
                        const errorSummary = errors.slice(0, 10).join("\n")
                        const moreErrors = errors.length > 10 ? `\n\n... y ${errors.length - 10} errores más` : ""
                        alert(
                          `Importación parcialmente completada.\n\nRegistros guardados: ${totalSaved}\nErrores encontrados:\n${errorSummary}${moreErrors}`,
                        )
                        setImportErrors([...importErrors, ...errors.slice(0, 20)])
                      } else {
                        await loadEmployees()
                        alert(`✅ Importación completada: ${totalSaved} empleados guardados exitosamente`)
                        // Limpiar vista previa inmediatamente después del éxito
                        setImportPreview([])
                        setImportErrors([])
                        setShowAllPreview(false)
                        setImportCountSaved(0)
                      }
                    } catch (err: any) {
                      const errorMsg = err?.message || String(err)
                      alert(
                        `❌ Error crítico al importar: ${errorMsg}\n\nRegistros guardados hasta el error: ${importCountSaved}`,
                      )
                    } finally {
                      setIsImporting(false)
                    }
                  }}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  {isImporting ? "⏳ Guardando…" : `✓ Guardar (${importPreview.length})`}
                </Button>
              </div>
              {importCountSaved > 0 && (
                <div className="text-xs text-muted-foreground text-right">Guardados: {importCountSaved}</div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="sticky bottom-6 left-0 right-0 flex justify-center">
          <Link href="/dashboard" className="drop-shadow-lg">
            <Button
              variant="outline"
              className="shadow-xl hover:shadow-2xl transition-all hover:scale-105 bg-background/90 backdrop-blur-sm border-border/50"
            >
              ← Volver al Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setIsImporting(true)
          setImportErrors([])
          setImportPreview([])
          setShowAllPreview(false)
          try {
            const ext = file.name.split(".")?.pop()?.toLowerCase()
            let rows: any[] = []
            if (ext === "csv") {
              const Papa = (await import("papaparse")).default
              const text = await file.text()
              const parsed = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                transformHeader: (header: string) => header.trim(),
              })
              rows = (parsed.data as any[]).filter(
                (r) => Object.keys(r).length > 0 && Object.values(r).some((v) => v && String(v).trim()),
              )
            } else {
              const XLSX = await import("xlsx")
              const data = await file.arrayBuffer()
              const wb = XLSX.read(data)
              const ws = wb.Sheets[wb.SheetNames[0]]
              rows = XLSX.utils.sheet_to_json(ws)
            }

            const normalizeStatus = (s: string): "active" | "inactive" => {
              if (!s) return "active"
              const normalized = String(s).toLowerCase().trim()
              if (normalized === "activos" || normalized === "activo" || normalized === "active") return "active"
              if (normalized === "inactivos" || normalized === "inactivo" || normalized === "inactive")
                return "inactive"
              return "active"
            }
            const normalized: Partial<Employee>[] = rows.map((r, idx) => {
              const statusRaw = String(r.status ?? r.estado ?? "active").trim()
              const salaryRaw = r.base_salary ?? r.salario_base ?? r.salario ?? 0

              let phoneRaw = String(r.phone ?? r.telefono ?? "").trim()
              phoneRaw = phoneRaw.replace(/[\s\-$$$$]/g, "")
              if (phoneRaw.length > 20) {
                phoneRaw = phoneRaw.substring(0, 20)
              }

              return {
                identification: String(r.identification ?? r.cedula ?? r.document ?? "")
                  .trim()
                  .substring(0, 50),
                first_name: String(r.first_name ?? r.nombre ?? "")
                  .trim()
                  .substring(0, 100),
                last_name: String(r.last_name ?? r.apellido ?? "")
                  .trim()
                  .substring(0, 100),
                email: String(r.email ?? "")
                  .trim()
                  .toLowerCase()
                  .substring(0, 255),
                phone: phoneRaw,
                position: String(r.position ?? r.cargo ?? "")
                  .trim()
                  .substring(0, 100),
                department: String(r.department ?? r.departamento ?? "")
                  .trim()
                  .substring(0, 100),
                base_salary: Number(salaryRaw),
                hire_date: String(r.hire_date ?? r.fecha_contratacion ?? r.fecha ?? "").trim(),
                status: normalizeStatus(statusRaw) as any,
              }
            })
            const errors: string[] = []
            const valids = normalized.filter((emp, idx) => {
              const requiredOk = Boolean(
                emp.identification &&
                  emp.first_name &&
                  emp.last_name &&
                  emp.email &&
                  emp.position &&
                  emp.department &&
                  emp.hire_date,
              )
              const salaryOk =
                typeof emp.base_salary === "number" && !Number.isNaN(emp.base_salary) && (emp.base_salary as number) > 0
              const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email || "")
              const statusOk = emp.status === "active" || emp.status === "inactive"
              if (!requiredOk) errors.push(`Fila ${idx + 2}: faltan campos obligatorios`)
              if (!salaryOk && emp.base_salary !== undefined)
                errors.push(`Fila ${idx + 2}: salario inválido (${emp.base_salary})`)
              if (!emailOk && emp.email) errors.push(`Fila ${idx + 2}: email inválido (${emp.email})`)
              return requiredOk && salaryOk && emailOk && statusOk
            })

            if (valids.length === 0 && normalized.length > 0) {
              setImportErrors([
                ...errors.slice(0, 10),
                `⚠️ Ningún registro pasó la validación. Total de errores: ${errors.length}`,
              ])
            } else {
              setImportPreview(valids)
              if (errors.length > 0) setImportErrors(errors.slice(0, 20))
            }
          } catch (err: any) {
            setImportErrors([err?.message || "Error procesando archivo"])
          } finally {
            setIsImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
          }
        }}
      />

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar Empleado"
        description={`¿Estás seguro de que deseas eliminar a ${employeeToDelete?.first_name ?? ""} ${employeeToDelete?.last_name ?? ""}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
