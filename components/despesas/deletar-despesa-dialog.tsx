'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface DeletarDespesaDialogProps {
  expenseId: string
  expenseDescription: string
  expenseAmount: number
  trigger?: React.ReactNode
}

export function DeletarDespesaDialog({
  expenseId,
  expenseDescription,
  expenseAmount,
  trigger
}: DeletarDespesaDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)

    try {
      // Primeiro, buscar informações da despesa antes de deletar
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('group_id, paid_by, expense_splits(user_id)')
        .eq('id', expenseId)
        .single()

      if (fetchError || !expense) {
        console.error('Erro ao buscar despesa:', fetchError)
        alert('Erro ao deletar despesa. Tente novamente.')
        setLoading(false)
        return
      }

      // Não precisamos deletar settlements porque eles não estão vinculados a despesas específicas
      // Settlements são acertos de conta independentes

      // Deletar a despesa (cascade vai deletar os splits e comentários)
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (error) {
        console.error('Erro ao deletar despesa:', error)
        alert('Erro ao deletar despesa. Tente novamente.')
        setLoading(false)
        return
      }

      // Sucesso
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erro ao deletar despesa:', error)
      alert('Erro ao deletar despesa. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a excluir a despesa:
            </p>
            <div className="bg-gray-100 p-3 rounded-md">
              <p className="font-semibold">{expenseDescription}</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(expenseAmount)}</p>
            </div>
            <p className="text-red-600 font-medium">
              ⚠️ Esta ação não pode ser desfeita e a divisão desta despesa será removida dos saldos.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Sim, Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
