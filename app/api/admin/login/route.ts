// app/api/admin/login/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password === process.env.ADMIN_PASSWORD) {
    cookies().set({
      name: 'admin-token',
      value: 'allow',
      httpOnly: true,
      path: '/admin',
      maxAge: 60 * 60,
      sameSite: 'strict'
    })
    return NextResponse.json({ ok: true })
  } else {
    return NextResponse.json({ error: 'Nieprawidłowe hasło' }, { status: 401 })
  }
}
