"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
} from "@/lib/mock-data"
import { getCurrentUser } from "@/lib/auth"
import { EmployeeDialog } from "@/components/employee-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)

  // 🔹 Cargar empleados (evita duplicación)
  const loadEmployees = useCallback(async () => {
    const emps = await getEmployees()
    setEmployees(emps)
  }, [])

  // 🔹 Verificar autenticación y cargar datos
  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user) {
        router.replace("/login")
        return
      }
      await loadEmployees()
    }
    init()
  }, [router, loadEmployees])

  // 🔹 Filtrado optimizado con useMemo
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return employees.filter(
      (emp) =>
        emp.first_name.toLowerCase().includes(term) ||
        emp.last_name.toLowerCase().includes(term) ||
        emp.identification.includes(term) ||
        emp.email.toLowerCase().includes(term),
    )
  }, [employees, searchTerm])

  //  CRUD Handlers
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

  // 🔹 Render principal
  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Empleados</h1>
          <p className="text-muted-foreground mt-1">Administra la información de los empleados</p>
          <a href="/dashboard">
            <Button variant="secondary" className="mt-4 shadow-sm transition-all hover:scale-105">
              Volver al Dashboard
            </Button>
          </a>
        </div>

        <Button onClick={handleAddEmployee} className="shadow-md transition-all hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Empleado
        </Button>
      </div>

      <Card className="shadow-sm transition-all hover:shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, identificación o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <CardTitle className="text-sm text-muted-foreground text-center sm:text-right">
              {filteredEmployees.length} empleado{filteredEmployees.length !== 1 ? "s" : ""}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificación</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Salario Base</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    No se encontraron empleados
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{emp.identification}</TableCell>
                    <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>${emp.base_salary.toLocaleString("es-CO")}</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                        {emp.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditEmployee(emp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(emp)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* 🔹 Modales */}
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
