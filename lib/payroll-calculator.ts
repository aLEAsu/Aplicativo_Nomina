// lib/payroll-calculator.ts - VERSIÓN SIN DESCUENTOS DE SALUD Y PENSIÓN

import type { Employee, PayrollNovelty, Payroll } from "./mock-data"

export function calculatePayroll(
  employee: Employee,
  novelties: PayrollNovelty[],
  month: number,
  year: number,
): Payroll {
  // Calcular salario base según tipo de contrato
  const effectiveBaseSalary = employee.contract_type === 'daily' 
    ? employee.daily_rate * employee.working_days 
    : employee.base_salary

  // Filtrar novedades del empleado para el mes seleccionado
  const employeeNovelties = novelties.filter((n) => {
    const noveltyDate = new Date(n.date)
    return (
      n.employee_id === employee.id &&
      noveltyDate.getMonth() + 1 === month &&
      noveltyDate.getFullYear() === year
    )
  })

  // Calcular totales por tipo de novedad
  const bonuses = employeeNovelties
    .filter((n) => n.novelty_type === "bonus")
    .reduce((sum, n) => sum + n.amount, 0)

  const overtime = employeeNovelties
    .filter((n) => n.novelty_type === "overtime")
    .reduce((sum, n) => sum + n.amount, 0)

  const commissions = employeeNovelties
    .filter((n) => n.novelty_type === "commission")
    .reduce((sum, n) => sum + n.amount, 0)

  // 🔸 Solo deducciones por novedades (sin salud ni pensión)
  const otherDeductions = employeeNovelties
    .filter((n) => ["deduction", "absence", "loan"].includes(n.novelty_type))
    .reduce((sum, n) => sum + n.amount, 0)

  const total_earnings = effectiveBaseSalary + bonuses + overtime + commissions
  const total_deductions = otherDeductions
  const net_salary = total_earnings - total_deductions

  return {
    id: `${employee.id}-${month}-${year}`,
    employee_id: employee.id,
    period_month: month,
    period_year: year,
    base_salary: effectiveBaseSalary,
    bonuses,
    overtime,
    commissions,
    deductions: otherDeductions,
    total_earnings,
    total_deductions,
    net_salary,
    processed_at: new Date().toISOString(),
  }
}
