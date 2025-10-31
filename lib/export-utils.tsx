import type { Employee, Payroll } from "./mock-data"

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return

  // Obtener headers
  const headers = Object.keys(data[0])

  // Crear contenido CSV
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escapar valores que contengan comas o comillas
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(","),
    ),
  ].join("\n")

  // Crear blob y descargar
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportReportToPDF(month: number, year: number, employees: Employee[], payrolls: Payroll[]) {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const periodPayrolls = payrolls.filter((p) => p.period_month === month && p.period_year === year)
  const activeEmployees = employees.filter((e) => e.status === "active")

  const totalPayroll = periodPayrolls.reduce((sum, p) => sum + p.net_salary, 0)
  const totalEarnings = periodPayrolls.reduce((sum, p) => sum + p.total_earnings, 0)
  const totalDeductions = periodPayrolls.reduce((sum, p) => sum + p.total_deductions, 0)

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .report-title {
          font-size: 20px;
          color: #666;
          margin-bottom: 10px;
        }
        .period {
          font-size: 16px;
          color: #999;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .summary-card {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin: 30px 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #ddd;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .table th {
          background-color: #333;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
        }
        .table td {
          padding: 10px 12px;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }
        .table tr:hover {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #999;
          font-size: 12px;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">EMPRESA S.A.S.</div>
        <div class="report-title">Reporte de Nómina</div>
        <div class="period">${monthNames[month - 1]} ${year}</div>
      </div>

      <div class="summary">
        <div class="summary-card">
          <div class="summary-label">Total Empleados</div>
          <div class="summary-value">${activeEmployees.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Devengado</div>
          <div class="summary-value">$${totalEarnings.toLocaleString("es-CO")}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Neto a Pagar</div>
          <div class="summary-value">$${totalPayroll.toLocaleString("es-CO")}</div>
        </div>
      </div>

      <div class="section-title">Detalle de Nómina</div>
      <table class="table">
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Identificación</th>
            <th>Cargo</th>
            <th>Salario Base</th>
            <th>Bonos</th>
            <th>Deducciones</th>
            <th>Neto</th>
          </tr>
        </thead>
        <tbody>
          ${periodPayrolls
            .map((payroll) => {
              const employee = employees.find((e) => e.id === payroll.employee_id)
              return `
            <tr>
              <td>${employee?.first_name} ${employee?.last_name}</td>
              <td>${employee?.identification}</td>
              <td>${employee?.position}</td>
              <td>$${payroll.base_salary.toLocaleString("es-CO")}</td>
              <td>$${payroll.bonuses.toLocaleString("es-CO")}</td>
              <td>$${payroll.deductions.toLocaleString("es-CO")}</td>
              <td><strong>$${payroll.net_salary.toLocaleString("es-CO")}</strong></td>
            </tr>
          `
            })
            .join("")}
        </tbody>
      </table>

      <div class="section-title">Resumen por Departamento</div>
      <table class="table">
        <thead>
          <tr>
            <th>Departamento</th>
            <th>Empleados</th>
            <th>Nómina Total</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(
            activeEmployees.reduce(
              (acc, emp) => {
                const dept = emp.department || "Sin Departamento"
                if (!acc[dept]) {
                  acc[dept] = { count: 0, total: 0 }
                }
                acc[dept].count += 1
                const empPayroll = periodPayrolls.find((p) => p.employee_id === emp.id)
                acc[dept].total += empPayroll?.net_salary || 0
                return acc
              },
              {} as Record<string, { count: number; total: number }>,
            ),
          )
            .map(
              ([dept, data]) => `
            <tr>
              <td>${dept}</td>
              <td>${data.count}</td>
              <td>$${data.total.toLocaleString("es-CO")}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        <p>Reporte generado el ${new Date().toLocaleDateString("es-CO")} a las ${new Date().toLocaleTimeString("es-CO")}</p>
        <p>Sistema de Nómina PAE - ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `Reporte_Nomina_${month}_${year}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
