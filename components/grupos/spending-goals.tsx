'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, Trash2, TrendingUp, AlertCircle } from 'lucide-react'
import { formatCurrency, getCategoryConfig } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/types/database'
import { toast } from 'sonner'

interface SpendingGoal {
  id: string
  category: string
  amount: number
  period: 'daily' | 'weekly' | 'monthly'
}

interface SpendingGoalsProps {
  groupId: string
  expenses: any[]
  isAdmin: boolean
}

export function SpendingGoals({ groupId, expenses, isAdmin }: SpendingGoalsProps) {
  const [goals, setGoals] = useState<SpendingGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [newGoal, setNewGoal] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly'
  })
  const supabase = createClient()

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('spending_goals')
        .select('*')
        .eq('group_id', groupId)

      if (error) {
        console.error('Erro ao carregar metas:', error)
        return
      }

      setGoals(data || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGoals()
  }, [groupId])

  const handleAddGoal = async () => {
    if (!newGoal.category || !newGoal.amount) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      const { error } = await supabase
        .from('spending_goals')
        .insert({
          group_id: groupId,
          category: newGoal.category,
          amount: parseFloat(newGoal.amount),
          period: newGoal.period
        })

      if (error) {
        console.error('Erro ao adicionar meta:', error)
        toast.error('Ops! Erro ao adicionar meta')
        return
      }

      toast.success('Meta adicionada!')
      setNewGoal({ category: '', amount: '', period: 'monthly' })
      loadGoals()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ops! Erro ao adicionar meta')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('spending_goals')
        .delete()
        .eq('id', goalId)

      if (error) {
        console.error('Erro ao deletar meta:', error)
        toast.error('Ops! Erro ao deletar meta')
        return
      }

      toast.success('Meta removida!')
      loadGoals()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ops! Erro ao deletar meta')
    }
  }

  const calculateSpending = (category: string, period: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date()
    const periodStart = new Date()

    if (period === 'daily') {
      periodStart.setHours(0, 0, 0, 0)
    } else if (period === 'weekly') {
      periodStart.setDate(now.getDate() - 7)
    } else {
      periodStart.setDate(now.getDate() - 30)
    }

    return expenses
      .filter(exp => {
        const expDate = new Date(exp.expense_date)
        return exp.category === category && expDate >= periodStart
      })
      .reduce((sum, exp) => sum + exp.amount, 0)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const availableCategories = EXPENSE_CATEGORIES.filter(
    cat => !goals.some(goal => goal.category === cat && goal.period === newGoal.period)
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-600">Carregando metas...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Form para adicionar meta (apenas admin) */}
      {isAdmin && (
        <Card className="glass-card border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Meta
            </CardTitle>
            <CardDescription>
              Defina limites de gastos por categoria para manter o controle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={newGoal.category} onValueChange={(val) => setNewGoal({ ...newGoal, category: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => {
                    const config = getCategoryConfig(cat)
                    const Icon = config.icon
                    return (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <span>{cat}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Valor máximo"
                value={newGoal.amount}
                onChange={(e) => setNewGoal({ ...newGoal, amount: e.target.value })}
              />

              <Select value={newGoal.period} onValueChange={(val: 'daily' | 'weekly' | 'monthly') => setNewGoal({ ...newGoal, period: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleAddGoal} disabled={!newGoal.category || !newGoal.amount}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de metas */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">
              Nenhuma meta definida ainda
            </p>
            {isAdmin && (
              <p className="text-sm text-gray-500">
                Adicione metas para controlar os gastos do grupo
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const spent = calculateSpending(goal.category, goal.period)
            const percentage = (spent / goal.amount) * 100
            const remaining = goal.amount - spent
            const categoryConfig = getCategoryConfig(goal.category)
            const CategoryIcon = categoryConfig.icon

            return (
              <Card key={goal.id} className="hover-lift glass-card border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-2 rounded-xl ${categoryConfig.bgColor}`}>
                          <CategoryIcon className={`h-5 w-5 ${categoryConfig.color}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{goal.category}</h4>
                          <Badge variant="outline" className="text-xs">
                            {goal.period === 'daily' ? 'Diária' : goal.period === 'weekly' ? 'Semanal' : 'Mensal'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-12">
                        Meta: {formatCurrency(goal.amount)}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gasto atual</span>
                      <span className="font-bold">{formatCurrency(spent)}</span>
                    </div>

                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(percentage)} transition-all rounded-full`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs">
                        {percentage >= 100 ? (
                          <>
                            <AlertCircle className="h-3 w-3 text-red-600" />
                            <span className="text-red-600 font-medium">
                              Meta ultrapassada!
                            </span>
                          </>
                        ) : percentage >= 80 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-yellow-600" />
                            <span className="text-yellow-600 font-medium">
                              Atenção: {percentage.toFixed(0)}% da meta
                            </span>
                          </>
                        ) : (
                          <span className="text-green-600 font-medium">
                            {percentage.toFixed(0)}% da meta
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {remaining >= 0 ? 'Restam' : 'Excedeu'} {formatCurrency(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
