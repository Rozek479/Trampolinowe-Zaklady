// pages/api/admin/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { password } = req.body
  if (password === process.env.ADMIN_PASSWORD) {
    // ustawiamy HttpOnly cookie ważne np. 1h
    res.setHeader('Set-Cookie', serialize('admin-token', 'allow', {
      httpOnly: true,
      path: '/admin',
      maxAge: 3600,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    }))
    return res.status(200).json({ ok: true })
  } else {
    return res.status(401).json({ error: 'Nieprawidłowe hasło' })
  }
}
