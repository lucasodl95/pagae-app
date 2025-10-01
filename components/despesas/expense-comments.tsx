'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Comment {
  id: string
  comment: string
  created_at: string
  user_id: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface ExpenseCommentsProps {
  expenseId: string
  currentUserId: string
}

export function ExpenseComments({ expenseId, currentUserId }: ExpenseCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)
  const supabase = createClient()

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_comments')
        .select(`
          id,
          comment,
          created_at,
          user_id,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao carregar comentários:', error)
        return
      }

      setComments((data || []) as any)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [expenseId])

  const handleAddComment = async () => {
    if (!newComment.trim() || loading) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('expense_comments')
        .insert({
          expense_id: expenseId,
          user_id: currentUserId,
          comment: newComment.trim()
        })

      if (error) {
        console.error('Erro ao adicionar comentário:', error)
        toast.error('Ops! Erro ao adicionar comentário')
        return
      }

      setNewComment('')
      toast.success('Comentário adicionado!')
      loadComments()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ops! Erro ao adicionar comentário')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('expense_comments')
        .delete()
        .eq('id', commentId)

      if (error) {
        console.error('Erro ao deletar comentário:', error)
        toast.error('Ops! Erro ao deletar comentário')
        return
      }

      toast.success('Comentário removido!')
      loadComments()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ops! Erro ao deletar comentário')
    }
  }

  return (
    <Card className="glass-card border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de comentários */}
        {loadingComments ? (
          <div className="text-center py-4 text-gray-500">
            Carregando comentários...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Nenhum comentário ainda. Seja o primeiro!
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg bg-white border hover:border-gray-300 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles.avatar_url || ''} />
                  <AvatarFallback>
                    {comment.profiles.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {comment.profiles.full_name}
                        {comment.user_id === currentUserId && (
                          <span className="text-xs text-gray-500 ml-1">(você)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                    {comment.user_id === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campo para novo comentário */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAddComment()
              }
            }}
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || loading}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Pressione Enter para enviar ou Shift+Enter para quebra de linha
        </p>
      </CardContent>
    </Card>
  )
}
