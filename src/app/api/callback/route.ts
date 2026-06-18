import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@/lib/signature'
import type { CallbackPayload } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const secret = process.env.CHANNEL_CALLBACK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CHANNEL_CALLBACK_SECRET não configurado' }, { status: 500 })
  }

  const raw = await req.text()
  const signature = req.headers.get('x-channel-signature')

  if (!verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 })
  }

  let payload: CallbackPayload
  try {
    payload = JSON.parse(raw) as CallbackPayload
  } catch {
    return NextResponse.json({ error: 'corpo inválido' }, { status: 400 })
  }

  // Ponto de integração: persista a resposta no seu sistema (banco, fila…)
  // e entregue ao usuário final. Este exemplo apenas registra no log.
  console.log('[callback] resposta da Desenrola:', payload)

  return NextResponse.json({ status: 'ok' })
}
