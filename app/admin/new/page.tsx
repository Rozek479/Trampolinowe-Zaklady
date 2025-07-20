'use client'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewMatchPage() {
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [group, setGroup] = useState('A')
  const [error, setError] = useState('')
  const router = useRouter()

  const submit = async () => {
    if (!teamA || !teamB) {
      setError('Podaj obie nazwy postaci')
      return
    }
    const { error: insertError } = await supabase
      .from('matches')
      .insert([{ team_a: teamA, team_b: teamB, group }])
    if (insertError) {
      setError(insertError.message)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-2xl mb-4">Nowy mecz</h1>
      {error && <p className="text-red-600">{error}</p>}
      <input
        placeholder="Postać A"
        value={teamA}
        onChange={(e) => setTeamA(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      />
      <input
        placeholder="Postać B"
        value={teamB}
        onChange={(e) => setTeamB(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      />
      <label>Grupa:</label>
      <select
        value={group}
        onChange={(e) => setGroup(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      >
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <button
        onClick={submit}
        className="w-full p-2 bg-green-600 text-white rounded"
      >
        Utwórz mecz
      </button>
    </div>
  )
}
