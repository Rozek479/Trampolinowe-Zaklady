// pages/api/settle.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient }           from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { match_id, result, winning_odds } = req.body as {
      match_id: number
      result: string
      winning_odds: number[]
    }

    // 1) Zapisz wynik i zakończ mecz
    const { error: me } = await supabase
      .from('matches')
      .update({ result, is_finished: true, winning_odds })
      .eq('id', match_id)
    if (me) throw me

    // 2) Pobierz wszystkie zakłady na ten mecz
    const { data: bets, error: be } = await supabase
      .from('bets')
      .select('id, user_id, amount, odd_id')
      .eq('match_id', match_id)
    if (be) throw be

    // 3) Dla każdego bet: oblicz payout, zaktualizuj bet i punkty
    for (const b of bets || []) {
      const won = winning_odds.includes(b.odd_id)
      // pobierz odd
      const { data: o, error: oe } = await supabase
        .from('odds')
        .select('odd')
        .eq('id', b.odd_id)
        .single()
      if (oe || !o) continue

      const payout = won ? b.amount * parseFloat(o.odd as any) : 0

      // 3a) aktualizuj bet
      const { error: bu } = await supabase
        .from('bets')
        .update({ is_win: won, payout, status: 'settled' })
        .eq('id', b.id)
      if (bu) console.error('Bet update error', bu)

      // 3b) pobierz obecne punkty usera
      const { data: udata, error: ue } = await supabase
        .from('users')
        .select('points')
        .eq('id', b.user_id)
        .single()
      if (ue || !udata) {
        console.error('User fetch error', ue)
        continue
      }

      const newPoints = udata.points + (won ? payout : -b.amount)

      // 3c) zaktualizuj punkty
      const { error: uu } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', b.user_id)
      if (uu) console.error('User update error', uu)
    }

    return res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    console.error('Settle handler error:', err)
    return res.status(500).json({ error: err.message || 'Unknown error' })
  }
}
