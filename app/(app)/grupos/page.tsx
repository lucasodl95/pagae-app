import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GrupoCard } from '@/components/grupos/grupo-card'
import { CriarGrupoDialog } from '@/components/grupos/criar-grupo-dialog'
import { EntrarGrupoDialog } from '@/components/grupos/entrar-grupo-dialog'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Plus, Users, TrendingUp, Sparkles, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import Link from 'next/link'
import { DivisionIcon } from '@/components/ui/division-icon'
import { simplifyTransactions } from '@/lib/calculations'
import { MemberBalance } from '@/types/database'

export default async function GruposPage() {
  const supabase = createServerClient()
  
  // Verificar autenticação
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Buscar grupos do usuário
  const { data: groups, error: groupsError } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups!inner (
        id,
        name,
        description,
        image_url,
        invite_code,
        created_at,
        group_members (
          id,
          user_id,
          role,
          profiles (
            id,
            full_name,
            avatar_url
          )
        )
      )
    `)
    .eq('user_id', user.id)

  if (groupsError) {
    console.error('Erro ao buscar grupos:', groupsError)
  }

  const userGroups = (groups?.map(g => g.groups).filter(Boolean) || []) as any[]

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Calcular quantas pessoas o usuário deve pagar e quantas devem pagar para ele
  let peopleToPay = 0
  let peopleToReceive = 0

  for (const group of userGroups) {
    // Buscar despesas do grupo
    const { data: expenses } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_splits (
          user_id,
          amount_owed
        )
      `)
      .eq('group_id', group.id)

    const groupExpenses = expenses || []

    // Buscar settlements
    const { data: settlements } = await supabase
      .from('settlements')
      .select('*')
      .eq('group_id', group.id)

    const groupSettlements = settlements || []

    // Calcular saldos
    const memberBalances = group.group_members.map((member: any) => {
      const totalPaid = groupExpenses
        .filter((expense: any) => expense.paid_by === member.user_id)
        .reduce((sum: number, expense: any) => sum + expense.amount, 0)

      const totalOwed = groupExpenses
        .flatMap((expense: any) => expense.expense_splits || [])
        .filter((split: any) => split.user_id === member.user_id)
        .reduce((sum: number, split: any) => sum + (split.amount_owed || 0), 0)

      const settlementsAsPayer = groupSettlements
        .filter((s: any) => s.from_user === member.user_id)
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0)

      const settlementsAsReceiver = groupSettlements
        .filter((s: any) => s.to_user === member.user_id)
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0)

      const balance = totalPaid - totalOwed + settlementsAsPayer - settlementsAsReceiver

      return {
        user_id: member.user_id,
        profile: {
          id: member.profiles.id,
          full_name: member.profiles.full_name,
          avatar_url: member.profiles.avatar_url,
          pix_key: null
        },
        total_paid: totalPaid,
        total_owed: totalOwed,
        balance
      }
    })

    // Simplificar transações
    const transactions = simplifyTransactions(memberBalances as MemberBalance[])

    // Contar transações onde o usuário está envolvido
    for (const transaction of transactions) {
      if (transaction.from_user.id === user.id) {
        peopleToPay++
      }
      if (transaction.to_user.id === user.id) {
        peopleToReceive++
      }
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 gradient-mesh"></div>

      {/* Animated gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10"></div>

      {/* Floating shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-gradient-to-r from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative backdrop-blur-xl bg-white/70 border-b border-white/30 sticky top-0 z-50 shadow-lg shadow-purple-500/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/grupos" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative gradient-primary p-2.5 rounded-2xl shadow-xl">
                  <DivisionIcon className="h-7 w-7 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Pagaê</span>
            </Link>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-violet-100">
                <Link href="/perfil">
                  <Avatar className="h-7 w-7 mr-2">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-violet-100 text-violet-600 text-xs">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{profile?.full_name?.split(' ')[0] || 'Perfil'}</span>
                </Link>
              </Button>

              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col items-center gap-4 mb-2">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
              <Sparkles className="h-6 w-6 text-amber-500" />
            </h2>

            <div className="w-full sm:w-64">
              <CriarGrupoDialog />
            </div>
          </div>
        </div>

        {/* Lista de Grupos */}
        {userGroups.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl shadow-violet-500/10 p-12 max-w-2xl mx-auto card-shine overflow-hidden">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-400 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-violet-100 to-purple-100 p-8 rounded-3xl shadow-lg">
                  <DivisionIcon className="h-16 w-16 text-violet-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Comece sua jornada!
              </h3>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                Crie seu primeiro grupo ou entre em um existente para começar a dividir despesas de forma inteligente
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <CriarGrupoDialog />
                <EntrarGrupoDialog />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-white/40 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 card-shine overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Grupos</p>
                    <p className="text-2xl font-bold text-gray-900">{userGroups.length}</p>
                  </div>
                  <div className="gradient-primary p-3 rounded-xl">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-white/40 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 card-shine overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Membros Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userGroups.reduce((sum: number, g: any) => sum + (g.group_members?.length || 0), 0)}
                    </p>
                  </div>
                  <div className="gradient-primary p-3 rounded-xl">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-white/40 shadow-xl shadow-red-500/10 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-1 card-shine overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Devo pagar</p>
                    <p className="text-2xl font-bold text-red-600">{peopleToPay}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {peopleToPay === 1 ? 'pessoa' : 'pessoas'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-rose-500 p-3 rounded-xl">
                    <ArrowUpCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-white/40 shadow-xl shadow-green-500/10 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1 card-shine overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Devem me pagar</p>
                    <p className="text-2xl font-bold text-green-600">{peopleToReceive}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {peopleToReceive === 1 ? 'pessoa' : 'pessoas'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl">
                    <ArrowDownCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
              {userGroups.map((group: any) => (
                <GrupoCard
                  key={group.id}
                  group={group}
                />
              ))}
            </div>
          </>
        )}

        {/* Ações Rápidas */}
        {userGroups.length > 0 && (
          <div className="mt-8 group relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 p-6 card-shine overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Ações Rápidas
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="w-full sm:w-auto">
                <CriarGrupoDialog />
              </div>
              <div className="w-full sm:w-auto">
                <EntrarGrupoDialog />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}