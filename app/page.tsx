import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Calculator,
  Smartphone,
  ArrowRight,
  TrendingDown,
  Shield,
  Zap,
  CheckCircle2,
  Sparkles,
  PiggyBank
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
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
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative gradient-primary p-2 rounded-xl">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Pagaê
              </h1>
              <Badge className="hidden sm:inline-flex bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                Novo
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild className="hidden sm:inline-flex hover:bg-violet-100 rounded-xl">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="gradient-primary text-white border-0 shadow-xl hover:shadow-2xl transition-all rounded-xl hover:-translate-y-0.5">
                <Link href="/cadastro">Começar Grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center relative z-10">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <Badge className="mb-8 px-5 py-2.5 text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5">
            <Zap className="h-4 w-4 mr-2 text-amber-300" />
            Divisão inteligente de despesas com IA
          </Badge>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
            Divida despesas com
            <span className="block mt-2 md:mt-3 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent animate-slide-up drop-shadow-lg">
              inteligência artificial
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Chega de planilhas complicadas. Simplifique a divisão de contas com algoritmos inteligentes que minimizam transações.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-14">
            <Button size="lg" asChild className="gradient-primary text-white border-0 shadow-2xl hover:shadow-3xl transition-all text-lg px-10 py-7 rounded-2xl group hover:-translate-y-1">
              <Link href="/cadastro" className="flex items-center">
                Começar Agora - É Grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="bg-white/90 backdrop-blur-xl border-2 border-violet-200 text-violet-600 hover:bg-white hover:border-violet-300 text-lg px-10 py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-base text-gray-700 font-medium">
            <div className="flex items-center group">
              <div className="bg-green-100 p-1.5 rounded-full mr-2.5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              Grátis para sempre
            </div>
            <div className="flex items-center group">
              <div className="bg-green-100 p-1.5 rounded-full mr-2.5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              Sem cartão de crédito
            </div>
            <div className="flex items-center group">
              <div className="bg-green-100 p-1.5 rounded-full mr-2.5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              Configuração em 2 minutos
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { value: '10k+', label: 'Usuários Ativos' },
            { value: 'R$ 2M+', label: 'Divididos' },
            { value: '50k+', label: 'Transações' },
            { value: '4.9★', label: 'Avaliação' }
          ].map((stat, index) => (
            <div key={index} className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 hover:-translate-y-2 card-shine overflow-hidden text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2 whitespace-nowrap">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm font-medium text-gray-600 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center mb-20 animate-fade-in">
          <Badge className="mb-6 px-5 py-2.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border border-violet-200 shadow-lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Recursos
          </Badge>
          <h3 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Por que escolher o Pagaê?
          </h3>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tudo que você precisa para gerenciar despesas compartilhadas de forma simples e eficiente
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="group relative text-center border border-white/40 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-xl card-shine overflow-hidden">
            <CardHeader>
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-violet-400 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative gradient-primary p-4 rounded-2xl w-fit mx-auto">
                  <Users className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">Grupos Inteligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                Crie grupos ilimitados para diferentes ocasiões. Adicione amigos com códigos de convite únicos e gerencie tudo em um só lugar.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group relative text-center border border-white/40 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-xl card-shine overflow-hidden">
            <CardHeader>
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition-opacity"></div>
                <div className="relative gradient-success p-5 rounded-2xl w-fit mx-auto shadow-lg">
                  <Calculator className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Algoritmo Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed text-gray-600">
                Nossa IA minimiza o número de transações necessárias, economizando seu tempo e simplificando acertos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group relative text-center border border-white/40 shadow-xl shadow-fuchsia-500/10 hover:shadow-2xl hover:shadow-fuchsia-500/20 transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-xl card-shine overflow-hidden">
            <CardHeader>
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-fuchsia-400 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition-opacity"></div>
                <div className="relative gradient-accent p-5 rounded-2xl w-fit mx-auto shadow-lg">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">App Nativo (PWA)</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed text-gray-600">
                Instale como app no seu celular. Funciona offline, recebe notificações e está sempre acessível.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group relative text-center border border-white/40 shadow-xl shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-xl card-shine overflow-hidden">
            <CardHeader>
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-amber-400 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition-opacity"></div>
                <div className="relative gradient-warm p-5 rounded-2xl w-fit mx-auto shadow-lg">
                  <TrendingDown className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Menos Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed text-gray-600">
                Reduza até 80% das transferências necessárias com nosso sistema de simplificação automática.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group relative text-center border border-white/40 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-xl card-shine overflow-hidden">
            <CardHeader>
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-5 rounded-2xl w-fit mx-auto shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">100% Seguro</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed text-gray-600">
                Seus dados protegidos com criptografia de ponta. Políticas de privacidade rigorosas e compliance total.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group relative text-center border border-white/40 shadow-xl shadow-pink-500/10 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-xl card-shine overflow-hidden">
            <CardHeader>
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-pink-400 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-pink-500 to-rose-500 p-5 rounded-2xl w-fit mx-auto shadow-lg">
                  <PiggyBank className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Controle Total</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed text-gray-600">
                Visualize gastos, saldos e histórico completo. Tome decisões informadas sobre suas finanças compartilhadas.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-primary"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/10 rounded-full blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h3 className="text-4xl md:text-6xl font-bold mb-8 text-white drop-shadow-lg">
              Pronto para simplificar suas contas?
            </h3>
            <p className="text-xl md:text-2xl mb-12 text-white/95 leading-relaxed font-medium">
              Junte-se a milhares de pessoas que já economizam tempo e dinheiro dividindo despesas de forma inteligente
            </p>
            <Button size="lg" variant="secondary" asChild className="bg-white text-purple-600 hover:bg-gray-50 text-lg px-12 py-7 rounded-2xl shadow-2xl hover:shadow-3xl transition-all group hover:-translate-y-1">
              <Link href="/cadastro" className="flex items-center">
                Criar Conta Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <p className="mt-8 text-white/90 text-base font-medium">
              ✨ Sem compromisso • Cancele quando quiser • Suporte dedicado
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-gray-900 to-gray-950 text-white py-16 z-10 border-t border-gray-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>

        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative gradient-primary p-3 rounded-xl shadow-xl">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Pagaê</span>
            </div>

            <p className="text-gray-400 max-w-lg text-lg leading-relaxed">
              A maneira mais inteligente de dividir despesas compartilhadas. Simples, rápido e totalmente grátis.
            </p>

            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:-translate-y-0.5 inline-block">Sobre</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:-translate-y-0.5 inline-block">Recursos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:-translate-y-0.5 inline-block">Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:-translate-y-0.5 inline-block">Termos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:-translate-y-0.5 inline-block">Suporte</a>
            </div>

            <div className="border-t border-gray-800 w-full max-w-4xl pt-8">
              <p className="text-gray-500 text-sm">
                © 2024 Pagaê. Todos os direitos reservados. Dividindo despesas com inteligência. ✨
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}