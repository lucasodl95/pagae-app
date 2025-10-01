'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Lock, User, Loader2, AlertCircle, CreditCard } from 'lucide-react'
import Link from 'next/link'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  pixKey: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      pixKey: ''
    }
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Criar perfil na tabela profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: data.fullName,
            pix_key: data.pixKey || null
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          // Não bloqueia o cadastro se houver erro no perfil
        }

        router.push('/grupos')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      setError(error.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo and Title */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur opacity-75"></div>
            <div className="relative gradient-primary p-4 rounded-2xl">
              <User className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Criar sua conta
        </h1>
        <p className="text-gray-600">Comece a dividir despesas de forma inteligente</p>
      </div>

      {/* Form Card */}
      <Card className="border-2 border-white/20 shadow-2xl bg-white/80 backdrop-blur-sm animate-scale-in">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Nome Completo</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                      <Input
                        placeholder="Seu nome completo"
                        className="pl-11 h-12 border-2 focus:border-violet-500 rounded-xl transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                      <Input
                        placeholder="seu@email.com"
                        className="pl-11 h-12 border-2 focus:border-violet-500 rounded-xl transition-all"
                        type="email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Senha</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                      <Input
                        placeholder="Mínimo 6 caracteres"
                        className="pl-11 h-12 border-2 focus:border-violet-500 rounded-xl transition-all"
                        type="password"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Confirmar Senha</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                      <Input
                        placeholder="Digite a senha novamente"
                        className="pl-11 h-12 border-2 focus:border-violet-500 rounded-xl transition-all"
                        type="password"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pixKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Chave PIX <span className="text-xs text-gray-500">(Opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                      <Input
                        placeholder="CPF, e-mail, telefone ou chave aleatória"
                        className="pl-11 h-12 border-2 focus:border-violet-500 rounded-xl transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Sua chave PIX será usada para receber pagamentos de despesas compartilhadas
                  </p>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl animate-slide-up">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all text-base font-semibold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando sua conta...
                </>
              ) : (
                'Criar Conta Grátis'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="text-violet-600 hover:text-violet-700 font-semibold hover:underline transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Ou</span>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
          >
            ← Voltar para página inicial
          </Link>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}