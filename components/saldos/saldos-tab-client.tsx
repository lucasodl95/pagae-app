'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CopyButton } from '@/components/ui/copy-button'
import { ArrowRight, Check, X, Clock, Sparkles, TrendingUp, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { SimplifiedTransaction } from '@/types/database'
import { toast } from 'sonner'

interface PaymentRequest {
  id: string
  from_user: string
  to_user: string
  amount: number
  requested_at: string
}

interface Settlement {
  id: string
  from_user: string
  to_user: string
  amount: number
  settled_at: string
  from_profile: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  to_profile: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface SaldosTabClientProps {
  simplifiedTransactions: SimplifiedTransaction[]
  currentUserId: string
  groupId: string
  paymentRequests: PaymentRequest[]
  settlements: Settlement[]
}

export function SaldosTabClient({ simplifiedTransactions, currentUserId, groupId, paymentRequests, settlements }: SaldosTabClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const formatDateTime = (dateString: string) => {
    // Criar date em UTC e converter para local
    const date = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'))
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} às ${hours}:${minutes}`
  }

  const handleMarkAsPaid = async (transaction: SimplifiedTransaction) => {
    if (loading) return

    setLoading(transaction.to_user.id)

    try {
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

  const triggerConfetti = async () => {
    const confetti = (await import('canvas-confetti')).default
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
    if (loading) return
    setLoading(requestId)

    try {
      const request = paymentRequests.find(req => req.id === requestId)
      if (!request) {
        toast.error('Solicitação não encontrada')
        setLoading(null)
        return
      }

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

      await triggerConfetti()

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
    if (loading) return
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

  // Separar transações por envolvimento do usuário (apenas as do usuário atual)
  const myDebts = simplifiedTransactions.filter(t => t.from_user.id === currentUserId)
  const myCredits = simplifiedTransactions.filter(t => t.to_user.id === currentUserId)

  // Separar settlements por envolvimento do usuário
  const myPaidSettlements = settlements.filter(s => s.from_user === currentUserId)
  const myReceivedSettlements = settlements.filter(s => s.to_user === currentUserId)
  const hasSettlements = settlements.length > 0

  return (
    <div className="space-y-6">
      {/* Empty State */}
      {simplifiedTransactions.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="text-center py-12">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Tudo certo por aqui! 🎉
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Não há dívidas pendentes no grupo. Todas as contas estão em dia!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Minhas Dívidas */}
          {myDebts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="bg-gradient-to-br from-red-500 to-rose-500 p-1.5 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Você deve pagar</h3>
                <span className="ml-auto bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {myDebts.length}
                </span>
              </div>

              {myDebts.map((transaction, index) => {
                const pendingRequest = paymentRequests.find(
                  req => req.from_user === transaction.from_user.id &&
                         req.to_user === transaction.to_user.id
                )

                return (
                  <Card
                    key={index}
                    className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="p-4 md:p-5">
                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center gap-6">
                        {/* Você */}
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-12 w-12 ring-2 ring-red-200">
                            <AvatarImage src={transaction.from_user.avatar_url || ''} />
                            <AvatarFallback className="bg-red-200 text-red-700 font-semibold">
                              {transaction.from_user.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">Você</p>
                            <p className="text-sm text-red-600 font-medium">Paga</p>
                          </div>
                        </div>

                        {/* Valor e Seta */}
                        <div className="flex items-center gap-4">
                          <ArrowRight className="h-6 w-6 text-gray-400" />
                          <div className="bg-white px-6 py-3 rounded-xl shadow-sm border-2 border-red-100">
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                          <ArrowRight className="h-6 w-6 text-gray-400" />
                        </div>

                        {/* Recebedor */}
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-12 w-12 ring-2 ring-green-200">
                            <AvatarImage src={transaction.to_user.avatar_url || ''} />
                            <AvatarFallback className="bg-green-200 text-green-700 font-semibold">
                              {transaction.to_user.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{transaction.to_user.full_name}</p>
                            <p className="text-sm text-green-600 font-medium">Recebe</p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10 ring-2 ring-red-200">
                              <AvatarImage src={transaction.from_user.avatar_url || ''} />
                              <AvatarFallback className="bg-red-200 text-red-700 text-sm font-semibold">
                                {transaction.from_user.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">Você</p>
                              <p className="text-xs text-red-600 font-medium">Deve pagar</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border-2 border-red-100 text-center">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold text-sm text-right">{transaction.to_user.full_name.split(' ')[0]}</p>
                              <p className="text-xs text-green-600 font-medium text-right">Vai receber</p>
                            </div>
                            <Avatar className="h-10 w-10 ring-2 ring-green-200">
                              <AvatarImage src={transaction.to_user.avatar_url || ''} />
                              <AvatarFallback className="bg-green-200 text-green-700 text-sm font-semibold">
                                {transaction.to_user.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>

                      {/* PIX Info */}
                      {transaction.to_user.pix_key && (
                        <div className="mt-4 bg-white rounded-xl p-3 md:p-4 border-2 border-violet-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-violet-600" />
                            <p className="text-xs md:text-sm font-semibold text-violet-900">
                              Chave PIX de {transaction.to_user.full_name.split(' ')[0]}
                            </p>
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <code className="text-xs md:text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg flex-1 break-all">
                              {transaction.to_user.pix_key}
                            </code>
                            <CopyButton
                              text={transaction.to_user.pix_key}
                              size="sm"
                              className="w-full md:w-auto bg-violet-600 hover:bg-violet-700 text-white"
                            >
                              Copiar PIX
                            </CopyButton>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4">
                        {!pendingRequest ? (
                          <Button
                            onClick={() => handleMarkAsPaid(transaction)}
                            disabled={loading === transaction.to_user.id}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            size="lg"
                          >
                            {loading === transaction.to_user.id ? (
                              <>
                                <Clock className="h-4 w-4 md:h-5 md:w-5 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                                Confirmar Pagamento
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                              <p className="font-semibold text-amber-900">Aguardando confirmação</p>
                            </div>
                            <p className="text-sm text-amber-700">
                              {transaction.to_user.full_name.split(' ')[0]} precisa confirmar o recebimento
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Vão me Pagar */}
          {myCredits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-1.5 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white rotate-180" />
                </div>
                <h3 className="font-semibold text-gray-900">Vão te pagar</h3>
                <span className="ml-auto bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {myCredits.length}
                </span>
              </div>

              {myCredits.map((transaction, index) => {
                const pendingRequest = paymentRequests.find(
                  req => req.from_user === transaction.from_user.id &&
                         req.to_user === transaction.to_user.id
                )

                return (
                  <Card
                    key={index}
                    className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="p-4 md:p-5">
                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-12 w-12 ring-2 ring-red-200">
                            <AvatarImage src={transaction.from_user.avatar_url || ''} />
                            <AvatarFallback className="bg-red-200 text-red-700 font-semibold">
                              {transaction.from_user.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{transaction.from_user.full_name}</p>
                            <p className="text-sm text-red-600 font-medium">Deve pagar</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <ArrowRight className="h-6 w-6 text-gray-400" />
                          <div className="bg-white px-6 py-3 rounded-xl shadow-sm border-2 border-green-100">
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                          <ArrowRight className="h-6 w-6 text-gray-400" />
                        </div>

                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-12 w-12 ring-2 ring-green-200">
                            <AvatarImage src={transaction.to_user.avatar_url || ''} />
                            <AvatarFallback className="bg-green-200 text-green-700 font-semibold">
                              {transaction.to_user.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">Você</p>
                            <p className="text-sm text-green-600 font-medium">Vai receber</p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10 ring-2 ring-red-200">
                              <AvatarImage src={transaction.from_user.avatar_url || ''} />
                              <AvatarFallback className="bg-red-200 text-red-700 text-sm font-semibold">
                                {transaction.from_user.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{transaction.from_user.full_name.split(' ')[0]}</p>
                              <p className="text-xs text-red-600 font-medium">Deve pagar</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border-2 border-green-100 text-center">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold text-sm text-right">Você</p>
                              <p className="text-xs text-green-600 font-medium text-right">Vai receber</p>
                            </div>
                            <Avatar className="h-10 w-10 ring-2 ring-green-200">
                              <AvatarImage src={transaction.to_user.avatar_url || ''} />
                              <AvatarFallback className="bg-green-200 text-green-700 text-sm font-semibold">
                                {transaction.to_user.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="mt-4">
                        {!pendingRequest ? (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                              <p className="font-semibold text-blue-900">Aguardando pagamento</p>
                            </div>
                            <p className="text-sm text-blue-700">
                              {transaction.from_user.full_name.split(' ')[0]} ainda não confirmou o pagamento
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Sparkles className="h-5 w-5 text-violet-600" />
                                <p className="font-semibold text-violet-900">
                                  {transaction.from_user.full_name.split(' ')[0]} confirmou o pagamento!
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => handleConfirmPayment(pendingRequest.id)}
                                disabled={loading === pendingRequest.id}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
                                size="lg"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span className="hidden md:inline">Confirmar</span>
                                <span className="md:hidden">OK</span>
                              </Button>
                              <Button
                                onClick={() => handleRejectPayment(pendingRequest.id)}
                                disabled={loading === pendingRequest.id}
                                variant="outline"
                                className="border-2 border-red-300 text-red-700 hover:bg-red-50 font-semibold"
                                size="lg"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Histórico de Pagamentos */}
      {hasSettlements && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-1.5 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Contas já pagas</h3>
            <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {settlements.length}
            </span>
          </div>

          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
            <CardContent className="p-4 md:p-5">
              <div className="space-y-3">
                {/* Pagamentos que eu fiz */}
                {myPaidSettlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide px-2">
                      Você pagou
                    </p>
                    {myPaidSettlements.map((settlement) => (
                      <div
                        key={settlement.id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Pagamento para {settlement.to_profile.full_name.split(' ')[0]}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(settlement.settled_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(Number(settlement.amount))}
                          </p>
                          <p className="text-xs text-gray-500">Pago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagamentos que eu recebi */}
                {myReceivedSettlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide px-2">
                      Você recebeu
                    </p>
                    {myReceivedSettlements.map((settlement) => (
                      <div
                        key={settlement.id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Recebido de {settlement.from_profile.full_name.split(' ')[0]}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(settlement.settled_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            +{formatCurrency(Number(settlement.amount))}
                          </p>
                          <p className="text-xs text-gray-500">Recebido</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
