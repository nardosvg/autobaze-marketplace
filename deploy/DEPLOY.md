# Deploy do AutoBaze Marketplace (Mercur) na VPS

Escrito depois da centralização de 27-28/08: o app Next.js saiu do Cloudflare
Workers e hoje roda como container na VPS (`operify-app`, rede
`supabase_default`, exposto por cloudflared). O marketplace entra na mesma
VPS e na mesma rede.

## Arquitetura

| Container | Papel | Porta |
|---|---|---|
| `mercur-pg` | Postgres 16 do marketplace (separado do Supabase) | interna |
| `mercur-redis` | Cache/eventos do Medusa | interna |
| `mercur-api` | Mercur/Medusa + admin `/dashboard` + vendor `/seller` | 127.0.0.1:9000 |
| `mercur-storefront` | Vitrine Next.js | 127.0.0.1:3300 |

Tráfego interno **não sai pra internet** (mesma rede Docker):

- app → `http://mercur-api:9000` (`MERCUR_BACKEND_URL`)
- Mercur → `http://operify-app:3000/api/webhooks/marketplace/pedido`

Público, via cloudflared (sem porta no firewall, igual app/ntfy/evolution):

- `marketplace.autobaze.com.br` → `127.0.0.1:3300`
- `mercur.autobaze.com.br` → `127.0.0.1:9000`

## Capacidade — ler antes de subir

A VPS agora concentra Supabase + app + observability + evolution + ntfy, e a
Hostinger aplica fair-use throttle com CPU sustained (~180 min). O marketplace
soma **~4 GB de teto** (api 2g, pg 1g, storefront 1g, redis 256m) e o build do
storefront é pesado. Duas saídas:

1. **Subir na VPS atual** (o que este compose faz): aceitável pro beta, com
   limites explícitos já configurados. Acompanhar CPU/memória no Grafana no
   primeiro dia. Se apertar, o rollback é imediato (ver no fim).
2. **VPS dedicada**: o mesmo compose roda sem alteração; só mudam os
   `MERCUR_BACKEND_URL`/`AUTOBAZE_WEBHOOK_URL` (passam a usar os domínios
   públicos em vez dos nomes de container).

Decisão do Leonardo, não minha. Nada aqui foi subido em produção.

## Versões (fixadas)

- Backend: create-mercur-app 2.3.1 (`@mercurjs/*` 2.3.1, `@medusajs/*` 2.18.0)
- Storefront: fork em `b2c-marketplace-storefront/` (main de 25/08 + patches
  AutoBaze: rota `/store/sellers`, buybox por `offer_id`, rebrand)

Não atualizar o storefront sem conferir compatibilidade com o core 2.3.1: a
main do storefront já chama rotas que só existem em versões mais novas.

## Passos

1. `mkdir -p /opt/mercur` e copiar `deploy/.env.prod.example` → `/opt/mercur/.env`,
   preenchendo os segredos.
2. Adicionar no `/opt/operify-app/app.env` (envs do app, usadas no build e no
   runtime do container `operify-app`):
   ```
   MERCUR_BACKEND_URL=http://mercur-api:9000
   MERCUR_STOREFRONT_URL=https://marketplace.autobaze.com.br
   MERCUR_ADMIN_EMAIL=admin@autobaze.com.br
   MERCUR_ADMIN_PASSWORD=<senha do admin do Mercur>
   MERCUR_WEBHOOK_SECRET=<mesmo valor de AUTOBAZE_WEBHOOK_SECRET>
   ```
   Depois redeployar o app (push na `main` do repo `autobaze`, ou
   workflow_dispatch em Actions → "Deploy para a VPS").
3. Subir o marketplace:
   ```
   docker compose -f deploy/docker-compose.prod.yml --env-file /opt/mercur/.env up -d --build
   ```
   As migrations do Medusa rodam no entrypoint da API.
4. Bootstrap único (só na primeira vez):
   - `docker compose exec mercur-api npx medusa user -e admin@autobaze.com.br -p <senha-forte>`
   - Criar publishable key, sales channel default, region **Brasil/BRL**,
     shipping profile "Marketplace Shipping" e as categorias — pelo admin em
     `mercur.autobaze.com.br/dashboard`, ou adaptando
     `packages/api/src/scripts/seed-autobaze.ts` (o do POC cria sellers de
     demonstração: **não usar como está em produção**).
   - Conferir a comissão default em Admin → Commissions (hoje 10%, placeholder).
   - Copiar a publishable key pro `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` e
     rebuildar o storefront (ela é inlinada no bundle).
5. Cloudflared: adicionar os dois ingress no config do túnel e criar os CNAMEs.
   O ingress precisa continuar com catch-all no fim.
6. Cron do sync (padrão dos crons do app, arquivo em `/etc/cron.d/`, **LF** e
   não CRLF senão o cron ignora):
   ```
   */2 * * * * root curl -s -H "Authorization: Bearer $OPERIFY_CRON_SECRET" http://127.0.0.1:3000/api/cron/marketplace-sync > /dev/null
   ```
7. Observability: blackbox probe pra `https://marketplace.autobaze.com.br` e
   pra `http://127.0.0.1:9000/health` em `/opt/monitoring`, junto dos outros.
8. Backup: incluir o volume `mercur_pgdata` (ou um `pg_dump` do `mercur-pg`)
   nas duas rotinas existentes (local systemd + R2).

## Rollback

`docker compose -f deploy/docker-compose.prod.yml down` derruba só o
marketplace. O painel degrada sozinho (o hub trata "marketplace indisponível"),
e PDV, fiscal e Loja Online não são afetados. Dados ficam no volume
`mercur_pgdata`.
