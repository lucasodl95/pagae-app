'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, Award, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/types/database'

interface GroupDashboardProps {
  expenses: any[]
  members: any[]
  totalExpenses: number
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#6366f1']

export function GroupDashboard({ expenses, members, totalExpenses }: GroupDashboardProps) {
  // Calcular gastos por categoria
  const expensesByCategory = EXPENSE_CATEGORIES.map(category => {
    const total = expenses
      .filter(exp => exp.category === category)
      .reduce((sum, exp) => sum + exp.amount, 0)

    return {
      name: category,
      value: total,
      percentage: totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(1) : 0
    }
  }).filter(cat => cat.value > 0)

  // Calcular quem mais gastou
  const expensesByMember = members.map(member => {
    const totalPaid = expenses
      .filter(exp => exp.paid_by === member.user_id)
      .reduce((sum, exp) => sum + exp.amount, 0)

    return {
      ...member,
      totalPaid,
      percentage: totalExpenses > 0 ? ((totalPaid / totalExpenses) * 100).toFixed(1) : 0
    }
  }).sort((a, b) => b.totalPaid - a.totalPaid)

  // Gastos por dia (últimos 7 dias)
  const getDayLabel = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const dailyExpenses = expenses.reduce((acc, exp) => {
    const date = new Date(exp.expense_date)
    const dayKey = date.toISOString().split('T')[0]
    const dayLabel = getDayLabel(date)

    if (!acc[dayKey]) {
      acc[dayKey] = { day: dayLabel, total: 0 }
    }
    acc[dayKey].total += exp.amount
    return acc
  }, {} as Record<string, { day: string, total: number }>)

  const dailyData = Object.values(dailyExpenses).slice(-7)

  // Métricas
  const avgPerPerson = members.length > 0 ? totalExpenses / members.length : 0
  const topCategory = expensesByCategory.length > 0 ? expensesByCategory[0].name : 'Nenhuma'
  const mostActiveDay = dailyData.length > 0
    ? dailyData.reduce((max, curr) => curr.total > max.total ? curr : max, dailyData[0])
    : null

  return (
    <div className="space-y-6">
      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-lift glass-card border-2">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Média por pessoa
            </CardDescription>
            <CardTitle className="text-2xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {formatCurrency(avgPerPerson)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-lift glass-card border-2">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Total de despesas
            </CardDescription>
            <CardTitle className="text-2xl text-gray-900">
              {expenses.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-lift glass-card border-2">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-xs">
              <Award className="h-3 w-3 mr-1" />
              Categoria top
            </CardDescription>
            <CardTitle className="text-lg text-gray-900 truncate">
              {topCategory}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-lift glass-card border-2">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Dia mais ativo
            </CardDescription>
            <CardTitle className="text-lg text-gray-900">
              {mostActiveDay ? mostActiveDay.day : 'N/A'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Gastos por Categoria */}
        <Card className="hover-lift glass-card border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Gastos por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das despesas por tipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Nenhuma despesa registrada ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Evolução Diária */}
        <Card className="hover-lift glass-card border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Evolução Diária
            </CardTitle>
            <CardDescription>
              Gastos dos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Dados insuficientes para gráfico
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Gastos */}
      <Card className="hover-lift glass-card border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Ranking de Gastos
          </CardTitle>
          <CardDescription>
            Quem mais gastou no grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expensesByMember.map((member, index) => (
              <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/50 to-transparent hover:from-white/70 transition-all">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={index === 0 ? 'default' : 'secondary'}
                    className={index === 0 ? 'gradient-primary text-white' : ''}
                  >
                    #{index + 1}
                  </Badge>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profiles.avatar_url || ''} />
                    <AvatarFallback>
                      {member.profiles.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.profiles.full_name}</p>
                    <p className="text-xs text-gray-500">{member.percentage}% do total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(member.totalPaid)}</p>
                  {index === 0 && member.totalPaid > 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Top Gastador
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
