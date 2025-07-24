'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type GroupBet = {
  id: number
  description: string
  odd: number
}

export default function AdminGroupPage() {
  const { id: groupName } = useParams() as { id: string }
  const [bets, setBets]       = useState<GroupBet[]>([])
  const [newDesc, setNewDesc] = useState('')
  const [newOdd, setNewOdd]   = useState('')
  // tutaj przechowujemy, które zakłady mają być uznane za wygrane
  const [isWin, setIsWin]     = useState<Record<number, boolean>>({})

  // 1) Pobierz zakłady
  useEffect(() => {
    if (!groupName) return
    supabase
      .from('group_bets')
      .select('id, description, odd')
      .eq('group_name', groupName)
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setBets(data || [])
      })
  }, [groupName])

  // 2) Dodanie nowego zakładu
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

    // odśwież listę
    const { data } = await supabase
      .from('group_bets')
      .select('id, description, odd')
      .eq('group_name', groupName)
      .order('id', { ascending: true })
    setBets(data || [])
    setNewDesc('')
    setNewOdd('')
  }

  // 3) Aktualizacja kursu
  const updateOdd = async (betId: number, odd: number) => {
    if (odd <= 0) return alert('Kurs musi być > 0')
    const { error } = await supabase
      .from('group_bets')
      .update({ odd })
      .eq('id', betId)
    if (error) return alert(error.message)
    setBets(bs => bs.map(b => b.id === betId ? { ...b, odd } : b))
  }

  // 4) Rozliczenie zakładu: usuń wszystkie wagers + sam bet; wypłać tylko, jeśli "Wygrany"
  const settleBet = async (bet: GroupBet) => {
    const win = !!isWin[bet.id]

    // 4.1) Pobierz wszystkie obstawienia
    const { data: wagers = [], error: fetchErr } = await supabase
      .from('group_bet_wagers')
      .select('id, user_id, amount, odd_at_time')
      .eq('group_bet_id', bet.id)

    if (fetchErr) {
      return alert('Błąd przy pobieraniu obstawień: ' + fetchErr.message)
    }

    // 4.2) Dla każdego obstawienia: jeśli wygrany, wypłać; potem usuń
    for (const w of wagers) {
      if (win) {
        const payout = w.amount * w.odd_at_time
        const { error: payErr } = await supabase.rpc('increment_points', {
          user_id: w.user_id,
          diff: payout
        })
        if (payErr) {
          console.error('Błąd wypłaty punktów:', payErr)
        }
      }

      const { error: delErr } = await supabase
        .from('group_bet_wagers')
        .delete()
        .eq('id', w.id)
      if (delErr) {
        console.error('Błąd usuwania obstawienia:', delErr)
      }
    }

    // 4.3) Usuń sam zakład
    const { error: betDelErr } = await supabase
      .from('group_bets')
      .delete()
      .eq('id', bet.id)
    if (betDelErr) {
      return alert('Błąd usuwania zakładu: ' + betDelErr.message)
    }

    // 4.4) Zaktualizuj stan, żeby od razu zniknął
    setBets(bs => bs.filter(b => b.id !== bet.id))

    alert(
      win
        ? `Zakład "${bet.description}" rozliczony jako WYGRANY, wypłacono ${wagers.length} obstawień.`
        : `Zakład "${bet.description}" rozliczony jako PRZEGRANY, usunięto ${wagers.length} obstawień.`
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <section>
        <h1 className="text-2xl mb-4">Zakłady grupy {groupName}</h1>
        {bets.length === 0 ? (
          <p className="text-gray-600">Brak zakładów w tej grupie.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {bets.map(b => (
              <div key={b.id} className="flex items-center space-x-2">
                <span className="flex-1">
                  {b.description} — <strong>Kurs:</strong> {b.odd}
                </span>

                {/* checkbox Wygrany */}
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={!!isWin[b.id]}
                    onChange={e => setIsWin(s => ({ ...s, [b.id]: e.target.checked }))}
                  />
                  <span>Wygrany</span>
                </label>

                <button
                  onClick={() => settleBet(b)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Rozlicz
                </button>

                <input
                  type="number"
                  step="0.01"
                  defaultValue={b.odd}
                  onBlur={e => {
                    const val = parseFloat(e.currentTarget.value)
                    if (!isNaN(val)) updateOdd(b.id, val)
                  }}
                  className="w-20 border p-1"
                />
              </div>
            ))}
          </div>
        )}

        {/* formularz dodawania */}
        <div className="space-y-2">
          <input
            placeholder="Opis zakładu"
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
            Dodaj nowy zakład
          </button>
        </div>
      </section>
    </div>
  )
}
