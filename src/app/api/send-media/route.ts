import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { sendImageFile, DesenrolaError } from '@/lib/desenrola'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const externalUserId = form.get('externalUserId')
  const file = form.get('file')

  if (typeof externalUserId !== 'string' || !externalUserId) {
    return NextResponse.json({ error: 'externalUserId obrigatório' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'campo "file" obrigatório' }, { status: 400 })
  }

  try {
    const result = await sendImageFile({ externalUserId, file, externalMessageId: randomUUID() })
    return NextResponse.json(result)
  } catch (err) {
    const status = err instanceof DesenrolaError ? err.status : 500
    return NextResponse.json({ error: (err as Error).message }, { status })
  }
}
