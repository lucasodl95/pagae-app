'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface GroupDeletedMonitorProps {
  groupId: string
}

export function GroupDeletedMonitor({ groupId }: GroupDeletedMonitorProps) {
  const router = useRouter()
  const supabase = createClient()
  const checkIntervalRef = useRef<NodeJS.Timeout>()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    // Função para verificar se o grupo ainda existe
    const checkGroupExists = async () => {
      if (hasRedirectedRef.current) return

      try {
        const { data, error } = await supabase
          .from('groups')
          .select('id')
          .eq('id', groupId)
          .single()

        // Se o grupo não existe (erro ou data null), redirecionar
        if (error || !data) {
          hasRedirectedRef.current = true

          toast.error('Este grupo foi excluído pelo administrador', {
            description: 'Você será redirecionado para a lista de grupos',
            duration: 3000
          })

          setTimeout(() => {
            router.push('/grupos')
            router.refresh()
          }, 2000)
        }
      } catch (err) {
        console.error('Erro ao verificar grupo:', err)
      }
    }

    // Verificar imediatamente
    checkGroupExists()

    // Verificar a cada 5 segundos
    checkIntervalRef.current = setInterval(checkGroupExists, 5000)

    // Também tentar usar Realtime como fallback
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`
        },
        () => {
          if (!hasRedirectedRef.current) {
            checkGroupExists()
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [groupId, router, supabase])

  return null
}
