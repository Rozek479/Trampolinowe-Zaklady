'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const json = await res.json()
    if (res.ok) {
      // Możesz zapisać usera do localStorage/cookie i przekierować
      // Np. localStorage.setItem('user', JSON.stringify(json.user))
      router.push(`/user/${json.user.id}`)
    } else {
      setError(json.error || 'Błąd logowania')
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl mb-4">Logowanie</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="text"
          placeholder="Nazwa użytkownika"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border rounded p-2 text-black"
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border rounded p-2 text-black"
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded"
        >
          Zaloguj się
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
    </div>
  )
}