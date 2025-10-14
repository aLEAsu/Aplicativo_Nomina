import type { Employee, PayrollNovelty, Payroll } from "./mock-data"

export function calculatePayroll(
  employee: Employee,
  novelties: PayrollNovelty[],
  month: number,
  year: number,
): Payroll {
  // Filtrar novedades del empleado para el mes seleccionado
  const employeeNovelties = novelties.filter((n) => {
    const noveltyDate = new Date(n.date)
    return n.employee_id === employee.id && noveltyDate.getMonth() + 1 === month && noveltyDate.getFullYear() === year
  })

  // Calcular totales por tipo de novedad
  const bonuses = employeeNovelties.filter((n) => n.novelty_type === "bonus").reduce((sum, n) => sum + n.amount, 0)

  const overtime = employeeNovelties.filter((n) => n.novelty_type === "overtime").reduce((sum, n) => sum + n.amount, 0)

  const commissions = employeeNovelties
    .filter((n) => n.novelty_type === "commission")
    .reduce((sum, n) => sum + n.amount, 0)

  const deductions = employeeNovelties
    .filter((n) => ["deduction", "absence", "loan"].includes(n.novelty_type))
    .reduce((sum, n) => sum + n.amount, 0)

  // Calcular salud y pensión (8% y 4% del salario base)
  const healthContribution = employee.base_salary * 0.04
  const pensionContribution = employee.base_salary * 0.04

  const totalEarnings = employee.base_salary + bonuses + overtime + commissions
  const totalDeductions = deductions + healthContribution + pensionContribution
  const netSalary = totalEarnings - totalDeductions

  return {
    id: `${employee.id}-${month}-${year}`,
    employee_id: employee.id,
    periodMonth: month,
    periodYear: year,
    base_salary: employee.base_salary,
    bonuses,
    deductions: deductions + healthContribution + pensionContribution,
    overtime,
    commissions,
    totalEarnings,
    totalDeductions,
    netSalary,
    processedAt: new Date().toISOString(),
  }
}
