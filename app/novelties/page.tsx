"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Filter } from "lucide-react"
import { getNovelties, getEmployees, getPayrolls, type PayrollNovelty, type Employee } from "@/lib/mock-data"
import { NoveltyDialog } from "@/components/novelty-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteNovelty } from "@/lib/mock-data"


const noveltyTypeLabels: Record<PayrollNovelty["novelty_type"], string> = {
  bonus: "Bono",
  deduction: "Deducción",
  overtime: "Horas Extras",
  absence: "Ausencia",
  commission: "Comisión",
  loan: "Préstamo",
}

const noveltyTypeColors: Record<PayrollNovelty["novelty_type"], "default" | "secondary" | "destructive"> = {
  bonus: "default",
  commission: "default",
  overtime: "default",
  deduction: "destructive",
  absence: "destructive",
  loan: "secondary",
}

export default function NoveltiesPage() {
  const [novelties, setNovelties] = useState<PayrollNovelty[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNovelty, setSelectedNovelty] = useState<PayrollNovelty | null>(null)
  const [noveltyToDelete, setNoveltyToDelete] = useState<PayrollNovelty | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
  async function fetchNovelties() {
    try {
      const data = await getNovelties()
      setNovelties(data)
    } catch (error) {
      console.error("Error al obtener las novedades:", error)
    }
  }
  fetchNovelties()
  }, [])

  useEffect(() => {
  async function fetchEmployees() {
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error("Error al obtener los empleados:", error)
    }
  }

  fetchEmployees()
  }, [])


  const filteredNovelties = (novelties ?? []).filter((novelty) => {
    const employee = employees.find((e) => e.id === novelty.employee_id)
    const matchesSearch =
      employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      novelty.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || novelty.novelty_type === filterType
    return matchesSearch && matchesType
  })

  const handleAddNovelty = () => {
    setSelectedNovelty(null)
    setDialogOpen(true)
  }

  const handleEditNovelty = (novelty: PayrollNovelty) => {
    setSelectedNovelty(novelty)
    setDialogOpen(true)
  }

  const handleDeleteClick = (novelty: PayrollNovelty) => {
    setNoveltyToDelete(novelty)
    setDeleteDialogOpen(true)
  }

  const handleSaveNovelty = (savedNovelty: PayrollNovelty) => {
  setNovelties((prev) => {
    const exists = prev.some((n) => n.id === savedNovelty.id)
    return exists
      ? prev.map((n) => (n.id === savedNovelty.id ? savedNovelty : n))
      : [...prev, savedNovelty]
  })

  setDialogOpen(false)
  setSelectedNovelty(null)
}


  const handleConfirmDelete = async () => {
  if (!noveltyToDelete) return

  try {
    await deleteNovelty(noveltyToDelete.id)
    setNovelties((prev) => prev.filter((n) => n.id !== noveltyToDelete.id))
  } catch (error) {
    console.error("Error al eliminar la novedad:", error)
  } finally {
    setDeleteDialogOpen(false)
    setNoveltyToDelete(null)
  }
}

  const totalAmount = filteredNovelties.reduce((sum, n) => {
    if (n.novelty_type === "deduction" || n.novelty_type === "absence") {
      return sum - n.amount
    }
    return sum + n.amount
  }, 0)


  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Novedades de Nómina</h1>
          <p className="text-muted-foreground mt-1">Registra bonos, deducciones y otros conceptos</p>
        </div>
        <Button onClick={handleAddNovelty}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Novedad
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Novedades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredNovelties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              $
              {filteredNovelties
                .filter((n) => ["bonus", "overtime", "commission"].includes(n.novelty_type))
                .reduce((sum, n) => sum + n.amount, 0)
                .toLocaleString("es-CO")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deducciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              $
              {filteredNovelties
                .filter((n) => ["deduction", "absence", "loan"].includes(n.novelty_type))
                .reduce((sum, n) => sum + n.amount, 0)
                .toLocaleString("es-CO")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="bonus">Bonos</SelectItem>
                  <SelectItem value="deduction">Deducciones</SelectItem>
                  <SelectItem value="overtime">Horas Extras</SelectItem>
                  <SelectItem value="absence">Ausencias</SelectItem>
                  <SelectItem value="commission">Comisiones</SelectItem>
                  <SelectItem value="loan">Préstamos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNovelties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No se encontraron novedades
                  </TableCell>
                </TableRow>
              ) : (
                filteredNovelties.map((novelty) => {
                  const employee = employees.find((e) => e.id === novelty.employee_id)
                  return (
                    <TableRow key={novelty.id}>
                      <TableCell>{new Date(novelty.date).toLocaleDateString("es-CO")}</TableCell>
                      <TableCell className="font-medium">
                        {employee?.first_name} {employee?.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={noveltyTypeColors[novelty.novelty_type]}>
                          {noveltyTypeLabels[novelty.novelty_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{novelty.description}</TableCell>
                      <TableCell
                        className={
                          ["deduction", "absence", "loan"].includes(novelty.novelty_type)
                            ? "text-red-600 font-medium"
                            : "text-green-600 font-medium"
                        }
                      >
                        {["deduction", "absence", "loan"].includes(novelty.novelty_type) ? "-" : "+"}$
                        {novelty.amount.toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditNovelty(novelty)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(novelty)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NoveltyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        novelty={selectedNovelty}
        onSave={handleSaveNovelty}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar Novedad"
        description="¿Estás seguro de que deseas eliminar esta novedad? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
