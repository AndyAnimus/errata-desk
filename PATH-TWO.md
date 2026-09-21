---
title: The Needle — one dial, three clocks
published: true
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

No login on the dial, the board, the scorecard, or the workflow page. The Studio Workflows tab needs a project seat. Start here:

1. https://luiscore.com/errata-desk/needle — opens on June 3. Tabletop and Magic Online have switched. Arena has not.
2. Turn to June 2. Sign with a name, or click **Try as agent**. The agent is refused. `decidedBy` stays empty.
3. https://luiscore.com/errata-desk/workflow — the official Workflows instance. The editor token is refused on sign. Stage stays `awaitingSignature`.
4. https://luiscore.com/errata-desk/app/ — App SDK board. Unsigned fields render as a dash.
5. https://luiscore.com/errata-desk/score — the same probes, one click.

Project `gsu7qzk9`, dataset `production` (public).

## What I Built

The Needle is not a chat. It is a dial.

You turn June 1, June 2, June 3, or June 4. Three rings on one face. Brown is the old companion reminder. Green is pay 3. The hand lands on the day, and the lake paints what each table is actually doing.

June 3 is the strange day. Tabletop has already switched. Magic Online switches that morning. Arena has not. Same sentence, three answers, one instrument.

The dial is one surface. The other is an App SDK board on the same lake: https://luiscore.com/errata-desk/app/

That board reads `deskCase` documents live. `decidedBy` and `decidedAt` render as a dash until someone signs. The workflow that gets a case there is stored as data (`workflow-sign-call`): the agent may derive, and only a person may sign. A timed edit run of that workflow finished 8/8. The run is the document `timed-run-latest`. One of the eight steps is the agent being refused when it tries to sign.

## Demo

Judge scorecard: https://luiscore.com/errata-desk/score

Turn it: https://luiscore.com/errata-desk/needle

On June 2, Arena stays unsigned on the dial. Type a name and Sign, or click Try as agent. The agent is refused. The same case shows on the App SDK board: https://luiscore.com/errata-desk/app/

Live Workflows instance: https://luiscore.com/errata-desk/workflow

No-token check: https://luiscore.com/errata-desk/check

QA battery against the live desk: `54/54`. Workflow timed run: `8/8` (`timed-run-latest`). The public lake holds 272 `rulesClaim` rows and 17 primary-source excerpts from printed Wizards announcements (2019–2021), each claim carrying FR/DE/ES.

The ask desk, if you want the sentence instead of the dial: https://luiscore.com/errata-desk/

Studio, Clock board first: https://luis-errata-desk.sanity.studio/

{% agent_session errata-desk-june-3-across-three-clocks-3xcvye %}

## Code

https://github.com/AndyAnimus/errata-desk

The dial is `needle.html`. It posts "On Jun N 2020, what does each table do?" to the desk, which calls `initial_context`, `array_field_reader` on the clocks, `errata-sources`, and `groq_query`. The green arc is painted from those dates, not from a picture of a card.

## My Build Process

Path Two is scored on the build as much as the result, so this is the actual sequence.

The Path One page already drew three bars for one week. A chat box was the wrong object. The strange part is that June 3 is three legal states at once, so the bars became a dial you turn. I did not add a schema for the dial. `needle.html` posts “On Jun N 2020, what does each table do?” and paints the lanes from the `compare` array. If the lake is wrong, the dial is wrong. That was the point.

The bonus the brief asked for was already the desk’s problem: an agent may move a case forward, and a person approves through the same transitions. That process is the document `workflow-sign-call`, not a comment in the server. States are asked → derived → awaitingSignature → signed. `scripts/timed-run.mjs` walks it and writes `timed-run-latest`. The run is 8/8. Two of the eight steps are refusals: the agent cannot sign, and a blank name cannot sign. I left those failures in the log.

The App SDK board is the other surface past the Studio. It reads `deskCase` live. `decidedBy` and `decidedAt` render as a dash until the sign call. I did not build a second copy of the cases for the board.

What I did not do: a second document type to look busy, a fake hotel catalog, or ban dates that are not printed on the Wizards page. The 2020 announcements in the lake are there because each one prints a different tabletop, Magic Online, or Arena clock. Volume that fails that test would have been padding.

Embeddings are on. A meaning query for “three tables disagree on one day” returns the desk call “Same words, June 2” with a real `_score`, via `text::semanticSimilarity`. Turning that flag on needs `sanity.project.datasets/update`, which the robot tokens do not have. It was enabled from the signed-in project.

The session embed is a Codex run that curled the public calls list and named the June 3 call. It is that transcript, not a summary of it.

## Sanity Workflows

The homemade gate was not the product Brawndo shipped. I installed `@sanity/workflow-engine`, `@sanity/workflow-cli`, and `@sanity/workflow-studio-plugin` at 0.33.0 and deployed a definition named `sign-call` v1 onto `gsu7qzk9.production`.

The definition has four stages: asked, derived, awaitingSignature, signed. Derive and hold are `editor` actions. Sign is `administrator` only. The robot token on this project is an editor. It started instance `production.wf-instance.6be7291055cc`, fired derive, fired hold, and was refused on sign.

That instance is not on the public API. The page a judge can open with no login reads it through the desk and will try the sign action again:

https://luiscore.com/errata-desk/workflow

The last click returned `Action "sign:sign" is not allowed: action filter returned false`, and the stage stayed `awaitingSignature`.

The Studio tab is mounted: https://luis-errata-desk.sanity.studio/workflows

Plugin 0.33.0 imports `Popover`, `Tooltip`, `Menu`, and `useToast` from the `@sanity/ui` barrel. Studio 6 is on UI v4, which moved those to subpaths and dropped them from the barrel. `studio/ui-compat.ts` re-exports the subpaths, and the Vite alias applies only to the exact specifier `@sanity/ui`. The tab needs a project login. The public page does not.

## Sanity Project Details

- Project ID: `gsu7qzk9`
- Dataset: `production` (public)
- Organization: `o4kqib00c`
- Public query: https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=count(*[_type==%22rulesClaim%22])
- Studio: https://luis-errata-desk.sanity.studio/
- Studio Workflows tab (project login): https://luis-errata-desk.sanity.studio/workflows
- Needle: https://luiscore.com/errata-desk/needle
- Scorecard: https://luiscore.com/errata-desk/score
- Workflow instance: https://luiscore.com/errata-desk/workflow
- App SDK board: https://luiscore.com/errata-desk/app/
- Repo: https://github.com/AndyAnimus/errata-desk
- Context MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true
- Sources MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources
- Sign MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign
