import type { Payroll, Employee, PayrollNovelty } from "./mock-data"

export function generatePayrollPDF(payroll: Payroll, employee: Employee, periodNovelties?: PayrollNovelty[]) {
  const deductionNovelties = (periodNovelties || []).filter(n => ["deduction","absence","loan"].includes(n.novelty_type))
  const earningNovelties = (periodNovelties || []).filter(n => ["bonus","overtime","commission"].includes(n.novelty_type))
  const otherDeductionsAmount = Math.max(0, payroll.deductions - payroll.base_salary * 0.08)
  // Crear contenido HTML para el PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .document-title {
          font-size: 18px;
          color: #666;
        }
        .info-section {
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .label {
          font-weight: bold;
          color: #333;
        }
        .value {
          color: #666;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .table th {
          background-color: #f5f5f5;
          padding: 12px;
          text-align: left;
          border: 1px solid #ddd;
        }
        .table td {
          padding: 10px 12px;
          border: 1px solid #ddd;
        }
        .total-row {
          background-color: #f9f9f9;
          font-weight: bold;
        }
        .net-salary {
          background-color: #e8f5e9;
          font-size: 18px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">FUP</div>
        <div class="document-title">Comprobante de Nómina</div>
      </div>

      <div class="info-section">
        <div class="info-row">
          <span class="label">Empleado:</span>
          <span class="value">${employee.first_name} ${employee.last_name}</span>
        </div>
        <div class="info-row">
          <span class="label">Identificación:</span>
          <span class="value">${employee.identification}</span>
        </div>
        <div class="info-row">
          <span class="label">Cargo:</span>
          <span class="value">${employee.position}</span>
        </div>
        <div class="info-row">
          <span class="label">Departamento:</span>
          <span class="value">${employee.department}</span>
        </div>
        <div class="info-row">
          <span class="label">Período:</span>
          <span class="value">${getMonthName(payroll.period_month)} ${payroll.period_year}</span>
        </div>
        <div class="info-row">
          <span class="label">Fecha de Proceso:</span>
          <span class="value">${new Date(payroll.processed_at).toLocaleDateString("es-CO")}</span>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th style="text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Salario Base</td>
            <td style="text-align: right;">$${payroll.base_salary.toLocaleString("es-CO")}</td>
          </tr>
          ${
            payroll.bonuses > 0
              ? `
          <tr>
            <td>Bonos</td>
            <td style="text-align: right;">$${payroll.bonuses.toLocaleString("es-CO")}</td>
          </tr>
          `
              : ""
          }
          ${
            payroll.overtime > 0
              ? `
          <tr>
            <td>Horas Extras</td>
            <td style="text-align: right;">$${payroll.overtime.toLocaleString("es-CO")}</td>
          </tr>
          `
              : ""
          }
          ${
            payroll.commissions > 0
              ? `
          <tr>
            <td>Comisiones</td>
            <td style="text-align: right;">$${payroll.commissions.toLocaleString("es-CO")}</td>
          </tr>
          `
              : ""
          }
          ${
            earningNovelties.length > 0
              ? earningNovelties.map(n => `
          <tr>
            <td>Ingreso por novedad: ${escapeHtml(n.description || n.novelty_type)}</td>
            <td style="text-align: right;">$${Number(n.amount || 0).toLocaleString("es-CO")}</td>
          </tr>`).join("")
              : ""
          }
          <tr class="total-row">
            <td>Total Devengado</td>
            <td style="text-align: right;">$${payroll.total_earnings.toLocaleString("es-CO")}</td>
          </tr>
          <tr>
            <td colspan="2" style="height: 10px; border: none;"></td>
          </tr>
          <tr>
            <td>Salud (4%)</td>
            <td style="text-align: right; color: #d32f2f;">-$${(payroll.base_salary * 0.04).toLocaleString("es-CO")}</td>
          </tr>
          <tr>
            <td>Pensión (4%)</td>
            <td style="text-align: right; color: #d32f2f;">-$${(payroll.base_salary * 0.04).toLocaleString("es-CO")}</td>
          </tr>
          ${deductionNovelties.length > 0 ? `
          <tr>
            <td colspan="2" style="background:#fafafa;font-weight:bold">Deducciones por Novedades</td>
          </tr>
          ${deductionNovelties.map(n => `
          <tr>
            <td>${escapeHtml(n.description || n.novelty_type)}</td>
            <td style="text-align: right; color: #d32f2f;">-$${Number(n.amount || 0).toLocaleString("es-CO")}</td>
          </tr>`).join("")}
          ` : ""}
          ${otherDeductionsAmount > 0 ? `
          <tr>
            <td>Otras Deducciones</td>
            <td style="text-align: right; color: #d32f2f;">-$${otherDeductionsAmount.toLocaleString("es-CO")}</td>
          </tr>
          ` : ""}
          <tr class="total-row">
            <td>Total Deducciones</td>
            <td style="text-align: right; color: #d32f2f;">-$${payroll.total_deductions.toLocaleString("es-CO")}</td>
          </tr>
          <tr>
            <td colspan="2" style="height: 10px; border: none;"></td>
          </tr>
          <tr class="net-salary">
            <td>NETO A PAGAR</td>
            <td style="text-align: right;">$${payroll.net_salary.toLocaleString("es-CO")}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Este documento es un comprobante de pago generado electrónicamente.</p>
        <p>Sistema de Nómina PAE - ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  // Crear un blob y descargarlo
  const blob = new Blob([htmlContent], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `Nomina_${employee.identification}_${payroll.period_month}_${payroll.period_year}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getMonthName(month: number): string {
  const months = [
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
  return months[month - 1]
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
