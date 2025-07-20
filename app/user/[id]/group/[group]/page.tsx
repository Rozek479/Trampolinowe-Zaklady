'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function GroupPage() {
  const { id, group } = useParams() as { id: string; group: string }
  const userId = Number(id)
  const router = useRouter()

  const [matches, setMatches] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [amounts, setAmounts] = useState<Record<number, string>>({})
  const [points, setPoints] = useState<number>(0)

  // 1) Ładujemy saldo
  useEffect(() => {
    supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) setPoints(data.points)
      })
  }, [userId])

  // 2) Ładujemy mecze i kursy
  useEffect(() => {
    supabase
      .from('matches')
      .select('id,team_a,team_b,is_finished,result,odds(id,description,odd)')
      .eq('group', group)
      .order('id', { ascending: true })
      .then(({ data }) => {
        setMatches(data || [])
      })
  }, [group])

  const placeBet = async (odd: any) => {
    if (selected === null) return
    const amt = parseInt(amounts[odd.id] || '', 10)
    if (!amt || amt < 1) return alert('Podaj poprawną kwotę')
    if (amt > points) return alert(`Masz tylko ${points} pkt`)

    const { error: be } = await supabase
      .from('bets')
      .insert([{
        user_id: userId,
        match_id: selected,
        odd_id: odd.id,
        amount: amt,
        predicted_value: ''
      }])
    if (be) return alert(be.message)

    await supabase.rpc('increment_points', { user_id: userId, diff: -amt })
    setPoints(points - amt)
    alert(`Postawiono ${amt} pkt`)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      {/* ↩️ przycisk powrotu */}
      <Link
        href={`/user/${userId}`}
        className="text-indigo-600 hover:underline mb-4 block"
      >
        ← Wróć do profilu
      </Link>

      {!selected ? (
        <>
          <h1 className="text-2xl mb-4">Grupa {group}</h1>
          {matches.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`
                w-full text-left p-3 mb-2 border rounded shadow
                ${m.is_finished ? 'bg-red-100' : 'bg-white hover:bg-gray-100'}
              `}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-900">
                  {m.team_a} vs {m.team_b}
                </span>
                {m.is_finished && (
                  <span className="ml-2 font-semibold text-red-600">
                    Zakończony
                    {m.result ? ` (${m.result})` : ''}
                  </span>
                )}
              </div>
            </button>
          ))}
        </>
      ) : (
        <>
          <button
            onClick={() => setSelected(null)}
            className="text-indigo-600 hover:underline mb-4 block"
          >
            ← Wybierz inny mecz
          </button>

          <h2 className="text-xl mb-2">
            Zakłady na {matches.find(m => m.id === selected)?.team_a} vs{' '}
            {matches.find(m => m.id === selected)?.team_b}
          </h2>
          <p className="mb-4 font-medium">Twoje saldo: {points} pkt</p>

          {matches.find(m => m.id === selected)?.is_finished ? (
            // Zakończony: tylko wyświetlamy historie kursów
            <div className="space-y-3">
              {matches.find(m => m.id === selected)?.odds.map((o: any) => (
                <div
                  key={o.id}
                  className="p-4 border rounded bg-red-50 shadow-sm"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-900">{o.description}</span>
                    <span className="font-bold text-gray-900">{o.odd}</span>
                  </div>
                  <div className="text-red-600 font-semibold">
                    Zakłady zamknięte
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Trwający: można obstawiać
            <div className="space-y-4">
              {matches
                .find(m => m.id === selected)!
                .odds.map((o: any) => (
                  <div
                    key={o.id}
                    className="p-4 border rounded bg-white shadow"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-900">{o.description}</span>
                      <span className="font-bold text-gray-900">{o.odd}</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        placeholder="pkt"
                        value={amounts[o.id] || ''}
                        onChange={e =>
                          setAmounts(a => ({ ...a, [o.id]: e.target.value }))
                        }
                        className="w-16 border p-1 mr-2 text-black"
                      />
                      <button
                        onClick={() => placeBet(o)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Obstaw
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
