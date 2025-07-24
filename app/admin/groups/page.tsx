'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

const GROUPS = ['A','B','C','D','E','F','G','H']

export default function AdminGroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [members, setMembers] = useState<{ id: number; name: string; points: number }[]>([])
  const [allPlayers, setAllPlayers] = useState<{ id: number; name: string }[]>([])
  const [newPlayerId, setNewPlayerId] = useState<number | ''>('')

  // 1) Ładujemy wszystkich zawodników (do selecta)
  useEffect(() => {
    supabase
      .from('players')
      .select('id, name')
      .then(({ data }) => {
        if (data) setAllPlayers(data)
      })
  }, [])

  // 2) Ładujemy skład dla wybranej grupy
  useEffect(() => {
    if (!selectedGroup) return setMembers([])
    supabase
      .from('group_members')
      .select('player_id, players ( id, name, points )')
      .eq('group_name', selectedGroup)
      .then(({ data, error }) => {
        if (error) {
          console.error('Błąd ładowania członków:', error)
          setMembers([])
        } else {
          setMembers(
            data.map((d: any) => ({
              id: d.player_id,
              name: d.players.name,
              points: d.players.points,
            }))
          )
        }
      })
  }, [selectedGroup])

  const addMember = async () => {
    if (!newPlayerId) return alert('Wybierz zawodnika')
    const { error } = await supabase
      .from('group_members')
      .insert([{ player_id: newPlayerId, group_name: selectedGroup }])
    if (error) {
      alert(`Błąd przy dodawaniu: ${error.message}`)
    } else {
      setNewPlayerId('')
      // odśwież dane
      setSelectedGroup(selectedGroup)
    }
  }

  const removeMember = async (playerId: number) => {
    if (!confirm('Usunąć tego zawodnika z grupy?')) return
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('player_id', playerId)
      .eq('group_name', selectedGroup)
    if (error) {
      alert(`Błąd przy usuwaniu: ${error.message}`)
    } else {
      setMembers(members.filter(m => m.id !== playerId))
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl mb-4">Zarządzanie składami grup</h1>

      <div className="mb-4">
        <label className="font-medium block mb-1">Wybierz grupę:</label>
        <select
          className="border p-2 rounded w-full"
          value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}
        >
          <option value="">— wybierz —</option>
          {GROUPS.map(g => (
            <option key={g} value={g}>
              Grupa {g}
            </option>
          ))}
        </select>
      </div>

      {selectedGroup && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">Zawodnicy w grupie {selectedGroup}</h2>
            {/* Nowy przycisk do zarządzania zakładami grupy */}
            <Link
              href={`/admin/groups/${selectedGroup}`}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Zakłady grupy
            </Link>
          </div>

          <ul className="mb-4">
            {members.length === 0 && (
              <li className="text-gray-600">Brak zawodników w tej grupie</li>
            )}
            {members.map(m => (
              <li key={m.id} className="flex justify-between mb-1">
                <span>{m.name} (punkty: {m.points})</span>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => removeMember(m.id)}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>

          <div className="flex mb-6">
            <select
              className="border p-2 rounded mr-2 flex-1"
              value={newPlayerId}
              onChange={e => setNewPlayerId(Number(e.target.value) || '')}
            >
              <option value="">— dodaj zawodnika —</option>
              {allPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={addMember}
            >
              Dodaj
            </button>
          </div>
        </>
      )}
    </div>
  )
}
