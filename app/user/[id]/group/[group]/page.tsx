'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function GroupPage() {
  const { id, group } = useParams() as { id: string; group: string }
  const userId = Number(id)
  const [matches, setMatches] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [amounts, setAmounts] = useState<Record<number, string>>({})
  const [points, setPoints] = useState<number>(0)
  const [players, setPlayers] = useState<any[]>([])

  // 1) saldo użytkownika
  useEffect(() => {
    supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single()
      .then(({ data }) => data && setPoints(data.points))
  }, [userId])

  // 2) mecze z kursami i opisem!
  useEffect(() => {
    supabase
      .from('matches')
      .select('id,team_a,team_b,is_finished,result,description,odds(id,description,odd)')
      .eq('group', group)
      .order('id', { ascending: true })
      .then(({ data }) => setMatches(data || []))
  }, [group])

  // 3) zawodnicy w grupie
  useEffect(() => {
    supabase
      .from('group_members')
      .select('player_id, players(name, points)')
      .eq('group_name', group)
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((m: any) => m.players)
          setPlayers(mapped)
        }
      })
  }, [group])

const placeBet = async (odd: any) => {
  if (selected === null) return
  const amt = parseInt(amounts[odd.id] || '', 10)
  if (!amt || amt < 1) return alert('Podaj poprawną kwotę')
  if (amt > points) return alert(`Masz tylko ${points} pkt`)

  // ZAPISUJ KURS!
  const { error } = await supabase.from('bets')
    .insert([{
      user_id: userId,
      match_id: selected,
      odd_id: odd.id,
      amount: amt,
      predicted_value: '',
      placed_odd: odd.odd // <-- tutaj dodaj kurs!
    }])
  if (error) return alert(error.message)

  await supabase.rpc('increment_points', { user_id: userId, diff: -amt })
  setPoints(points - amt)
  alert(`Postawiono ${amt} pkt`)
}

  return (
    <div className="p-6 max-w-md mx-auto">
      <Link href={`/user/${userId}`} className="text-indigo-600 hover:underline mb-4 block">
        ← Wróć do profilu
      </Link>

      <h1 className="text-2xl mb-4">Grupa {group}</h1>

      {/* nowy przycisk */}
      <div className="mb-6">
        <Link
          href={`/user/${userId}/group/${group}/bets`}
          className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Zakłady grupy →
        </Link>
      </div>

      {/* Lista zawodników */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Zawodnicy:</h2>
        {players.length === 0 ? (
          <p className="text-gray-500">Brak zawodników w tej grupie.</p>
        ) : (
          <ul className="space-y-1">
            {players.map((player, i) => (
              <li key={i} className="flex justify-between border-b py-1">
                <span>{player.name}</span>
                <span className="font-bold">{player.points} pkt</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!selected ? (
        <>
          <h2 className="text-lg mb-4">Wybierz mecz:</h2>
          {matches.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`w-full text-left p-3 mb-2 border rounded shadow
                ${m.is_finished ? 'bg-red-100' : 'bg-white hover:bg-gray-100'}`}
            >
              <div className="flex justify-between">
                <span>{m.team_a} vs {m.team_b}</span>
                {m.is_finished && (
                  <span className="font-semibold text-red-600">
                    Zakończony{m.result ? ` (${m.result})` : ''}
                  </span>
                )}
              </div>
            </button>
          ))}
        </>
      ) : (
        <>
          <button onClick={() => setSelected(null)} className="text-indigo-600 hover:underline mb-4 block">
            ← Wybierz inny mecz
          </button>
          <h2 className="text-xl mb-2">
            Zakłady na {matches.find(m => m.id === selected)?.team_a} vs {matches.find(m => m.id === selected)?.team_b}
          </h2>
          
          {/* Blok z opisem meczu i wynikiem */}
          <div className="mb-4 p-3 bg-gray-50 rounded border">
            {matches.find(m => m.id === selected)?.description && (
              <div className="mb-1 text-gray-900">
                <span className="font-semibold">Opis meczu:</span> {matches.find(m => m.id === selected)?.description}
              </div>
            )}
            {matches.find(m => m.id === selected)?.is_finished && (
              <div className="mb-1 text-green-700 font-bold">
                Wynik: {matches.find(m => m.id === selected)?.result}
              </div>
            )}
          </div>

          <p className="mb-4 font-medium">Twoje saldo: {points} pkt</p>

          {matches.find(m => m.id === selected)?.is_finished ? (
            <div className="space-y-3">
              {matches.find(m => m.id === selected)?.odds.map((o: any) => (
                <div key={o.id} className="p-4 border rounded bg-red-50 shadow-sm">
                  <div className="flex justify-between">
                    <span>{o.description}</span>
                    <span className="font-bold">{o.odd}</span>
                  </div>
                  <div className="text-red-600 font-semibold">Zakłady zamknięte</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {matches.find(m => m.id === selected)!.odds.map((o: any) => (
                <div key={o.id} className="p-4 border rounded bg-white shadow">
                  <div className="flex justify-between mb-2">
                    <span>{o.description}</span>
                    <span className="font-bold">{o.odd}</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      placeholder="pkt"
                      value={amounts[o.id] || ''}
                      onChange={e => setAmounts(a => ({ ...a, [o.id]: e.target.value }))}
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