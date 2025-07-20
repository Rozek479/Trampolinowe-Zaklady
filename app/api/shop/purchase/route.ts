// app/api/shop/purchase/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { user_id, item_id } = await req.json()
  // 1) Pobierz koszt
  const { data: item, error: ie } = await supabaseAdmin
    .from('items').select('cost').eq('id', item_id).single()
  if (ie || !item) return NextResponse.json({ error: ie?.message||'Brak przedmiotu' }, { status: 400 })
  // 2) Odejmij punkty
  const { error: rpcErr } = await supabaseAdmin.rpc('increment_points', {
    user_id, diff: -item.cost
  })
  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 400 })
  // 3) Zapisz zakup
  const { error: insErr } = await supabaseAdmin
    .from('purchases')
    .insert([{ user_id, item_id }])
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
