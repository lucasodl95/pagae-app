import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  // Fazer logout
  await supabase.auth.signOut()
  
  // Redirecionar para a página inicial
  return NextResponse.redirect(new URL('/', request.url))
}