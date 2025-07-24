// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { serialize } from 'cookie'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Nieprawidłowe hasło' }, { status: 401 })
    }

    const cookie = serialize('admin-token', 'allow', {
      httpOnly: true,
      path: '/admin',
      maxAge: 3600,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    })

    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
