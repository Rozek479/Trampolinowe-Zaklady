'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const router = useRouter()

  const submit = async () => {
    setErr('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      const { error } = await res.json()
      setErr(error)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded bg-white">
      <h1 className="text-2xl mb-4">Logowanie Admin</h1>
      {err && <p className="text-red-600 mb-2">{err}</p>}
      <input
        type="password"
        placeholder="Hasło"
        value={pw}
        onChange={e => setPw(e.target.value)}
        className="w-full p-2 border rounded mb-4 text-black"
      />
      <button
        onClick={submit}
        className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
      >
        Zaloguj
      </button>
    </div>
  )
}
