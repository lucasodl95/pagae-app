# 📱 Guia de Teste Mobile - Pagaê PWA

## 🎯 Forma Mais Rápida (Rede Local)

### Seu IP Local: `192.168.2.119`

### Passo a Passo:

1. **Certifique-se que o app está rodando:**
```bash
npm run dev
```

2. **No seu celular:**
   - Conecte na **mesma rede WiFi** do seu computador
   - Abra o Chrome (Android) ou Safari (iPhone)
   - Digite na barra de endereço:
   ```
   http://192.168.2.119:3000
   ```

3. **Instalar como PWA:**

   **📱 Android (Chrome):**
   - Toque nos 3 pontinhos (⋮) no canto superior direito
   - Selecione "Adicionar à tela inicial" ou "Instalar app"
   - Confirme
   - O app aparecerá como um ícone normal!

   **🍎 iPhone (Safari):**
   - Toque no botão Compartilhar (📤)
   - Role para baixo
   - Selecione "Adicionar à Tela de Início"
   - Nomeie o app (ex: "Pagaê")
   - Toque em "Adicionar"

---

## 🌐 Método 2: Ngrok (Internet)

Use isso para compartilhar com seu amigo!

### Instalação:

```bash
npm install -g ngrok
```

### Uso:

1. **Terminal 1** (deixe rodando):
```bash
npm run dev
```

2. **Terminal 2** (novo terminal):
```bash
ngrok http 3000
```

3. **Copie a URL HTTPS** que aparece (ex: `https://abc123.ngrok-free.app`)

4. **Compartilhe com seu amigo** ou acesse do celular

5. **Instale como PWA** (mesmo processo acima)

✅ **Vantagens:**
- Funciona de qualquer lugar
- Seu amigo pode testar de outra cidade
- URL HTTPS (necessário para PWA completo)

⚠️ **Desvantagens:**
- URL muda quando reinicia (versão grátis)
- Limite de conexões simultâneas

---

## 🚀 Método 3: Vercel (RECOMENDADO para testes)

Faça o deploy e terá uma URL permanente:

1. Siga o guia em `DEPLOY.md`
2. Sua URL será: `https://pagae.vercel.app` (ou similar)
3. Acesse do celular
4. Instale como PWA

✅ **Vantagens:**
- URL permanente
- HTTPS automático
- Performance otimizada
- Pode compartilhar com quantas pessoas quiser

---

## 🧪 Checklist de Testes no Celular

### Funcionalidades Básicas:
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Criar grupo
- [ ] Adicionar despesa
- [ ] Tirar foto do comprovante
- [ ] Upload de imagem funciona
- [ ] Visualizar despesas
- [ ] Editar despesa
- [ ] Deletar despesa
- [ ] Ver saldos
- [ ] Marcar pagamento como pago

### Funcionalidades PWA:
- [ ] Ícone aparece na tela inicial
- [ ] App abre em tela cheia (sem barra do navegador)
- [ ] Funciona offline (após carregar uma vez)
- [ ] Notificações funcionam
- [ ] Splash screen aparece ao abrir

### Performance:
- [ ] App carrega rápido
- [ ] Transições são suaves
- [ ] Scroll é fluido
- [ ] Imagens carregam bem

### Responsividade:
- [ ] Textos legíveis
- [ ] Botões clicáveis
- [ ] Formulários funcionam
- [ ] Layout se ajusta bem

---

## 🔧 Ferramentas de Debug Mobile

### Chrome DevTools (Desktop):

1. Conecte o celular Android via USB
2. No Chrome desktop: `chrome://inspect`
3. Selecione seu dispositivo
4. Você verá o console e pode debugar!

### Safari DevTools (iPhone):

1. No iPhone: Settings → Safari → Advanced → Web Inspector (ativar)
2. No Mac: Safari → Preferences → Advanced → Show Develop menu
3. Conecte iPhone via cabo
4. Develop → [Seu iPhone] → Selecione a página

---

## 📊 Testar PWA Score

Acesse do desktop:

1. Abra `http://localhost:3000`
2. Pressione F12 (DevTools)
3. Aba "Lighthouse"
4. Marque "Progressive Web App"
5. Clique "Analyze page load"

**Seu app deve ter score 90+ em PWA! ✅**

---

## 🎨 Verificar Manifest e Service Worker

### Verificar Manifest:
```
http://localhost:3000/manifest.json
```

Deve mostrar informações do app (nome, ícones, cores, etc.)

### Verificar Service Worker:

No DevTools:
1. Aba "Application"
2. Service Workers (à esquerda)
3. Deve aparecer como "activated and running"

---

## 🐛 Problemas Comuns

### "Não consigo acessar pelo IP"
- Firewall do Windows pode estar bloqueando
- Verifique se está na mesma rede WiFi
- Tente desativar temporariamente o firewall

### "PWA não instala"
- Precisa ser HTTPS (use ngrok ou Vercel)
- Manifest.json deve estar correto
- Service worker deve estar ativo

### "App não funciona offline"
- Service worker precisa estar instalado
- Precisa acessar pelo menos uma vez online
- Verifique se o manifest está carregando

### "Câmera não funciona"
- Precisa ser HTTPS
- Precisa dar permissão no navegador
- No Safari pode ter limitações

---

## 💡 Dicas Profissionais

1. **Sempre teste em HTTPS** para funcionalidades completas de PWA
2. **Teste em múltiplos dispositivos** (Android e iOS)
3. **Limpe o cache** entre testes (Configurações do app)
4. **Teste com rede lenta** (DevTools → Network → Slow 3G)
5. **Verifique permissões** (câmera, notificações)

---

## 🎯 Próximos Passos

1. **Teste local** (http://192.168.2.119:3000)
2. **Se funcionar bem**, use Ngrok para compartilhar
3. **Quando estiver satisfeito**, faça deploy na Vercel
4. **Compartilhe a URL** com seu amigo

---

**Boa sorte nos testes! 📱✨**
