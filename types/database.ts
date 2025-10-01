export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          pix_key: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          pix_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          pix_key?: string | null
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          invite_code: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          invite_code: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          invite_code?: string
          created_by?: string | null
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          description: string
          amount: number
          category: string
          paid_by: string | null
          receipt_url: string | null
          expense_date: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          group_id: string
          description: string
          amount: number
          category: string
          paid_by?: string | null
          receipt_url?: string | null
          expense_date: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          description?: string
          amount?: number
          category?: string
          paid_by?: string | null
          receipt_url?: string | null
          expense_date?: string
          created_at?: string
          created_by?: string | null
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string | null
          amount_owed: number
          is_paid: boolean
          paid_at: string | null
        }
        Insert: {
          id?: string
          expense_id: string
          user_id?: string | null
          amount_owed: number
          is_paid?: boolean
          paid_at?: string | null
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string | null
          amount_owed?: number
          is_paid?: boolean
          paid_at?: string | null
        }
      }
      settlements: {
        Row: {
          id: string
          group_id: string
          from_user: string | null
          to_user: string | null
          amount: number
          settled_at: string
        }
        Insert: {
          id?: string
          group_id: string
          from_user?: string | null
          to_user?: string | null
          amount: number
          settled_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          from_user?: string | null
          to_user?: string | null
          amount?: number
          settled_at?: string
        }
      }
    }
  }
}

// Tipos auxiliares
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row']
export type Settlement = Database['public']['Tables']['settlements']['Row']

// Tipos com relacionamentos
export type GroupWithMembers = Group & {
  group_members: (GroupMember & {
    profiles: Profile
  })[]
}

export type ExpenseWithDetails = Expense & {
  paid_by_profile: Profile | null
  expense_splits: (ExpenseSplit & {
    profiles: Profile | null
  })[]
}

// Tipos para cálculos de saldo
export type MemberBalance = {
  user_id: string
  profile: Profile
  total_paid: number
  total_owed: number
  balance: number
}

export type SimplifiedTransaction = {
  from_user: Profile
  to_user: Profile
  amount: number
}

// Categorias de despesas
export const EXPENSE_CATEGORIES = [
  'Mercado',
  'Ifood',
  'Restaurante',
  'Transporte',
  'Contas',
  'Lazer',
  'Compras',
  'Outros'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]