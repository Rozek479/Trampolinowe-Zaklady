'use client'


import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Link from 'next/link'

<Link href="/admin/purchases" className="px-3 py-2 text-gray-700 hover:text-indigo-600">
  Zamówienia
</Link>


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

console.log('SERVICE_ROLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)

export default function AdminPage() {
  const [matches, setMatches] = useState<any[]>([])

useEffect(() => {
  supabase
    .from('matches')
    .select('*')
    .eq('is_finished', false)       // <-- tylko nierozliczone
    .order('id', { ascending: true })
    .then(({ data }) => setMatches(data || []))
}, [])


  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Panel Admina</h1>
      <Link href="/admin/new" className="text-blue-600 mb-4 block">
        + Dodaj nowy mecz
      </Link>
      <ul>
        {matches.map((m) => (
          <li key={m.id} className="mb-2">
            <Link href={`/admin/match/${m.id}`}>
              {m.team_a} vs {m.team_b} (grupa {m.group})
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/admin/purchases" className="text-blue-600 mb-4 block">
  → Zamówienia w sklepie
</Link>

    </div>
  )
}
