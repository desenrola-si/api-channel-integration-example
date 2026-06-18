# API de Conversa — Exemplo de integração (Next.js)

Exemplo mínimo de como integrar seu app ao **canal API de Conversa da
Desenrola**. Cobre os dois lados do contrato:

- **Envio** (seu app → Desenrola): texto, imagem por URL e imagem por arquivo.
- **Recebimento** (Desenrola → seu app): callback assinado com **HMAC-SHA256**,
  validado antes de processar.

O segredo da conta nunca vai pro navegador: a UI chama rotas internas do Next, e
só o servidor conhece `CHANNEL_SECRET`. Onde guardar/exibir as respostas é
decisão sua — este exemplo só valida o callback e registra no log.

## Como rodar

```bash
cp .env.example .env.local   # preencha os secrets
npm install
npm run dev                  # http://localhost:3000
```

### Variáveis de ambiente

| Var | Para quê |
|-----|----------|
| `DESENROLA_API_URL` | Base da API (default `https://api.desenrolasi.com`) |
| `CHANNEL_ACCOUNT_ID` | `publicId` da conta (header `x-channel-account-id`) |
| `CHANNEL_SECRET` | Secret de autenticação do envio (header `x-channel-secret`) |
| `CHANNEL_CALLBACK_SECRET` | Secret **separado** pra validar a assinatura do callback |

## Contrato

### Envio — texto / imagem por URL

```bash
curl -X POST https://api.desenrolasi.com/api-channel/inbound \
  -H "x-channel-account-id: $CHANNEL_ACCOUNT_ID" \
  -H "x-channel-secret: $CHANNEL_SECRET" \
  -H "content-type: application/json" \
  -d '{
    "externalUserId": "UUID-v4-do-usuario",
    "type": "text",
    "text": "Olá!",
    "externalMessageId": "id-no-seu-sistema"
  }'
# imagem por URL: "type": "image", "imageUrl": "https://…/foto.jpg"
```

### Envio — imagem por arquivo

```bash
curl -X POST https://api.desenrolasi.com/api-channel/inbound/media \
  -H "x-channel-account-id: $CHANNEL_ACCOUNT_ID" \
  -H "x-channel-secret: $CHANNEL_SECRET" \
  -F "externalUserId=UUID-v4-do-usuario" \
  -F "externalMessageId=id-no-seu-sistema" \
  -F "file=@/caminho/foto.png"
```

Resposta dos dois (HTTP 202):

```json
{ "status": "accepted", "messageId": "uuid-gerado-pela-desenrola" }
```

### Recebimento — callback assinado

A Desenrola entrega as respostas via `POST` na URL de callback configurada no
painel (`/contas-api` → aba **Callback**):

```http
POST /api/callback
Content-Type: application/json
X-Channel-Signature: <hex hmac-sha256 do corpo cru>

{
  "accountPublicId": "…",
  "externalUserId": "…",
  "type": "text" | "image",
  "text": "…",          // presente quando type=text
  "imageUrl": "…",       // presente quando type=image
  "messageId": "…"
}
```

Valide assim (`src/lib/signature.ts`): calcule
`HMAC-SHA256(corpo_cru, CHANNEL_CALLBACK_SECRET)` em **hex** e compare com
`X-Channel-Signature` usando comparação timing-safe. Sem prefixo `sha256=`.

### IDs

- **`externalMessageId`** — você gera (id no seu sistema). Opcional. Reenvie o
  mesmo valor em retries pra garantir **idempotência**.
- **`messageId`** — a Desenrola gera e devolve na resposta. Guarde pra rastreio.

### Limites

- Texto: até **4096** caracteres.
- Imagem: até **5 MB**, apenas `image/jpeg` ou `image/png`.
- Rate limit: **5 requisições a cada 5s** por `(conta + externalUserId)` →
  `429` com header `Retry-After`.

## Estrutura

```
src/
├── app/
│   ├── api/
│   │   ├── send/route.ts        envio JSON (texto / imagem URL)
│   │   ├── send-media/route.ts  envio multipart (imagem arquivo)
│   │   └── callback/route.ts    recebe e valida o callback assinado
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/Chat.tsx          UI de envio de exemplo
└── lib/
    ├── desenrola.ts             cliente da API (server-only, injeta o secret)
    ├── signature.ts             valida HMAC-SHA256
    └── types.ts
```
