// CRUD empleados
export async function createEmployee(employee: Omit<Employee, "id">): Promise<Employee | null> {
  const { data, error } = await supabase.from("employees").insert([employee]).select()
  if (error) throw error
  return data ? data[0] as Employee : null
}

export async function updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee | null> {
  const { data, error } = await supabase.from("employees").update(employee).eq("id", id).select()
  if (error) throw error
  return data ? data[0] as Employee : null
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from("employees").delete().eq("id", id)
  if (error) throw error
}

// CRUD Novedades
// CRUD Novedades
export async function createNovelty(novelty: Omit<PayrollNovelty, "id">): Promise<PayrollNovelty | null> {
  console.log("📝 Datos a insertar:", novelty)
  
  const { data, error } = await supabase
    .from("payroll_novelties")
    .insert([novelty])
    .select()
    .single()
  
  if (error) {
    console.error("❌ Error de Supabase:", error)
    throw error
  }
  
  console.log("✅ Novedad creada:", data)
  return data as PayrollNovelty
}

export async function updateNovelty(id: string, novelty: Partial<PayrollNovelty>): Promise<PayrollNovelty | null> {
  console.log("✏️ Actualizando novedad:", id, novelty)
  
  const { data, error } = await supabase
    .from("payroll_novelties")
    .update(novelty)
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("❌ Error de Supabase:", error)
    throw error
  }
  
  console.log("✅ Novedad actualizada:", data)
  return data as PayrollNovelty
}

export async function deleteNovelty(id: string): Promise<void> {
  const { error } = await supabase
    .from("payroll_novelties")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("❌ Error de Supabase:", error)
    throw error
  }
}
// Al final del archivo, después de deleteNovelty

// CRUD Payrolls
export async function getPayrollsByPeriod(month: number, year: number): Promise<Payroll[]> {
  console.log("📊 Obteniendo nóminas del período:", month, year)
  
  const { data, error } = await supabase
    .from("payrolls")
    .select("*")
    .eq("period_month", month)
    .eq("period_year", year)
  
  if (error) {
    console.error("❌ Error al obtener nóminas:", error)
    throw error
  }
  
  console.log("✅ Nóminas obtenidas:", data)
  return data as Payroll[]
}

export async function createPayroll(payroll: Omit<Payroll, "id" | "processed_at">): Promise<Payroll> {
  console.log("💰 Creando nómina:", payroll)
  
  const { data, error } = await supabase
    .from("payrolls")
    .insert([{
      employee_id: payroll.employee_id,
      period_month: payroll.period_month,
      period_year: payroll.period_year,
      base_salary: payroll.base_salary,
      bonuses: payroll.bonuses,
      deductions: payroll.deductions,
      overtime: payroll.overtime,
      commissions: payroll.commissions,
      total_earnings: payroll.total_earnings,
      total_deductions: payroll.total_deductions,
      net_salary: payroll.net_salary
    }])
    .select()
    .single()
  
  if (error) {
    console.error("❌ Error al crear nómina:", error)
    throw error
  }
  
  if (!data) {
    throw new Error("No se recibieron datos de la base de datos")
  }
  
  console.log("✅ Nómina creada:", data)
  return data as Payroll
}

export async function createBulkPayrolls(payrolls: Omit<Payroll, "id" | "processed_at">[]): Promise<Payroll[]> {
  console.log("💰 Creando múltiples nóminas:", payrolls.length)
  
  const payrollsToInsert = payrolls.map(p => ({
    employee_id: p.employee_id,
    period_month: p.period_month,
    period_year: p.period_year,
    base_salary: p.base_salary,
    bonuses: p.bonuses,
    deductions: p.deductions,
    overtime: p.overtime,
    commissions: p.commissions,
    total_earnings: p.total_earnings,
    total_deductions: p.total_deductions,
    net_salary: p.net_salary

  }))
  
  const { data, error } = await supabase
    .from("payrolls")
    .insert(payrollsToInsert)
    .select()
  
  if (error) {
    console.error("❌ Error al crear nóminas:", error)
    throw error
  }
  
  if (!data) {
    throw new Error("No se recibieron datos de la base de datos")
  }
  
  console.log("✅ Nóminas creadas:", data.length)
  return data as Payroll[]
}

export async function deletePayrollsByPeriod(month: number, year: number): Promise<void> {
  console.log("Eliminando nóminas del período", month, year);
  const { error } = await supabase
    .from('payrolls')
    .delete()
    .eq('period_month', month)
    .eq('period_year', year);

  if (error) {
    console.error("Error al eliminar nóminas", error);
    throw error;
  }
  console.log("Nóminas eliminadas");
}


// Integración con Supabase para datos reales
export interface Employee {
  id: string
  identification: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
  base_salary: number
  hire_date: string
  status: "active" | "inactive"
}

export interface PayrollNovelty {
  id: string
  employee_id: string
  novelty_type: "bonus" | "deduction" | "overtime" | "absence" | "commission" | "loan"
  description: string
  amount: number
  date: string
}

export interface Payroll {
  id: string
  employee_id: string
  period_month: number
  period_year: number
  base_salary: number
  bonuses: number
  deductions: number
  overtime: number
  commissions: number
  total_earnings: number
  total_deductions: number
  net_salary: number
  processed_at: string
}

import { supabase } from "./supabaseClient"

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from("employees").select("*")
  if (error) throw error
  return data as Employee[]
}

export async function getNovelties(): Promise<PayrollNovelty[]> {
  const { data, error } = await supabase.from("payroll_novelties").select("*")
  if (error) throw error
  return data as PayrollNovelty[]
}
export async function getPayrolls(): Promise<Payroll[]> {
  const { data, error } = await supabase.from("payrolls").select("*")
  if (error) throw error
  return data as Payroll[]
}
