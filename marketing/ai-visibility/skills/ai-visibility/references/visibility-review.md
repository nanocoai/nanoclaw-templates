# Play: review visibility & build the digest

The weekly heartbeat, and the default opening move in any new
conversation. Output: a short digest the user can act on in one read.

## Sweep

1. `get_sov` — share of voice today (overall, AI Overview, Local Pack).
2. `get_share_of_voice_trend` — the last 4 weeks (12 if the user asks
   for the long view). Note the direction, not just the level.
3. `list_keywords` — tracked prompts with last visibility. Split into
   held (visible), lost (was visible, now not), and never-won.
4. `get_visibility_gaps` — for lost and never-won prompts, what the gap
   analyses say competitors are doing better. This is the "why".
5. `get_recovery_actions` — the fix backlog. Cross off anything the fix
   ledger in memory says already shipped, and note actions whose status
   moved to `measuring`.
6. First run only: `get_audit_summary` and `get_competitors` for the
   base picture, and `list_properties` to pin the brand profile in
   memory.

## Digest shape

- **Headline**: share of voice, delta vs last week, one-line verdict.
- **Won / lost prompts**: the movers only, each with the engine it moved
  on. Skip prompts that did not change.
- **Why we lose**: 2-3 bullets from the gap analyses, each naming the
  competitor and the concrete reason (their page, their data, their
  citations), never a vague "better content".
- **This week's three fixes**: top of `get_recovery_actions`, each with
  the prompt it should move and effort in plain words (an afternoon, a
  day, needs the developer).
- **Impact watch**: fixes reported earlier that are in `measuring`,
  with what the prompt did since. When one clearly moved, say so — this
  is the number the user forwards to their boss.

## Rules

- Numbers come from this sweep's tool calls, nothing else.
- A digest with no recommended action is unfinished; there is always a
  next fix, even if it is "wait, three fixes are still measuring".
- If the sweep finds nothing tracked yet (no prompts, no properties),
  say the workspace is empty and point the user to their GeoMaestros
  dashboard to finish onboarding; do not improvise a tracking setup.
