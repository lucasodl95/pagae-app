'use client'

import { useState } from 'react'
import { DespesaCard } from './despesa-card'
import { ExpenseWithDetails } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Calculator, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import Image from 'next/image'

interface ListaDespesasProps {
  expenses: ExpenseWithDetails[]
  currentUserId: string
  isLoading?: boolean
  onRefresh?: () => void
}

export function ListaDespesas({ 
  expenses, 
  currentUserId, 
  isLoading = false,
  onRefresh 
}: ListaDespesasProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true)
      await onRefresh()
      setRefreshing(false)
    }
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma despesa registrada
          </h3>
          <p className="text-gray-600">
            Adicione sua primeira despesa para começar a dividir os custos com o grupo
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Botão de atualizar */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {expenses.length} {expenses.length === 1 ? 'despesa' : 'despesas'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Lista de despesas */}
        {expenses.map((expense) => (
          <DespesaCard
            key={expense.id}
            expense={expense}
            currentUserId={currentUserId}
            onImageClick={handleImageClick}
          />
        ))}
      </div>

      {/* Dialog para visualizar imagem da nota fiscal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage}
                alt="Nota fiscal"
                fill
                className="object-contain"
                onError={() => setSelectedImage(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}