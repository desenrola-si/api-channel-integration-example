'use client'

import { useEffect, useRef, useState } from 'react'
import type { SentMessage } from '@/lib/types'

const USER_ID_KEY = 'api-channel-demo:externalUserId'

function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

export function Chat() {
  const [externalUserId, setExternalUserId] = useState('')
  const [sent, setSent] = useState<SentMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setExternalUserId(getOrCreateUserId())
  }, [])

  const handleSendText = async () => {
    const value = text.trim()
    if (!value || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ externalUserId, type: 'text', text: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar')
      setSent((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: 'text', text: value, messageId: data.messageId, status: data.status },
      ])
      setText('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const handleSendFile = async (file: File) => {
    setSending(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('externalUserId', externalUserId)
      form.append('file', file)
      const res = await fetch('/api/send-media', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar imagem')
      setSent((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: 'image', text: `🖼️ ${file.name}`, messageId: data.messageId, status: data.status },
      ])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="chat">
      <div className="chat-meta">
        <span className="chat-meta-label">externalUserId</span>
        <code>{externalUserId || '…'}</code>
      </div>

      <div className="chat-messages">
        {sent.length === 0 && (
          <p className="chat-empty">Envie uma mensagem pra Desenrola 👇</p>
        )}
        {sent.map((m) => (
          <div key={m.id} className="bubble bubble-user">
            <span className="bubble-text">{m.text}</span>
            {m.messageId ? (
              <span className="bubble-id" title="messageId na Desenrola">
                {m.status} · {m.messageId.slice(0, 8)}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <p className="chat-hint">
        As respostas da Desenrola chegam no seu <code>POST /api/callback</code>{' '}
        (assinado com HMAC). Este exemplo valida a assinatura e registra no log
        do servidor — persista no seu sistema pra exibir ao usuário.
      </p>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-input">
        <button
          type="button"
          className="attach-btn"
          title="Enviar imagem (jpeg/png, até 5MB)"
          disabled={sending || !externalUserId}
          onClick={() => fileRef.current?.click()}
        >
          📎
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleSendFile(file)
          }}
        />
        <input
          type="text"
          value={text}
          placeholder="Digite uma mensagem…"
          disabled={sending || !externalUserId}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendText()
          }}
        />
        <button
          type="button"
          className="send-btn"
          disabled={sending || !text.trim() || !externalUserId}
          onClick={handleSendText}
        >
          {sending ? '…' : 'Enviar'}
        </button>
      </div>
    </section>
  )
}
