'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { splitExpenseEqually } from '@/lib/calculations'
import { EXPENSE_CATEGORIES } from '@/types/database'
import { getCategoryConfig } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const addExpenseSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  category: z.enum(EXPENSE_CATEGORIES, {
    required_error: 'Categoria é obrigatória'
  }),
  paidBy: z.string().min(1, 'Selecione quem pagou'),
  expenseDate: z.string().min(1, 'Data é obrigatória'),
  receipt: z.any().optional()
})

type AddExpenseFormData = z.infer<typeof addExpenseSchema>

interface AdicionarDespesaSheetProps {
  groupId: string
  members: Array<{
    user_id: string
    profiles: {
      id: string
      full_name: string
      avatar_url: string | null
    }
  }>
  currentUserId: string
  onExpenseAdded?: () => void
}

export function AdicionarDespesaSheet({
  groupId,
  members,
  currentUserId,
  onExpenseAdded
}: AdicionarDespesaSheetProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.user_id))
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<AddExpenseFormData>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: undefined,
      paidBy: currentUserId,
      expenseDate: new Date().toISOString().split('T')[0],
    }
  })

  const onSubmit = async (data: AddExpenseFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      let receiptUrl: string | null = null

      // Upload da nota fiscal se fornecida
      if (receiptFile) {
        try {
          const fileExt = receiptFile.name.split('.').pop()
          const fileName = `${currentUserId}/${groupId}-${Date.now()}.${fileExt}`
          
          console.log('Iniciando upload...', { fileName, fileSize: receiptFile.size })
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, receiptFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Erro no upload:', uploadError)
            throw new Error(`Erro no upload: ${uploadError.message}`)
          }

          console.log('Upload realizado com sucesso:', uploadData)
          receiptUrl = uploadData.path
        } catch (uploadError: any) {
          console.error('Erro ao fazer upload da nota fiscal:', uploadError)
          throw new Error(`Erro ao fazer upload: ${uploadError.message}`)
        }
      }

      // Criar despesa
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          description: data.description,
          amount: data.amount,
          category: data.category,
          paid_by: data.paidBy,
          receipt_url: receiptUrl,
          expense_date: data.expenseDate,
          created_by: currentUserId
        })
        .select()
        .single()

      if (expenseError) {
        throw expenseError
      }

      // Dividir despesa igualmente entre os membros selecionados
      const splits = splitExpenseEqually(data.amount, selectedMembers)

      console.log('Criando divisões:', {
        expenseId: expense.id,
        totalAmount: data.amount,
        selectedMembers,
        splits
      })

      // Criar divisões da despesa
      const { data: splitsData, error: splitsError } = await supabase
        .from('expense_splits')
        .insert(
          splits.map(split => ({
            expense_id: expense.id,
            user_id: split.user_id,
            amount_owed: split.amount_owed
          }))
        )
        .select()

      console.log('Divisões criadas:', splitsData)

      if (splitsError) {
        throw splitsError
      }

      // Fechar sheet e atualizar lista
      setOpen(false)
      form.reset()
      setReceiptFile(null)
      setSelectedMembers(members.map(m => m.user_id))

      if (onExpenseAdded) {
        onExpenseAdded()
      }

      router.refresh()
    } catch (error: any) {
      console.error('Erro ao adicionar despesa:', error)
      setError(error.message || 'Erro ao adicionar despesa')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('Arquivo selecionado:', { 
        name: file.name, 
        type: file.type, 
        size: file.size 
      })
      
      // Validar tipo de arquivo (apenas imagens)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setError(`Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`)
        return
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB (máximo 5MB)`)
        return
      }
      
      setReceiptFile(file)
      setError(null)
      console.log('Arquivo validado com sucesso')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Despesa
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adicionar Nova Despesa</SheetTitle>
          <SheetDescription>
            Registre uma nova despesa para dividir com o grupo
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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

            <div className="space-y-3">
              <FormLabel>Dividir entre</FormLabel>
              <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`member-${member.user_id}`}
                      checked={selectedMembers.includes(member.user_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers([...selectedMembers, member.user_id])
                        } else {
                          // Impedir desmarcar se for o único selecionado
                          if (selectedMembers.length > 1) {
                            setSelectedMembers(selectedMembers.filter(id => id !== member.user_id))
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor={`member-${member.user_id}`}
                      className="flex items-center space-x-2 flex-1 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profiles.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {member.profiles.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.profiles.full_name}</span>
                      {member.user_id === currentUserId && (
                        <span className="text-xs text-gray-500">(Você)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {selectedMembers.length === members.length
                  ? 'Todos os membros participam desta despesa'
                  : `${selectedMembers.length} de ${members.length} membros selecionados`}
              </p>
            </div>

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

            <div className="space-y-2">
              <FormLabel>Nota Fiscal (opcional)</FormLabel>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReceiptChange}
                  className="hidden"
                  id="receipt-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('receipt-input')?.click()}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {receiptFile ? receiptFile.name : 'Tirar Foto da Nota'}
                </Button>
              </div>
              {receiptFile && (
                <p className="text-sm text-green-600">
                  ✓ {receiptFile.name} selecionado
                </p>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}

            <SheetFooter className="gap-2">
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
                    Adicionando...
                  </>
                ) : (
                  'Adicionar Despesa'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}