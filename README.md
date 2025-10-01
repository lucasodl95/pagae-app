# Pagaê - Progressive Web App para Divisão de Despesas

Um PWA completo para dividir despesas compartilhadas entre amigos, com algoritmo inteligente de simplificação de dívidas.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação completa** (login/cadastro com Supabase Auth)
- **Gestão de grupos** (criar, visualizar, códigos de convite)
- **Registro de despesas** (com foto da nota fiscal)
- **Divisão automática** entre todos os membros
- **Algoritmo de simplificação** que minimiza transações
- **Sistema de saldos** com acerto via PIX
- **Progressive Web App** (funciona offline)
- **Interface responsiva** (mobile-first)
- **Upload de imagens** para notas fiscais

### 🔄 Sistema de Cálculos
- Divisão igual automática entre membros
- Cálculo de saldos individuais
- Algoritmo que emparelha credores e devedores
- Minimização do número de transações necessárias

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Banco de dados, Auth, Storage)
- **Tailwind CSS** (Estilização)
- **shadcn/ui** (Componentes)
- **React Hook Form + Zod** (Formulários e validação)
- **Lucide React** (Ícones)
- **next-pwa** (Funcionalidades PWA)

## 📦 Instalação e Setup

### 1. Pré-requisitos
```bash
Node.js 18+ 
npm ou yarn
Conta no Supabase
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar Supabase

#### 3.1. Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e a chave anônima

#### 3.2. Configurar variáveis de ambiente
Edite o arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

#### 3.3. Executar SQL no Supabase
No painel do Supabase, vá em "SQL Editor" e execute:

```sql
-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  pix_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group Members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Expenses
CREATE TABLE expenses (
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

-- Expense Splits
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  amount_owed DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP
);

-- Settlements (acertos de conta)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  from_user UUID REFERENCES profiles(id),
  to_user UUID REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  settled_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies para groups
CREATE POLICY "Users view their groups" ON groups FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policies para group_members
CREATE POLICY "Users view members of their groups" ON group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Admins add members" ON group_members FOR INSERT WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policies para expenses
CREATE POLICY "Users view expenses of their groups" ON expenses FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users create expenses in their groups" ON expenses FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Policies para expense_splits
CREATE POLICY "Users view splits of their expenses" ON expense_splits FOR SELECT USING (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Users update their own splits" ON expense_splits FOR UPDATE USING (
  user_id = auth.uid()
);

-- Policies para settlements
CREATE POLICY "Users view settlements of their groups" ON settlements FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users create settlements" ON settlements FOR INSERT WITH CHECK (
  from_user = auth.uid() OR to_user = auth.uid()
);
```

#### 3.4. Configurar Storage para notas fiscais
1. No Supabase, vá em "Storage"
2. Crie um bucket chamado "receipts"
3. Configure como público para leitura

### 4. Executar o projeto
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 📱 PWA - Progressive Web App

### Recursos PWA Implementados
- **Manifest.json** configurado
- **Service Worker** automático (next-pwa)
- **Funciona offline** (cache automático)
- **Instalável** no dispositivo
- **Ícones** para diferentes tamanhos
- **Tema personalizado** (indigo)

### Para instalar como app:
1. Abra o site no navegador mobile
2. Toque no menu "Adicionar à tela inicial"
3. Confirme a instalação

## 🎨 Design System

### Cores
- **Primária**: Indigo (#6366F1)
- **Sucesso**: Verde (#10B981) 
- **Erro/Dívida**: Vermelho (#EF4444)
- **Fundo**: Cinza claro (#F9FAFB)

### Categorias de Despesas
- Mercado
- Ifood  
- Restaurante
- Transporte
- Contas
- Lazer
- Compras
- Outros

## 🔧 Estrutura do Projeto

```
/app
  /(auth)
    /login/page.tsx          # Página de login
    /cadastro/page.tsx       # Página de cadastro
  /(app)
    /grupos/page.tsx         # Lista de grupos
    /grupos/[id]/page.tsx    # Detalhes do grupo
    /perfil/page.tsx         # Perfil do usuário
  /layout.tsx               # Layout principal
  /page.tsx                 # Landing page

/components
  /ui/                      # Componentes shadcn/ui
  /auth/                    # Componentes de autenticação
  /grupos/                  # Componentes de grupos
  /despesas/                # Componentes de despesas
  /saldos/                  # Componentes de saldos

/lib
  /supabase/               # Configuração Supabase
  /utils.ts                # Utilitários
  /calculations.ts         # Algoritmos de cálculo

/types
  /database.ts             # Tipos TypeScript
```

## 🧮 Algoritmo de Simplificação

O algoritmo implementado em `lib/calculations.ts` funciona da seguinte forma:

1. **Calcula saldos individuais**: Total pago - Total devido
2. **Separa credores e devedores**: Saldos positivos e negativos
3. **Emparelha maior devedor com maior credor**: Minimiza transações
4. **Gera lista otimizada**: Menor número de transferências necessárias

### Exemplo:
```
Ana pagou R$ 150, deve R$ 100 → Saldo: +R$ 50
Bob pagou R$ 50, deve R$ 100  → Saldo: -R$ 50
Carlos pagou R$ 100, deve R$ 100 → Saldo: R$ 0

Resultado: Bob paga R$ 50 para Ana (1 transação)
```

## 📊 Funcionalidades por Página

### 🏠 Landing Page (/)
- Apresentação do app
- Call-to-action para cadastro
- Links para login/cadastro

### 🔐 Login/Cadastro (/login, /cadastro)
- Formulários validados com Zod
- Integração com Supabase Auth
- Criação automática de perfil
- Redirecionamento inteligente

### 👥 Lista de Grupos (/grupos)
- Cards com resumo de cada grupo
- Botão para criar novo grupo
- Visualização de saldos individuais
- Navegação para detalhes

### 📊 Detalhes do Grupo (/grupos/[id])
- **Aba Despesas**: Lista e adicionar despesas
- **Aba Saldos**: Acerto de contas simplificado
- **Aba Membros**: Gestão de participantes
- Resumo financeiro do grupo

### 👤 Perfil (/perfil)
- Edição de dados pessoais
- Configuração de chave PIX
- Informações da conta
- Logout

## 🔒 Segurança

### Row Level Security (RLS)
- Usuários só veem dados dos próprios grupos
- Políticas de acesso granulares
- Validação no banco e frontend

### Validações
- Formulários validados com Zod
- Sanitização de uploads
- Verificação de permissões

## 📱 Responsividade

- **Mobile-first**: Design otimizado para celular
- **Breakpoints**: sm, md, lg, xl
- **Componentes adaptáveis**: Cards, formulários, navegação
- **Touch-friendly**: Botões e alvos de toque adequados

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte o repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras plataformas
- Netlify
- Railway
- Render

## 🐛 Troubleshooting

### Problema: Erro de autenticação
- Verifique as variáveis de ambiente
- Confirme a configuração RLS no Supabase

### Problema: Upload de imagens não funciona
- Verifique se o bucket "receipts" existe
- Configure permissões públicas para leitura

### Problema: PWA não instala
- Verifique se está servindo via HTTPS
- Confirme se o manifest.json está acessível

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Pagaê** - Dividindo despesas de forma inteligente! 🧮💰