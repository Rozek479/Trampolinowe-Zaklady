// pages/api/admin/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

type Data = { ok?: boolean; error?: string }

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // zawsze JSON
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ error: `Method ${req.method} Not Allowed` })
  }

  const { password } = req.body as { password?: string }
  if (password === process.env.ADMIN_PASSWORD) {
    res.setHeader(
      'Set-Cookie',
      serialize('admin-token', 'allow', {
        httpOnly: true,
        path: '/admin',
        maxAge: 3600,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      })
    )
    return res.status(200).json({ ok: true })
  } else {
    return res.status(401).json({ error: 'Nieprawidłowe hasło' })
  }
}
