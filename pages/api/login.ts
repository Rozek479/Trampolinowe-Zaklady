import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { username, password } = req.body as { username: string; password: string }

  // Możesz użyć: username = nazwa lub email, zależnie od bazy
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, password')
    .eq('name', username)
    .single()

  if (error || !user) {
    return res.status(401).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' })
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' })
  }

  // Sukces! Możesz tu ustawić cookie, token JWT lub po prostu zwrócić dane
  return res.status(200).json({ user: { id: user.id, name: user.name } })
}