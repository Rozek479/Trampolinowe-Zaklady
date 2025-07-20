// app/user/[id]/history/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Bet = {
  id: number
  match_id: number | null
  odd_id: number
  amount: number
  is_win: boolean | null
  payout: number
  created_at: string
}
type Match = {
  id: number
  team_a: string
  team_b: string
  result: string | null
}
type Odd = {
  id: number
  description: string
  odd: number
}

export default function HistoryPage() {
  const { id } = useParams()
  const userId = Number(id)
  const router = useRouter()

  const [bets, setBets] = useState<Bet[]>([])
  const [matches, setMatches] = useState<Record<number, Match>>({})
  const [oddsMap, setOddsMap] = useState<Record<number, Odd>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: betsData, error: betsErr } = await supabase
        .from('bets')
        .select('id,match_id,odd_id,amount,is_win,payout,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (betsErr) {
        setError('Błąd pobierania zakładów: ' + betsErr.message)
        setLoading(false)
        return
      }
      setBets(betsData || [])

      // mecze
      const validMatchIds = Array.from(
        new Set(
          (betsData || [])
            .map(b => b.match_id)
            .filter((m): m is number => typeof m === 'number' && !isNaN(m))
        )
      )
      if (validMatchIds.length) {
        const { data: mData, error: mErr } = await supabase
          .from('matches')
          .select('id,team_a,team_b,result')
          .in('id', validMatchIds)
        if (!mErr && mData) {
          const mMap: Record<number, Match> = {}
          mData.forEach(m => { mMap[m.id] = m })
          setMatches(mMap)
        }
      }

      // kursy
      const validOddIds = Array.from(new Set((betsData || []).map(b => b.odd_id)))
      if (validOddIds.length) {
        const oddsRes = await supabase
          .from('odds')
          .select('id,description,odd')
          .in('id', validOddIds)
        if (!oddsRes.error && oddsRes.data) {
          const oMap: Record<number, Odd> = {}
          oddsRes.data.forEach(o => { oMap[o.id] = o })
          setOddsMap(oMap)
        }
      }

      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return <p className="p-6 text-gray-900">Ładowanie historii…</p>
  if (error)   return <p className="p-6 text-red-600">{error}</p>
  if (!bets.length) {
    return (
      <div className="p-6">
        <p className="text-gray-900">Brak zakładów.</p>
        <button
          onClick={() => router.push(`/user/${userId}`)}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          ← Wróć do profilu
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link
        href={`/user/${userId}`}
        className="text-indigo-600 hover:underline mb-4 block text-gray-900"
      >
        ← Wróć do profilu
      </Link>
      <h1 className="text-2xl font-semibold text-white">Historia zakładów</h1>

      {bets.map(b => {
        const m = b.match_id != null ? matches[b.match_id] : null
        const o = oddsMap[b.odd_id]
        const status =
          b.is_win === null
            ? 'Oczekuje rozstrzygnięcia'
            : b.is_win
            ? 'Wygrana'
            : 'Przegrana'

        return (
          <div key={b.id} className="p-4 border rounded bg-white shadow-sm">
            <div className="flex justify-between">
              <span className="text-gray-900">
                {m
                  ? `${m.team_a} vs ${m.team_b}`
                  : '—— vs ——'}
                {m
                  ? m.result
                    ? ` (wynik: ${m.result})`
                    : ' (brak wyniku)'
                  : ''}
              </span>
              <span className="text-sm text-gray-900">
                {new Date(b.created_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-gray-900">
              Zakład: {o?.description ?? '—'} @ {o?.odd ?? '—'}
            </div>
            <div className="text-gray-900">
              Kwota: <strong>{b.amount} pkt</strong>
            </div>
            <div className="text-gray-900">
              Status:{' '}
              <strong
                className={
                  b.is_win === null
                    ? 'text-yellow-600'
                    : b.is_win
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {status}
              </strong>
            </div>
            {b.is_win !== null && (
              <div className="text-gray-900">
                Payout: <strong>{b.payout} pkt</strong>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
