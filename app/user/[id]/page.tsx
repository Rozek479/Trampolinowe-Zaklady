'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'

type User = { name: string; points: number; loan_amount?: number }

export default function UserDashboard() {
  const params = useParams()
  const userId = Array.isArray(params.id) ? params.id[0] : params.id!
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [loanInput, setLoanInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [repayLoading, setRepayLoading] = useState(false)
  const [loanLoading, setLoanLoading] = useState(false)

  const groups = ['A','B','C','D','E','F','G','H']

  // 1) Ładujemy dane użytkownika (teraz też loan_amount)
  useEffect(() => {
    supabase
      .from('users')
      .select('name, points, loan_amount')
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

  // Pożyczanie punktów
  const borrowPoints = async () => {
    setError('')
    setSuccess('')
    setLoanLoading(true)
    const amount = parseInt(loanInput, 10)
    if (!amount || amount < 1) { setError('Podaj kwotę'); setLoanLoading(false); return }
    if (amount > 5000) { setError('Max 5000 pkt'); setLoanLoading(false); return }
    if (user?.loan_amount && user.loan_amount > 0) { setError('Masz już pożyczkę!'); setLoanLoading(false); return }
    // Dodaj punkty, ustaw loan_amount
    const { error } = await supabase
      .from('users')
      .update({
        points: (user?.points ?? 0) + amount,
        loan_amount: amount
      })
      .eq('id', userId)
    setLoanLoading(false)
    if (error) setError(error.message)
    else {
      setSuccess(`Pożyczono ${amount} pkt. Musisz oddać ${Math.ceil(amount * 1.1)} pkt.`)
      setUser({ ...user!, points: (user?.points ?? 0) + amount, loan_amount: amount })
      setLoanInput('')
    }
  }

  // Spłacanie pożyczki
  const repayLoan = async () => {
    setError('')
    setSuccess('')
    setRepayLoading(true)
    const debt = Math.ceil((user?.loan_amount ?? 0) * 1.1)
    if ((user?.points ?? 0) < debt) {
      setError(`Potrzebujesz ${debt} pkt, masz tylko ${user?.points ?? 0}.`)
      setRepayLoading(false)
      return
    }
    const { error } = await supabase
      .from('users')
      .update({
        points: (user?.points ?? 0) - debt,
        loan_amount: 0
      })
      .eq('id', userId)
    setRepayLoading(false)
    if (error) setError(error.message)
    else {
      setSuccess('Spłacono pożyczkę!')
      setUser({ ...user!, points: (user?.points ?? 0) - debt, loan_amount: 0 })
    }
  }

  if (loading) return <p className="p-6">Ładowanie profilu...</p>
  if (!user)  return <p className="p-6 text-red-600">Użytkownik nie znaleziony</p>

  // Czy sklep jest zablokowany?
  const shopBlocked = !!user.loan_amount && user.loan_amount > 0

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl mb-2">Cześć, {user.name}!</h1>
      <p className="mb-4">Twoje saldo: {user.points} pkt</p>

      {/* BANK */}
      <div className="mb-6 border p-4 rounded bg-gray-50">
        <h2 className="text-lg font-bold mb-2">Bank</h2>
        <div className="mb-2">
          <b>Pożyczka:</b>{' '}
          {user.loan_amount && user.loan_amount > 0
            ? (
              <>
                <span className="text-red-600 font-bold">{user.loan_amount} pkt</span>{' '}
                <span className="text-gray-600">(do oddania: <b>{Math.ceil(user.loan_amount * 1.1)}</b> pkt)</span>
                <button
                  className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={repayLoan}
                  disabled={repayLoading}
                >
                  Spłać pożyczkę
                </button>
              </>
            )
            : <span className="text-green-600">Brak pożyczki</span>
          }
        </div>
        {(!user.loan_amount || user.loan_amount === 0) && (
          <form
            onSubmit={e => { e.preventDefault(); borrowPoints() }}
            className="flex items-center space-x-2"
          >
            <input
              type="number"
              placeholder="Kwota (max 5000)"
              value={loanInput}
              onChange={e => setLoanInput(e.target.value)}
              className="border rounded p-2 w-32 text-black"
              min={1}
              max={5000}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
              disabled={loanLoading}
            >
              Pożycz
            </button>
          </form>
        )}
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </div>

      <div className="flex justify-between mb-4">
        <Link
          href={`/user/${userId}/shop`}
          className={`px-3 py-1 rounded
            ${shopBlocked
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'}`}
          aria-disabled={shopBlocked}
          tabIndex={shopBlocked ? -1 : 0}
          onClick={e => {
            if (shopBlocked) {
              e.preventDefault()
              alert('Najpierw spłać pożyczkę w banku, żeby móc kupować w sklepie!')
            }
          }}
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