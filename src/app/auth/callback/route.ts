import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/shift-manager'

  if (code) {
    const cookieStore = {
        getAll() {
            return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => 
                request.cookies.set(name, value)
            )
        },
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookieStore,
      }
    )
    
    // Tukar code dengan session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
        // Jika berhasil login, redirect ke halaman tujuan
        return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal, kembalikan ke halaman login dengan error
  return NextResponse.redirect(`${origin}/admin-auth?error=auth-code-error`)
}