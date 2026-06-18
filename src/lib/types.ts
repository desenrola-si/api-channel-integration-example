export type MessageType = 'text' | 'image'

export type SentMessage = {
  id: string
  type: MessageType
  text?: string
  imageUrl?: string
  messageId?: string
  status?: string
}

export type CallbackPayload = {
  accountPublicId: string
  externalUserId: string
  type: MessageType
  text?: string
  imageUrl?: string
  messageId: string
}
