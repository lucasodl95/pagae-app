import { LoginForm } from '@/components/auth/login-form'
import { Calculator } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center space-x-2 w-fit">
          <Calculator className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Pagaê</h1>
        </Link>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <LoginForm />
      </div>
    </div>
  )
}