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
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={expense.paid_by_profile?.avatar_url || ''} />
              <AvatarFallback className="text-sm">
                {expense.paid_by_profile?.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 leading-tight">
                {expense.description}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-xs ${categoryConfig.bgColor} ${categoryConfig.color} flex items-center gap-1.5`}
                >
                  <categoryConfig.icon className="h-3.5 w-3.5" />
                  {expense.category}
                </Badge>
                {isPaidByCurrentUser && (
                  <Badge variant="outline" className="text-xs">
                    Você pagou
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right ml-4">
            <p className="font-bold text-lg">
              {formatCurrency(expense.amount)}
            </p>
            {amountOwed > 0 && (
              <p className="text-sm text-gray-600">
                Sua parte: {formatCurrency(amountOwed)}
              </p>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>
                {expense.paid_by_profile?.full_name}
                {isPaidByCurrentUser && ' (você)'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(expense.expense_date), 'dd MMM yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-1">
            {/* Nota fiscal */}
            {expense.receipt_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageClick?.(getReceiptImageUrl(expense.receipt_url))}
                className="h-8 px-2"
              >
                <Receipt className="h-4 w-4 mr-1" />
                Nota
              </Button>
            )}
            
            {/* Editar despesa */}
            {canEdit && onEditClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditClick(expense)}
                className="h-8 px-2"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}

            {/* Deletar despesa */}
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
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Dividido entre {expense.expense_splits.length} {expense.expense_splits.length === 1 ? 'pessoa' : 'pessoas'}
            </span>

            <div className="flex -space-x-2">
              {expense.expense_splits.slice(0, 4).map((split) => (
                <Avatar key={split.id} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={split.profiles?.avatar_url || ''} />
                  <AvatarFallback className="text-xs bg-gray-100">
                    {split.profiles?.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {expense.expense_splits.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    +{expense.expense_splits.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seção de comentários expansível */}
        <Collapsible open={showComments} onOpenChange={setShowComments} className="mt-3">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {showComments ? 'Ocultar' : 'Ver'} comentários
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <ExpenseComments expenseId={expense.id} currentUserId={currentUserId} />
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  )
}