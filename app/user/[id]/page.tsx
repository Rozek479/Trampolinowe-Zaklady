// app/user/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'

export default function UserDashboard() {
  const params = useParams()
  const userId = Array.isArray(params.id) ? params.id[0] : params.id!
  const router = useRouter()

  const [user, setUser] = useState<{ name: string; points: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('users')
      .select('name, points')
      .eq('id', parseInt(userId, 10))
      .single()
      .then(({ data, error }) => {
        if (error || !data) router.push('/')
        else {
          setUser(data)
          setLoading(false)
        }
      })
  }, [userId, router])

  if (loading) return <p className="p-6">Ładowanie profilu...</p>
  if (!user) return <p className="p-6 text-red-600">Użytkownik nie znaleziony</p>

  const groups = ['A','B','C','D','E','F','G','H']

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl mb-2">Cześć, {user.name}!</h1>
      <p className="mb-4">Twoje saldo: {user.points} pkt</p>

      <div className="flex justify-between mb-4">
        <Link
          href={`/user/${userId}/shop`}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Sklep
        </Link>
        <Link
          href={`/user/${userId}/history`}
          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Historia
        </Link>
      </div>

      <h2 className="text-xl mb-2">Grupy</h2>
      <ul className="grid grid-cols-4 gap-2">
        {groups.map((g) => (
          <li key={g}>
            <Link
              href={`/user/${userId}/group/${g}`}
              className="block p-3 border rounded text-center hover:bg-gray-100"
            >
              Grupa {g}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
