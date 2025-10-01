import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { AdicionarDespesaSheet } from '@/components/despesas/adicionar-despesa-sheet'
import { GrupoDetailClient } from '@/components/grupos/grupo-detail-client'
import { DeletarGrupoDialog } from '@/components/grupos/deletar-grupo-dialog'
import { SaldosTabClient } from '@/components/saldos/saldos-tab-client'
import { GroupDashboard } from '@/components/grupos/grupo-dashboard'
import { ComprovantesGallery } from '@/components/grupos/comprovantes-gallery'
import { SpendingGoals } from '@/components/grupos/spending-goals'
import { ExportReport } from '@/components/grupos/export-report'
import { ArrowLeft, Users, Calculator, Settings } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { simplifyTransactions } from '@/lib/calculations'
import { MemberBalance } from '@/types/database'
import Link from 'next/link'

interface GrupoDetailPageProps {
  params: {
    id: string
  }
}

export default async function GrupoDetailPage({ params }: GrupoDetailPageProps) {
  const supabase = createServerClient()
  
  // Verificar autenticação
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Buscar dados do grupo
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        id,
        user_id,
        role,
        joined_at,
        profiles (
          id,
          full_name,
          avatar_url,
          phone,
          pix_key
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (groupError || !group) {
    notFound()
  }

  // Verificar se o usuário é membro do grupo
  const userMembership = group.group_members.find((m: any) => m.user_id === user.id)
  
  if (!userMembership) {
    redirect('/grupos')
  }

  // Buscar despesas do grupo
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select(`
      *,
      profiles!expenses_paid_by_fkey (
        id,
        full_name,
        avatar_url
      ),
      expense_splits (
        id,
        user_id,
        amount_owed,
        is_paid,
        paid_at,
        profiles (
          id,
          full_name
        )
      )
    `)
    .eq('group_id', params.id)
    .order('expense_date', { ascending: false })

  if (expensesError) {
    console.error('Erro ao buscar despesas:', expensesError)
  }

  const groupExpenses = expenses || []
  const totalExpenses = groupExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)

  // Buscar settlements (pagamentos confirmados)
  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', params.id)

  const groupSettlements = settlements || []

  // Calcular saldos dos membros
  const memberBalances = group.group_members.map((member: any) => {
    // Total pago por este membro
    const totalPaid = groupExpenses
      .filter((expense: any) => expense.paid_by === member.user_id)
      .reduce((sum: number, expense: any) => sum + expense.amount, 0)

    // Total devido por este membro
    const totalOwed = groupExpenses
      .flatMap((expense: any) => expense.expense_splits || [])
      .filter((split: any) => split.user_id === member.user_id)
      .reduce((sum: number, split: any) => sum + (split.amount_owed || 0), 0)

    // Ajustar saldo com settlements (pagamentos confirmados)
    // Settlement é um PAGAMENTO de acerto, não uma despesa nova
    // Se PAGOU acerto (from_user), AUMENTA seu saldo (pagou dívida pendente)
    const settlementsAsPayer = groupSettlements
      .filter((s: any) => s.from_user === member.user_id)
      .reduce((sum: number, s: any) => sum + Number(s.amount), 0)

    // Se RECEBEU acerto (to_user), DIMINUI seu saldo (recebeu o que era devido)
    const settlementsAsReceiver = groupSettlements
      .filter((s: any) => s.to_user === member.user_id)
      .reduce((sum: number, s: any) => sum + Number(s.amount), 0)

    const balance = totalPaid - totalOwed + settlementsAsPayer - settlementsAsReceiver

    console.log(`Saldo de ${member.profiles.full_name}:`, {
      totalPaid,
      totalOwed,
      balance,
      userId: member.user_id
    })

    return {
      ...member,
      totalPaid,
      totalOwed,
      balance
    }
  })

  const userBalance = memberBalances.find((m: any) => m.user_id === user.id)?.balance || 0

  console.log('Saldos calculados:', memberBalances)
  console.log('Saldo do usuário atual:', userBalance)

  // Calcular transações simplificadas usando o algoritmo
  const balancesForAlgorithm: MemberBalance[] = memberBalances.map((m: any) => ({
    user_id: m.user_id,
    profile: {
      id: m.profiles.id,
      full_name: m.profiles.full_name,
      avatar_url: m.profiles.avatar_url,
      pix_key: m.profiles.pix_key
    },
    total_paid: m.totalPaid,
    total_owed: m.totalOwed,
    balance: m.balance
  }))

  const simplifiedTransactions = simplifyTransactions(balancesForAlgorithm)
  console.log('Transações simplificadas:', simplifiedTransactions)

  // Buscar solicitações de pagamento pendentes
  const { data: paymentRequests, error: paymentError } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('group_id', params.id)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  console.log('Payment requests:', paymentRequests, paymentError)

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="backdrop-blur-md bg-white/80 border-b border-white/20 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/grupos">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={group.image_url || ''} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                    {group.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
                  {group.description && (
                    <p className="text-sm text-gray-600">{group.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="font-mono">
                {group.invite_code}
              </Badge>
              <CopyButton 
                text={group.invite_code}
                variant="outline" 
                size="sm"
              >
                Copiar Código
              </CopyButton>
              {userMembership.role === 'admin' && (
                <DeletarGrupoDialog groupId={params.id} groupName={group.name} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Resumo */}
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total de Gastos</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(totalExpenses)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>
                {userBalance > 0 ? 'Você recebe' : userBalance < 0 ? 'Você deve' : 'Seu Saldo'}
              </CardDescription>
              <CardTitle className={`text-2xl font-bold ${
                userBalance > 0 ? 'text-green-600' :
                userBalance < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {userBalance > 0 ? '+' : userBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(userBalance))}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Membros</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <Users className="h-6 w-6 mr-2 text-gray-600" />
                {group.group_members.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="despesas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
            <TabsTrigger value="saldos">Saldos</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="comprovantes">Comprovantes</TabsTrigger>
            <TabsTrigger value="membros">Membros</TabsTrigger>
          </TabsList>
          
          {/* Tab Despesas */}
          <TabsContent value="despesas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Despesas ({groupExpenses.length})
              </h3>
              <AdicionarDespesaSheet
                groupId={params.id}
                members={group.group_members}
                currentUserId={user.id}
              />
            </div>
            
            <GrupoDetailClient
              groupExpenses={groupExpenses}
              group={group}
              currentUserId={user.id}
              userRole={userMembership.role}
            />
          </TabsContent>
          
          {/* Tab Saldos */}
          <TabsContent value="saldos" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Acerto de Contas</h3>
              <p className="text-sm text-gray-600">
                Transações simplificadas para quitar todas as dívidas do grupo
              </p>
            </div>

            <SaldosTabClient
              simplifiedTransactions={simplifiedTransactions}
              currentUserId={user.id}
              groupId={params.id}
              paymentRequests={paymentRequests || []}
            />
          </TabsContent>

          {/* Tab Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            <GroupDashboard
              expenses={groupExpenses}
              members={group.group_members}
              totalExpenses={totalExpenses}
            />

            {/* Metas de Gastos */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Metas de Gastos</h3>
              <SpendingGoals
                groupId={params.id}
                expenses={groupExpenses}
                isAdmin={userMembership.role === 'admin'}
              />
            </div>

            {/* Exportar Relatório */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Exportar Dados</h3>
              <ExportReport
                groupName={group.name}
                expenses={groupExpenses}
                members={group.group_members}
                totalExpenses={totalExpenses}
              />
            </div>
          </TabsContent>

          {/* Tab Comprovantes */}
          <TabsContent value="comprovantes" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Galeria de Comprovantes</h3>
              <p className="text-sm text-gray-600">
                Visualize todas as notas fiscais e comprovantes do grupo
              </p>
            </div>
            <ComprovantesGallery expenses={groupExpenses} />
          </TabsContent>

          {/* Tab Membros */}
          <TabsContent value="membros" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Membros ({group.group_members.length})
              </h3>
              <Button variant="outline">
                Convidar Membro
              </Button>
            </div>
            
            <div className="space-y-3">
              {group.group_members.map((member: any) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.profiles.avatar_url || ''} />
                          <AvatarFallback>
                            {member.profiles.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.profiles.full_name}</p>
                          <div className="flex items-center space-x-2">
                            {member.role === 'admin' && (
                              <Badge variant="secondary" className="text-xs">
                                Admin
                              </Badge>
                            )}
                            {member.user_id === user.id && (
                              <Badge variant="outline" className="text-xs">
                                Você
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Membro desde {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}