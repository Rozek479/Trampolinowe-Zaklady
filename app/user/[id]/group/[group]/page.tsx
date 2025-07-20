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
  const [amounts, setAmounts] = useState<Record<number,string>>({})
  const [points, setPoints] = useState<number>(0)

  // 1) saldo
  useEffect(() => {
    supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single()
      .then(({ data }) => data && setPoints(data.points))
  }, [userId])

  // 2) pobieramy mecze + kursy + winning_odds
  useEffect(() => {
    supabase
      .from('matches')
      .select('id,team_a,team_b,is_finished,result,winning_odds, odds(id,description,odd)')
      .eq('group', group)
      .order('id', { ascending: true })
      .then(({ data }) => setMatches(data || []))
  }, [group])

  const placeBet = async (odd: any) => {
    if (selected === null) return
    const amt = parseInt(amounts[odd.id]||'', 10)
    if (!amt || amt < 1) return alert('Podaj poprawną kwotę')
    if (amt > points) return alert(`Masz tylko ${points} pkt`)

    const { error: be } = await supabase
      .from('bets')
      .insert([{ user_id: userId, match_id: selected, odd_id: odd.id, amount: amt, predicted_value: '' }])
    if (be) return alert(be.message)

    await supabase.rpc('increment_points', { user_id: userId, diff: -amt })
    setPoints(points - amt)
    alert(`Postawiono ${amt} pkt`)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Link
        href={`/user/${userId}`}
        className="text-indigo-600 hover:underline mb-4 block"
      >
        ← Wróć do profilu
      </Link>

      {!selected ? (
        <>
          <h1 className="text-2xl mb-4 text-white">Grupa {group}</h1>
          {matches.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`
                w-full text-left p-3 mb-2 border rounded shadow
                ${m.is_finished
                  ? 'bg-red-100 hover:bg-red-100'
                  : 'bg-white hover:bg-gray-100'}
              `}
            >
              <span className="text-black">
                {m.team_a} vs {m.team_b}
              </span>
              {m.is_finished && (
                <span className="ml-2 font-semibold text-red-600">
                  Zakończony
                </span>
              )}
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

          <h2 className="text-xl mb-2 text-white">
            Kursy: {matches.find(m=>m.id===selected)?.team_a} vs {matches.find(m=>m.id===selected)?.team_b}
          </h2>
          <p className="mb-4 text-white font-medium">Saldo: {points} pkt</p>

          {matches.find(m=>m.id===selected)?.is_finished ? (
            // zakończony: pokazujemy wynik kursów
            <div className="space-y-3">
              {matches.find(m=>m.id===selected)?.odds.map((o:any) => {
                const wonSet: number[] = matches.find(m=>m.id===selected)?.winning_odds || []
                const won = wonSet.includes(o.id)
                return (
                  <div
                    key={o.id}
                    className="p-4 border rounded bg-red-50 shadow-sm flex justify-between"
                  >
                    <span className="text-black">{o.description} — {o.odd}</span>
                    <span className={won ? 'text-green-600' : 'text-red-600'}>
                      {won ? 'Wygrany' : 'Przegrany'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            // trwa: obstawianie
            <div className="space-y-4">
              {matches.find(m=>m.id===selected)?.odds.map((o:any) => (
                <div key={o.id} className="p-4 border rounded bg-white shadow">
                  <div className="flex justify-between mb-2">
                    <span className="text-black">{o.description}</span>
                    <span className="font-bold text-black">{o.odd}</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      placeholder="pkt"
                      value={amounts[o.id]||''}
                      onChange={e=>setAmounts(a=>({...a,[o.id]:e.target.value}))}
                      className="w-16 border p-1 mr-2 text-black"
                    />
                    <button
                      onClick={()=>placeBet(o)}
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
