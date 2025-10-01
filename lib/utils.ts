import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  ShoppingCart,
  Utensils,
  Car,
  Receipt,
  Gamepad2,
  ShoppingBag,
  MoreHorizontal,
  Pizza
} from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Mapa de ícones e cores para categorias
export const CATEGORY_CONFIG = {
  'Mercado': {
    icon: ShoppingCart,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    gradient: 'from-green-500 to-emerald-500'
  },
  'Ifood': {
    icon: Pizza,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    gradient: 'from-red-500 to-rose-500'
  },
  'Restaurante': {
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    gradient: 'from-orange-500 to-amber-500'
  },
  'Transporte': {
    icon: Car,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    gradient: 'from-blue-500 to-cyan-500'
  },
  'Contas': {
    icon: Receipt,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    gradient: 'from-purple-500 to-violet-500'
  },
  'Lazer': {
    icon: Gamepad2,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    gradient: 'from-pink-500 to-fuchsia-500'
  },
  'Compras': {
    icon: ShoppingBag,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    gradient: 'from-indigo-500 to-purple-500'
  },
  'Outros': {
    icon: MoreHorizontal,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    gradient: 'from-gray-500 to-slate-500'
  }
} as const

export type CategoryKey = keyof typeof CATEGORY_CONFIG

export function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category as CategoryKey] || CATEGORY_CONFIG['Outros']
}