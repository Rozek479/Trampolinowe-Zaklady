import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { match_id, result, winning_odds } = req.body as {
    match_id: number
    result: string
    winning_odds: number[]
  }

  try {
    // 1) Zapisz wynik i oznacz mecz jako zakończony
    const { error: me } = await supabaseAdmin
      .from('matches')
      .update({ result, is_finished: true, winning_odds })
      .eq('id', match_id)
    if (me) throw me

    // 2) Pobierz zakłady (dodaj pole placed_odd!)
    const { data: bets, error: be } = await supabaseAdmin
      .from('bets')
      .select('id, user_id, amount, odd_id, placed_odd')
      .eq('match_id', match_id)
    if (be) throw be

    // 3) Rozlicz każdy
    for (const b of bets || []) {
      const won = winning_odds.includes(b.odd_id)
      const rate = b.placed_odd !== null && b.placed_odd !== undefined
        ? parseFloat(b.placed_odd)
        : 1 // fallback jeśli pole puste
      const payout = won ? b.amount * rate : 0

      // 3a) zaktualizuj zakład
      await supabaseAdmin
        .from('bets')
        .update({ is_win: won, payout, status: 'settled' })
        .eq('id', b.id)

      // 3b) pobierz punkty i zaktualizuj usera
      const { data: u } = await supabaseAdmin
        .from('users')
        .select('points')
        .eq('id', b.user_id)
        .single()
      if (u) {
        const newPoints = u.points + (won ? payout : -b.amount)
        await supabaseAdmin
          .from('users')
          .update({ points: newPoints })
          .eq('id', b.user_id)
      }
    }

    return res.status(200).json({ status: 'ok' })
  } catch (error: any) {
    console.error('Settle error:', error)
    return res.status(500).json({ error: error.message })
  }
}