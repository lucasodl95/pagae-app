'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'ghost' | 'destructive' | 'default' | 'outline'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  fullWidth?: boolean
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'sm', 
  className = '',
  fullWidth = false 
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erro no logout:', error)
      }
      
      // Redirecionar para home
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 mr-2" />
      )}
      {variant === 'destructive' ? 'Sair da Conta' : 'Sair'}
    </Button>
  )
}