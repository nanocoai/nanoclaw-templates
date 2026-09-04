# trade-front-desk

NanoClaw Agent Plugins 1.0.0 template for a small trade business front desk on a Dial phone line (plumbing, HVAC, electrical, concrete, roofing). Dial track entry for the NanoClaw Templates Hackathon (Sep 2026).

## What it does

Answers inbound texts on the shop Dial line in each caller's own thread.
Handles voice-call follow-up after Dial posts a call-ended notice or transcript.
Collects name, 10-digit callback, job type, address plus city, and one of two standard callback windows.
On an emergency thread the safe instruction goes out first and the owner is paged, with no question before either. After that, if the caller keeps texting and is safe, the desk collects name, callback number, and address only: no job-type question, no window offer. The window is EMERGENCY_WINDOW as defined in hours-and-windows.md.
Loads a trade playbook, matches English or Spanish, and appends a money-ledger line per outcome.
Sends a short caller receipt, a nightly self-audit, and a Monday money digest whose arithmetic comes from a script.

Two of those are shipped but not yet proven live on the v2 stamp: the voice-call follow-up and the caller receipt. No thread reached a confirmed complete intake on the proof runs, and the v2 stamp's own call proof is pending Dial credit. PROOF.md section 6 lists what ran and what did not.

## Who it is for

Owners of small US trade shops who miss calls after hours and want a calm front desk that books the job and protects the owner line.

## Why this desk is different

**D1 self-proving.** A nightly task scores the last 24 hours of caller threads against a fixed rubric and posts one health line to the owner. A non-emergency thread scores on name, 10-digit callback, job type, address plus city, one of the two windows, a confirmation line, and language match. An emergency thread scores on safe instruction first, owner paged, EMERGENCY_WINDOW, ledger outcome `emergency`, and whichever of name, callback number, and address the caller gave. On a day with no traffic it runs a scripted rehearsal and reports drift.

**D2 money ledger.** Every complete, abandoned, emergency, or spam outcome appends one JSON line to a per-plugin ledger. A Monday script sums the week by outcome and job type and prints coaching counts. The model only narrates those printed numbers.

**D3 playbooks.** After job type is known, the desk opens a trade file (plumbing, HVAC, electrical, concrete, roofing) with the extra intake fields that matter, exact emergency trigger phrases, the safe-instruction line to give right now, and typical callback windows.

**D4 bilingual.** The desk answers in the caller's language from the first message, English or Spanish, same five fields. It never switches mid-thread unless the caller does.

**D5 owner coaching.** The weekly digest ends with exactly one recommended change, chosen by six threshold rules over the counts the digest script prints: after-hours emergencies, abandoned at the address or city step, price questions per job type, spam, Spanish intakes, and abandoned intakes overall. If none of the six trips, the line is "no change this week" plus why.

## Credentials and services

Dial is a paid service (https://getdial.ai). Use the tier that includes a phone number with SMS and voice. Put your own Dial key in the OneCLI Agent Vault. This template ships no other services and no secrets. Owner phone placeholders live in `ai.nanoco.nanoclaw/context/additional_context/owner-contact.md` (`{{OWNER_PHONE}}`) until you fill them on the host. The money ledger lives at `/workspace/agent/plugin-data/trade-front-desk/ledger.jsonl` (writable per-plugin state; `/workspace/agent/plugins` is read-only on a stamped host).

- API host: `api.getdial.ai`. The OneCLI gateway authenticates requests there; the key never enters the sandbox.
- Auth style: the account API key, stored in the OneCLI vault by the `dial` CLI at sign-in (email plus a 6-digit code).
- Scope: one phone number on the account, with SMS and voice enabled.
- Where to get it: sign in with the `@getdial/cli` package. No key is ever pasted into the template.

## Operator steps in order

1. Stamp: `ncl groups create --template sales/trade-front-desk --name "Trade Front Desk"`
2. Pair Dial with `ncl dial` (see NanoClaw Dial docs). If that number was already paired to another agent, move it with the channel wizard: re-pointing the destination alone leaves existing threads answering on the old agent. That cost us two failed proof runs.
3. Set the number policy to `public` (default `owner` refuses strangers).
4. Paste this inbound voice instruction on the number: "You are the shop AI front desk. Collect name, 10-digit US callback, job type, street and city, and one of two windows. One question at a time. Texts under 320 characters. No prices. Do not claim to be human. Gas smell or carbon monoxide alarm: leave the building, do not flip any switches or light anything, and call 911 from outside. Sewage backup or water you cannot shut off: if water is spreading and it is safe, shut the main water valve and stay clear of electrical panels. No heat below 20°F or no cooling above 95°F with an infant or elderly person: get to a safe temperature. Sparking, burning smell at an outlet or panel, partial outage with hot outlets, or water near a panel: leave the area; do not touch. Active roof leak or storm damage with exposed decking: stay off the roof and keep clear. For any of those: that safe line first, then page the owner, no question before either. Then name, callback, and address only: no job type, no window unless the shop set an on-call window."
5. Fill `additional_context/business-profile.md` (`trade:`, `on_call_window`, and the `at_risk_usd` average-ticket table) and `additional_context/owner-contact.md` (`{{OWNER_PHONE}}`). Leave `on_call_window` as `unset` if the shop has no on-call span: emergencies then page the owner and promise no window at all. Never commit real numbers.
6. Send a test text and place a test call. Confirm each produced an intake.
7. Resume tasks: `ncl tasks resume`. Tasks stamp paused on purpose.

## What happens when it fails

- Dial down: the owner thread is told Dial is down; the desk does not invent a second outbound path.
- Caller refuses a field: that field is noted, the rest of the intake continues, and the thread stays incomplete until they give it or 30 minutes of silence marks it abandoned.
- Non-US number: the desk asks once for a 10-digit US callback, keeps the rest of the intake, and does not dial the foreign number.
- Ledger unwritable: if `/workspace/agent/plugin-data/trade-front-desk/ledger.jsonl` cannot be created or appended (mkdir/write fail), the caller conversation still finishes; the owner thread is told the append failed.
- Owner placeholder unset: no guessed number is dialed; the caller is told the request is saved and the owner will follow up when contact is configured.

## What it deliberately does not do

- Quote prices unless a flat fee is listed in context
- Dial or text a caller-supplied third number
- Claim to be a human
- Give medical or legal advice, or DIY steps for gas, electrical, or CO
- Send outbound SMS marketing
- Install `/add-dial-tool` on a public line
- Run money-digest arithmetic inside the model
- Ship MCP servers or API keys

## The demo

What is proven, in [PROOF.md](PROOF.md) (numbers masked): an English SMS intake and an emergency text on the real Dial line, both answered by the stamped v2 agent on a cold container; a Spanish intake end to end; an emergency re-run against the current playbook floor; a routine intake that turns into a gas smell mid-thread; and the nightly self-audit scoring the night's real traffic. The Spanish and emergency runs after 02:52 were injected through the NanoClaw CLI because the Dial balance had blocked outbound SMS; the reply text comes from the session transcript.

The only call transcript is section 3, the 2026-09-02 recording on the v0.1 stamp, when the agent was named Sarah. It is not a v2 transcript, and the v2 stamp's own call proof is pending Dial credit.

The video shows: stamp, a text intake, the live Spanish intake, the 2026-09-02 recorded call on the v0.1 stamp, an emergency escalation, the ledger next to the Monday digest script's printout, and the self-audit health line as the task logged it on the box. That health line never left the line (Dial balance); PROOF.md section 6 says so.

## How this was built

Every row below is a review finding turned into a change. Times are CT on 2026-09-04 unless noted.

| Time | Built by | What changed | What the next review found |
| --- | --- | --- | --- |
| 9/2 | Themis VM (Grok 4.6) | v0.1 of this desk, PR #83. SMS and voice proofs passed on the live Dial line. | Carried in as the base. The hackathon brief opened 9/4 00:06. |
| 00:16 | Themis VM (Grok 4.6) | Round 1, PR #112: registry layout, five playbooks, rehearsal, audit rubric, ledger format, nightly audit task, weekly digest script. | The dispatch webhook truncated the 10.6 KB spec, so round 1 invented a caller receipt and skipped owner coaching, two skills, and the fixture. |
| 00:28 | Themis VM (Grok 4.6) | Round 2: coaching rules, Spanish intake, the ledger-append and self-audit skills, sample ledger, README in the spec's order. | Review lane: the post-call path texted the caller before checking for emergency phrases and could ledger one call twice; four playbooks had no callback windows. |
| 00:33 | Cursor Cloud | Repair: post-call order fixed, double ledger closed, spec files taken off the branch. | It emptied a spec file instead of deleting it. The specs moved to main so repair agents on a branch cannot touch them. |
| 00:45 | Themis VM (Grok 4.6) | Round 3: typical callback windows in the plumbing, HVAC, electrical, and roofing playbooks. | Review lane: the no-heat threshold differed between the rules file and the HVAC playbook, the Spanish safety lines had drifted from the English, and Spanish job words were not mapped to the ledger keys. |
| 00:50 | Themis VM (Grok 4.6) | Round 4: those three closed. | The first live run found the bug no static check can see. |
| 00:42 to 00:51 | Forge (host) | First live proofs on the Dial line. Two reroutes on the way: a paired line's binding lives in `messaging_group_agents` and the peer's session row, not only in `agent_destinations`. | English SMS intake PASS on a cold container (section 1); the gas-smell reply PASS at 00:51 (section 2). |
| 01:00 | Themis VM (Grok 4.6) | Round 5: the ledger moved to `/workspace/agent/plugin-data/` after the live run proved the `plugins` mount is read-only; the emergency skill posts in-thread when the owner is the caller thread. | Review lane: the README voice instruction carried only part of the emergency floor, the gas line lacked the no-switches rule, and the safe line keyed off the shop's trade instead of the matched trigger. |
| 01:2x | Themis VM (Grok 4.6) | Round 6: full floor in the voice instruction, no-switches rule, trigger-keyed safe line, Spanish lines one per English line. | Review lane: an emergency caller could still be promised one of the two standard windows. |
| 01:38 | Themis VM (Grok 4.6) | Round 7: one `EMERGENCY_WINDOW` rule in hours-and-windows.md. | Review #8: the rule never reached the always-on persona files, the plumbing window table fought its own trigger list, and the README claimed a Spanish scene the proof did not back. |
| 02:33 | the desk itself | The nightly task ran on its 02:30 schedule and scored the night's one real thread (section 4). | Its health line could not leave the line: the Dial balance had gone negative. |
| 02:53 | Opus seat | Round 8: the emergency exception in every persona file that states the two-window rule, playbook trigger tables, honest labels on the recorded call, em dashes to zero. | Review #10: four more places where the window rule fought itself, including the unset on-call fallback and Spanish question 5. |
| 02:54 to 03:01 | Forge (host) | Live proofs injected through the NanoClaw CLI once Dial credit ran out: the emergency re-run against the current floor, then the Spanish intake end to end. | The Spanish read-back omitted the callback number. |
| 03:12 | Opus seat | Round 9: `EMERGENCY_WINDOW` defined once and pointed at by all 30 two-window statements, the trigger scan before any question, the five-field read-back. | The 03:13 live run proved the scan-first rule (section 9). The read-back change is still unproven live. |
| 03:18 | pipeline autopilot | PR #112 merged. | The merged tree went to the publish gauntlet. |
| 03:25 | Grok 4.6, two barrels | Publish gauntlet on the merged template: one proof lens, one file lens. | A wrong first-reply number, two capabilities no transcript backs, a fixed-gap claim, an emergency path that said both "collect nothing" and "collect the fields", and a trigger owned by two playbooks. |
| 03:3x | Opus gate | This pass: the emergency path unified in one phrasing across seven files, proof numbers corrected against the transcripts, unproven capabilities labeled as shipped-not-proven, this table. | Open. |

The full play-by-play, including the lanes that died and the dispatches that were dropped, ships as [BUILD_LOG.md](BUILD_LOG.md) next to this README.

## Credit

Built by LegacyForge AI (legacyforgeai.com) for the NanoClaw Templates Hackathon, September 2026. MIT.
