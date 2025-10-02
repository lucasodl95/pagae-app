import { SignupForm } from '@/components/auth/signup-form'
import Link from 'next/link'
import { DivisionIcon } from '@/components/ui/division-icon'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center w-fit space-x-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative gradient-primary p-3 rounded-2xl shadow-xl">
              <DivisionIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Pagaê</span>
        </Link>
      </header>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <SignupForm />
      </div>
    </div>
  )
}