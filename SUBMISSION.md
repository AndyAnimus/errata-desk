---
title: Errata Desk — same rule, three clocks
published: true
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path One: Ship an Agent That Queries Real Content](https://dev.to/challenges/sanity-2026-09-16)*

No login. The desk asks itself. Open these, in order:

1. https://luiscore.com/errata-desk/ — Arena on June 2 is still “cast from outside the game.” The pay-3 claim is on screen, labeled not in force.
2. https://luiscore.com/errata-desk/needle — June 3. Tabletop and Magic Online have switched. Arena has not.
3. https://luiscore.com/errata-desk/check — the same companion split, public GROQ, no token.
4. https://luiscore.com/errata-desk/score — every live probe in one click.
5. https://luiscore.com/errata-desk/workflow — Sanity Workflows. The editor cannot sign.
6. https://luiscore.com/errata-desk/app/ — App SDK board. Unsigned fields are dashes.
7. Studio: https://luis-errata-desk.sanity.studio/ — the Workflows tab needs a project login: https://luis-errata-desk.sanity.studio/workflows

Project `gsu7qzk9`, dataset `production` (public).

## What I Built

Errata Desk answers a rules question keyword search gets wrong.

On June 1, 2020 Wizards changed how Magic companions enter the game. The new procedure is: pay 3 generic mana, put the companion into your hand, then cast it. That change did not land everywhere on the same day.

- Tabletop: June 1
- Magic Online: June 3
- MTG Arena: June 4

Ask "two days before Arena switched, do I pay 3 or cast it from outside the game?" A search for "cast your companion" returns both sentences. They look like a contradiction. They are not. Arena on June 2 is still on the old reminder. The table is already on the new one.

The agent only keeps a `rulesClaim` whose `platform` matches and whose `effectiveFrom` / `effectiveUntil` window covers the date. The other claim stays visible, labeled not in force, with its source.

Then you can **bind the call**. That writes a `ruling` document for that platform and day. The next ask returns the standing ruling from the lake instead of deriving again — the challenge line about a decision carrying across future builds, as an actual write.

The public dataset holds the procedure claims, the three clocks, and the worked calls written for this entry. Each call is a question a keyword search gets wrong, with the finding stored next to the date. Card images are not the product.

## Demo

**Live desk (type anything):** https://luiscore.com/errata-desk/

No-token check of the Arena June 2 split (public GROQ, no Context key): https://luiscore.com/errata-desk/check

Studio: https://luis-errata-desk.sanity.studio/

Sign board (App SDK): https://luiscore.com/errata-desk/app/

Judge prompts that pass right now (battery `54/54`, workflow timed run `8/8`). The lake is 272 `rulesClaim` rows and 17 `sourceDoc` excerpts from printed Wizards B&R pages (2019–2021), each claim carrying `valueFr` / `valueDe` / `valueEs`.

Companion clocks, plus the printed clocks from these announcements (no invented dates):

- January 21, 2019 — Magic Online January 21, tabletop January 25 (Modern Ironworks)
- October 21, 2019 — Magic Online October 21, Arena October 24, tabletop October 25 (Field of the Dead)
- November 18, 2019 — Arena and Magic Online November 18, tabletop November 22 (Oko Standard)
- December 16, 2019 — Pioneer tabletop and Magic Online December 17
- January 13, 2020 — Modern tabletop and Magic Online January 14
- March 9, 2020 — tabletop/Magic Online March 10, Arena March 12
- April 13, 2020 — Brawl Lutri April 16
- May 18, 2020 — tabletop/Magic Online May 18, Arena May 21
- June 1, 2020 — companion and Standard bans (Arena June 4, Magic Online companion June 3)
- July 13, 2020 — tabletop/Magic Online July 13, Arena July 16
- August 3, September 28, and October 12, 2020 — one effective date, named on the page
- February 15, 2021 — one effective date across Historic, Pioneer, Modern, Legacy, Vintage
- June 9, 2021 — Historic Time Warp, Arena June 10

Historic and Brawl stay Arena-only. Pioneer, Modern, Legacy, Vintage, and Pauper stay tabletop and Magic Online. Same card can be banned in one format and only suspended in another (Omnath on October 12).

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

Public dataset (no token):

https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=*[_type==%22rulesClaim%22]{platform,status,effectiveFrom,effectiveUntil,value,sourceTitle,sourceUrl}

Default ask on the desk — two days before Arena switched:

- in force: cast once from outside the game (`claim-arena-old`, until 2020-06-04)
- also in the lake, not in force: pay 3 (`claim-arena-current`, from 2020-06-04)

Same words. Different clock. Bind locks the call.

## Code

Public repo: https://github.com/AndyAnimus/errata-desk

Every ask hits the hosted Sanity Context MCP for this Knowledge Base, not a private GROQ shortcut:

1. `initial_context` — schema + instructions
2. `array_field_reader` — `rules-change-companion.clocks` (or the Standard-ban clocks)
3. `errata-sources` — primary-source `sourceDoc` rows from printed Wizards B&R announcements (2019–2021)
4. `groq_query` — standing `ruling` first, then `rulesClaim` rows for that platform (with `valueFr` / `valueDe` / `valueEs` when the ask is in that language)
5. Window filter in code — the model never invents which claim is in force
6. Optional `POST /rule` — writes `ruling-{platform}-{date}` so the next ask is bound
7. `errata-sign` — unsigned `deskCase` fields stay empty until a person signs

The page shows the tool trace under the answer so judges can see Context was actually used.

```js
// window filter — lake decides, model does not
function inForce(c, date) {
  if (c.effectiveFrom && date < c.effectiveFrom) return false
  if (c.effectiveUntil && date >= c.effectiveUntil) return false
  return true
}
```

Schema in the deployed Studio:

- `rulesClaim` — game, subject, predicate, platform, status, value, valueFr, valueDe, valueEs, quote, effectiveFrom, effectiveUntil, sourceTitle, sourceUrl
- `rulesChange` — title, subject, sourceUrl, `clocks[]` (platform + switchesOn) for `array_field_reader`
- `sourceDoc` — primary-source excerpt (title, sourceUrl, about[], body) for the `errata-sources` MCP
- `ruling` — standing answer after a bind. `decidedBy` and `decidedAt` stay empty until a person signs
- `deskCase` — the workflow document. States: asked → derived → awaitingSignature → signed. The last step is `actor: person` only
- `deskWorkflow` — those transitions stored as data, not only as code

## How I Used Sanity

Three Context endpoints on one public dataset. No login on the desk.

- `errata-desk` reads the clocks, the claims, and the worked calls. Embeddings are on.
- `errata-sign` can see only `deskCase`. Its instructions say: if `decidedBy` or `decidedAt` is missing, the case is unsigned. Do not invent a signer.
- `errata-sources` can see only `sourceDoc` — primary-source excerpts from printed Wizards B&R announcements (2019–2021). Same lake, third Context endpoint.

Ask "two days before Arena switched". The first endpoint returns the old reminder. The second returns `case-arena-2020-06-02` with `decidedBy: null` and `decidedAt: null`. Binding the call does not fill those fields. Signing does, and only with a name. Ban asks (Fires / Agent) hit the same clocks and the sources MCP.

Asks in French, German, or Spanish get localized shells and `valueFr` / `valueDe` / `valueEs` claim bodies when present — not a translation layer bolted onto English-only content.

The workflow is the document `workflow-sign-call`. An agent may move asked → derived → awaitingSignature. A person is the only actor who can move it to signed. A timed edit run against that workflow scored 8/8, including the refusal when the agent tried to sign and the refusal when the name was blank. The log is the document `timed-run-latest`.

The App SDK board reads the same cases live: https://luiscore.com/errata-desk/app/

- Studio v6 at https://luis-errata-desk.sanity.studio/
- Context MCP, rules: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true`
- Context MCP, signature: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign`
- Context MCP, sources: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources`

Companion clocks are the June 1, 2020 Banned and Restricted Announcement. Every later ban in the lake is a later printed announcement, with the date that page names for that platform. Nothing is invented.

What most entries show: an agent that answers. What this one adds: three clocks for one sentence, both claims on screen with sources, and a bind that writes the decision back into the lake.

Dataset embeddings are on. This GROQ is live against `production`:

```groq
*[_type=="workedCall"]
  | score(text::semanticSimilarity("three tables disagree on one day"))
  | order(_score desc)[0]{title, _score}
```

It returned the desk call "Same words, June 2" with `_score` 8.1. The MCP URL the desk uses is `.../errata-desk?embeddings=true`, and each ask records a `text::semanticSimilarity` tool call.

{% agent_session errata-desk-june-3-across-three-clocks-3xcvye %}

## Recorded session

June 3, 2020, asked live on the desk. The model did not pick the rule. Context did.

Tools called, in order: `initial_context`, `array_field_reader` on `rules-change-companion.clocks`, `groq_query` for every `bringIntoGame` claim.

Result:

- Tabletop: pay 3. Switched June 1.
- Magic Online: pay 3. Switches that day.
- Arena: cast once from outside the game. Pay 3 is in the lake and not in force until June 4.

Keyword search returns both sentences. The chart shows why they are not a contradiction.

## Sanity Project Details

- Project ID: `gsu7qzk9`
- Dataset: `production` (public)
- Organization: `o4kqib00c`
- Public query: https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=count(*[_type==%22rulesClaim%22])
- Studio: https://luis-errata-desk.sanity.studio/
- Studio Workflows tab (project login): https://luis-errata-desk.sanity.studio/workflows
- Judge scorecard (no login): https://luiscore.com/errata-desk/score
- Live desk: https://luiscore.com/errata-desk/
- Needle: https://luiscore.com/errata-desk/needle
- Workflow instance: https://luiscore.com/errata-desk/workflow
- App SDK board: https://luiscore.com/errata-desk/app/
- Repo: https://github.com/AndyAnimus/errata-desk
- Context MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true
- Sources MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources
- Sign MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign
