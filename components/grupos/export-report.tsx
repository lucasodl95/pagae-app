'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportReportProps {
  groupName: string
  expenses: any[]
  members: any[]
  totalExpenses: number
}

export function ExportReport({ groupName, expenses, members, totalExpenses }: ExportReportProps) {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all')

  const getFilteredExpenses = () => {
    if (period === 'all') return expenses

    const now = new Date()
    const periodStart = new Date()

    if (period === 'week') {
      periodStart.setDate(now.getDate() - 7)
    } else {
      periodStart.setDate(now.getDate() - 30)
    }

    return expenses.filter(exp => new Date(exp.expense_date) >= periodStart)
  }

  const exportToExcel = () => {
    setLoading(true)
    try {
      const filteredExpenses = getFilteredExpenses()

      // Sheet 1: Despesas
      const expensesData = filteredExpenses.map(exp => ({
        'Data': new Date(exp.expense_date).toLocaleDateString('pt-BR'),
        'Descrição': exp.description,
        'Categoria': exp.category,
        'Valor': exp.amount,
        'Pago por': exp.profiles?.full_name || 'N/A',
        'Participantes': exp.expense_splits?.length || 0
      }))

      // Sheet 2: Resumo por categoria
      const categorySummary = expenses.reduce((acc: any, exp) => {
        if (!acc[exp.category]) {
          acc[exp.category] = { total: 0, count: 0 }
        }
        acc[exp.category].total += exp.amount
        acc[exp.category].count += 1
        return acc
      }, {})

      const categoryData = Object.entries(categorySummary).map(([category, data]: [string, any]) => ({
        'Categoria': category,
        'Total': data.total,
        'Quantidade': data.count,
        'Média': data.total / data.count
      }))

      // Sheet 3: Membros
      const membersData = members.map(member => {
        const totalPaid = filteredExpenses
          .filter(exp => exp.paid_by === member.user_id)
          .reduce((sum, exp) => sum + exp.amount, 0)

        const totalOwed = filteredExpenses
          .flatMap(exp => exp.expense_splits || [])
          .filter(split => split.user_id === member.user_id)
          .reduce((sum, split) => sum + (split.amount_owed || 0), 0)

        return {
          'Nome': member.profiles.full_name,
          'Total Pago': totalPaid,
          'Total Devido': totalOwed,
          'Saldo': totalPaid - totalOwed
        }
      })

      // Criar workbook
      const wb = XLSX.utils.book_new()

      const ws1 = XLSX.utils.json_to_sheet(expensesData)
      const ws2 = XLSX.utils.json_to_sheet(categoryData)
      const ws3 = XLSX.utils.json_to_sheet(membersData)

      XLSX.utils.book_append_sheet(wb, ws1, 'Despesas')
      XLSX.utils.book_append_sheet(wb, ws2, 'Por Categoria')
      XLSX.utils.book_append_sheet(wb, ws3, 'Membros')

      // Salvar arquivo
      const periodLabel = period === 'all' ? 'completo' : period === 'week' ? 'semanal' : 'mensal'
      XLSX.writeFile(wb, `${groupName}_relatorio_${periodLabel}.xlsx`)

      toast.success('Relatório Excel exportado!')
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast.error('Ops! Erro ao exportar Excel')
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    setLoading(true)
    try {
      const filteredExpenses = getFilteredExpenses()
      const doc = new jsPDF()

      // Título
      doc.setFontSize(18)
      doc.text(`Relatório - ${groupName}`, 14, 20)

      doc.setFontSize(11)
      const periodLabel = period === 'all' ? 'Período completo' : period === 'week' ? 'Últimos 7 dias' : 'Últimos 30 dias'
      doc.text(periodLabel, 14, 28)

      // Resumo
      doc.setFontSize(14)
      doc.text('Resumo Geral', 14, 38)

      const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      const avgPerExpense = filteredExpenses.length > 0 ? total / filteredExpenses.length : 0

      doc.setFontSize(10)
      doc.text(`Total de despesas: ${filteredExpenses.length}`, 14, 46)
      doc.text(`Valor total: ${formatCurrency(total)}`, 14, 52)
      doc.text(`Média por despesa: ${formatCurrency(avgPerExpense)}`, 14, 58)

      // Tabela de despesas
      autoTable(doc, {
        startY: 68,
        head: [['Data', 'Descrição', 'Categoria', 'Valor', 'Pago por']],
        body: filteredExpenses.map(exp => [
          new Date(exp.expense_date).toLocaleDateString('pt-BR'),
          exp.description,
          exp.category,
          formatCurrency(exp.amount),
          exp.profiles?.full_name || 'N/A'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
        styles: { fontSize: 8 }
      })

      // Nova página para resumo por categoria
      doc.addPage()
      doc.setFontSize(14)
      doc.text('Resumo por Categoria', 14, 20)

      const categorySummary = filteredExpenses.reduce((acc: any, exp) => {
        if (!acc[exp.category]) {
          acc[exp.category] = { total: 0, count: 0 }
        }
        acc[exp.category].total += exp.amount
        acc[exp.category].count += 1
        return acc
      }, {})

      autoTable(doc, {
        startY: 28,
        head: [['Categoria', 'Quantidade', 'Total', 'Média']],
        body: Object.entries(categorySummary).map(([category, data]: [string, any]) => [
          category,
          data.count,
          formatCurrency(data.total),
          formatCurrency(data.total / data.count)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] }
      })

      // Salvar PDF
      const filenamePeriod = period === 'all' ? 'completo' : period === 'week' ? 'semanal' : 'mensal'
      doc.save(`${groupName}_relatorio_${filenamePeriod}.pdf`)

      toast.success('Relatório PDF exportado!')
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast.error('Ops! Erro ao exportar PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glass-card border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Relatório
        </CardTitle>
        <CardDescription>
          Baixe um relatório completo das despesas do grupo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Período</label>
          <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as despesas</SelectItem>
              <SelectItem value="month">Últimos 30 dias</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={exportToExcel}
            disabled={loading || expenses.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Excel
          </Button>

          <Button
            onClick={exportToPDF}
            disabled={loading || expenses.length === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        </div>

        {expenses.length === 0 && (
          <p className="text-sm text-gray-500 text-center">
            Nenhuma despesa para exportar
          </p>
        )}
      </CardContent>
    </Card>
  )
}
