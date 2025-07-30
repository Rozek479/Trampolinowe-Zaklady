// app/user/[id]/group/[group]/bets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type GroupBet = {
  id: number
  description: string
  odd: number
  closed: boolean        // <--- dodane
}

export default function GroupBetsPage() {
  const { id, group } = useParams() as { id: string; group: string }
  const userId = Number(id)
  const [bets, setBets] = useState<GroupBet[]>([])
  const [myBets, setMyBets] = useState<Record<number, number>>({})
  const [points, setPoints] = useState(0)

  // 1) Pobierz saldo
  useEffect(() => {
    supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (data) setPoints(data.points)
      })
  }, [userId])

  // 2) Pobierz dostępne zakłady grupowe
  useEffect(() => {
    fetch(`/api/group_bets?group_name=${encodeURIComponent(group)}`)
      .then(res => res.json())
      .then((data: GroupBet[]) => setBets(data))
  }, [group])

  // 3) Funkcja postawienia zakładu
  const place = async (gb: GroupBet) => {
    if (gb.closed) return

    const amt = myBets[gb.id] || 0
    if (amt < 1) return alert('Podaj poprawną kwotę (>= 1)')
    if (amt > points) return alert(`Masz tylko ${points} pkt`)

    const { error: insErr } = await supabase
      .from('group_bet_wagers')
      .insert([{ user_id: userId, group_bet_id: gb.id, amount: amt, odd_at_time: gb.odd }])
    if (insErr) return alert('Błąd dodawania zakładu: ' + insErr.message)

    await supabase.rpc('increment_points', { user_id: userId, diff: -amt })
    setPoints(p => p - amt)
    alert(`Postawiono ${amt} pkt`)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Link href={`/user/${userId}/group/${group}`} className="text-indigo-600 hover:underline mb-4 block">
        ← Wróć do grupy
      </Link>
      <h1 className="text-2xl mb-4">Zakłady grupy {group}</h1>
      <p className="mb-4">Twoje saldo: {points} pkt</p>

      <div className="space-y-4">
        {bets.map(gb => (
          <div key={gb.id} className="p-4 border rounded shadow">
            <div className="flex justify-between mb-2">
              <span>{gb.description}</span>
              <span className="font-bold">{gb.odd}</span>
            </div>

            {gb.closed ? (
              <div className="text-red-600 font-semibold">Grupa zamknięta</div>
            ) : (
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  className="w-16 border p-1 mr-2"
                  placeholder="pkt"
                  onChange={e =>
                    setMyBets(m => ({
                      ...m,
                      [gb.id]: Math.max(0, parseInt(e.target.value, 10) || 0)
                    }))
                  }
                />
                <button
                  onClick={() => place(gb)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Obstaw
                </button>
              </div>
            )}
          </div>
        ))}
        {bets.length === 0 && (
          <p className="text-gray-600">Brak dostępnych zakładów w tej grupie.</p>
        )}
      </div>
    </div>
  )
}
