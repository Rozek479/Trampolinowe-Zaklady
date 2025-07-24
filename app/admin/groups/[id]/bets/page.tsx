'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type GroupBet = { id: number, description: string, odd: number }

export default function AdminGroupBets() {
  const { id: group } = useParams() as { id: string }
  const [bets, setBets] = useState<GroupBet[]>([])
  const [desc, setDesc] = useState('')
  const [odd, setOdd] = useState('')

  useEffect(() => {
    fetch(`/api/group_bets?group_name=${group}`)
      .then(r => r.json())
      .then(setBets)
  }, [group])

  const create = async () => {
    await fetch('/api/group_bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_name: group, description: desc, odd: parseFloat(odd) })
    })
    setDesc(''); setOdd('')
    // odśwież
    const data = await fetch(`/api/group_bets?group_name=${group}`).then(r => r.json())
    setBets(data)
  }

  const updateOdd = async (id: number, newOdd: number) => {
    await fetch('/api/group_bets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, odd: newOdd })
    })
    setBets(b => b.map(x => x.id === id ? { ...x, odd: newOdd } : x))
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl mb-4">Zakłady grupy {group} (admin)</h1>

      <div className="mb-6">
        <input
          className="border p-2 mr-2"
          placeholder="Opis zakładu"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          className="border p-2 mr-2 w-24"
          placeholder="Kurs"
          value={odd}
          onChange={e => setOdd(e.target.value)}
        />
        <button onClick={create} className="bg-green-600 text-white px-4 py-2 rounded">
          Dodaj
        </button>
      </div>

      <ul className="space-y-4">
        {bets.map(b => (
          <li key={b.id} className="flex justify-between items-center">
            <span>{b.description}</span>
            <input
              type="number"
              step="0.01"
              className="border p-1 w-20"
              defaultValue={b.odd}
              onBlur={e => updateOdd(b.id, parseFloat(e.currentTarget.value))}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
