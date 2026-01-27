import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/shift-manager'

  const type = searchParams.get('type') 

  if (code) {
    const cookieStore = request.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const targetUrl = type === 'recovery' ? '/update-password' : next
      
      const response = NextResponse.redirect(`${origin}${targetUrl}`)

      const sessionCookies = request.cookies.getAll()
      sessionCookies.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value)
      })

      return response
    } else {
        return new NextResponse(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #e11d48;">Link Tidak Valid / Kadaluarsa</h1>
              <p>Error: ${error.message}</p>
              <p>Silakan request reset password baru.</p>
              <a href="/admin-auth" style="background: #0B4650; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Kembali ke Login</a>
            </body>
          </html>
        `, { status: 400, headers: { 'Content-Type': 'text/html' } })
    }
  }

  return NextResponse.redirect(`${origin}/admin-auth?error=no_code`)
}