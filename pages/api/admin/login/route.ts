// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { serialize }          from 'cookie'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ ok: true })
    res.headers.set('Set-Cookie',
      serialize('admin-token', 'allow', {
        httpOnly: true,
        path: '/admin',
        maxAge: 3600,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      })
    )
    return res
  } else {
    return NextResponse.json({ error: 'Nieprawidłowe hasło' }, { status: 401 })
  }
}
