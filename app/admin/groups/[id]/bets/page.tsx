// app/admin/groups/[id]/bets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Wager = {
  id: number
  user_id: number
  amount: number
  odd_at_time: number
  is_win: boolean | null
}

export default function AdminGroupWagersPage() {
  const { id: groupName } = useParams() as { id: string }
  const [wagers, setWagers] = useState<Wager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marks, setMarks] = useState<Record<number, boolean>>({})

  // Pobierz wszystkie wagers dla grupy (via join na group_bets)
  useEffect(() => {
    async function loadWagers() {
      try {
        const { data, error: gwErr } = await supabase
          .from('group_bet_wagers')
          .select(`
            id,
            user_id,
            amount,
            odd_at_time,
            is_win,
            group_bets!inner(group_name)
          `)
          .eq('group_bets.group_name', groupName)
          .order('created_at', { ascending: false })

        if (gwErr) throw gwErr
        setWagers(data?.map(w => ({
          id: w.id,
          user_id: w.user_id,
          amount: w.amount,
          odd_at_time: w.odd_at_time,
          is_win: w.is_win,
        })) || [])
        setLoading(false)
      } catch (e: any) {
        setError(e.message)
        setLoading(false)
      }
    }
    loadWagers()
  }, [groupName])

  const settleWager = async (wager: Wager) => {
    const win = !!marks[wager.id]

    // 1) Oznacz
    const { error: updErr } = await supabase
      .from('group_bet_wagers')
      .update({ is_win: win })
      .eq('id', wager.id)
    if (updErr) {
      console.error(updErr)
      return alert('Błąd aktualizacji is_win: ' + updErr.message)
    }

    // 2) Wypłać punkty, jeśli wygrana
    if (win) {
      const payout = wager.amount * wager.odd_at_time
      const { error: payErr } = await supabase.rpc('increment_points', {
        user_id: wager.user_id,
        diff: payout
      })
      if (payErr) {
        console.error(payErr)
        alert('Błąd wypłaty punktów: ' + payErr.message)
      }
    }

    // 3) Odśwież
    setWagers(ws =>
      ws.map(w => (w.id === wager.id ? { ...w, is_win: win } : w))
    )
    alert(win ? 'Oznaczono jako WYGRANA' : 'Oznaczono jako PRZEGRANA')
  }

  if (loading) return <p className="p-6">Ładowanie…</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>
  if (wagers.length === 0) {
    return <p className="p-6">Brak obstawień w tej grupie.</p>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold mb-4">
        Obstawienia grupy {groupName}
      </h1>
      {wagers.map(w => (
        <div key={w.id} className="flex items-center justify-between p-4 border rounded">
          <div>
            User #{w.user_id}: {w.amount} pkt @ {w.odd_at_time}
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={!!marks[w.id]}
                onChange={e =>
                  setMarks(m => ({ ...m, [w.id]: e.target.checked }))
                }
              />
              <span>Wygrany</span>
            </label>
            <button
              onClick={() => settleWager(w)}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Zatwierdź
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
