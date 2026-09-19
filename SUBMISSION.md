---
title: Errata Desk — same rule, three clocks
published: true
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path One: Ship an Agent That Queries Real Content](https://dev.to/challenges/sanity-2026-09-16)*

## What I Built

Errata Desk answers a rules question keyword search gets wrong.

On June 1, 2020 Wizards changed how Magic companions enter the game. The new procedure is: pay 3 generic mana, put the companion into your hand, then cast it. That change did not land everywhere on the same day.

- Tabletop: June 1
- Magic Online: June 3
- MTG Arena: June 4

Ask "two days before Arena switched, do I pay 3 or cast it from outside the game?" A search for "cast your companion" returns both sentences. They look like a contradiction. They are not. Arena on June 2 is still on the old reminder. The table is already on the new one.

The agent only keeps a `rulesClaim` whose `platform` matches and whose `effectiveFrom` / `effectiveUntil` window covers the date. The other claim stays visible, labeled not in force, with its source.

Then you can **bind the call**. That writes a `ruling` document for that platform and day. The next ask returns the standing ruling from the lake instead of deriving again — the challenge line about a decision carrying across future builds, as an actual write.

The public dataset holds the procedure claims, the three clocks, and nine desk calls written for this entry. Each call is a question a keyword search gets wrong, with the finding stored next to the date. Card images are not the product.

## Demo

**Live desk (type anything):** https://luiscore.com/errata-desk/

Studio: https://luis-errata-desk.sanity.studio/

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
2. `array_field_reader` — `rules-change-companion.clocks` (the three switch dates)
3. `groq_query` — standing `ruling` first, then `rulesClaim` rows for that platform
4. Window filter in code — the model never invents which claim is in force
5. Optional `POST /rule` — writes `ruling-{platform}-{date}` so the next ask is bound

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

- `rulesClaim` — game, subject, predicate, platform, status, value, quote, effectiveFrom, effectiveUntil, sourceTitle, sourceUrl
- `rulesChange` — title, subject, sourceUrl, `clocks[]` (platform + switchesOn) for `array_field_reader`
- `ruling` — standing answer after a bind

## How I Used Sanity

Sanity Context is pointed at this project's own content.

- Studio v6 at https://luis-errata-desk.sanity.studio/
- `sanity.agentContext` slug `errata-desk`, filter `_type in ["rulesClaim", "ruling", "rulesChange"]`
- Instructions tell the agent: read clocks with `array_field_reader`, check `ruling` before deriving, never treat word overlap as current
- Context MCP: `https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk`

Source for every quote: the June 1, 2020 Banned and Restricted Announcement, which states the new companion rule and the three effective dates.

What most entries show: an agent that answers. What this one adds: three clocks for one sentence, both claims on screen with sources, and a bind that writes the decision back into the lake.

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
- Studio: https://luis-errata-desk.sanity.studio/
- Live desk: https://luiscore.com/errata-desk/
- Repo: https://github.com/AndyAnimus/errata-desk
- Context MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk
- Public query: https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=*[_type==%22rulesClaim%22]
