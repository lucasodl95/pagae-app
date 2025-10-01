# 🔧 Troubleshooting Vercel Deploy

## ⚠️ Warnings vs Errors

### Warnings (Avisos) - ✅ NÃO impedem o deploy
```
npm warn deprecated...
```
São apenas avisos de pacotes antigos. O build continua normalmente.

### Errors (Erros) - ❌ Impedem o deploy
```
Error: ...
Build failed
```
Esses param o build e precisam ser corrigidos.

---

## 🚨 Problemas Comuns e Soluções

### 1. "Module not found" ou "Cannot find module"

**Causa:** Falta instalar uma dependência

**Solução:**
```bash
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

---

### 2. "Build failed" sem erro específico

**Causa:** Falta configurar variáveis de ambiente

**Solução na Vercel:**
1. Vá em Settings → Environment Variables
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave do Supabase
3. Clique em "Redeploy"

---

### 3. Warnings de pacotes deprecados

**O que você viu:**
```
npm warn deprecated @supabase/auth-helpers-shared@0.6.3
npm warn deprecated sourcemap-codec@1.4.8
npm warn deprecated rimraf@3.0.2
```

**Solução:** Ignore! São apenas avisos, não impedem o deploy.

**Se quiser remover os warnings (opcional):**

1. Atualize os pacotes:
```bash
npm install @supabase/ssr@latest @supabase/supabase-js@latest
npm uninstall @supabase/auth-helpers-nextjs
```

2. Commit e push:
```bash
git add .
git commit -m "Update Supabase packages"
git push
```

---

### 4. "ENOENT: no such file or directory"

**Causa:** Arquivo referenciado não existe

**Solução:** Verifique se todos os arquivos foram commitados:
```bash
git status
git add .
git commit -m "Add missing files"
git push
```

---

### 5. "Type error" durante build

**Causa:** Erros de TypeScript

**Solução:** Teste o build localmente:
```bash
npm run build
```

Se der erro, corrija e depois:
```bash
git add .
git commit -m "Fix TypeScript errors"
git push
```

---

### 6. "Cannot connect to database"

**Causa:** Variáveis de ambiente incorretas

**Solução:**
1. Verifique no Supabase: Settings → API
2. Copie exatamente:
   - Project URL
   - anon public key
3. Cole na Vercel: Settings → Environment Variables
4. Redeploy

---

### 7. Build passa mas app não funciona

**Causa:** Variáveis de ambiente não configuradas

**Checklist:**
- [ ] NEXT_PUBLIC_SUPABASE_URL está configurada?
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY está configurada?
- [ ] Fez redeploy depois de adicionar as variáveis?

---

## 📋 Checklist Completo de Deploy

### Antes do Deploy:
- [ ] Build funciona localmente (`npm run build`)
- [ ] Variáveis de ambiente anotadas
- [ ] Código commitado no GitHub
- [ ] `.env.local` NÃO está no Git (está no .gitignore)

### Durante o Deploy:
- [ ] Repositório conectado à Vercel
- [ ] Framework detectado como "Next.js"
- [ ] Build Command: `npm run build` (ou deixe automático)
- [ ] Variáveis de ambiente adicionadas

### Após o Deploy:
- [ ] Build completou com sucesso
- [ ] Site está acessível
- [ ] Login funciona
- [ ] Banco de dados conecta

---

## 🔍 Como Debugar Erros

### 1. Ver logs detalhados:
- Na Vercel: Deployments → Clique no deploy → Build Logs
- Leia a última linha antes de "Error"

### 2. Testar localmente:
```bash
# Limpe tudo
rm -rf .next node_modules

# Reinstale
npm install

# Teste o build
npm run build

# Se passar, o problema é na Vercel (geralmente variáveis de ambiente)
```

### 3. Comparar com o .env.local:
```bash
# Suas variáveis locais
cat .env.local

# Compare com o que está na Vercel
```

---

## 🆘 Se Nada Funcionar

### Opção 1: Deploy manual
```bash
npm install -g vercel
vercel
```

### Opção 2: Netlify como alternativa
```bash
npm install -g netlify-cli
netlify deploy
```

### Opção 3: Começar do zero
1. Delete o deploy na Vercel
2. Delete o repositório do GitHub
3. Siga o guia DEPLOY.md novamente

---

## 📞 Onde Buscar Ajuda

1. **Vercel Docs:** https://vercel.com/docs/errors
2. **Supabase Docs:** https://supabase.com/docs
3. **Next.js Docs:** https://nextjs.org/docs/messages/...

---

## ✅ Seu Deploy Funcionou?

Se você vê isso na Vercel:
```
✓ Compiled successfully
✓ Build completed
```

**Parabéns! O deploy funcionou! 🎉**

Os warnings não importam, pode ignorar.

---

**Dica:** Mantenha esse arquivo para referência futura!
