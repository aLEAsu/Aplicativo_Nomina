"use client"

import { useState, useEffect } from "react"
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
import type { Employee, ContractType } from "@/lib/mock-data"

interface EmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onSave: (employee: Employee) => void
}

export function EmployeeDialog({ open, onOpenChange, employee, onSave }: EmployeeDialogProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    identification: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    contract_type: "monthly",
    base_salary: 0,
    daily_rate: 0,
    working_days: 0,
    hire_date: "",
    status: "active",
  })

  useEffect(() => {
    if (employee) {
      setFormData(employee)
    } else {
      setFormData({
        identification: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        contract_type: "monthly",
        base_salary: 0,
        daily_rate: 0,
        working_days: 0,
        hire_date: "",
        status: "active",
      })
    }
  }, [employee, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación
    const errors: string[] = []
    
    if (formData.contract_type === 'monthly' && (!formData.base_salary || formData.base_salary <= 0)) {
      errors.push('El salario base es requerido para empleados mensuales')
    }
    
    if (formData.contract_type === 'daily' && (!formData.daily_rate || formData.daily_rate <= 0)) {
      errors.push('El valor día es requerido para trabajadores por día')
    }
    
    if (errors.length > 0) {
      alert(errors.join('\n'))
      return
    }
    
    onSave(formData as Employee)
  }

  const handleChange = (field: keyof Employee, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isMonthly = formData.contract_type === 'monthly'
  const isDaily = formData.contract_type === 'daily'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
          <DialogDescription>
            {employee
              ? "Actualiza la información del empleado"
              : "Completa el formulario para agregar un nuevo empleado"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Información Básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="identification">Identificación *</Label>
                <Input
                  id="identification"
                  value={formData.identification}
                  onChange={(e) => handleChange("identification", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="status">
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
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
              </div>
            </div>

            {/* Cargo y Departamento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Cargo *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                />
              </div>
            </div>

            {/* 🆕 SECCIÓN DE TIPO DE CONTRATO */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract_type" className="text-base font-semibold">
                  Tipo de Contrato *
                </Label>
                <Select 
                  value={formData.contract_type} 
                  onValueChange={(value: ContractType) => handleChange("contract_type", value)}
                >
                  <SelectTrigger id="contract_type" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">💼 Salario Mensual Fijo</SelectItem>
                    <SelectItem value="daily">📅 Pago por Día Trabajado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos Condicionales según el tipo de contrato */}
              {isMonthly && (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <Label htmlFor="base_salary" className="flex items-center gap-2">
                    Salario Base Mensual *
                    <span className="text-xs text-muted-foreground">(fijo cada mes)</span>
                  </Label>
                  <Input
                    id="base_salary"
                    type="number"
                    value={formData.base_salary || ''}
                    onChange={(e) => handleChange("base_salary", Number.parseFloat(e.target.value) || 0)}
                    className="bg-background"
                    required
                    placeholder="Ej: 1500000"
                  />
                </div>
              )}

              {isDaily && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="daily_rate" className="flex items-center gap-2">
                      Valor Día *
                      <span className="text-xs text-muted-foreground">(pago por cada día trabajado)</span>
                    </Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      value={formData.daily_rate || ''}
                      onChange={(e) => handleChange("daily_rate", Number.parseFloat(e.target.value) || 0)}
                      className="bg-background"
                      required
                      placeholder="Ej: 50000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="working_days" className="flex items-center gap-2">
                      Días Trabajados (Mes Actual)
                      <span className="text-xs text-muted-foreground">(opcional, se puede actualizar después)</span>
                    </Label>
                    <Input
                      id="working_days"
                      type="number"
                      min="0"
                      max="31"
                      value={formData.working_days || 0}
                      onChange={(e) => handleChange("working_days", Number.parseInt(e.target.value) || 0)}
                      className="bg-background"
                      placeholder="Ej: 20"
                    />
                    {(formData.daily_rate ?? 0) > 0 && (formData.working_days ?? 0) > 0 && (
                        <p className="text-sm text-muted-foreground">
                          💰 Pago estimado: <strong className="text-foreground">
                            ${((formData.daily_rate ?? 0) * (formData.working_days ?? 0)).toLocaleString('es-CO')}
                          </strong>
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Fecha de Contratación */}
            <div className="space-y-2">
              <Label htmlFor="hire_date">Fecha de Contratación *</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleChange("hire_date", e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{employee ? "Actualizar" : "Crear"} Empleado</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}