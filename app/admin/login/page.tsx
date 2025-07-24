'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const router = useRouter()

  const submit = async () => {
    setErr('')
    try {
const res = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: pw })
})

      // parsujemy zawsze JSON
      const json = await res.json()
      if (res.ok && json.ok) {
        router.push('/admin')
      } else {
        setErr(json.error || 'Nieoczekiwany błąd')
      }
    } catch (e: any) {
      console.error('Fetch error:', e)
      setErr('Błąd sieci: ' + (e.message || e))
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded bg-white">
      <h1 className="text-xl mb-4">Logowanie Admin</h1>
      {err && <p className="text-red-600 mb-2">{err}</p>}
      <input
        type="password"
        placeholder="Hasło"
        value={pw}
        onChange={e => setPw(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={submit}
        className="w-full bg-indigo-600 text-white p-2 rounded"
      >
        Zaloguj
      </button>
    </div>
  )
}
