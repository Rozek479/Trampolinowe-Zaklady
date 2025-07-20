'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function HomePage() {
  const [users, setUsers] = useState<{ id: number; name: string; points: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('users')
      .select('id, name, points')
      .then(({ data }) => {
        setUsers(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="p-6">Ładowanie użytkowników...</p>

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Witaj! Wybierz użytkownika:</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id} className="mb-2">
            <Link href={`/user/${u.id}`} className="block p-3 border rounded hover:bg-gray-100">
              {u.name} — saldo: {u.points} pkt
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
