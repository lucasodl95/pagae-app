'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DeletarDespesaDialog } from '@/components/despesas/deletar-despesa-dialog'
import { ExpenseWithDetails } from '@/types/database'
import { formatCurrency, getCategoryConfig } from '@/lib/utils'
import { Receipt, Calendar, User, Edit3, Trash2, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'
import { useState } from 'react'
import { ExpenseComments } from './expense-comments'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface DespesaCardProps {
  expense: ExpenseWithDetails
  currentUserId: string
  userRole?: 'admin' | 'member'
  onImageClick?: (imageUrl: string) => void
  onEditClick?: (expense: ExpenseWithDetails) => void
}

export function DespesaCard({ expense, currentUserId, userRole, onImageClick, onEditClick }: DespesaCardProps) {
  const [imageError, setImageError] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const isPaidByCurrentUser = expense.paid_by === currentUserId
  const isCreatedByCurrentUser = expense.created_by === currentUserId
  const canEdit = isCreatedByCurrentUser || userRole === 'admin'
  const userSplit = expense.expense_splits.find(split => split.user_id === currentUserId)
  const amountOwed = userSplit?.amount_owed || 0

  const categoryConfig = getCategoryConfig(expense.category)

  const getReceiptImageUrl = (receiptPath: string | null) => {
    if (!receiptPath) return ''
    // URL completa do Supabase Storage
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${receiptPath}`
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        {/* Cabeçalho com descrição e valor */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
              {expense.description}
            </h4>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className={`text-xs ${categoryConfig.bgColor} ${categoryConfig.color} flex items-center gap-1`}
              >
                <categoryConfig.icon className="h-3 w-3" />
                {expense.category}
              </Badge>
              {isPaidByCurrentUser && (
                <Badge variant="outline" className="text-xs">
                  Você pagou
                </Badge>
              )}
            </div>
          </div>

          <p className="font-bold text-base text-gray-900 shrink-0">
            {formatCurrency(expense.amount)}
          </p>
        </div>

        {/* Informações e Ações em uma linha */}
        <div className="flex items-center justify-between text-xs text-gray-600 gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {(() => {
                  // Se é apenas data (YYYY-MM-DD), usar como local, não UTC
                  const dateStr = expense.expense_date
                  if (dateStr.length === 10 && !dateStr.includes('T')) {
                    const [year, month, day] = dateStr.split('-')
                    return format(new Date(Number(year), Number(month) - 1, Number(day)), 'dd/MM/yy')
                  }
                  return format(new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z')), 'dd/MM/yy')
                })()}
              </span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {expense.paid_by_profile?.full_name || 'Desconhecido'}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-0.5 shrink-0">
            {expense.receipt_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageClick?.(getReceiptImageUrl(expense.receipt_url))}
                className="h-7 px-1.5"
                title="Ver nota"
              >
                <Receipt className="h-3.5 w-3.5" />
              </Button>
            )}

            {canEdit && onEditClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditClick(expense)}
                className="h-7 px-1.5"
                title="Editar"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            )}

            {canEdit && (
              <DeletarDespesaDialog
                expenseId={expense.id}
                expenseDescription={expense.description}
                expenseAmount={expense.amount}
              />
            )}
          </div>
        </div>

        {/* Divisão da despesa */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {expense.expense_splits.length} {expense.expense_splits.length === 1 ? 'pessoa' : 'pessoas'}
            </span>
            <span className="text-gray-500">
              {formatCurrency(expense.amount / expense.expense_splits.length)}/pessoa
            </span>
          </div>
        </div>

        {/* Seção de comentários */}
        <Collapsible open={showComments} onOpenChange={setShowComments} className="mt-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 justify-center text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              {showComments ? 'Ocultar' : 'Ver'} comentários
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ExpenseComments expenseId={expense.id} currentUserId={currentUserId} />
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  )
}