# Privacy and review records

Derived records exist only to recognize related messages during the seven-day review window.

## Storage

Write records under:

```text
/workspace/agent/memory/youth-group-safety/review-notes/
```

Use a filename such as `note-<UTC compact timestamp>-<short random suffix>.md`. Do not use a child's name or phone number in the filename.

Each file uses this shape:

```markdown
---
created_at: 2026-08-24T10:22:31.000Z
expires_at: 2026-08-31T10:22:31.000Z
attention: review
source_message_id: <platform message id>
related_note: <optional filename only>
---

Sender label: <WhatsApp display name>
Minimal excerpt: <only what is needed>
Reason for review: <one tentative sentence>
```

Use ISO-8601 UTC timestamps with `Z` in storage. Use the configured local timezone in moderator messages.

## Minimization

- Do not store raw images, audio, full transcripts, phone numbers, or unrelated surrounding conversation.
- Do not create a child profile, risk score, running biography, or permanent behavior label.
- Store at most one short excerpt and one related-note link.
- A display name is a conversational label, not verified identity.
- Original WhatsApp and NanoClaw session history has its own retention; this seven-day rule covers only these derived review notes.

The paused cleanup task deletes expired records. Invalid records are retained and reported privately so an adult can correct the configuration without silently losing data.
