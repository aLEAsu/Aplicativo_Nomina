"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Employee } from "@/lib/mock-data"
import { createEmployee, updateEmployee, validateEmployee, MINIMUM_WAGE, MINIMUM_DAILY_RATE } from "@/lib/mock-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

interface EmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onSave: (employee: Employee) => void
}

export function EmployeeDialog({ open, onOpenChange, employee, onSave }: EmployeeDialogProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    contract_type: 'monthly',
    base_salary: 0,
    daily_rate: 0,
    working_days: 0,
    status: 'active'
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        contract_type: employee.contract_type || 'monthly',
        base_salary: employee.base_salary || 0,
        daily_rate: employee.daily_rate || 0,
        working_days: employee.working_days || 0
      })
    } else {
      setFormData({
        contract_type: 'monthly',
        base_salary: MINIMUM_WAGE,
        daily_rate: 0,
        working_days: 0,
        status: 'active',
        identification: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        hire_date: new Date().toISOString().split('T')[0]
      })
    }
    setErrors([])
  }, [employee, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setIsSubmitting(true)

    try {
      // Validar datos
      const validation = validateEmployee(formData)
      if (!validation.isValid) {
        setErrors(validation.errors)
        setIsSubmitting(false)
        return
      }

      // Preparar datos según tipo de contrato
      const employeeData = {
        ...formData,
        base_salary: formData.contract_type === 'monthly' ? Number(formData.base_salary) : 0,
        daily_rate: formData.contract_type === 'daily' ? Number(formData.daily_rate) : 0,
        working_days: formData.contract_type === 'daily' ? Number(formData.working_days) : 0
      } as Employee

      // ✅ Solo pasar los datos al padre
      onSave(employeeData as Employee)
      onOpenChange(false)

    } catch (error: any) {
      console.error('Error al guardar empleado:', error)
      setErrors([error.message || 'Error al guardar el empleado'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors([]) // Limpiar errores al cambiar campos
  }

  const estimatedMonthlySalary = formData.contract_type === 'daily' 
    ? (formData.daily_rate || 0) * (formData.working_days || 0)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
          <DialogDescription>
            {employee ? "Modifica la información del empleado" : "Completa los datos del nuevo empleado"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Tipo de Contrato */}
          <div className="space-y-2">
            <Label htmlFor="contract_type">Tipo de Contrato *</Label>
            <Select
              value={formData.contract_type}
              onValueChange={(value) => handleChange('contract_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo de contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">💼 Empleado Mensual</SelectItem>
                <SelectItem value="daily">📅 Trabajador por Día</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.contract_type === 'monthly' 
                ? 'Empleado con salario fijo mensual'
                : 'Trabajador que cobra por día laborado'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identification">Identificación *</Label>
              <Input
                id="identification"
                value={formData.identification || ''}
                onChange={(e) => handleChange('identification', e.target.value)}
                placeholder="1234567890"
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombres *</Label>
              <Input
                id="first_name"
                value={formData.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Nombres completos"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellidos *</Label>
              <Input
                id="last_name"
                value={formData.last_name || ''}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Apellidos completos"
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Digite el correo electrónico"
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Nro de teléfono"
                maxLength={20}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Cargo *</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="Cargo "
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Municipio *</Label>
              <Input
                id="department"
                value={formData.department || ''}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Administración"
                maxLength={100}
                required
              />
            </div>
          </div>

          {/* Campos condicionales según tipo de contrato */}
          {formData.contract_type === 'monthly' ? (
            <div className="space-y-2">
              <Label htmlFor="base_salary">Salario Base Mensual *</Label>
              <Input
                id="base_salary"
                type="number"
                min={MINIMUM_WAGE}
                step="1000"
                value={formData.base_salary || ''}
                onChange={(e) => handleChange('base_salary', Number(e.target.value))}
                placeholder={MINIMUM_WAGE.toString()}
                required
              />
              <p className="text-xs text-muted-foreground">
                Salario mínimo: ${MINIMUM_WAGE.toLocaleString('es-CO')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_rate">Valor por Día *</Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    min={MINIMUM_DAILY_RATE}
                    step="1000"
                    value={formData.daily_rate || ''}
                    onChange={(e) => handleChange('daily_rate', Number(e.target.value))}
                    placeholder={Math.round(MINIMUM_DAILY_RATE).toString()}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo: ${Math.round(MINIMUM_DAILY_RATE).toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="working_days">Días Trabajados</Label>
                  <Input
                    id="working_days"
                    type="number"
                    min="0"
                    max="31"
                    value={formData.working_days || ''}
                    onChange={(e) => handleChange('working_days', Number(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Días en el período actual
                  </p>
                </div>
              </div>

              {estimatedMonthlySalary > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-semibold">Salario estimado del período:</span>
                    <div className="text-lg font-bold text-primary mt-1">
                      ${estimatedMonthlySalary.toLocaleString('es-CO')}
                    </div>
                    <p className="text-xs mt-1">
                      ({formData.working_days} días × ${(formData.daily_rate || 0).toLocaleString('es-CO')})
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="hire_date">Fecha de Contratación *</Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date || ''}
              onChange={(e) => handleChange('hire_date', e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (employee ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}