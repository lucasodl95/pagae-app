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
    ? dailyData.reduce((max: any, curr: any) => curr.total > max.total ? curr : max, dailyData[0])
    : null

  return (
    <div className="space-y-6">
      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center text-xs text-violet-700 font-medium">
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              Média/pessoa
            </CardDescription>
            <CardTitle className="text-xl md:text-2xl font-bold text-violet-900">
              {formatCurrency(avgPerPerson)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center text-xs text-blue-700 font-medium">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              Despesas
            </CardDescription>
            <CardTitle className="text-xl md:text-2xl font-bold text-blue-900">
              {expenses.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center text-xs text-amber-700 font-medium">
              <Award className="h-3.5 w-3.5 mr-1" />
              Top categoria
            </CardDescription>
            <CardTitle className="text-xl md:text-2xl font-bold text-amber-900 truncate">
              {topCategory}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center text-xs text-green-700 font-medium">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Dia mais ativo
            </CardDescription>
            <CardTitle className="text-xl md:text-2xl font-bold text-green-900">
              {mostActiveDay ? (mostActiveDay as any).day : 'N/A'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Gráfico de Pizza - Gastos por Categoria */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              📊 Gastos por Categoria
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Distribuição das despesas por tipo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {expensesByCategory.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
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

                {/* Legenda customizada */}
                <div className="grid grid-cols-2 gap-2">
                  {expensesByCategory.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs text-gray-700 truncate">
                        {entry.name} ({entry.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
