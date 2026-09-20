---
title: The Needle — one dial, three clocks
published: true
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

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

QA battery against the live desk: `14/14`. Workflow timed run: `8/8` (`timed-run-latest`). Logs in `demo/qa-battery.json`.

The ask desk, if you want the sentence instead of the dial: https://luiscore.com/errata-desk/

Studio, Clock board first: https://luis-errata-desk.sanity.studio/

{% agent_session errata-desk-june-3-across-three-clocks-3xcvye %}

## Code

https://github.com/AndyAnimus/errata-desk

The dial is `needle.html`. It posts "On Jun N 2020, what does each table do?" to the desk, which calls `initial_context`, `array_field_reader` on the clocks, `errata-sources`, and `groq_query`. The green arc is painted from those dates, not from a picture of a card.

## My Build Process

This started as the Path One agent. The chart on that page already showed three bars. Path Two asked for something strange, so the bars became a dial you turn, and the Studio landing tool became a clock board instead of an empty document pane.

I did not add a second schema for the dial. The strangeness is the interface. The structure was already the point: one rule, three effective dates. Reusing it is the honest version. A new document type just to look busy would have been the fake one.

Embeddings are on for the dataset now. A meaning query for "three tables disagree on one day" returns the desk call "Same words, June 2" with a real `_score`, via `text::semanticSimilarity`. That flag is `sanity.project.datasets/update`, which the robot tokens do not have. It was enabled from the signed-in project, status `updating`, then a live GROQ returned a score.

The session embed above is a Codex run that curled the public calls list and named the June 3 call. It is that transcript, not a written summary.

## Sanity Project Details

- Project ID: `gsu7qzk9`
- Dataset: `production` (public)
- Organization: `o4kqib00c`
- Studio: https://luis-errata-desk.sanity.studio/
- Needle: https://luiscore.com/errata-desk/needle
- Context MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-desk?embeddings=true
- Sources MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sources
- Sign MCP: https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign
