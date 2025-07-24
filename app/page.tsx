'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function HomePage() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.from('users').select('id, name').then(({ data }) => {
      if (data) setUsers(data)
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: selectedUser.name, password })
    })
    const json = await res.json()
    if (res.ok) {
      router.push(`/user/${selectedUser.id}`)
    } else {
      setError(json.error || 'Błędne hasło')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl mb-4 font-bold">Wybierz użytkownika</h1>
      {!selectedUser ? (
        <ul className="space-y-2">
          {users.map(user => (
            <li key={user.id}>
              <button
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => setSelectedUser(user)}
              >
                {user.name} – Zaloguj się
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-900 font-semibold">Użytkownik</label>
            <div className="p-2 border rounded">{selectedUser.name}</div>
          </div>
          <div>
            <label className="block mb-1 text-gray-900 font-semibold">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded p-2 text-black"
              placeholder="Wpisz hasło"
            />
          </div>
          <button type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Zaloguj się
          </button>
          <button
            type="button"
            onClick={() => { setSelectedUser(null); setPassword(''); setError('') }}
            className="ml-3 bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500"
          >
            Wróć
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
      )}
    </div>
  )
}