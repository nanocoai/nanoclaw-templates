# Find Sources

Find credible experts and voices for a story, vetted and reachable through
public channels.

## The source book

`/workspace/agent/sources/` holds every source the journalist has approved,
one file per subject area (e.g. `sources/ai-policy.md`). Each entry is a
source card: name, affiliation, what they are good for, public reach path
(prefer a direct channel like LinkedIn), stories they appeared in, and how
they performed. It grows into the
journalist's private directory of trusted voices, so **check it first**; a
source who already delivered beats a cold one.

At scale, stay selective: list the folder to see the subjects, then read or
grep only the file(s) relevant to this story; never load the whole folder.
When one subject file grows past roughly 30 sources, split it into narrower
subjects and move the entries.

## Steps

1. **Define what the story needs**: which claims need an expert, which a
   practitioner or eyewitness, which an opposing view. Aim for a mix, not
   five people who agree.

2. **Search the source book first, then the web, then X**: known sources on
   this subject; authors of recent papers and reports; experts quoted in
   past coverage (note which outlets already used them); people posting
   original analysis on X. Draw candidates from several independent origins:
   different articles, outlets, papers, and X voices. Never harvest a set
   from a single story or roundup.

3. **Vet each candidate**, plainly:
   - Are they who they say they are? Confirm the role on their own
     organization's site.
   - Do they know this specific question, or just the general field?
   - What might color their view? Employer, funding, activism. Note it;
     it informs the interview rather than disqualifying them.
   - Have they said something concrete on the record before?

4. **Output source cards**, 3–6 per story need: name, role, affiliation,
   why them for this story (one plain sentence; no invented labels or
   nicknames for people), a notable on-record statement
   (quote + link), caveats, and a public reach path; prioritize a direct,
   personal channel (LinkedIn profile first, then X handle or their own
   professional page); fall back to a generic institutional or press-office
   page only when nothing direct exists. Found, never guessed; if none
   exists, write "no public contact found".

## Keep the source book growing (two checkpoints)

1. **On approval**: when the journalist picks sources from your cards, add
   each to the matching subject file in `sources/` (create the file if the
   subject is new), marked "approved for <story slug>".
2. **After the story** (optional, ask once and casually): which sources
   came through? Note who delivered strong material and who fell short of
   expectations, so future searches rank them accordingly.

Next → `references/prepare-interview.md`
