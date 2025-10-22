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

  // ✅ Solo deducciones reales (sin salud ni pensión todavía)
  const otherDeductions = employeeNovelties
    .filter((n) => ["deduction", "absence", "loan"].includes(n.novelty_type))
    .reduce((sum, n) => sum + n.amount, 0)

  // 💡 Calcular salud y pensión pero registrarlas aparte, no sumarlas al campo "deductions"
  const healthContribution = employee.base_salary * 0.04
  const pensionContribution = employee.base_salary * 0.04

  const total_earnings = employee.base_salary + bonuses + overtime + commissions
  const total_deductions = otherDeductions + healthContribution + pensionContribution
  const net_salary = total_earnings - total_deductions

  return {
    id: `${employee.id}-${month}-${year}`,
    employee_id: employee.id,
    period_month: month,
    period_year: year,
    base_salary: employee.base_salary,
    bonuses,
    overtime,
    commissions,
    // ⚠️ Aquí la corrección clave:
    // Solo guardamos deducciones de novedades (no salud ni pensión)
    deductions: otherDeductions,
    total_earnings,
    total_deductions,
    net_salary,
    processed_at: new Date().toISOString(),
  }
}
