import { MemberBalance, SimplifiedTransaction, Profile } from '@/types/database'

// Cache para otimização de cálculos repetidos
const calculationCache = new Map<string, any>()
const CACHE_TTL = 60000 // 1 minuto

/**
 * Calcula os saldos de cada membro do grupo
 * @param members Array de membros com totais pagos e devidos
 * @returns Array de saldos calculados
 */
export function calculateMemberBalances(members: {
  user_id: string
  profile: Profile
  total_paid: number
  total_owed: number
}[]): MemberBalance[] {
  const cacheKey = `balances_${members.map(m => `${m.user_id}_${m.total_paid}_${m.total_owed}`).join('_')}`

  // Verificar cache
  const cached = getCachedValue(cacheKey)
  if (cached) return cached

  const result = members.map(member => ({
    ...member,
    balance: Number((member.total_paid - member.total_owed).toFixed(2))
  }))

  setCachedValue(cacheKey, result)
  return result
}

/**
 * Obtém valor do cache se ainda válido
 */
function getCachedValue(key: string): any {
  const cached = calculationCache.get(key)
  if (!cached) return null

  const { value, timestamp } = cached
  if (Date.now() - timestamp > CACHE_TTL) {
    calculationCache.delete(key)
    return null
  }

  return value
}

/**
 * Armazena valor no cache com timestamp
 */
function setCachedValue(key: string, value: any): void {
  calculationCache.set(key, { value, timestamp: Date.now() })

  // Limpar cache antigo periodicamente
  if (calculationCache.size > 100) {
    const now = Date.now()
    Array.from(calculationCache.entries()).forEach(([k, v]) => {
      if (now - v.timestamp > CACHE_TTL) {
        calculationCache.delete(k)
      }
    })
  }
}

/**
 * Algoritmo otimizado de simplificação de dívidas usando abordagem Greedy
 * Minimiza o número de transações necessárias para quitar todas as dívidas
 * Complexidade: O(n log n) onde n é o número de membros
 * @param balances Array de saldos dos membros
 * @returns Array de transações simplificadas
 */
export function simplifyTransactions(balances: MemberBalance[]): SimplifiedTransaction[] {
  const cacheKey = `transactions_${balances.map(b => `${b.user_id}_${b.balance}`).join('_')}`

  // Verificar cache
  const cached = getCachedValue(cacheKey)
  if (cached) return cached

  // Filtra apenas membros com saldo significativo diferente de zero
  const EPSILON = 0.01
  const nonZeroBalances = balances.filter(b => Math.abs(b.balance) > EPSILON)

  if (nonZeroBalances.length === 0) {
    return []
  }

  // Separa e ordena credores (saldo positivo) e devedores (saldo negativo)
  const creditors = nonZeroBalances
    .filter(b => b.balance > EPSILON)
    .sort((a, b) => b.balance - a.balance) // Maior crédito primeiro
    .map(b => ({ ...b, balance: Number(b.balance.toFixed(2)) }))

  const debtors = nonZeroBalances
    .filter(b => b.balance < -EPSILON)
    .sort((a, b) => a.balance - b.balance) // Maior débito primeiro
    .map(b => ({ ...b, balance: Number(Math.abs(b.balance).toFixed(2)) }))

  const transactions: SimplifiedTransaction[] = []

  // Algoritmo Greedy de emparelhamento otimizado
  let i = 0, j = 0
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]

    // Calcula o valor ótimo da transação
    const transactionAmount = Number(Math.min(creditor.balance, debtor.balance).toFixed(2))

    if (transactionAmount > EPSILON) {
      transactions.push({
        from_user: debtor.profile,
        to_user: creditor.profile,
        amount: transactionAmount
      })

      // Atualiza os saldos
      creditor.balance = Number((creditor.balance - transactionAmount).toFixed(2))
      debtor.balance = Number((debtor.balance - transactionAmount).toFixed(2))
    }

    // Avança para o próximo credor ou devedor
    if (creditor.balance <= EPSILON) i++
    if (debtor.balance <= EPSILON) j++
  }

  setCachedValue(cacheKey, transactions)
  return transactions
}

/**
 * Calcula estatísticas detalhadas de um grupo
 * @param expenses Array de despesas
 * @param members Array de membros
 * @returns Objeto com estatísticas
 */
export function calculateGroupStatistics(expenses: any[], members: any[]) {
  const totalExpenses = calculateGroupTotal(expenses)
  const avgPerPerson = calculateAveragePerPerson(totalExpenses, members.length)

  // Estatísticas por categoria
  const byCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  // Membro que mais gastou
  const memberExpenses = members.map(member => {
    const total = expenses
      .filter(e => e.paid_by === member.user_id)
      .reduce((sum, e) => sum + e.amount, 0)
    return { ...member, total }
  })

  const topSpender = memberExpenses.reduce((max, member) =>
    member.total > max.total ? member : max, memberExpenses[0] || { total: 0 }
  )

  return {
    totalExpenses,
    avgPerPerson,
    expenseCount: expenses.length,
    byCategory,
    topSpender,
    memberCount: members.length
  }
}

/**
 * Calcula o total de gastos do grupo
 * @param expenses Array de despesas
 * @returns Total de gastos
 */
export function calculateGroupTotal(expenses: { amount: number }[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0)
}

/**
 * Calcula a média de gastos por pessoa
 * @param totalAmount Total de gastos
 * @param memberCount Número de membros
 * @returns Média por pessoa
 */
export function calculateAveragePerPerson(totalAmount: number, memberCount: number): number {
  if (memberCount === 0) return 0
  return totalAmount / memberCount
}

/**
 * Formata um valor para exibição em moeda brasileira
 * @param value Valor a ser formatado
 * @returns String formatada em R$
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Valida se um valor de despesa é válido
 * @param amount Valor a ser validado
 * @returns true se válido, false caso contrário
 */
export function isValidExpenseAmount(amount: number): boolean {
  return amount > 0 && isFinite(amount) && !isNaN(amount)
}

/**
 * Divide uma despesa igualmente entre membros com precisão decimal
 * @param totalAmount Valor total da despesa
 * @param memberIds Array de IDs dos membros
 * @returns Array com valor devido por cada membro
 */
export function splitExpenseEqually(totalAmount: number, memberIds: string[]): { user_id: string; amount_owed: number }[] {
  if (memberIds.length === 0) return []

  // Calcula valor por pessoa com arredondamento para 2 casas decimais
  const amountPerPerson = Number((totalAmount / memberIds.length).toFixed(2))

  // Calcula diferença de arredondamento
  const totalDistributed = amountPerPerson * memberIds.length
  const difference = Number((totalAmount - totalDistributed).toFixed(2))

  const result = memberIds.map((user_id, index) => ({
    user_id,
    // Adiciona a diferença ao primeiro membro para manter o total exato
    amount_owed: index === 0
      ? Number((amountPerPerson + difference).toFixed(2))
      : amountPerPerson
  }))

  return result
}

/**
 * Divide uma despesa de forma personalizada
 * @param totalAmount Valor total
 * @param splits Array com user_id e porcentagem/valor
 * @returns Array normalizado com valores
 */
export function splitExpenseCustom(
  totalAmount: number,
  splits: { user_id: string; value: number; type: 'percentage' | 'fixed' }[]
): { user_id: string; amount_owed: number }[] {
  if (splits.length === 0) return []

  // Separa splits fixos e percentuais
  const fixedSplits = splits.filter(s => s.type === 'fixed')
  const percentageSplits = splits.filter(s => s.type === 'percentage')

  // Calcula total de valores fixos
  const totalFixed = fixedSplits.reduce((sum, s) => sum + s.value, 0)
  const remaining = totalAmount - totalFixed

  // Calcula valores percentuais sobre o restante
  const result = splits.map(split => {
    if (split.type === 'fixed') {
      return { user_id: split.user_id, amount_owed: Number(split.value.toFixed(2)) }
    } else {
      const amount = (remaining * split.value) / 100
      return { user_id: split.user_id, amount_owed: Number(amount.toFixed(2)) }
    }
  })

  return result
}

/**
 * Valida e normaliza saldos para evitar erros de arredondamento
 */
export function normalizeBalances(balances: MemberBalance[]): MemberBalance[] {
  return balances.map(balance => ({
    ...balance,
    balance: Number(balance.balance.toFixed(2))
  }))
}

/**
 * Limpa o cache de cálculos (útil após atualizações)
 */
export function clearCalculationCache(): void {
  calculationCache.clear()
}