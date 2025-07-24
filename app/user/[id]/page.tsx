'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'

type User = { name: string; points: number }

export default function UserDashboard() {
  const params = useParams()
  const userId = Array.isArray(params.id) ? params.id[0] : params.id!
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const groups = ['A','B','C','D','E','F','G','H']

  // 1) Ładujemy dane użytkownika
  useEffect(() => {
    supabase
      .from('users')
      .select('name, points')
      .eq('id', parseInt(userId, 10))
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          router.push('/')
        } else {
          setUser(data)
          setLoading(false)
        }
      })
  }, [userId, router])

  if (loading) return <p className="p-6">Ładowanie profilu...</p>
  if (!user)  return <p className="p-6 text-red-600">Użytkownik nie znaleziony</p>

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl mb-2">Cześć, {user.name}!</h1>
      <p className="mb-4">Twoje saldo: {user.points} pkt</p>

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

      <h2 className="text-xl mb-2">Twoje grupy</h2>
      <div className="grid grid-cols-4 gap-2">
        {groups.map((g) => (
          <Link
            key={g}
            href={`/user/${userId}/group/${g}`}
            className="text-center py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {g}
          </Link>
        ))}
      </div>
    </div>
  )
}
