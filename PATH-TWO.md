---
title: The Needle — one dial, three clocks
published: true
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

Open https://luiscore.com/errata-desk/needle. It starts on June 3: tabletop and Magic Online have switched, Arena has not. Turn to June 2 and sign the Arena case with a name. The agent is not allowed to do that step. The same unsigned case is on the App SDK board: https://luiscore.com/errata-desk/app/

Project `gsu7qzk9`, dataset `production` (public).

## What I Built

The Needle is not a chat. It is a dial.

You turn June 1, June 2, June 3, or June 4. Three rings on one face. Brown is the old companion reminder. Green is pay 3. The hand lands on the day, and the lake paints what each table is actually doing.

June 3 is the strange day. Tabletop has already switched. Magic Online switches that morning. Arena has not. Same sentence, three answers, one instrument.

The dial is one surface. The other is an App SDK board on the same lake: https://luiscore.com/errata-desk/app/

That board reads `deskCase` documents live. `decidedBy` and `decidedAt` render as a dash until someone signs. The workflow that gets a case there is stored as data (`workflow-sign-call`): the agent may derive, and only a person may sign. A timed edit run of that workflow finished 8/8. The run is the document `timed-run-latest`. One of the eight steps is the agent being refused when it tries to sign.

## Demo

Turn it: https://luiscore.com/errata-desk/needle

On June 2, Arena stays unsigned on the dial. Type a name and Sign. The agent is refused if it tries that move. The same case shows on the App SDK board: https://luiscore.com/errata-desk/app/

No-token check: https://luiscore.com/errata-desk/check

QA battery against the live desk: `43/43`. Workflow timed run: `8/8` (`timed-run-latest`). Logs in `demo/qa-battery.json`. The public lake holds 138 `rulesClaim` rows and 9 primary-source excerpts.

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

## Sanity Project Details

- Project ID: `gsu7qzk9`
- Dataset: `production` (public)
- Organization: `o4kqib00c`
- Studio: https://luis-errata-desk.sanity.studio/
- Needle: https://luiscore.com/errata-desk/needle
- Context MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true
- Sources MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources
- Sign MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign
