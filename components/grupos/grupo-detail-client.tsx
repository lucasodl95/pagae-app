'use client'

import { useState, useMemo } from 'react'
import { DespesaCard } from '@/components/despesas/despesa-card'
import { EditarDespesaDialog } from '@/components/despesas/editar-despesa-dialog'
import { ExpenseWithDetails, GroupWithMembers, EXPENSE_CATEGORIES } from '@/types/database'
import { getCategoryConfig } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Filter, X, Search } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DivisionIcon } from '@/components/ui/division-icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

interface GrupoDetailClientProps {
  groupExpenses: ExpenseWithDetails[]
  group: GroupWithMembers
  currentUserId: string
  userRole: 'admin' | 'member'
}

export function GrupoDetailClient({
  groupExpenses,
  group,
  currentUserId,
  userRole
}: GrupoDetailClientProps) {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setSelectedExpense(expense)
    setEditDialogOpen(true)
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const handleExpenseUpdated = () => {
    // Aqui você pode adicionar lógica para atualizar a lista
    // Por enquanto, apenas fechamos o dialog
    setEditDialogOpen(false)
    setSelectedExpense(null)
  }

  // Filtrar despesas
  const filteredExpenses = useMemo(() => {
    let filtered = groupExpenses

    // Filtro por busca (descrição)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(exp =>
        exp.description.toLowerCase().includes(query)
      )
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(exp => exp.category === categoryFilter)
    }

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date()
      const expenseDate = (exp: ExpenseWithDetails) => new Date(exp.expense_date)

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(exp => {
            const date = expenseDate(exp)
            return date.toDateString() === now.toDateString()
          })
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(exp => expenseDate(exp) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(exp => expenseDate(exp) >= monthAgo)
          break
      }
    }

    return filtered
  }, [groupExpenses, categoryFilter, dateFilter, searchQuery])

  const hasActiveFilters = categoryFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim() !== ''

  const clearFilters = () => {
    setCategoryFilter('all')
    setDateFilter('all')
    setSearchQuery('')
  }

  if (groupExpenses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <DivisionIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            Nenhuma despesa registrada ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar despesas por descrição..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filtrar por:</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900 ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {EXPENSE_CATEGORIES.map(cat => {
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

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as datas</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="outline" className="w-fit md:ml-auto">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'despesa' : 'despesas'}
          </Badge>
        </div>
      </div>

      {/* Lista de despesas */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <DivisionIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              Nenhuma despesa encontrada com os filtros aplicados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
          <DespesaCard
            key={expense.id}
            expense={expense}
            currentUserId={currentUserId}
            userRole={userRole}
            onImageClick={handleImageClick}
            onEditClick={handleEditExpense}
          />
        ))}
        </div>
      )}

      {/* Dialog de edição */}
      <EditarDespesaDialog
        expense={selectedExpense}
        members={group.group_members}
        currentUserId={currentUserId}
        userRole={userRole}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onExpenseUpdated={handleExpenseUpdated}
      />

      {/* Dialog para visualizar imagem */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage}
                alt="Nota fiscal"
                fill
                className="object-contain"
                onError={() => setSelectedImage(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}