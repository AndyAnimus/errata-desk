# Errata Desk

Same Magic companion rule. Three clocks. A Sanity Context agent that only keeps the claim in force for that platform and day — then lets you **bind** the call so the next ask returns a standing ruling from the lake.

## Live

- Desk: https://luiscore.com/errata-desk/
- Studio: https://luis-errata-desk.sanity.studio/
- DEV submission: https://dev.to/luisprimecore/errata-desk-same-rule-three-clocks-1nkk
- Project ID: `gsu7qzk9` · dataset `production` (public)
- Context MCP: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk`

## Why structure matters

Keyword search returns both “cast from outside the game” and “pay 3”. On Arena, June 2 2020, only the first is in force. Tabletop on the same day already uses pay 3.

## Run locally

```bash
# secrets/sanity.env needs SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN
node scripts/seed.mjs
node ask-server.mjs   # http://127.0.0.1:8791
```

Studio: `cd studio && npm i && npx sanity deploy`
