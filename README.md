# Errata Desk

Same Magic companion rule. Three clocks. A Sanity Context agent that only keeps the claim in force for that platform and day. A second endpoint can see the signature, and `decidedBy` stays empty until a person signs. A third endpoint (`errata-sources`) serves primary-source `sourceDoc` excerpts from the June 1, 2020 B&R. Asks work in EN / FR / DE / ES.

## Live

- Desk: https://luiscore.com/errata-desk/
- Needle (Path Two): https://luiscore.com/errata-desk/needle
- App SDK board: https://luiscore.com/errata-desk/app/
- Studio: https://luis-errata-desk.sanity.studio/
- Path One: https://dev.to/luisprimecore/errata-desk-same-rule-three-clocks-1nkk
- Path Two: https://dev.to/luisprimecore/the-needle-one-dial-three-clocks-43ga
- Project ID: `gsu7qzk9` · dataset `production` (public)
- Rules MCP: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true`
- Signature MCP: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign`
- Sources MCP: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources`

## Why structure matters

Keyword search returns both “cast from outside the game” and “pay 3”. On Arena, June 2 2020, only the first is in force. Tabletop on the same day already uses pay 3. The signature fields stay blank until someone signs. The agent is not allowed to fill them. Fires of Invention / Agent of Treachery share the same announcement clocks; the sources MCP returns the primary excerpts.

The legal steps live in `workflow-sign-call`: asked → derived → awaitingSignature (agent), then signed (person only). `scripts/timed-run.mjs` walks that workflow and records the result as `timed-run-latest`.

## Run locally

```bash
# secrets/sanity.env needs SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN
node scripts/seed.mjs
node scripts/seed-sign.mjs
node scripts/seed-sources.mjs
node ask-server.mjs   # http://127.0.0.1:8791
```

The App SDK board: `cd app && npm i && npm run build`, then open `/app/`.

Studio: `cd studio && npm i && npx sanity deploy`
