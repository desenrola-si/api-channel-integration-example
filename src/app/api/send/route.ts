import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { sendText, sendImageUrl, DesenrolaError } from '@/lib/desenrola'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    externalUserId?: string
    type?: string
    text?: string
    imageUrl?: string
  } | null

  if (!body?.externalUserId) {
    return NextResponse.json({ error: 'externalUserId obrigatório' }, { status: 400 })
  }

  const externalMessageId = randomUUID()

  try {
    if (body.type === 'image') {
      if (!body.imageUrl?.trim()) {
        return NextResponse.json({ error: 'imageUrl obrigatório para type=image' }, { status: 400 })
      }
      const result = await sendImageUrl({ externalUserId: body.externalUserId, imageUrl: body.imageUrl, externalMessageId })
      return NextResponse.json(result)
    }

    if (!body.text?.trim()) {
      return NextResponse.json({ error: 'text obrigatório para type=text' }, { status: 400 })
    }
    const result = await sendText({ externalUserId: body.externalUserId, text: body.text, externalMessageId })
    return NextResponse.json(result)
  } catch (err) {
    const status = err instanceof DesenrolaError ? err.status : 500
    return NextResponse.json({ error: (err as Error).message }, { status })
  }
}
