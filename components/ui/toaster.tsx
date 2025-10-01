'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          color: 'hsl(222.2 84% 4.9%)',
          border: '1px solid hsl(220 13% 91%)',
        },
        className: 'glass-card',
      }}
      richColors
    />
  )
}
