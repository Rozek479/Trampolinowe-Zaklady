'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Purchase = {
  id: number
  user_id: number
  item_id: number
  created_at: string
  done: boolean
  user: { name: string }
  item: { name: string; cost: number }
}

export default function PurchasesAdmin() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  // 1) wczytaj zamówienia
  useEffect(() => {
    supabase
      .from('purchases')
      .select('id,created_at,done,user:users(name),item:items(name,cost)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setPurchases(data || [])
        setLoading(false)
      })
  }, [])

  // 2) toggle done w bazie
  const toggleDone = async (id: number, currentlyDone: boolean) => {
    const { error } = await supabase
      .from('purchases')
      .update({ done: !currentlyDone })
      .eq('id', id)
    if (error) {
      alert('Błąd przy aktualizacji: ' + error.message)
    } else {
      setPurchases(p =>
        p.map(x => (x.id === id ? { ...x, done: !currentlyDone } : x))
      )
    }
  }

  if (loading) return <p className="p-6">Ładowanie zamówień…</p>

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl mb-4 text-gray-900">Zamówienia w sklepie</h1>
      <Link href="/admin" className="text-indigo-600 hover:underline mb-4 block">
        ← Wróć do panelu Admina
      </Link>

      {purchases.length === 0 ? (
        <p className="text-gray-900">Brak nowych zamówień.</p>
      ) : (
        <table className="w-full table-auto border-collapse bg-gray-50">
          <thead>
            <tr className="bg-gray-200">
              {['Data','Użytkownik','Przedmiot','Koszt','Wykonane'].map(h => (
                <th
                  key={h}
                  className="border px-3 py-2 text-left text-gray-900"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id} className="hover:bg-gray-100">
                <td className="border px-3 py-2 text-gray-900">
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td className="border px-3 py-2 text-gray-900">{p.user.name}</td>
                <td className="border px-3 py-2 text-gray-900">{p.item.name}</td>
                <td className="border px-3 py-2 text-gray-900">{p.item.cost} pkt</td>
                <td className="border px-3 py-2 text-center">
                  <button
                    onClick={() => toggleDone(p.id, p.done)}
                    className="text-lg"
                  >
                    {p.done ? '✅' : '⬜️'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
