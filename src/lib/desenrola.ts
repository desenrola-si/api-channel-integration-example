import 'server-only'

const BASE_URL = process.env.DESENROLA_API_URL ?? 'https://api.desenrolasi.com'
const ACCOUNT_ID =
  process.env.CHANNEL_ACCOUNT_ID ?? 'b74061de-e2cf-4670-a5cd-491ba8c716a7'

export type InboundResult = { status: string; messageId: string }

export class DesenrolaError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'DesenrolaError'
  }
}

function authHeaders(): Record<string, string> {
  const secret = process.env.CHANNEL_SECRET
  if (!secret) {
    throw new DesenrolaError(
      'CHANNEL_SECRET não configurado — defina em .env.local',
      500,
    )
  }
  return {
    'x-channel-account-id': ACCOUNT_ID,
    'x-channel-secret': secret,
  }
}

export async function sendText(input: {
  externalUserId: string
  text: string
  userName?: string
  externalMessageId?: string
}): Promise<InboundResult> {
  return postInbound({
    externalUserId: input.externalUserId,
    userName: input.userName,
    type: 'text',
    text: input.text,
    externalMessageId: input.externalMessageId,
  })
}

export async function sendImageUrl(input: {
  externalUserId: string
  imageUrl: string
  userName?: string
  externalMessageId?: string
}): Promise<InboundResult> {
  return postInbound({
    externalUserId: input.externalUserId,
    userName: input.userName,
    type: 'image',
    imageUrl: input.imageUrl,
    externalMessageId: input.externalMessageId,
  })
}

export async function sendImageFile(input: {
  externalUserId: string
  file: File
  userName?: string
  externalMessageId?: string
}): Promise<InboundResult> {
  const form = new FormData()
  form.append('externalUserId', input.externalUserId)
  if (input.userName) form.append('userName', input.userName)
  if (input.externalMessageId)
    form.append('externalMessageId', input.externalMessageId)
  form.append('file', input.file)

  const res = await fetch(`${BASE_URL}/api-channel/inbound/media`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  return parse(res)
}

async function postInbound(
  body: Record<string, unknown>,
): Promise<InboundResult> {
  const res = await fetch(`${BASE_URL}/api-channel/inbound`, {
    method: 'POST',
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parse(res)
}

async function parse(res: Response): Promise<InboundResult> {
  const data = (await res.json().catch(() => ({}))) as {
    status?: string
    messageId?: string
    message?: string | string[]
    error?: string
  }
  if (!res.ok) {
    const raw = data.message ?? data.error ?? `Desenrola respondeu ${res.status}`
    const message = Array.isArray(raw) ? raw.join(', ') : raw
    throw new DesenrolaError(message, res.status)
  }
  return { status: data.status ?? 'accepted', messageId: data.messageId ?? '' }
}
