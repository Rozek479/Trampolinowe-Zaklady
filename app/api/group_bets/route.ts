import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
  // ?group_name=A
  const { searchParams } = new URL(request.url)
  const group = searchParams.get('group_name') || undefined

  const query = supabase.from('group_bets').select('*')
  if (group) query.eq('group_name', group)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { group_name, description, odd } = body

  const { data, error } = await supabase
    .from('group_bets')
    .insert([{ group_name, description, odd }])
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, odd } = body

  const { data, error } = await supabase
    .from('group_bets')
    .update({ odd })
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
