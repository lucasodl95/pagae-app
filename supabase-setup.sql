-- ============================================
-- PAGAÊ - Setup Completo do Banco de Dados
-- ============================================
-- Execute este arquivo no SQL Editor do Supabase

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELAS
-- ============================================

-- Profiles (perfis dos usuários)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  pix_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Groups (grupos de despesas)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group Members (membros dos grupos)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Expenses (despesas)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  paid_by UUID REFERENCES profiles(id),
  receipt_url TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Expense Splits (divisão das despesas)
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  amount_owed DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP
);

-- Settlements (acertos de conta confirmados)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  from_user UUID REFERENCES profiles(id),
  to_user UUID REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  settled_at TIMESTAMP DEFAULT NOW()
);

-- Payment Requests (solicitações de pagamento)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  from_user UUID REFERENCES profiles(id),
  to_user UUID REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

-- Expense Comments (comentários nas despesas)
CREATE TABLE IF NOT EXISTS expense_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Spending Goals (metas de gastos por categoria)
CREATE TABLE IF NOT EXISTS spending_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly')) DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, category, period)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_group ON payment_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_comments_expense ON expense_comments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_comments_user ON expense_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_goals_group ON spending_goals(group_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_goals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURANÇA - PROFILES
-- ============================================

DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - GROUPS
-- ============================================

DROP POLICY IF EXISTS "Users view their groups or by invite code" ON groups;
CREATE POLICY "Users view their groups or by invite code" ON groups FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  OR invite_code IS NOT NULL
);

DROP POLICY IF EXISTS "Users create groups" ON groups;
CREATE POLICY "Users create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - GROUP_MEMBERS
-- ============================================

DROP POLICY IF EXISTS "Users view members of their groups" ON group_members;
CREATE POLICY "Users view members of their groups" ON group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins add members" ON group_members;
CREATE POLICY "Admins add members" ON group_members FOR INSERT WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - EXPENSES
-- ============================================

DROP POLICY IF EXISTS "Users view expenses of their groups" ON expenses;
CREATE POLICY "Users view expenses of their groups" ON expenses FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users create expenses in their groups" ON expenses;
CREATE POLICY "Users create expenses in their groups" ON expenses FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - EXPENSE_SPLITS
-- ============================================

DROP POLICY IF EXISTS "Users view splits of their expenses" ON expense_splits;
CREATE POLICY "Users view splits of their expenses" ON expense_splits FOR SELECT USING (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users update their own splits" ON expense_splits;
CREATE POLICY "Users update their own splits" ON expense_splits FOR UPDATE USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users insert splits" ON expense_splits;
CREATE POLICY "Users insert splits" ON expense_splits FOR INSERT WITH CHECK (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - SETTLEMENTS
-- ============================================

DROP POLICY IF EXISTS "Users view settlements of their groups" ON settlements;
CREATE POLICY "Users view settlements of their groups" ON settlements FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users create settlements" ON settlements;
CREATE POLICY "Users create settlements" ON settlements FOR INSERT WITH CHECK (
  from_user = auth.uid() OR to_user = auth.uid()
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - PAYMENT_REQUESTS
-- ============================================

DROP POLICY IF EXISTS "Users view payment requests of their groups" ON payment_requests;
CREATE POLICY "Users view payment requests of their groups" ON payment_requests FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users create payment requests" ON payment_requests;
CREATE POLICY "Users create payment requests" ON payment_requests FOR INSERT WITH CHECK (
  from_user = auth.uid() AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users update their payment requests" ON payment_requests;
CREATE POLICY "Users update their payment requests" ON payment_requests FOR UPDATE USING (
  to_user = auth.uid() OR from_user = auth.uid()
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - EXPENSE_COMMENTS
-- ============================================

DROP POLICY IF EXISTS "Users view comments of their group expenses" ON expense_comments;
CREATE POLICY "Users view comments of their group expenses" ON expense_comments FOR SELECT USING (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users create comments on their group expenses" ON expense_comments;
CREATE POLICY "Users create comments on their group expenses" ON expense_comments FOR INSERT WITH CHECK (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users delete their own comments" ON expense_comments;
CREATE POLICY "Users delete their own comments" ON expense_comments FOR DELETE USING (
  user_id = auth.uid()
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - SPENDING_GOALS
-- ============================================

DROP POLICY IF EXISTS "Users view goals of their groups" ON spending_goals;
CREATE POLICY "Users view goals of their groups" ON spending_goals FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage spending goals" ON spending_goals;
CREATE POLICY "Admins manage spending goals" ON spending_goals FOR ALL USING (
  group_id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- REMOVER CONSTRAINTS PROBLEMÁTICAS
-- ============================================

-- Remover constraint única que impedia múltiplas solicitações pendentes
ALTER TABLE payment_requests
DROP CONSTRAINT IF EXISTS payment_requests_group_id_from_user_to_user_status_key;

-- ============================================
-- STORAGE BUCKET PARA NOTAS FISCAIS
-- ============================================

-- IMPORTANTE: Criar manualmente no Supabase Dashboard:
-- 1. Ir em Storage > Create bucket
-- 2. Nome: "receipts"
-- 3. Marcar como "Public bucket" para permitir leitura pública
-- 4. Criar

-- Depois, criar policies no bucket:

-- Policy para upload (INSERT):
-- CREATE POLICY "Users can upload receipts" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'receipts' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Policy para visualização (SELECT):
-- CREATE POLICY "Anyone can view receipts" ON storage.objects
--   FOR SELECT USING (bucket_id = 'receipts');

-- ============================================
-- RESUMO DAS FUNCIONALIDADES
-- ============================================

-- ✅ Autenticação de usuários (Supabase Auth)
-- ✅ Perfis de usuário com chave PIX
-- ✅ Criação e gestão de grupos
-- ✅ Convite por código de 6 caracteres
-- ✅ Registro de despesas com foto da nota
-- ✅ Seleção de participantes por despesa
-- ✅ Divisão automática igualitária
-- ✅ Cálculo de saldos com settlements
-- ✅ Sistema de solicitação e confirmação de pagamentos
-- ✅ Algoritmo de simplificação de transações
-- ✅ Row Level Security (RLS) completo

-- ============================================
-- CATEGORIAS DE DESPESAS (definidas no frontend)
-- ============================================

-- 'Mercado', 'Ifood', 'Restaurante', 'Transporte',
-- 'Contas', 'Lazer', 'Compras', 'Outros'

-- ============================================
-- FIM DO SETUP
-- ============================================
-- Execute este script inteiro no SQL Editor do Supabase
-- Este script pode ser executado múltiplas vezes com segurança
