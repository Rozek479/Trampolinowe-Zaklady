'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function MatchAdminPage() {
  const { id } = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<any>(null)
  const [odds, setOdds] = useState<any[]>([])
  const [newDesc, setNewDesc] = useState('')
  const [newOdd, setNewOdd] = useState('')
  const [winningOdds, setWinningOdds] = useState<Set<number>>(new Set())
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [description, setDescription] = useState('')
  const [descLoading, setDescLoading] = useState(false)
  // NOWE: stan edycji kursu
  const [editingOddId, setEditingOddId] = useState<number | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editOdd, setEditOdd] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const matchId = Number(id)
      const { data: m } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()
      const { data: o } = await supabase
        .from('odds')
        .select('*')
        .eq('match_id', matchId)
      setMatch(m)
      setOdds(o || [])
      if (m?.result) setResult(m.result)
      if (Array.isArray(m?.winning_odds)) setWinningOdds(new Set(m.winning_odds))
      setDescription(m?.description ?? '')
    })()
  }, [id])

  const addOdd = async () => {
    setError('')
    const matchId = Number(id)
    if (!newDesc || !newOdd) return setError('Podaj opis i kurs')
    const val = parseFloat(newOdd.replace(',', '.'))
    if (isNaN(val) || val <= 0) return setError('Niepoprawny kurs')
    const { error: ie } = await supabase
      .from('odds')
      .insert([{
        match_id: matchId,
        bet_type: 'match',
        description: newDesc,
        odd: val
      }])
    if (ie) return setError(ie.message)
    setNewDesc(''); setNewOdd('')
    const { data: o } = await supabase
      .from('odds')
      .select('*')
      .eq('match_id', matchId)
    setOdds(o || [])
  }

  const toggleWin = (oddId: number) => {
    setWinningOdds(prev => {
      const nxt = new Set(prev)
      nxt.has(oddId) ? nxt.delete(oddId) : nxt.add(oddId)
      return nxt
    })
  }

  const settle = async () => {
    setError('')
    if (!result) return setError('Podaj wynik meczu')
    const matchId = Number(id)
    const res = await fetch('/api/settle', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        match_id: matchId,
        result,
        winning_odds: Array.from(winningOdds),
      }),
    })
    const json = await res.json()
    if (!res.ok) return setError(json.error || 'Błąd rozliczenia')
    router.push('/admin')
  }

  // NOWE: zapisz opis meczu
  const saveDescription = async () => {
    setDescLoading(true)
    const matchId = Number(id)
    const { error } = await supabase
      .from('matches')
      .update({ description })
      .eq('id', matchId)
    setDescLoading(false)
    if (error) setError(error.message)
    else alert('Opis meczu zapisany!')
  }

  // NOWE: zapisz edytowany kurs
  const saveEditedOdd = async () => {
    setEditLoading(true)
    const val = parseFloat(editOdd.replace(',', '.'))
    if (!editDescription || isNaN(val) || val <= 0) {
      setError('Podaj poprawny opis i kurs')
      setEditLoading(false)
      return
    }
    const { error } = await supabase
      .from('odds')
      .update({ description: editDescription, odd: val })
      .eq('id', editingOddId)
    setEditLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setEditingOddId(null)
      setEditDescription('')
      setEditOdd('')
      // odśwież kursy
      const matchId = Number(id)
      const { data: o } = await supabase
        .from('odds')
        .select('*')
        .eq('match_id', matchId)
      setOdds(o || [])
    }
  }

  if (!match) return <p className="p-6 text-gray-900">Ładowanie…</p>

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <Link href="/admin" className="text-indigo-600 hover:underline mb-4 block">
        ← Panel Admina
      </Link>
      <h1 className="text-2xl mb-4 text-gray-900">
        {match.team_a} vs {match.team_b} (grupa {match.group})
      </h1>

      <div className="mb-6">
        <label className="block mb-1 text-gray-900 font-medium">Wynik meczu:</label>
        <input
          className="w-full border p-2 rounded text-black"
          placeholder="np. 9-5"
          value={result}
          onChange={e => setResult(e.target.value)}
        />
      </div>

      {/* NOWE: opis meczu */}
      <div className="mb-6">
        <label className="block mb-1 text-gray-900 font-medium">Opis meczu:</label>
        <textarea
          className="w-full border p-2 rounded text-black"
          rows={3}
          placeholder="Dodaj opis meczu (np. wydarzenia, podsumowanie, ciekawostki)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button
          onClick={saveDescription}
          className="mt-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded"
          disabled={descLoading}
        >
          {descLoading ? 'Zapisywanie...' : 'Zapisz opis'}
        </button>
      </div>

      <section className="mb-8">
        <h2 className="text-xl mb-2 text-gray-900">Kursy meczu</h2>
        {odds.map(o => (
          <div key={o.id} className="flex flex-col space-y-1 mb-3 p-3 border rounded">
            {editingOddId === o.id ? (
              // Formularz edycji kursu
              <div>
                <input
                  className="border p-1 rounded w-full mb-1 text-black"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Opis kursu"
                />
                <input
                  className="border p-1 rounded w-1/2 text-black mb-1"
                  value={editOdd}
                  onChange={e => setEditOdd(e.target.value)}
                  placeholder="Kurs"
                  type="number"
                  step="0.01"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={saveEditedOdd}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    disabled={editLoading}
                  >
                    {editLoading ? 'Zapisywanie...' : 'Zapisz'}
                  </button>
                  <button
                    onClick={() => setEditingOddId(null)}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    Anuluj
                  </button>
                </div>
                {error && <div className="text-red-600 mt-1">{error}</div>}
              </div>
            ) : (
              // Widok kursu + przycisk edycji
              <div className="flex items-center justify-between">
                <span>{o.description} — <span className="font-bold">{o.odd}</span></span>
                <button
                  onClick={() => {
                    setEditingOddId(o.id)
                    setEditDescription(o.description)
                    setEditOdd(String(o.odd))
                  }}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  Edytuj
                </button>
              </div>
            )}
          </div>
        ))}
        <h2 className="text-xl mb-2 text-gray-900">Zaznacz kursy wygrane</h2>
        {odds.map(o => (
          <label key={o.id} className="flex items-center mb-1">
            <input
              type="checkbox"
              checked={winningOdds.has(o.id)}
              onChange={() => toggleWin(o.id)}
              className="mr-2"
            />
            <span className="text-gray-900">{o.description} — {o.odd}</span>
          </label>
        ))}
        {error && <p className="text-red-600 mt-2">{error}</p>}
        <button
          onClick={settle}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Zakończ i rozlicz
        </button>
      </section>

      <hr className="my-6" />

      <section>
        <h2 className="text-xl mb-2 text-gray-900">Dodaj kurs</h2>
        <input
          className="border p-2 mr-2 rounded w-full text-black"
          placeholder="Opis"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
        />
        <input
          className="border p-2 mr-2 rounded w-1/3 text-black"
          placeholder="Kurs"
          value={newOdd}
          onChange={e => setNewOdd(e.target.value)}
        />
        <button
          onClick={addOdd}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Dodaj kurs
        </button>
      </section>
    </div>
  )
}