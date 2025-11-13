// lib/mock-data.ts - VERSIÓN MEJORADA Y OPTIMIZADA

import { supabase } from "./supabaseClient"

// ============= TIPOS Y CONSTANTES =============

export type ContractType = 'monthly' | 'daily'
export type EmployeeStatus = 'active' | 'inactive'

export const MINIMUM_WAGE = 1_300_000 // Salario mínimo 2025
export const MINIMUM_DAILY_RATE = 25_000 // Tarifa diaria mínima sugerida

export interface Employee {
  id: string
  identification: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
  contract_type: ContractType
  base_salary: number      // Para empleados mensuales
  daily_rate: number       // Para trabajadores por día
  working_days: number     // Días trabajados en el período actual
  hire_date: string
  status: EmployeeStatus
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

// ============= VALIDACIONES =============

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateEmployee(employee: Partial<Employee>): ValidationResult {
  const errors: string[] = []

  // Validaciones básicas
  if (!employee.identification?.trim()) {
    errors.push('La identificación es obligatoria')
  }
  if (!employee.first_name?.trim()) {
    errors.push('El nombre es obligatorio')
  }
  if (!employee.last_name?.trim()) {
    errors.push('El apellido es obligatorio')
  }
  if (!employee.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    errors.push('Email inválido')
  }
  if (!employee.position?.trim()) {
    errors.push('El cargo es obligatorio')
  }
  if (!employee.department?.trim()) {
    errors.push('El departamento es obligatorio')
  }
  if (!employee.hire_date) {
    errors.push('La fecha de contratación es obligatoria')
  }

  // Validaciones específicas por tipo de contrato
  if (employee.contract_type === 'monthly') {
    if (!employee.base_salary || employee.base_salary < MINIMUM_WAGE) {
      errors.push(`El salario mensual debe ser mínimo $${MINIMUM_WAGE.toLocaleString('es-CO')}`)
    }
  } else if (employee.contract_type === 'daily') {
    if (!employee.daily_rate || employee.daily_rate < MINIMUM_DAILY_RATE) {
      errors.push(`El valor día debe ser mínimo $${MINIMUM_DAILY_RATE.toLocaleString('es-CO')}`)
    }
    if (employee.working_days !== undefined && (employee.working_days < 0 || employee.working_days > 31)) {
      errors.push('Los días trabajados deben estar entre 0 y 31')
    }
  } else {
    errors.push('Tipo de contrato inválido (debe ser "monthly" o "daily")')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============= HELPERS =============

export function getEffectiveSalary(employee: Employee): number {
  if (employee.contract_type === 'daily') {
    return employee.daily_rate * employee.working_days
  }
  return employee.base_salary
}

export function normalizeEmployeeData(rawData: any): Partial<Employee> {
  // Normalizar tipo de contrato
  const contractTypeRaw = String(rawData.contract_type || rawData.tipo_contrato || 'monthly').toLowerCase().trim()
  const contract_type: ContractType = 
    contractTypeRaw === 'daily' || contractTypeRaw === 'diario' || contractTypeRaw === 'por dia' 
      ? 'daily' 
      : 'monthly'

  // Normalizar estado
  const statusRaw = String(rawData.status || rawData.estado || 'active').toLowerCase().trim()
  const status: EmployeeStatus = 
    statusRaw === 'active' || statusRaw === 'activo' 
      ? 'active' 
      : 'inactive'

  // Limpiar teléfono
  const phoneRaw = String(rawData.phone || rawData.telefono || '').trim()
  const phone = phoneRaw.replace(/[\s\-()]/g, '').substring(0, 20)

  // Normalizar salarios según tipo de contrato
  let base_salary = 0
  let daily_rate = 0
  let working_days = 0

  if (contract_type === 'monthly') {
    base_salary = Number(rawData.base_salary || rawData.salario_base || rawData.salario || 0)
  } else {
    daily_rate = Number(rawData.daily_rate || rawData.valor_dia || 0)
    working_days = Number(rawData.working_days || rawData.dias_trabajados || 0)
  }

  return {
    identification: String(rawData.identification || rawData.cedula || rawData.document || '').trim().substring(0, 50),
    first_name: String(rawData.first_name || rawData.nombre || '').trim().substring(0, 100),
    last_name: String(rawData.last_name || rawData.apellido || '').trim().substring(0, 100),
    email: String(rawData.email || '').trim().toLowerCase().substring(0, 255),
    phone,
    position: String(rawData.position || rawData.cargo || '').trim().substring(0, 100),
    department: String(rawData.department || rawData.departamento || '').trim().substring(0, 100),
    contract_type,
    base_salary,
    daily_rate,
    working_days,
    hire_date: String(rawData.hire_date || rawData.fecha_contratacion || rawData.fecha || '').trim(),
    status
  }
}

// ============= CRUD EMPLEADOS =============

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order('first_name', { ascending: true })
  
  if (error) throw error
  return (data || []) as Employee[]
}

export async function createEmployee(employee: Omit<Employee, "id">): Promise<Employee | null> {
  // Validar antes de insertar
  const validation = validateEmployee(employee)
  if (!validation.isValid) {
    throw new Error(`Validación fallida: ${validation.errors.join(', ')}`)
  }

  const { data, error } = await supabase
    .from("employees")
    .insert([employee])
    .select()
    .single()
  if (error) throw error
  return data as Employee
}

export async function updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee | null> {
  // Validar antes de actualizar
  const validation = validateEmployee(employee)
  if (!validation.isValid) {
    throw new Error(`Validación fallida: ${validation.errors.join(', ')}`)
  }

  const { data, error } = await supabase
    .from("employees")
    .update(employee)
    .eq("id", id)
    .select()
    .single()
  
  if (error) throw error
  return data as Employee
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
  
  if (error) throw error
}

export async function createBulkEmployees(employees: Omit<Employee, "id">[]): Promise<{
  success: Employee[]
  errors: Array<{ index: number; employee: any; error: string }>
}> {
  if (!employees.length) return { success: [], errors: [] }

  const success: Employee[] = []
  const errors: Array<{ index: number; employee: any; error: string }> = []

  // Procesar en lotes de 50 para mejor performance
  const BATCH_SIZE = 50
  
  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    const batch = employees.slice(i, i + BATCH_SIZE)
    
    // Validar cada empleado del lote
    const validEmployees: Array<{ employee: Omit<Employee, "id">; originalIndex: number }> = []
    
    batch.forEach((emp, batchIndex) => {
      const originalIndex = i + batchIndex
      const validation = validateEmployee(emp)
      
      if (validation.isValid) {
        validEmployees.push({ employee: emp, originalIndex })
      } else {
        errors.push({
          index: originalIndex + 1,
          employee: emp,
          error: validation.errors.join(', ')
        })
      }
    })

    // Insertar empleados válidos
    if (validEmployees.length > 0) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .insert(validEmployees.map(v => v.employee))
          .select()
        
        if (error) {
          // Si falla el lote completo, intentar uno por uno
          for (const { employee, originalIndex } of validEmployees) {
            try {
              const { data: singleData, error: singleError } = await supabase
                .from("employees")
                .insert([employee])
                .select()
                .single()
              
              if (singleError) throw singleError
              if (singleData) success.push(singleData as Employee)
            } catch (singleErr: any) {
              errors.push({
                index: originalIndex + 1,
                employee,
                error: singleErr.message || 'Error desconocido'
              })
            }
          }
        } else if (data) {
          success.push(...(data as Employee[]))
        }
      } catch (batchErr: any) {
        validEmployees.forEach(({ employee, originalIndex }) => {
          errors.push({
            index: originalIndex + 1,
            employee,
            error: batchErr.message || 'Error en el lote'
          })
        })
      }
    }
  }

  return { success, errors }
}

// ============= CRUD NOVEDADES =============

export async function getNovelties(): Promise<PayrollNovelty[]> {
  const { data, error } = await supabase
    .from("payroll_novelties")
    .select("*")
    .order('date', { ascending: false })
  
  if (error) throw error
  return (data || []) as PayrollNovelty[]
}

export async function createNovelty(novelty: Omit<PayrollNovelty, "id">): Promise<PayrollNovelty | null> {
  const { data, error } = await supabase
    .from("payroll_novelties")
    .insert([novelty])
    .select()
    .single()
  
  if (error) throw error
  return data as PayrollNovelty
}

export async function updateNovelty(id: string, novelty: Partial<PayrollNovelty>): Promise<PayrollNovelty | null> {
  const { data, error } = await supabase
    .from("payroll_novelties")
    .update(novelty)
    .eq("id", id)
    .select()
    .single()
  
  if (error) throw error
  return data as PayrollNovelty
}

export async function deleteNovelty(id: string): Promise<void> {
  const { error } = await supabase
    .from("payroll_novelties")
    .delete()
    .eq("id", id)
  
  if (error) throw error
}

// ============= CRUD NÓMINAS =============

export async function getPayrolls(): Promise<Payroll[]> {
  const { data, error } = await supabase
    .from("payrolls")
    .select("*")
    .order('processed_at', { ascending: false })
  
  if (error) throw error
  return (data || []) as Payroll[]
}

export async function getPayrollsByPeriod(month: number, year: number): Promise<Payroll[]> {
  const { data, error } = await supabase
    .from("payrolls")
    .select("*")
    .eq("period_month", month)
    .eq("period_year", year)
    .order('employee_id', { ascending: true })
  
  if (error) throw error
  return (data || []) as Payroll[]
}

export async function createPayroll(payroll: Omit<Payroll, "id" | "processed_at">): Promise<Payroll> {
  const { data, error } = await supabase
    .from("payrolls")
    .insert([payroll])
    .select()
    .single()
  
  if (error) throw error
  if (!data) throw new Error("No se recibieron datos de la base de datos")
  
  return data as Payroll
}

export async function createBulkPayrolls(payrolls: Partial<Payroll>[]): Promise<Payroll[]> {
  if (!payrolls.length) return []

  const sanitized = payrolls.map(({ id, processed_at, ...rest }) => rest)

  const { data, error } = await supabase
    .from("payrolls")
    .insert(sanitized)
    .select()

  if (error) throw new Error(error.message || "Error desconocido al insertar nóminas")
  if (!data) throw new Error("No se recibieron datos de la base de datos")

  return data as Payroll[]
}


export async function deletePayrollsByPeriod(month: number, year: number): Promise<void> {
  const { error } = await supabase
    .from('payrolls')
    .delete()
    .eq('period_month', month)
    .eq('period_year', year)

  if (error) throw error
}