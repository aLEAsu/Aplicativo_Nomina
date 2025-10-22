"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee } from "@/lib/mock-data"
import { getCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
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

  useEffect(() => {
    // Verificar sesión cliente-side con Supabase
    getCurrentUser().then((u) => {
      if (!u) {
        router.replace("/login")
        return
      }
      // Si está autenticado, cargar empleados
      getEmployees().then((emps) => setEmployees(emps))
    })
  }, [])

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.identification.includes(searchTerm) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddEmployee = () => {
    setSelectedEmployee(null)
    setDialogOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setDialogOpen(true)
  }

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteDialogOpen(true)
  }

  const handleSaveEmployee = async (employee: Employee) => {
    try {
      if (selectedEmployee) {
        // Actualizar empleado existente en Supabase
        const updatedEmp = {
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
        await updateEmployee(employee.id, updatedEmp)
      } else {
        // Crear nuevo empleado en Supabase
        // No enviar 'id' si la tabla lo autogenera
        const newEmp = {
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
        await createEmployee(newEmp)
      }
      // Refrescar empleados desde Supabase
      const emps = await getEmployees()
      setEmployees(emps)
      setDialogOpen(false)
    } catch (err: any) {
      alert("Error al guardar empleado: " + (err?.message || JSON.stringify(err)))
    }
  }

  const handleConfirmDelete = async () => {
    if (employeeToDelete) {
      await deleteEmployee(employeeToDelete.id)
      const emps = await getEmployees()
      setEmployees(emps)
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Empleados</h1>
          <p className="text-muted-foreground mt-1">Administra la información de los empleados</p>
          <a href="/dashboard">
            <Button className=" mt-4">
              Volver al Dashboard
            </Button>
          </a>
        </div>
        <Button onClick={handleAddEmployee}>
          <Plus className="mr-3 h-4 w-4" />
          Nuevo Empleado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, identificación o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <CardTitle className="text-sm text-muted-foreground">
              {filteredEmployees.length} empleado{filteredEmployees.length !== 1 ? "s" : ""}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No se encontraron empleados
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.identification}</TableCell>
                    <TableCell>
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>${employee.base_salary.toLocaleString("es-CO")}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                        {employee.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditEmployee(employee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(employee)}>
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
        description={`¿Estás seguro de que deseas eliminar a ${employeeToDelete?.first_name} ${employeeToDelete?.last_name}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
