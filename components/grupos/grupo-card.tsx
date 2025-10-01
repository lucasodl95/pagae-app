'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GroupWithMembers } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface GrupoCardProps {
  group: GroupWithMembers
  totalExpenses?: number
  userBalance?: number
}

export function GrupoCard({ group, totalExpenses = 0, userBalance = 0 }: GrupoCardProps) {
  const memberCount = group.group_members.length
  const balanceColor = userBalance > 0 ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : 'text-gray-600'

  return (
    <Link href={`/grupos/${group.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={group.image_url || ''} />
                <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                  {group.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                {group.description && (
                  <CardDescription className="mt-1">
                    {group.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {group.invite_code}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Estatísticas do grupo */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-600">
                <Users className="h-4 w-4" />
                <span>{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(group.created_at), 'MMM yyyy', { locale: ptBR })}</span>
              </div>
            </div>
          </div>

          {/* Saldo do usuário */}
          {userBalance !== 0 && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">Seu saldo:</span>
              <span className={`font-medium ${balanceColor}`}>
                {userBalance > 0 ? '+' : ''}{formatCurrency(userBalance)}
              </span>
            </div>
          )}

          {/* Total de gastos */}
          {totalExpenses > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total de gastos:</span>
              <span className="font-medium">{formatCurrency(totalExpenses)}</span>
            </div>
          )}

          {/* Membros (avatares) */}
          <div className="flex items-center space-x-1 pt-2">
            <span className="text-xs text-gray-600 mr-2">Membros:</span>
            <div className="flex -space-x-2">
              {group.group_members.slice(0, 4).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={member.profiles.avatar_url || ''} />
                  <AvatarFallback className="text-xs bg-gray-100">
                    {member.profiles.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {memberCount > 4 && (
                <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{memberCount - 4}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}