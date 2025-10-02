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
import { SpendingGoals } from '@/components/grupos/spending-goals'
import { ExportReport } from '@/components/grupos/export-report'
import { GroupDeletedMonitor } from '@/components/grupos/group-deleted-monitor'
import { ArrowLeft, Users, Settings, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DivisionIcon } from '@/components/ui/division-icon'
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
      paid_by_profile:profiles!expenses_paid_by_fkey (
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
  const { data: settlements, error: settlementsError } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', params.id)

  if (settlementsError) {
    console.error('Erro ao buscar settlements:', settlementsError)
  }

  const groupSettlements = settlements || []

  // Buscar perfis para os settlements
  const settlementsWithProfiles = await Promise.all(
    groupSettlements.map(async (settlement: any) => {
      const { data: fromProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', settlement.from_user)
        .single()

      const { data: toProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', settlement.to_user)
        .single()

      return {
        ...settlement,
        from_profile: fromProfile,
        to_profile: toProfile
      }
    })
  )

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
  console.log('Settlements encontrados:', settlementsWithProfiles)

  // Buscar solicitações de pagamento pendentes
  const { data: paymentRequests, error: paymentError } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('group_id', params.id)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  console.log('Payment requests:', paymentRequests, paymentError)

  // Calcular notificações de Saldos para o usuário atual
  const userDebts = simplifiedTransactions.filter(t => t.from_user.id === user.id).length
  const pendingConfirmations = (paymentRequests || []).filter(r => r.to_user === user.id).length
  const saldosNotifications = userDebts + pendingConfirmations

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Monitor para detectar se o grupo foi deletado */}
      <GroupDeletedMonitor groupId={params.id} />

      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="backdrop-blur-md bg-white/95 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            {/* Left - Back button + Group info */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href="/grupos">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>

              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={group.image_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
                  {group.description && (
                    <p className="text-sm text-gray-600 max-w-md truncate">{group.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Invite code + Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-gray-600">Código:</span>
                <Badge variant="secondary" className="font-mono text-sm bg-white">
                  {group.invite_code}
                </Badge>
                <CopyButton
                  text={group.invite_code}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                />
              </div>
              {userMembership.role === 'admin' && (
                <DeletarGrupoDialog groupId={params.id} groupName={group.name} />
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            {/* Top row - Back + Actions */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/grupos">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              {userMembership.role === 'admin' && (
                <DeletarGrupoDialog groupId={params.id} groupName={group.name} />
              )}
            </div>

            {/* Group info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={group.image_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                  {group.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">{group.name}</h1>
                {group.description && (
                  <p className="text-xs text-gray-600 truncate">{group.description}</p>
                )}
              </div>
            </div>

            {/* Invite code */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-gray-600">Código:</span>
              <Badge variant="secondary" className="font-mono text-xs bg-white">
                {group.invite_code}
              </Badge>
              <CopyButton
                text={group.invite_code}
                variant="ghost"
                size="sm"
                className="h-6 px-2 ml-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Resumo */}
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Card Total de Gastos */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="pb-3 relative">
              <div className="flex items-center mb-2">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <DivisionIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <CardDescription className="text-blue-700 font-medium">Total de Gastos</CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-900">
                {formatCurrency(totalExpenses)}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Card Saldo do Usuário */}
          <Card className={`${
            userBalance > 0
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
              : userBalance < 0
              ? 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200'
              : 'bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200'
          } shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 ${
              userBalance > 0 ? 'bg-green-400/10' : userBalance < 0 ? 'bg-red-400/10' : 'bg-gray-400/10'
            }`}></div>
            <CardHeader className="pb-3 relative">
              <div className="flex items-center mb-2">
                <div className={`p-2 rounded-lg ${
                  userBalance > 0
                    ? 'bg-green-500'
                    : userBalance < 0
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}>
                  <TrendingUp className={`h-5 w-5 text-white ${
                    userBalance > 0 ? '' : userBalance < 0 ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
              <CardDescription className={`font-medium ${
                userBalance > 0 ? 'text-green-700' : userBalance < 0 ? 'text-red-700' : 'text-gray-700'
              }`}>
                {userBalance > 0 ? 'Você recebe' : userBalance < 0 ? 'Você deve' : 'Seu Saldo'}
              </CardDescription>
              <CardTitle className={`text-3xl font-bold ${
                userBalance > 0 ? 'text-green-600' :
                userBalance < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {userBalance > 0 ? '+' : userBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(userBalance))}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Card Membros */}
          <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="pb-3 relative">
              <div className="flex items-center mb-2">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <CardDescription className="text-purple-700 font-medium">Membros</CardDescription>
              <CardTitle className="text-3xl font-bold text-purple-900">
                {group.group_members.length}
              </CardTitle>
              <div className="flex -space-x-2 mt-2">
                {group.group_members.slice(0, 5).map((member: any) => (
                  <Avatar key={member.id} className="h-7 w-7 border-2 border-white">
                    <AvatarImage src={member.profiles.avatar_url || ''} />
                    <AvatarFallback className="bg-purple-200 text-purple-700 text-xs">
                      {member.profiles.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {group.group_members.length > 5 && (
                  <div className="h-7 w-7 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-semibold text-purple-700">+{group.group_members.length - 5}</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="despesas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="despesas" className="text-xs md:text-sm">Despesas</TabsTrigger>
            <TabsTrigger value="saldos" className="text-xs md:text-sm">
              <span className="flex items-center gap-2">
                Saldos
                {saldosNotifications > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs md:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="membros" className="text-xs md:text-sm">Membros</TabsTrigger>
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
              settlements={settlementsWithProfiles}
            />
          </TabsContent>

          {/* Tab Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <GroupDashboard
              expenses={groupExpenses}
              members={group.group_members}
              totalExpenses={totalExpenses}
            />

            {/* Metas de Gastos */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-lg">
                    <DivisionIcon className="h-4 w-4 text-white" />
                  </div>
                  Metas de Gastos
                </CardTitle>
                <CardDescription>
                  Defina e acompanhe metas de gastos para o grupo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpendingGoals
                  groupId={params.id}
                  expenses={groupExpenses}
                  isAdmin={userMembership.role === 'admin'}
                />
              </CardContent>
            </Card>

            {/* Exportar Relatório */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                  Exportar Dados
                </CardTitle>
                <CardDescription>
                  Baixe relatórios detalhados em diferentes formatos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportReport
                  groupName={group.name}
                  expenses={groupExpenses}
                  members={group.group_members}
                  totalExpenses={totalExpenses}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Membros */}
          <TabsContent value="membros" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Membros do Grupo
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {group.group_members.length} {group.group_members.length === 1 ? 'membro ativo' : 'membros ativos'}
              </p>
            </div>

            <div className="grid gap-3 md:gap-4">
              {group.group_members.map((member: any) => {
                const memberBalance = memberBalances.find((m: any) => m.user_id === member.user_id)
                const balance = memberBalance?.balance || 0

                return (
                  <Card key={member.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        {/* Info do membro */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 md:h-14 md:w-14 ring-2 ring-gray-100">
                            <AvatarImage src={member.profiles.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-lg">
                              {member.profiles.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{member.profiles.full_name}</p>
                              {member.user_id === user.id && (
                                <Badge variant="outline" className="text-xs">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {member.role === 'admin' && (
                                <Badge className="text-xs bg-gradient-to-r from-violet-500 to-purple-500">
                                  Admin
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                Desde {new Date(member.joined_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Saldo do membro */}
                        <div className="flex md:flex-col items-center md:items-end gap-2">
                          <div className="text-left md:text-right">
                            <p className="text-xs text-gray-600 mb-1">Saldo</p>
                            <p className={`text-lg md:text-xl font-bold ${
                              balance > 0 ? 'text-green-600' :
                              balance < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {balance > 0 ? '+' : balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance))}
                            </p>
                          </div>
                          {member.profiles.pix_key && (
                            <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              PIX configurado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}