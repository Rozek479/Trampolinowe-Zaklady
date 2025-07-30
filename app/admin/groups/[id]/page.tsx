// app/admin/groups/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type GroupBet = {
  id: number
  description: string
  odd: number
}

type Wager = {
  id: number
  user_id: number
  amount: number
  odd_at_time: number
  is_win: boolean | null
}

export default function AdminGroupPage() {
  const { id: groupName } = useParams() as { id: string }

  const [bets, setBets] = useState<GroupBet[]>([])
  const [wagersMap, setWagersMap] = useState<Record<number, Wager[]>>({})
  const [newDesc, setNewDesc] = useState('')
  const [newOdd, setNewOdd] = useState('')
  const [marks, setMarks] = useState<Record<number, boolean>>({})

  // 1) Pobierz aktywne zakłady grupowe
  useEffect(() => {
    if (!groupName) return
    supabase
      .from('group_bets')
      .select('id,description,odd')
      .eq('group_name', groupName)
      .eq('closed', false)
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setBets(data || [])
      })
  }, [groupName])

  // 2) Dla każdego bet pobierz jego wagers
  useEffect(() => {
    if (!bets.length) return
    ;(async () => {
      const map: Record<number, Wager[]> = {}
      for (const b of bets) {
        const { data, error } = await supabase
          .from('group_bet_wagers')
          .select('id,user_id,amount,odd_at_time,is_win')
          .eq('group_bet_id', b.id)    // gwarantuje, że bet.id jest liczbą
          .order('created_at', { ascending: false })
        if (error) console.error(error)
        map[b.id] = data || []
      }
      setWagersMap(map)
    })()
  }, [bets])

  // 3) Dodanie nowego zakładu
  const addBet = async () => {
    if (!newDesc.trim() || !newOdd) {
      return alert('Podaj opis i kurs zakładu')
    }
    const oddValue = parseFloat(newOdd)
    if (isNaN(oddValue) || oddValue <= 0) {
      return alert('Kurs musi być liczbą większą od 0')
    }

    const { error } = await supabase
      .from('group_bets')
      .insert([{ group_name: groupName, description: newDesc, odd: oddValue }])
    if (error) return alert(error.message)

    setNewDesc('')
    setNewOdd('')
    // odśwież listę zakładów
    const { data } = await supabase
      .from('group_bets')
      .select('id,description,odd')
      .eq('group_name', groupName)
      .eq('closed', false)
      .order('id', { ascending: true })
    setBets(data || [])
  }

  // 4) Aktualizacja kursu
  const updateOdd = async (betId: number, odd: number) => {
    if (odd <= 0) return alert('Kurs musi być > 0')
    const { error } = await supabase
      .from('group_bets')
      .update({ odd })
      .eq('id', betId)
    if (error) return alert(error.message)
    setBets(bs => bs.map(b => (b.id === betId ? { ...b, odd } : b)))
  }

  // 5) Rozliczenie zakładu
  const settleBet = async (bet: GroupBet) => {
    const win = !!marks[bet.id]
    const wagers = wagersMap[bet.id] || []

    // 5.1) Oznacz każdy wager i wypłać punkty zwycięzcom
    for (const w of wagers) {
      // oznacz wynik
      await supabase
        .from('group_bet_wagers')
        .update({ is_win: win })
        .eq('id', w.id)

      // wypłata, jeśli win
      if (win) {
        const payout = w.amount * w.odd_at_time
        await supabase.rpc('increment_points', {
          user_id: w.user_id,
          diff: payout
        })
      }
    }

    // 5.2) Oznacz zakład jako zamknięty
    await supabase
      .from('group_bets')
      .update({ closed: true })
      .eq('id', bet.id)

    // 5.3) Odśwież UI
    setBets(bs => bs.filter(b => b.id !== bet.id))
    setMarks(m => {
      const next = { ...m }
      delete next[bet.id]
      return next
    })
    const nextMap = { ...wagersMap }
    delete nextMap[bet.id]
    setWagersMap(nextMap)

    alert(win ? 'Zakład rozliczony jako WYGRANY' : 'Zakład rozliczony jako PRZEGRANA')
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold mb-4">
        Zakłady grupy {groupName} (admin)
      </h1>

      {bets.length === 0 ? (
        <p className="text-gray-600">Brak aktywnych zakładów.</p>
      ) : (
        bets.map(bet => (
          <div key={bet.id} className="p-4 border rounded space-y-2">
            <div className="flex items-center space-x-4">
              <span className="flex-1">
                {bet.description} — kurs <strong>{bet.odd}</strong>
              </span>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={!!marks[bet.id]}
                  onChange={e =>
                    setMarks(m => ({ ...m, [bet.id]: e.target.checked }))
                  }
                />
                <span>Wygrany</span>
              </label>
              <button
                onClick={() => settleBet(bet)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Rozlicz
              </button>
              <input
                type="number"
                step="0.01"
                defaultValue={bet.odd}
                onBlur={e => {
                  const val = parseFloat(e.currentTarget.value)
                  if (!isNaN(val)) updateOdd(bet.id, val)
                }}
                className="w-24 border p-1 rounded"
              />
            </div>

            {wagersMap[bet.id] && (
              <ul className="pl-4 list-disc text-sm text-gray-700">
                {wagersMap[bet.id].map(w => (
                  <li key={w.id}>
                    User #{w.user_id}: {w.amount} pkt @ {w.odd_at_time} —{' '}
                    {w.is_win == null
                      ? 'Oczekuje'
                      : w.is_win
                      ? 'Wygrana'
                      : 'Przegrana'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}

      {/* Dodawanie nowego zakładu */}
      <div className="pt-6 border-t space-y-2">
        <h2 className="text-lg">Nowy zakład</h2>
        <input
          placeholder="Opis"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Kurs"
          value={newOdd}
          onChange={e => setNewOdd(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={addBet}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Dodaj zakład
        </button>
      </div>
    </div>
  )
}
