'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const createGroupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional()
})

type CreateGroupFormData = z.infer<typeof createGroupSchema>

interface CriarGrupoDialogProps {
  onGroupCreated?: () => void
}

export function CriarGrupoDialog({ onGroupCreated }: CriarGrupoDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  })

  const onSubmit = async (data: CreateGroupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado')
      }

      // Gerar código de convite único
      let inviteCode = generateInviteCode()
      let codeExists = true
      
      // Verificar se o código já existe (tentar até encontrar um único)
      while (codeExists) {
        const { data: existingGroup } = await supabase
          .from('groups')
          .select('id')
          .eq('invite_code', inviteCode)
          .single()
        
        if (!existingGroup) {
          codeExists = false
        } else {
          inviteCode = generateInviteCode()
        }
      }

      // Criar grupo
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          description: data.description || null,
          invite_code: inviteCode,
          created_by: user.id
        })
        .select()
        .single()

      if (groupError) {
        throw groupError
      }

      // Adicionar criador como admin do grupo
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        })

      if (memberError) {
        throw memberError
      }

      // Fechar dialog e atualizar lista
      setOpen(false)
      form.reset()
      
      if (onGroupCreated) {
        onGroupCreated()
      }
      
      // Redirecionar para o grupo criado
      router.push(`/grupos/${group.id}`)
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error)
      setError(error.message || 'Erro ao criar grupo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Criar Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
          <DialogDescription>
            Crie um grupo para dividir despesas com seus amigos
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Grupo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Viagem para Bahia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o propósito do grupo..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Grupo'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}