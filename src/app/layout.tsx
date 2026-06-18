import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'API de Conversa — Demo',
  description: 'Exemplo de integração com o canal API de Conversa da Desenrola',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
