'use client'

import { useState } from 'react'
import { ExpenseWithDetails } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileImage, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface ComprovantesGalleryProps {
  expenses: ExpenseWithDetails[]
}

export function ComprovantesGallery({ expenses }: ComprovantesGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    expense: ExpenseWithDetails
  } | null>(null)

  // Filtrar apenas despesas com comprovantes
  const expensesWithReceipts = expenses.filter(exp => exp.receipt_url)

  if (expensesWithReceipts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileImage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">
            Nenhum comprovante cadastrado ainda
          </p>
          <p className="text-sm text-gray-500">
            Adicione notas fiscais ao criar ou editar despesas
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {expensesWithReceipts.map((expense) => (
          <Card
            key={expense.id}
            className="hover-lift cursor-pointer glass-card border-2 overflow-hidden"
            onClick={() => setSelectedImage({ url: expense.receipt_url!, expense })}
          >
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={expense.receipt_url!}
                alt={expense.description}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            <CardContent className="p-3">
              <p className="font-medium text-sm truncate mb-1">
                {expense.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCurrency(expense.amount)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {expense.category}
                </Badge>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(expense.expense_date).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para visualizar comprovante em tela cheia */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0">
          {selectedImage && (
            <div className="flex flex-col h-full">
              {/* Informações da despesa */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1">
                      {selectedImage.expense.description}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(selectedImage.expense.amount)}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(selectedImage.expense.expense_date).toLocaleDateString('pt-BR')}
                      </span>
                      <Badge variant="secondary">
                        {selectedImage.expense.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Imagem */}
              <div className="relative flex-1 bg-gray-900">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.expense.description}
                  fill
                  className="object-contain"
                  onError={() => setSelectedImage(null)}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
