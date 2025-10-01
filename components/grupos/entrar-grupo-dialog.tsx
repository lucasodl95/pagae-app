'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface EntrarGrupoDialogProps {
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function EntrarGrupoDialog({ variant = 'outline', size = 'lg', className = '' }: EntrarGrupoDialogProps) {
  const [open, setOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      setError('Por favor, insira um código de convite')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Buscar grupo pelo código de convite
      const searchCode = inviteCode.trim().toUpperCase()
      console.log('Buscando grupo com código:', searchCode)

      const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('id, name, invite_code')
        .eq('invite_code', searchCode)

      console.log('Resultado da busca:', { groups, groupError })

      if (groupError) {
        console.error('Erro ao buscar grupo:', groupError)
        setError('Erro ao buscar grupo. Tente novamente.')
        setLoading(false)
        return
      }

      if (!groups || groups.length === 0) {
        setError(`Código de convite inválido: ${searchCode}`)
        setLoading(false)
        return
      }

      const group = groups[0]

      // Verificar se o usuário já é membro
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Você precisa estar autenticado')
        setLoading(false)
        return
      }

      const { data: existingMembers } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)

      if (existingMembers && existingMembers.length > 0) {
        // Já é membro, redirecionar
        setOpen(false)
        setInviteCode('')
        setError('')
        setLoading(false)
        router.push(`/grupos/${group.id}`)
        return
      }

      // Adicionar usuário ao grupo
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member'
        })

      if (memberError) {
        console.error('Erro ao entrar no grupo:', memberError)
        setError('Erro ao entrar no grupo. Tente novamente.')
        setLoading(false)
        return
      }

      // Sucesso!
      setOpen(false)
      setInviteCode('')
      setError('')
      router.refresh()
      router.push(`/grupos/${group.id}`)
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error)
      setError('Erro ao entrar no grupo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleJoinGroup()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={`rounded-xl ${variant === 'outline' ? 'border-2' : ''} ${className}`}>
          <Plus className="h-5 w-5 mr-2" />
          Entrar com Código
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Entrar em um Grupo
          </DialogTitle>
          <DialogDescription>
            Digite o código de convite do grupo para participar
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Código de Convite</Label>
            <Input
              id="invite-code"
              placeholder="Ex: ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest uppercase"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              O código tem 6 caracteres e você pode encontrá-lo na página do grupo
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-2">
                {error}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleJoinGroup}
            disabled={loading || !inviteCode.trim()}
            className="gradient-primary"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar no Grupo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
