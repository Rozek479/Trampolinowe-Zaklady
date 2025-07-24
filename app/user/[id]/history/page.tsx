'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type RegularBet = {
  id: number
  match_id: number | null
  odd_id: number
  amount: number
  is_win: boolean | null
  payout: number
  created_at: string
  placed_odd: number | null // <-- dodane!
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

type GroupWager = {
  type: 'group'
  id: number
  group_bet_id: number
  description: string
  odd_at_time: number
  amount: number
  is_win: boolean | null
  payout: number
  created_at: string
}

export default function HistoryPage() {
  const { id } = useParams()
  const userId = Number(id)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Regular bets + group wagers combined
  const [historyItems, setHistoryItems] = useState<
    (RegularBet & { type: 'regular' } | GroupWager)[]
  >([])

  const [matches, setMatches] = useState<Record<number, Match>>({})
  const [oddsMap, setOddsMap] = useState<Record<number, Odd>>({})

  useEffect(() => {
    async function load() {
      try {
        // 1) Pobierz zwykłe zakłady, teraz z placed_odd!
        const { data: betsData = [], error: betsErr } = await supabase
          .from('bets')
          .select('id,match_id,odd_id,amount,is_win,payout,created_at,placed_odd')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (betsErr) throw betsErr

        const regularBets = betsData.map(b => ({
          ...b,
          type: 'regular' as const,
        }))

        // 2) Pobierz zakłady grupowe z is_win!
        const { data: gwData = [], error: gwErr } = await supabase
          .from('group_bet_wagers')
          .select(`
            id,
            group_bet_id,
            amount,
            odd_at_time,
            is_win,
            created_at,
            group_bets ( description )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (gwErr) throw gwErr

        const groupWagers: GroupWager[] = gwData.map(w => ({
          type: 'group',
          id: w.id,
          group_bet_id: w.group_bet_id,
          description: w.group_bets?.description ?? '—',
          odd_at_time: w.odd_at_time,
          amount: w.amount,
          is_win: w.is_win,
          payout:
            w.is_win === true
              ? Math.round(w.amount * w.odd_at_time * 100) / 100
              : w.is_win === false
              ? 0
              : -1, // -1 oznacza oczekuje rozstrzygnięcia
          created_at: w.created_at,
        }))

        // 3) Połącz i posortuj po created_at desc
        const combined = [...regularBets, ...groupWagers].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setHistoryItems(combined)

        // 4) Pobierz mecze dla regularnych
        const matchIds = Array.from(
          new Set(
            regularBets
              .map(b => b.match_id)
              .filter((m): m is number => m !== null)
          )
        )
        if (matchIds.length) {
          const { data: mData, error: mErr } = await supabase
            .from('matches')
            .select('id,team_a,team_b,result')
            .in('id', matchIds)
          if (!mErr && mData) {
            const mMap: Record<number, Match> = {}
            mData.forEach(m => {
              mMap[m.id] = m
            })
            setMatches(mMap)
          }
        }

        // 5) Pobierz kursy dla regularnych (tylko do opisu)
        const oddIds = Array.from(new Set(regularBets.map(b => b.odd_id)))
        if (oddIds.length) {
          const { data: oData, error: oErr } = await supabase
            .from('odds')
            .select('id,description,odd')
            .in('id', oddIds)
          if (!oErr && oData) {
            const oMap: Record<number, Odd> = {}
            oData.forEach(o => {
              oMap[o.id] = o
            })
            setOddsMap(oMap)
          }
        }

        setLoading(false)
      } catch (e: any) {
        setError(e.message)
        setLoading(false)
      }
    }
    load()
  }, [userId])

  if (loading) return <p className="p-6 text-gray-900">Ładowanie historii…</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>
  if (!historyItems.length) {
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
      <h1 className="text-2xl font-semibold text-black">Historia zakładów</h1>

      {historyItems.map(item => {
        if (item.type === 'regular') {
          const b = item as RegularBet & { type: 'regular' }
          const m = b.match_id != null ? matches[b.match_id] : null
          const o = oddsMap[b.odd_id]
          const status =
            b.is_win === null
              ? 'Oczekuje rozstrzygnięcia'
              : b.is_win
              ? 'Wygrana'
              : 'Przegrana'

          return (
            <div key={`r${b.id}`} className="p-4 border rounded bg-white shadow-sm">
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
                Zakład: {o?.description ?? '—'} @{' '}
                <span className="font-bold">
                  {b.placed_odd !== null && b.placed_odd !== undefined
                    ? b.placed_odd
                    : o?.odd ?? '—'}
                </span>
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
        } else {
          const w = item as GroupWager
          let status: string, payoutStr: string, color: string
          if (w.is_win === null) {
            status = 'Oczekuje rozstrzygnięcia'
            payoutStr = '---'
            color = 'text-yellow-600'
          } else if (w.is_win) {
            status = 'Wygrany'
            payoutStr = `${w.payout} pkt`
            color = 'text-green-600'
          } else {
            status = 'Przegrany'
            payoutStr = '0 pkt'
            color = 'text-red-600'
          }

          return (
            <div key={`g${w.id}`} className="p-4 border rounded bg-white shadow-sm">
              <div className="flex justify-between">
                <span className="text-gray-900">
                  Zakład grupowy: {w.description}
                </span>
                <span className="text-sm text-gray-900">
                  {new Date(w.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-gray-900">
                Kurs: <span className="font-bold">{w.odd_at_time}</span>
              </div>
              <div className="text-gray-900">
                Kwota: <strong>{w.amount} pkt</strong>
              </div>
              <div className="text-gray-900">
                Status: <strong className={color}>{status}</strong>
              </div>
              <div className="text-gray-900">
                Payout: <strong>{payoutStr}</strong>
              </div>
            </div>
          )
        }
      })}
    </div>
  )
}