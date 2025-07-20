// app/components/Navbar.tsx
'use client'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          TrampoZakłady
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-gray-900 hover:text-indigo-600">Home</Link>
          <Link href="/admin" className="text-gray-900 hover:text-indigo-600">Admin</Link>
        </div>
      </div>
    </nav>
  )
}
