// pages/api/settle.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { match_id, result, winning_odds } = req.body as {
    match_id: number
    result: string
    winning_odds: number[]    // tutaj odd_id zwycięskich kursów
  }

  try {
    // 1) Zapisz wynik meczu
    const { error: me } = await supabaseAdmin
      .from('matches')
      .update({ result, is_finished: true, winning_odds })
      .eq('id', match_id)
    if (me) throw me

    // 2) Pobierz wszystkie zakłady na ten mecz
    const { data: bets, error: be } = await supabaseAdmin
      .from('bets')
      .select('id, user_id, amount, odd_id, placed_odd')
      .eq('match_id', match_id)
    if (be) throw be

    const errors: string[] = []

    // 3) Rozlicz każdy zakład
    for (const b of bets || []) {
      const won = b.odd_id !== null && winning_odds.includes(b.odd_id)
      const rate = b.placed_odd ?? 1
      // Math.round, bo kolumna users.points jest typu integer,
      // a amount * rate może wyjść niecałkowite (np. 10 * 1.75 = 17.5)
      const payout = won ? Math.round(b.amount * rate) : 0

      // 3a) oznacz zakład jako rozliczony
      const { error: betUpdateErr } = await supabaseAdmin
        .from('bets')
        .update({ is_win: won, payout, status: 'settled' })
        .eq('id', b.id)

      if (betUpdateErr) {
        console.error('Błąd aktualizacji zakładu', b.id, betUpdateErr)
        errors.push(`bet ${b.id}: ${betUpdateErr.message}`)
        continue
      }

      // 3b) zaktualizuj punkty użytkownika (tylko przy wygranej -
      // przy przegranej nie ruszamy punktów, stawka zdjęta przy obstawianiu)
      if (won && b.user_id !== null) {
        const { data: u, error: userSelectErr } = await supabaseAdmin
          .from('users')
          .select('points')
          .eq('id', b.user_id)
          .single()

        if (userSelectErr || !u) {
          console.error('Błąd pobierania usera', b.user_id, userSelectErr)
          errors.push(`user ${b.user_id} select: ${userSelectErr?.message}`)
          continue
        }

        const newPoints = u.points + payout
        const { error: userUpdateErr } = await supabaseAdmin
          .from('users')
          .update({ points: newPoints })
          .eq('id', b.user_id)

        if (userUpdateErr) {
          console.error('Błąd aktualizacji punktów', b.user_id, userUpdateErr)
          errors.push(`user ${b.user_id} update: ${userUpdateErr.message}`)
        }
      }
    }

    if (errors.length > 0) {
      // Rozliczenie się wykonało, ale część operacji się nie powiodła -
      // zwracamy 200, ale z listą błędów, żeby było widać w konsoli przeglądarki
      return res.status(200).json({ status: 'partial', errors })
    }

    return res.status(200).json({ status: 'ok' })
  } catch (error: any) {
    console.error('Settle error:', error)
    return res.status(500).json({ error: error.message })
  }
}