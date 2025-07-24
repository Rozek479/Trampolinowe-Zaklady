'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Item = {
  id: number
  name: string
  cost: number
  description: string
}

export default function UserShopPage() {
  const params = useParams()
  const userId = Number(Array.isArray(params.id) ? params.id[0] : params.id)
  const router = useRouter()

  const [items, setItems] = useState<Item[]>([])
  const [points, setPoints] = useState<number>(0)
  const [loanAmount, setLoanAmount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Pobierz saldo, loan_amount i ofertę sklepu
  useEffect(() => {
    async function load() {
      try {
        // saldo + loan
        const { data: u, error: ue } = await supabase
          .from('users')
          .select('points, loan_amount')
          .eq('id', userId)
          .single()
        if (ue) throw ue
        setPoints(u?.points ?? 0)
        setLoanAmount(u?.loan_amount ?? 0)

        // przedmioty
        const { data: itemsData, error: ie } = await supabase
          .from('items')
          .select('*')
          .order('id', { ascending: true })
        if (ie) throw ie
        setItems(itemsData || [])
      } catch (e: any) {
        console.error('Błąd ładowania sklepu:', e.message)
        setError('Nie udało się pobrać oferty sklepu lub salda.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  if (loading) return <p className="p-6">Ładowanie sklepu…</p>
  if (error)   return <p className="p-6 text-red-600">{error}</p>
  if (!items.length) return <p className="p-6">Brak ofert w sklepie.</p>

  // Blokada sklepu jeśli jest pożyczka
  if (loanAmount > 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link
          href={`/user/${userId}`}
          className="text-indigo-600 hover:underline mb-4 block"
        >
          ← Wróć do profilu
        </Link>
        <div className="mb-6 text-red-600 font-bold text-lg">
          Najpierw spłać pożyczkę w banku, żeby móc kupować w sklepie!
        </div>
      </div>
    )
  }

  const handleBuy = async (itemId: number, cost: number, name: string) => {
    if (cost > points) {
      alert(`Nie masz wystarczająco punktów (masz ${points}, a koszt to ${cost}).`)
      return
    }

    const res = await fetch('/api/shop/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, item_id: itemId })
    })
    const j = await res.json()
    if (!res.ok) {
      alert('Błąd: ' + j.error)
    } else {
      alert(`Kupiono: ${name}`)
      // odśwież saldo i ewentualnie ofertę
      setPoints(points - cost)
      router.refresh()
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        href={`/user/${userId}`}
        className="col-span-full text-indigo-600 hover:underline mb-4 block"
      >
        ← Wróć do profilu
      </Link>

      <div className="col-span-full mb-4 text-lg font-medium">
        Twoje saldo: <strong>{points} pkt</strong>
      </div>

      {items.map(item => {
        const canBuy = item.cost <= points
        return (
          <div key={item.id} className="p-4 border rounded bg-white shadow">
            <h2 className="text-xl font-medium">{item.name}</h2>
            <p className="text-gray-700 mt-1">{item.description}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold">{item.cost} pkt</span>
              <button
                onClick={() => handleBuy(item.id, item.cost, item.name)}
                disabled={!canBuy}
                className={`px-3 py-1 rounded
                  ${canBuy
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
              >
                {canBuy ? 'Kup' : 'Brak punktów'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}