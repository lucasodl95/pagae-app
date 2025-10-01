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

interface DeletarGrupoDialogProps {
  groupId: string
  groupName: string
}

export function DeletarGrupoDialog({ groupId, groupName }: DeletarGrupoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)

    try {
      // Deletar o grupo (cascade vai deletar membros e despesas)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (error) {
        console.error('Erro ao deletar grupo:', error)
        alert('Erro ao deletar grupo. Tente novamente.')
        setLoading(false)
        return
      }

      // Sucesso - redirecionar para lista de grupos
      router.push('/grupos')
      router.refresh()
    } catch (error) {
      console.error('Erro ao deletar grupo:', error)
      alert('Erro ao deletar grupo. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Grupo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir este grupo?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a excluir o grupo <span className="font-semibold">"{groupName}"</span>.
            </p>
            <p className="text-red-600 font-medium">
              ⚠️ Esta ação não pode ser desfeita e todos os dados do grupo serão perdidos:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Todas as despesas</li>
              <li>Todos os membros</li>
              <li>Todo o histórico de transações</li>
            </ul>
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
              'Sim, Excluir Grupo'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
