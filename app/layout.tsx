import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pagaê - Divisão de Despesas',
  description: 'Divida despesas com amigos de forma simples e inteligente',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pagaê'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366F1'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/images/favicon.png" />
        <link rel="apple-touch-icon" href="/images/icone-app.png" />
        <meta name="theme-color" content="#8b5cf6" />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}