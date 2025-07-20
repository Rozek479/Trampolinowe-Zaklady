'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Item = { id: number; name: string; cost: number; description: string }

export default function UserShopPage() {
  const params = useParams()
  const userId = Number(Array.isArray(params.id) ? params.id[0] : params.id)
  const router = useRouter()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('items').select('*')
        if (error) throw error
        setItems(data || [])
      } catch (e: any) {
        console.error('Błąd ładowania sklepu:', e)
        setError('Nie udało się pobrać oferty sklepu.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="p-6">Ładowanie sklepu…</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>
  if (!items.length) return <p className="p-6">Brak ofert w sklepie.</p>

  const handleBuy = async (itemId: number, name: string) => {
    const res = await fetch('/api/shop/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, item_id: itemId }),
    })
    const j = await res.json()
    if (!res.ok) alert('Błąd: ' + j.error)
    else {
      alert(`Kupiono: ${name}`)
      router.refresh()
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href={`/user/${userId}`} className="text-indigo-600 hover:underline mb-4 block">
        ← Wróć do profilu
      </Link>
      <h1 className="text-2xl font-semibold mb-4">Sklep</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className="p-4 border rounded bg-white shadow">
            <h2 className="text-black font-bold">{item.name}</h2>
            <p className="text-black mt-1">{item.description}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-black">{item.cost} pkt</span>
              <button
                onClick={() => handleBuy(item.id, item.name)}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Kup
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
