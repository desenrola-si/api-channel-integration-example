import { Chat } from '@/components/Chat'

export default function Home() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>API de Conversa — Demo</h1>
        <p>
          Exemplo de integração com o canal de atendimento da Desenrola. Envie
          texto ou imagem pra Desenrola; as respostas chegam no seu endpoint de
          callback assinado (<code>/api/callback</code>).
        </p>
      </header>
      <Chat />
    </main>
  )
}
