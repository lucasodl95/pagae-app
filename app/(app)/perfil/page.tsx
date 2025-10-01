import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutButton } from '@/components/auth/logout-button'
import { EditarPerfilDialog } from '@/components/perfil/editar-perfil-dialog'
import { ArrowLeft, User, Phone, CreditCard, Camera } from 'lucide-react'
import Link from 'next/link'

export default async function PerfilPage() {
  const supabase = createServerClient()
  
  // Verificar autenticação
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Buscar perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Erro ao buscar perfil:', profileError)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/grupos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            
            <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>

            <EditarPerfilDialog
              currentProfile={{
                full_name: profile?.full_name || '',
                phone: profile?.phone,
                pix_key: profile?.pix_key
              }}
              userId={user.id}
            />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Foto e informações básicas */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {profile?.full_name || 'Nome não informado'}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>

            <div className="grid gap-4">
              {/* Nome completo */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Nome Completo</p>
                  <p className="text-sm text-gray-600">
                    {profile?.full_name || 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Telefone */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Telefone</p>
                  <p className="text-sm text-gray-600">
                    {profile?.phone || 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Chave PIX */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Chave PIX</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {profile?.pix_key || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da conta */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>
              Detalhes da sua conta no Pagaê
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <Button variant="outline" size="sm">
                Alterar Email
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">Senha</p>
                <p className="text-sm text-gray-600">••••••••</p>
              </div>
              <Button variant="outline" size="sm">
                Alterar Senha
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">Conta criada em</p>
                <p className="text-sm text-gray-600">
                  {new Date(profile?.created_at || user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Exportar Dados
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              Políticas de Privacidade
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              Termos de Uso
            </Button>
            
            <hr className="my-4" />
            
            <LogoutButton 
              variant="destructive" 
              size="default" 
              fullWidth={true}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}