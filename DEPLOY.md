# 🚀 Guia de Deploy do Pagaê

## Opção 1: Vercel (RECOMENDADO ⭐)

### Por que Vercel?
- ✅ **100% Gratuito** para projetos pessoais
- ✅ Deploy automático a cada commit
- ✅ SSL/HTTPS automático
- ✅ Performance otimizada para Next.js
- ✅ Domínio gratuito (.vercel.app)

### Passo a Passo:

#### 1. Preparar o Código

```bash
# Navegue até a pasta do projeto
cd "C:\Users\User\Desktop\pagaê"

# Inicialize o Git (se ainda não fez)
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Initial commit - Pagaê app"
```

#### 2. Criar Repositório no GitHub

1. Acesse https://github.com
2. Faça login ou crie uma conta
3. Clique no botão **"+"** no canto superior direito
4. Selecione **"New repository"**
5. Nome: `pagae` ou `pagae-app`
6. Deixe **público** ou **privado** (sua escolha)
7. **NÃO marque** "Initialize this repository with a README"
8. Clique em **"Create repository"**

#### 3. Conectar seu código ao GitHub

Copie e execute os comandos que aparecem na tela:

```bash
git remote add origin https://github.com/SEU_USUARIO/pagae.git
git branch -M main
git push -u origin main
```

#### 4. Deploy na Vercel

1. Acesse https://vercel.com
2. Clique em **"Sign Up"** ou **"Log in"**
3. Escolha **"Continue with GitHub"**
4. Autorize a Vercel a acessar seus repositórios
5. Clique em **"Add New Project"**
6. Selecione o repositório **pagae**
7. Configure as variáveis de ambiente:

**IMPORTANTE:** Clique em "Environment Variables" e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_do_supabase
```

💡 **Onde pegar essas variáveis?**
- Acesse https://supabase.com/dashboard
- Selecione seu projeto
- Vá em **Settings** → **API**
- Copie:
  - **Project URL** → NEXT_PUBLIC_SUPABASE_URL
  - **anon public** → NEXT_PUBLIC_SUPABASE_ANON_KEY

8. Clique em **"Deploy"**

⏱️ **Aguarde 2-3 minutos** e seu app estará no ar!

#### 5. Compartilhe com seu amigo

Sua URL será algo como: `https://pagae.vercel.app`

---

## Opção 2: Netlify (Alternativa)

### Passo a Passo:

1. Acesse https://netlify.com
2. Faça login com GitHub
3. Clique em **"Add new site"** → **"Import an existing project"**
4. Escolha **GitHub**
5. Selecione o repositório **pagae**
6. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
7. Adicione as mesmas variáveis de ambiente
8. Clique em **"Deploy site"**

---

## Opção 3: Cloudflare Pages

### Passo a Passo:

1. Acesse https://pages.cloudflare.com
2. Faça login
3. Clique em **"Create a project"**
4. Conecte com GitHub
5. Selecione o repositório
6. **Build settings:**
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Build output: `.next`
7. Adicione as variáveis de ambiente
8. Clique em **"Save and Deploy"**

---

## 📝 Checklist antes do Deploy

- [ ] Código commitado no Git
- [ ] Repositório criado no GitHub
- [ ] Variáveis de ambiente do Supabase em mãos
- [ ] Conta criada na plataforma de deploy escolhida
- [ ] Banco de dados Supabase funcionando

---

## 🔄 Atualizações Futuras

Depois do primeiro deploy:

```bash
# Faça suas alterações no código
git add .
git commit -m "Descrição da alteração"
git push

# A Vercel/Netlify/Cloudflare fará deploy automático!
```

---

## 🐛 Problemas Comuns

### "Build failed"
- Verifique se adicionou as variáveis de ambiente
- Certifique-se que `npm run build` funciona localmente

### "Can't connect to database"
- Confira se as URLs do Supabase estão corretas
- Verifique as permissões (RLS) no Supabase

### "Domain not working"
- Aguarde alguns minutos após o deploy
- Limpe o cache do navegador (Ctrl + Shift + R)

---

## 💡 Dicas

1. **Domínio personalizado:** Todas as plataformas permitem adicionar seu próprio domínio
2. **Analytics:** Vercel oferece analytics gratuito
3. **Preview:** Toda plataforma cria URLs de preview para cada Pull Request
4. **Rollback:** Você pode voltar para versões anteriores com 1 clique

---

## 📞 Suporte

- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- Cloudflare: https://developers.cloudflare.com/pages

---

**Boa sorte com o deploy! 🎉**
