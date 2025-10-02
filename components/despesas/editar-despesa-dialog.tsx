'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { EXPENSE_CATEGORIES, ExpenseWithDetails } from '@/types/database'
import { getCategoryConfig } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const editExpenseSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  category: z.enum(EXPENSE_CATEGORIES, {
    required_error: 'Categoria é obrigatória'
  }),
  paidBy: z.string().min(1, 'Selecione quem pagou'),
  expenseDate: z.string().min(1, 'Data é obrigatória')
})

type EditExpenseFormData = z.infer<typeof editExpenseSchema>

interface EditarDespesaDialogProps {
  expense: ExpenseWithDetails | null
  members: Array<{
    user_id: string
    profiles: {
      id: string
      full_name: string
      avatar_url: string | null
    }
  }>
  currentUserId: string
  userRole?: 'admin' | 'member'
  open: boolean
  onOpenChange: (open: boolean) => void
  onExpenseUpdated?: () => void
}

export function EditarDespesaDialog({
  expense,
  members,
  currentUserId,
  userRole,
  open,
  onOpenChange,
  onExpenseUpdated
}: EditarDespesaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<EditExpenseFormData>({
    resolver: zodResolver(editExpenseSchema),
    defaultValues: expense ? {
      description: expense.description,
      amount: expense.amount,
      category: expense.category as any,
      paidBy: expense.paid_by || '',
      expenseDate: expense.expense_date,
    } : undefined
  })

  // Atualizar form e participantes quando expense mudar
  useEffect(() => {
    if (expense && open) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        category: expense.category as any,
        paidBy: expense.paid_by || '',
        expenseDate: expense.expense_date,
      })

      // Carregar participantes atuais da despesa
      const currentParticipants = expense.expense_splits?.map(split => split.user_id).filter(Boolean) as string[]
      setSelectedMembers(currentParticipants || [])
    }
  }, [expense, open, form])

  if (!expense) return null

  const canDelete = expense.created_by === currentUserId || userRole === 'admin'

  const onSubmit = async (data: EditExpenseFormData) => {
    if (!expense) return

    if (selectedMembers.length === 0) {
      toast.error('Selecione pelo menos um participante')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Atualizar despesa
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          description: data.description,
          amount: data.amount,
          category: data.category,
          paid_by: data.paidBy,
          expense_date: data.expenseDate
        })
        .eq('id', expense.id)

      if (expenseError) {
        throw expenseError
      }

      // Deletar todos os splits existentes
      const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expense.id)

      if (deleteError) {
        throw deleteError
      }

      // Criar novos splits com os participantes selecionados
      const amountPerPerson = data.amount / selectedMembers.length
      const newSplits = selectedMembers.map(userId => ({
        expense_id: expense.id,
        user_id: userId,
        amount_owed: amountPerPerson,
        is_paid: false
      }))

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(newSplits)

      if (splitsError) {
        throw splitsError
      }

      toast.success('Despesa atualizada com sucesso!')
      onOpenChange(false)
      if (onExpenseUpdated) {
        onExpenseUpdated()
      }
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao atualizar despesa:', error)
      setError(error.message || 'Erro ao atualizar despesa')
      toast.error('Ops! Erro ao atualizar despesa')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleMember = (userId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        // Não permitir desmarcar o último membro
        if (prev.length === 1) {
          toast.error('Pelo menos um participante deve ser selecionado')
          return prev
        }
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const handleDelete = async () => {
    if (!expense || !canDelete) return
    
    setIsDeleting(true)
    setError(null)

    try {
      // Deletar divisões primeiro (devido à foreign key)
      const { error: splitsError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expense.id)

      if (splitsError) {
        throw splitsError
      }

      // Deletar despesa
      const { error: expenseError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (expenseError) {
        throw expenseError
      }

      // Deletar nota fiscal se existir
      if (expense.receipt_url) {
        await supabase.storage
          .from('receipts')
          .remove([expense.receipt_url])
      }

      onOpenChange(false)
      if (onExpenseUpdated) {
        onExpenseUpdated()
      }
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao deletar despesa:', error)
      setError(error.message || 'Erro ao deletar despesa')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Editar Despesa</DialogTitle>
          <DialogDescription className="text-sm">
            Altere os dados da despesa. A divisão será recalculada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Jantar no restaurante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="0,00"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => {
                        const config = getCategoryConfig(category)
                        const Icon = config.icon
                        return (
                          <SelectItem key={category} value={category}>
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <span>{category}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quem pagou</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione quem pagou" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.profiles.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {member.profiles.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.profiles.full_name}</span>
                            {member.user_id === currentUserId && (
                              <span className="text-xs text-gray-500">(Você)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Despesa</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de participantes */}
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Quem participa desta despesa?</FormLabel>
              <div className="border rounded-lg p-2 md:p-3 space-y-1 max-h-[180px] md:max-h-[200px] overflow-y-auto bg-gray-50">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center space-x-2 hover:bg-white p-2 rounded-md transition-colors"
                  >
                    <Checkbox
                      id={`member-${member.user_id}`}
                      checked={selectedMembers.includes(member.user_id)}
                      onCheckedChange={() => handleToggleMember(member.user_id)}
                      className="shrink-0"
                    />
                    <label
                      htmlFor={`member-${member.user_id}`}
                      className="flex items-center space-x-2 flex-1 cursor-pointer min-w-0"
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={member.profiles.avatar_url || ''} />
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                          {member.profiles.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">
                        {member.profiles.full_name}
                        {member.user_id === currentUserId && (
                          <span className="text-xs text-gray-500 ml-1">(Você)</span>
                        )}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>
                  {selectedMembers.length} {selectedMembers.length === 1 ? 'participante' : 'participantes'}
                </span>
                {selectedMembers.length > 0 && (
                  <span className="font-medium text-gray-700">
                    {form.watch('amount') ?
                      `R$ ${(form.watch('amount') / selectedMembers.length).toFixed(2)} cada`
                      : '—'}
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading || isDeleting}
                  className="w-full sm:w-auto sm:mr-auto"
                  size="sm"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deletando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar
                    </>
                  )}
                </Button>
              )}

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading || isDeleting}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading || isDeleting}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}