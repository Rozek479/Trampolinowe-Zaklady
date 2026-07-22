// app/api/group_bets/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
  // ?group_name=A            -> tylko aktywne (closed=false)
  // ?group_name=A&include_closed=true -> aktywne + rozliczone
  const { searchParams } = new URL(request.url)
  const group = searchParams.get('group_name') || undefined
  const includeClosed = searchParams.get('include_closed') === 'true'

  let query = supabase.from('group_bets').select('*')
  if (!includeClosed) query = query.eq('closed', false)
  if (group) query = query.eq('group_name', group)
  query = query.order('id', { ascending: true })

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
    .select()
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
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}