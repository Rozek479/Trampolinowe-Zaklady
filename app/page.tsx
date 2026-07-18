'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function HomePage() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.from('users').select('id, name').then(({ data }) => {
      if (data) setUsers(data)
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: selectedUser.name, password })
    })
    const json = await res.json()
    setLoading(false)
    if (res.ok) {
      router.push(`/user/${selectedUser.id}`)
    } else {
      setError(json.error || 'Błędne hasło')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedUser ? 'Zaloguj się' : 'Wybierz użytkownika'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {selectedUser ? 'Podaj hasło, żeby kontynuować' : 'Kliknij swoje imię z listy poniżej'}
            </p>
          </div>

          {!selectedUser ? (
            <div className="space-y-2">
              {users.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">Wczytywanie użytkowników...</p>
              )}
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-150 text-left group"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-800 group-hover:text-indigo-700">
                    {user.name}
                  </span>
                  <span className="ml-auto text-gray-300 group-hover:text-indigo-400 transition-colors">→</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-800">{selectedUser.name}</span>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Hasło</label>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  placeholder="Wpisz hasło"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setPassword(''); setError('') }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Wróć
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Logowanie...' : 'Zaloguj się'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}