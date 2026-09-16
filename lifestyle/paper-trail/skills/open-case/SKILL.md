---
name: open-paper-trail-case
description: Create a new Paper Trail case workspace when the user has described one evidence problem and the outcome they want, or resume an existing case without overwriting it.
---

# Open a case

## Inputs

- short title;
- requested outcome in the user's words;
- optional known parties;
- whether evidence collection is complete.

## Procedure

1. Create a lowercase case slug from the title using letters, numbers, and
   single hyphens. Keep it under 64 characters.
2. Check `cases/<slug>/`. If it exists, do not overwrite it. Ask whether to
   resume that case or choose a different slug.
3. Run:

   ```bash
   node plugins/paper-trail/skills/ingest-evidence/scripts/evidence-ledger.mjs init \
     "cases/<slug>" "<title>" "<requested outcome>"
   ```

4. Read the JSON result and confirm the created path.
5. Record parties only when the user supplied them. Do not infer legal roles.
6. Keep state `OPEN` until at least one exhibit has been indexed.

Shell-escape every user-derived argument. Never construct a shell command by
concatenating untrusted text; pass arguments as separately quoted values.

## Resume behavior

Read `case.json` and `manifest.json`. Report the current state and counts. Do
not rerun `init`. Continue at the first incomplete workflow stage.
