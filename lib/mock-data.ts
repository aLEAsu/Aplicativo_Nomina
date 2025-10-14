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
export async function createNovelty(novelty: Omit<PayrollNovelty, "id">): Promise<PayrollNovelty | null> {
  const { data, error } = await supabase.from("payroll_novelties").insert([novelty]).select().single()
  if (error) throw error
  return data as PayrollNovelty
}

export async function updateNovelty(id: string, novelty: Partial<PayrollNovelty>): Promise<PayrollNovelty | null> {
  const { data, error } = await supabase.from("payroll_novelties").update(novelty).eq("id", id).select().single()
  if (error) throw error
  return data as PayrollNovelty
}

export async function deleteNovelty(id: string): Promise<void> {
  const { error } = await supabase.from("payroll_novelties").delete().eq("id", id)
  if (error) throw error
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
  periodMonth: number
  periodYear: number
  base_salary: number
  bonuses: number
  deductions: number
  overtime: number
  commissions: number
  totalEarnings: number
  totalDeductions: number
  netSalary: number
  processedAt: string
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
