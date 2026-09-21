---
title: Errata Desk — same rule, three clocks
published: true
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path One: Ship an Agent That Queries Real Content](https://dev.to/challenges/sanity-2026-09-16)*

The desk is https://luiscore.com/errata-desk/. No account. It asks on load.

If you want the other surfaces:

- Needle: https://luiscore.com/errata-desk/needle
- Checks, no token: https://luiscore.com/errata-desk/check
- The same cases, rerun: https://luiscore.com/errata-desk/score
- Workflow instance: https://luiscore.com/errata-desk/workflow
- Sign board: https://luiscore.com/errata-desk/app/
- Studio: https://luis-errata-desk.sanity.studio/ (the Workflows tab wants a project login: https://luis-errata-desk.sanity.studio/workflows)

Project `gsu7qzk9`, dataset `production`. The dataset is public.

## What I Built

On June 1, 2020 Wizards changed how a companion enters the game. You pay 3, put it in your hand, then cast it. Paper, Magic Online, and Arena did not pick that up on the same day.

- Tabletop: June 1
- Magic Online: June 3
- MTG Arena: June 4

Ask "two days before Arena switched, do I pay 3 or cast it from outside the game?" A search for "cast your companion" returns both sentences. They are both in the announcement. Arena on June 2 is still on the old reminder. Paper is already on the new one.

The desk keeps a `rulesClaim` when `platform` matches and the date is inside `effectiveFrom` / `effectiveUntil`. The other claim stays on the page, marked not in force, with the source next to it.

**Bind** writes a `ruling` for that platform and day. The next ask reads that document instead of deriving the answer again.

The dataset has the claims, the clocks, and the calls I wrote while testing. I didn't put card images in it.

## Demo

Desk: https://luiscore.com/errata-desk/

June 2 split with no Context token: https://luiscore.com/errata-desk/check

Studio: https://luis-errata-desk.sanity.studio/

Sign board: https://luiscore.com/errata-desk/app/

I ran the battery against the live desk: `54/54`. The workflow timed run is `8/8`. The lake currently has 272 `rulesClaim` documents and 17 `sourceDoc` excerpts. Claims have `valueFr`, `valueDe`, and `valueEs`.

The dates below are the ones printed on each announcement. I didn't copy one effective day onto every client.

- January 21, 2019 — Magic Online January 21, tabletop January 25 (Modern Ironworks)
- October 21, 2019 — Magic Online October 21, Arena October 24, tabletop October 25 (Field of the Dead)
- November 18, 2019 — Arena and Magic Online November 18, tabletop November 22 (Oko in Standard)
- December 16, 2019 — Pioneer, tabletop and Magic Online December 17
- January 13, 2020 — Modern, tabletop and Magic Online January 14
- March 9, 2020 — tabletop and Magic Online March 10, Arena March 12
- April 13, 2020 — Brawl Lutri, April 16
- May 18, 2020 — tabletop and Magic Online May 18, Arena May 21
- June 1, 2020 — companion change and the Standard bans (Magic Online companion June 3, Arena June 4)
- July 13, 2020 — tabletop and Magic Online July 13, Arena July 16
- August 3, September 28, and October 12, 2020 — the page names one date
- February 15, 2021 — one date, Historic / Pioneer / Modern / Legacy / Vintage
- June 9, 2021 — Historic Time Warp, Arena June 10

Historic and Brawl are Arena. Pioneer, Modern, Legacy, Vintage, and Pauper are tabletop and Magic Online. Omnath on October 12 is banned in one format and suspended in another.

Questions I actually type:

1. `two days before Arena switched, do I pay 3 or cast it from outside the game?`
2. `On paper, June 2 2020 — pay 3 or cast from outside the game?`
3. `On Jun 3 2020, what does each table do?`
4. `dos días antes de que Arena cambiara, ¿pago 3 o lanzo desde fuera del juego?`
5. `Deux jours avant qu'Arena change, est-ce que je paie 3 ou je joue depuis l'extérieur ?`
6. `Zwei Tage bevor Arena umgestellt hat: zahle ich 3 oder spiele ich von außerhalb?`
7. `On Arena, June 2 2020, is Fires of Invention banned in Standard?`
8. `On Arena, March 11 2020, is Oko banned in Historic?`
9. `On Arena, May 19 2020, is Winota banned in Brawl?`
10. `On Arena, October 12 2020, is Omnath suspended in Historic?`
11. `On Arena, October 23 2019, is Field of the Dead banned in Standard?`
12. `On paper, November 20 2019, is Oko banned in Standard?`
13. `On Arena, June 10 2021, is Time Warp banned in Historic?`

Public dataset, no token:

https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=*[_type==%22rulesClaim%22]{platform,status,effectiveFrom,effectiveUntil,value,sourceTitle,sourceUrl}

Default ask, two days before Arena switched:

- in force: cast once from outside the game (`claim-arena-old`, until 2020-06-04)
- in the lake, not in force: pay 3 (`claim-arena-current`, from 2020-06-04)

Bind stores that call.

## Code

https://github.com/AndyAnimus/errata-desk

An ask goes to the hosted Context MCP for this project. It does not skip to a private GROQ query.

1. `initial_context`
2. `array_field_reader` on `rules-change-companion.clocks` (or the Standard-ban clocks)
3. `errata-sources` for the `sourceDoc` rows
4. `groq_query` — a standing `ruling` if one exists, otherwise `rulesClaim` rows for that platform (`valueFr` / `valueDe` / `valueEs` when the question is in that language)
5. The window filter below. The model does not decide which claim is in force.
6. Optional `POST /rule`, which writes `ruling-{platform}-{date}`
7. `errata-sign` — `decidedBy` and `decidedAt` stay empty until someone signs

The trace under the answer is those tool calls.

```js
function inForce(c, date) {
  if (c.effectiveFrom && date < c.effectiveFrom) return false
  if (c.effectiveUntil && date >= c.effectiveUntil) return false
  return true
}
```

Schema in the Studio:

- `rulesClaim` — game, subject, predicate, platform, status, value, valueFr, valueDe, valueEs, quote, effectiveFrom, effectiveUntil, sourceTitle, sourceUrl
- `rulesChange` — title, subject, sourceUrl, `clocks[]` (platform + switchesOn)
- `sourceDoc` — title, sourceUrl, about[], body
- `ruling` — the bound answer. `decidedBy` and `decidedAt` stay empty until a person signs
- `deskCase` — asked → derived → awaitingSignature → signed. The last step is `actor: person`
- `deskWorkflow` — those transitions as documents

## How I Used Sanity

Three Context endpoints on the same public dataset.

- `errata-desk` reads clocks, claims, and the worked calls. Embeddings are on.
- `errata-sign` can see only `deskCase`. If `decidedBy` or `decidedAt` is missing, the case is unsigned.
- `errata-sources` can see only `sourceDoc`. Those are excerpts from the printed B&R pages (2019–2021).

"Two days before Arena switched" comes back from the first endpoint as the old reminder. The second returns `case-arena-2020-06-02` with both decision fields null. Binding the call does not fill them. Signing does, and it wants a name. Fires and Agent of Treachery use the same clocks and the sources endpoint.

French, German, and Spanish asks get the matching shell and the `valueFr` / `valueDe` / `valueEs` body when that field is filled in.

The workflow document is `workflow-sign-call`. An agent can move asked → derived → awaitingSignature. Only a person can move it to signed. `scripts/timed-run.mjs` walks that and writes `timed-run-latest`. The run is 8/8, and two of the steps are refusals: the agent trying to sign, and a blank name.

The sign board reads the same cases: https://luiscore.com/errata-desk/app/

- Studio: https://luis-errata-desk.sanity.studio/
- Rules MCP: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true`
- Signature MCP: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign`
- Sources MCP: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources`

The companion clocks are the June 1, 2020 announcement. Later bans are later announcements, using the date that page prints for that platform.

Embeddings are on. This query is live on `production`:

```groq
*[_type=="workedCall"]
  | score(text::semanticSimilarity("three tables disagree on one day"))
  | order(_score desc)[0]{title, _score}
```

It returned "Same words, June 2" with `_score` 8.1. The desk MCP URL has `?embeddings=true`, and each ask records a `text::semanticSimilarity` call.

{% agent_session errata-desk-june-3-across-three-clocks-3xcvye %}

## Recorded session

June 3, 2020, from the desk.

Tools, in order: `initial_context`, `array_field_reader` on `rules-change-companion.clocks`, `groq_query` for the `bringIntoGame` claims.

- Tabletop: pay 3. Switched June 1.
- Magic Online: pay 3. Switches that day.
- Arena: cast once from outside the game. Pay 3 is in the lake and not in force until June 4.

## Sanity Project Details

- Project ID: `gsu7qzk9`
- Dataset: `production` (public)
- Organization: `o4kqib00c`
- Public query: https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=count(*[_type==%22rulesClaim%22])
- Studio: https://luis-errata-desk.sanity.studio/
- Studio Workflows tab (project login): https://luis-errata-desk.sanity.studio/workflows
- Checks: https://luiscore.com/errata-desk/score
- Desk: https://luiscore.com/errata-desk/
- Needle: https://luiscore.com/errata-desk/needle
- Workflow: https://luiscore.com/errata-desk/workflow
- Sign board: https://luiscore.com/errata-desk/app/
- Repo: https://github.com/AndyAnimus/errata-desk
- Context MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true
- Sources MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources
- Sign MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign
