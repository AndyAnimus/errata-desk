---
title: The Needle — one dial, three clocks
published: true
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

The dial is https://luiscore.com/errata-desk/needle. It opens on June 3. No account.

The Studio Workflows tab wants a project login. Everything else below does not.

1. Turn the dial to June 2. Sign with a name, or click **Try as agent**. The agent is refused and `decidedBy` stays empty.
2. https://luiscore.com/errata-desk/workflow — workflow instance `production.wf-instance.6be7291055cc`. Sign as the editor is refused. Stage stays `awaitingSignature`.
3. https://luiscore.com/errata-desk/app/ — same case. Unsigned fields are a dash.
4. https://luiscore.com/errata-desk/score — reruns the cases.

Project `gsu7qzk9`, dataset `production` (public).

## What I Built

The Path One page already had three bars for one week. A text box didn't show the thing I kept tripping on: June 3 is three different answers. So the bars became a dial.

You turn June 1, 2, 3, or 4. Brown is the old companion reminder. Green is pay 3. On June 3, paper has already switched, Magic Online switches that morning, and Arena has not.

There is no schema for the dial. `needle.html` posts "On Jun N 2020, what does each table do?" and paints the lanes from the `compare` array.

The other page on the same lake is the sign board: https://luiscore.com/errata-desk/app/

It reads `deskCase`. `decidedBy` and `decidedAt` are a dash until someone signs. The transitions live in `workflow-sign-call`: the agent can derive, and only a person can sign. `timed-run-latest` is 8/8. One of those steps is the agent being refused.

## Demo

Dial: https://luiscore.com/errata-desk/needle

On June 2 the Arena case is unsigned. Type a name, or click Try as agent.

Sign board: https://luiscore.com/errata-desk/app/

Workflow: https://luiscore.com/errata-desk/workflow

Checks: https://luiscore.com/errata-desk/score

No-token JSON: https://luiscore.com/errata-desk/check

Battery against the live desk: `54/54`. Workflow run: `8/8` (`timed-run-latest`). 272 `rulesClaim` rows, 17 source excerpts from the printed announcements (2019–2021), with FR/DE/ES on the claims.

The ask page, if you want the sentence instead of the dial: https://luiscore.com/errata-desk/

Studio: https://luis-errata-desk.sanity.studio/

{% agent_session errata-desk-june-3-across-three-clocks-3xcvye %}

## Code

https://github.com/AndyAnimus/errata-desk

`needle.html` posts to the desk. The desk calls `initial_context`, `array_field_reader` on the clocks, `errata-sources`, and `groq_query`. The green arc is those dates.

## My Build Process

I started from the three bars on the Path One page. The week is the whole product, and June 3 is the day the three rings don't match, so I wanted to turn the day instead of typing it. If the lake is wrong, the dial is wrong. I didn't add a document type for the picture.

The brief also asks for an approval step. That was already the desk's problem, so I stored it as `workflow-sign-call` instead of a branch in the server. States are asked → derived → awaitingSignature → signed. `scripts/timed-run.mjs` walks it and writes `timed-run-latest`. Two of the eight steps fail on purpose: the agent cannot sign, and a blank name cannot sign. Both refusals are in the log.

The sign board is a second view of `deskCase`, not a second copy of the cases. Unsigned fields render as a dash.

I didn't add a document type just to have one, and I didn't put dates in the lake that aren't on the Wizards page. The 2019–2021 announcements are there because each page prints a different paper, Magic Online, or Arena date.

Embeddings are on. A query for "three tables disagree on one day" returns the call "Same words, June 2" with a `_score`, through `text::semanticSimilarity`. Turning embeddings on needs `sanity.project.datasets/update`. The robot tokens don't have that. I did it from the signed-in project.

The session embed is a Codex run that curled the public calls list and named the June 3 call. It's the transcript.

## Sanity Workflows

I installed `@sanity/workflow-engine`, `@sanity/workflow-cli`, and `@sanity/workflow-studio-plugin` at 0.33.0 and deployed `sign-call` v1 onto `gsu7qzk9.production`.

Four stages: asked, derived, awaitingSignature, signed. Derive and hold are `editor`. Sign is `administrator`. The token on this project is an editor. It started `production.wf-instance.6be7291055cc`, fired derive, fired hold, and was refused on sign.

That instance is not on the public API. This page reads it through the desk and tries sign again:

https://luiscore.com/errata-desk/workflow

The last click returned `Action "sign:sign" is not allowed: action filter returned false`. The stage stayed `awaitingSignature`.

Studio tab: https://luis-errata-desk.sanity.studio/workflows

Plugin 0.33.0 imports `Popover`, `Tooltip`, `Menu`, and `useToast` from the `@sanity/ui` barrel. Studio 6 is on UI v4, which moved those off the barrel. `studio/ui-compat.ts` re-exports the subpaths. The Vite alias is only the exact specifier `@sanity/ui`. The Studio tab needs a project login. The page above does not.

## Sanity Project Details

- Project ID: `gsu7qzk9`
- Dataset: `production` (public)
- Organization: `o4kqib00c`
- Public query: https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=count(*[_type==%22rulesClaim%22])
- Studio: https://luis-errata-desk.sanity.studio/
- Studio Workflows tab (project login): https://luis-errata-desk.sanity.studio/workflows
- Needle: https://luiscore.com/errata-desk/needle
- Checks: https://luiscore.com/errata-desk/score
- Workflow: https://luiscore.com/errata-desk/workflow
- Sign board: https://luiscore.com/errata-desk/app/
- Repo: https://github.com/AndyAnimus/errata-desk
- Context MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true
- Sources MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources
- Sign MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign
