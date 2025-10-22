"use client"

import type React from "react"

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
import { Textarea } from "@/components/ui/textarea"
import type { PayrollNovelty } from "@/lib/mock-data"
import { getEmployees, Employee } from "@/lib/mock-data"
import { createNovelty, updateNovelty } from "@/lib/mock-data"
import { getNovelties, getPayrolls } from "@/lib/mock-data"


interface NoveltyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  novelty: PayrollNovelty | null
  onSave: (novelty: PayrollNovelty) => void
}

export function NoveltyDialog({ open, onOpenChange, novelty, onSave }: NoveltyDialogProps) {
  const [formData, setFormData] = useState<Partial<PayrollNovelty>>({
    employee_id: "",
    novelty_type: "bonus",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (novelty) {
      setFormData(novelty)
    } else {
      setFormData({
        employee_id: "",
        novelty_type: "bonus",
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
      })
    }
  }, [novelty, open])

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    console.log("📤 Guardando novedad...", formData)
    
    // Validar que employee_id esté presente
    if (!formData.employee_id) {
      alert("Por favor selecciona un empleado")
      return
    }
    
    // Validar que amount sea mayor a 0
    if (!formData.amount || formData.amount <= 0) {
      alert("Por favor ingresa un monto válido")
      return
    }

    let savedNovelty: PayrollNovelty | null = null

    if (novelty?.id) {
      // ✏️ Editar novedad existente
      console.log("Editando novedad existente:", novelty.id)
      savedNovelty = await updateNovelty(novelty.id, formData as PayrollNovelty)
    } else {
      // 🆕 Crear nueva novedad
      console.log("Creando nueva novedad")
      savedNovelty = await createNovelty(formData as PayrollNovelty)
    }

    if (savedNovelty) {
      console.log("✅ Novedad guardada exitosamente:", savedNovelty)
      onSave(savedNovelty)
      onOpenChange(false)
    }
  } catch (error: any) {
    console.error("❌ Error al guardar la novedad:", error)
    
    // Mostrar mensaje de error más detallado
    const errorMessage = error?.message || error?.toString() || "Error desconocido al guardar"
    alert(`Error al guardar la novedad: ${errorMessage}`)
  }
}

  const handleChange = (field: keyof PayrollNovelty, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [errorEmployees, setErrorEmployees] = useState<string | null>(null)

  useEffect(() => {
    setLoadingEmployees(true)
    getEmployees()
      .then((data) => {
        setEmployees(data.filter((e) => e.status === "active"))
        setErrorEmployees(null)
      })
      .catch((err) => {
        setErrorEmployees("Error al cargar empleados")
        setEmployees([])
      })
      .finally(() => setLoadingEmployees(false))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{novelty ? "Editar Novedad" : "Nueva Novedad"}</DialogTitle>
          <DialogDescription>
            {novelty ? "Actualiza la información de la novedad" : "Registra una nueva novedad de nómina"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Empleado *</Label>
              <Select value={formData.employee_id} onValueChange={(value) => handleChange("employee_id", value)}>
                <SelectTrigger id="employeeId">
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {loadingEmployees && (
                    <div className="px-4 py-2 text-sm text-muted-foreground">Cargando empleados...</div>
                  )}
                  {errorEmployees && (
                    <div className="px-4 py-2 text-sm text-destructive">{errorEmployees}</div>
                  )}
                  {!loadingEmployees && !errorEmployees && employees.length === 0 && (
                    <div className="px-4 py-2 text-sm text-muted-foreground">No hay empleados activos</div>
                  )}
                  {!loadingEmployees && !errorEmployees && employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.identification}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="noveltyType">Tipo de Novedad *</Label>
                <Select value={formData.novelty_type} onValueChange={(value) => handleChange("novelty_type", value)}>
                  <SelectTrigger id="noveltyType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bonus">Bono</SelectItem>
                    <SelectItem value="deduction">Deducción</SelectItem>
                    <SelectItem value="overtime">Horas Extras</SelectItem>
                    <SelectItem value="absence">Ausencia</SelectItem>
                    <SelectItem value="commission">Comisión</SelectItem>
                    <SelectItem value="loan">Préstamo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount === 0 ? "" : formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange("amount", value === "" ? 0 : Number.parseFloat(value));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe el motivo de esta novedad..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{novelty ? "Actualizar" : "Registrar"} Novedad</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
