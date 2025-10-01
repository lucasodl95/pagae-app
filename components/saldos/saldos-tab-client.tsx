'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CopyButton } from '@/components/ui/copy-button'
import { ArrowRight, Check, X, Clock, PartyPopper } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { SimplifiedTransaction } from '@/types/database'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

interface PaymentRequest {
  id: string
  from_user: string
  to_user: string
  amount: number
  requested_at: string
}

interface SaldosTabClientProps {
  simplifiedTransactions: SimplifiedTransaction[]
  currentUserId: string
  groupId: string
  paymentRequests: PaymentRequest[]
}

export function SaldosTabClient({ simplifiedTransactions, currentUserId, groupId, paymentRequests }: SaldosTabClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleMarkAsPaid = async (transaction: SimplifiedTransaction) => {
    if (loading) return // Prevenir cliques duplicados

    setLoading(transaction.to_user.id)

    try {
      // Criar solicitação de pagamento
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          group_id: groupId,
          from_user: transaction.from_user.id,
          to_user: transaction.to_user.id,
          amount: transaction.amount,
          status: 'pending'
        })

      if (error) {
        console.error('Erro ao criar solicitação:', error)
        toast.error('Ops! Erro ao enviar solicitação de pagamento')
        setLoading(null)
        return
      }

      toast.success('✅ Solicitação enviada! Aguarde a confirmação', {
        description: 'Você será notificado quando for confirmado'
      })
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ops! Erro ao enviar solicitação')
    } finally {
      setLoading(null)
    }
  }

  const triggerConfetti = () => {
    const count = 200
    const defaults = {
      origin: { y: 0.7 }
    }

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        spread: 90,
        startVelocity: 45,
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    })

    fire(0.2, {
      spread: 60,
    })

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }

  const handleConfirmPayment = async (requestId: string) => {
    if (loading) return // Prevenir cliques duplicados
    setLoading(requestId)

    try {
      // Buscar dados da solicitação
      const request = paymentRequests.find(req => req.id === requestId)
      if (!request) {
        toast.error('Solicitação não encontrada')
        setLoading(null)
        return
      }

      // Criar settlement
      const { error: settlementError } = await supabase
        .from('settlements')
        .insert({
          group_id: groupId,
          from_user: request.from_user,
          to_user: request.to_user,
          amount: request.amount
        })

      if (settlementError) {
        console.error('Erro ao criar settlement:', settlementError)
        toast.error('Ops! Erro ao confirmar pagamento')
        setLoading(null)
        return
      }

      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'confirmed',
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) {
        console.error('Erro ao atualizar solicitação:', updateError)
        toast.error('Ops! Erro ao confirmar pagamento')
        setLoading(null)
        return
      }

      // Disparar confetes!
      triggerConfetti()

      toast.success('🎉 Dívida quitada!', {
        description: `Você recebeu ${formatCurrency(request.amount)}!`
      })

      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ops! Erro ao confirmar pagamento')
    } finally {
      setLoading(null)
    }
  }

  const handleRejectPayment = async (requestId: string) => {
    if (loading) return // Prevenir cliques duplicados
    setLoading(requestId)

    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) {
        console.error('Erro ao rejeitar:', error)
        toast.error('Ops! Erro ao rejeitar pagamento')
        setLoading(null)
        return
      }

      toast.info('Pagamento rejeitado', {
        description: 'A solicitação foi recusada'
      })
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ops! Erro ao rejeitar pagamento')
    } finally {
      setLoading(null)
    }
  }

  console.log('SaldosTabClient - paymentRequests:', paymentRequests)
  console.log('SaldosTabClient - simplifiedTransactions:', simplifiedTransactions)
  console.log('SaldosTabClient - currentUserId:', currentUserId)

  return (
    <div className="space-y-3">
      {simplifiedTransactions.length > 0 ? (
        simplifiedTransactions.map((transaction, index) => {
          const isUserInvolved = transaction.from_user.id === currentUserId || transaction.to_user.id === currentUserId
          const isDebt = transaction.from_user.id === currentUserId
          const isCredit = transaction.to_user.id === currentUserId

          // Verificar se há solicitação pendente para esta transação
          const pendingRequest = paymentRequests.find(
            req => req.from_user === transaction.from_user.id &&
                   req.to_user === transaction.to_user.id
          )

          console.log(`Transaction ${index}:`, {
            from: transaction.from_user.id,
            to: transaction.to_user.id,
            pendingRequest,
            isDebt,
            isCredit
          })

          return (
            <Card
              key={index}
              className={`transition-all ${
                isUserInvolved
                  ? isDebt
                    ? 'border-red-200 bg-red-50 border-2'
                    : 'border-green-200 bg-green-50 border-2'
                  : 'border-gray-200'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Devedor */}
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={transaction.from_user.avatar_url || ''} />
                        <AvatarFallback className="bg-white">
                          {transaction.from_user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.from_user.full_name}
                          {transaction.from_user.id === currentUserId && (
                            <span className="text-xs text-gray-500 ml-1">(você)</span>
                          )}
                        </p>
                        <p className="text-xs text-red-600">Paga</p>
                      </div>
                    </div>

                    {/* Seta e valor */}
                    <div className="flex flex-col items-center">
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                      <p className="font-bold text-lg mt-1">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>

                    {/* Credor */}
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={transaction.to_user.avatar_url || ''} />
                        <AvatarFallback className="bg-white">
                          {transaction.to_user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.to_user.full_name}
                          {transaction.to_user.id === currentUserId && (
                            <span className="text-xs text-gray-500 ml-1">(você)</span>
                          )}
                        </p>
                        <p className="text-xs text-green-600">Recebe</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações de PIX e ações */}
                {isDebt && transaction.to_user.pix_key && (
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-xs text-gray-600 mb-1">Chave PIX de {transaction.to_user.full_name}:</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-mono text-gray-900 truncate flex-1">
                        {transaction.to_user.pix_key}
                      </p>
                      <CopyButton
                        text={transaction.to_user.pix_key}
                        size="sm"
                        variant="outline"
                        className="ml-2"
                      >
                        Copiar
                      </CopyButton>
                    </div>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex gap-2">
                  {isDebt && !pendingRequest && (
                    <Button
                      onClick={() => handleMarkAsPaid(transaction)}
                      disabled={loading === transaction.to_user.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {loading === transaction.to_user.id ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Marcar como Pago
                        </>
                      )}
                    </Button>
                  )}

                  {isDebt && pendingRequest && (
                    <div className="w-full text-center text-sm text-yellow-600 py-2 bg-yellow-50 rounded border border-yellow-200">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Aguardando confirmação de {transaction.to_user.full_name}
                    </div>
                  )}

                  {isCredit && !pendingRequest && (
                    <div className="w-full text-center text-sm text-gray-600 py-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Aguardando pagamento de {transaction.from_user.full_name}
                    </div>
                  )}

                  {isCredit && pendingRequest && (
                    <div className="w-full space-y-2">
                      <div className="text-center text-sm text-blue-600 py-1 bg-blue-50 rounded border border-blue-200">
                        💰 {transaction.from_user.full_name} confirmou o pagamento
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleConfirmPayment(pendingRequest.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Confirmar Recebimento
                        </Button>
                        <Button
                          onClick={() => handleRejectPayment(pendingRequest.id)}
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-green-600 font-medium">
              ✅ Todas as contas estão em dia!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
