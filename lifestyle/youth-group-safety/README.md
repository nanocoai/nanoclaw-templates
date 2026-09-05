# Youth Group Safety Agent Template

A consent-first NanoClaw agent that quietly reviews one youth WhatsApp group and sends possible concerns to a separate group of trusted adults. It does not judge children, reply in the monitored group, contact parents automatically, or make safeguarding decisions.

The moderator experience is intentionally calm: `For review`, `Please review soon`, or `Please review now`, followed by the smallest useful quotation or local media description and a reminder to check the original conversation.

Open [`docs/flow.html`](docs/flow.html) locally for a visual walkthrough.

## Coverage

| Reviewed | How |
|---|---|
| Text and captions | Contextual language review, including Hebrew/English mixed chat |
| Images and screenshots | Local Ollama vision model |
| Static and animated stickers | Local frame extraction plus Ollama vision |
| Voice notes | Local `whisper.cpp` multilingual transcription |
| Video and documents | Caption/text only; the file itself is not reviewed |

Raw downloaded media is not copied to moderators. The review helper deletes its local session copy after processing. Operators should also configure host-side stale-inbox cleanup for media left behind by a crash. Derived review notes expire after seven days. This does not delete the original WhatsApp message or NanoClaw session history.

## Required host setup

This template configures the agent's behavior; it cannot install host software or connect real WhatsApp groups. Before activation, the operator must provide:

- NanoClaw's native WhatsApp adapter and a **dedicated, visible WhatsApp number**.
- A WhatsApp adapter with session-inbox media staging and inbound sticker support. Without that adapter update, text works but media cannot be reviewed reliably.
- `ffmpeg`, a pinned `whisper.cpp` binary, and the pinned multilingual `ggml-small` model.
- A local Ollama installation with a vision-capable model.
- The monitored-group wiring and the outbound-only `moderator-review` destination.

Write the media configuration to `groups/<agent-folder>/plugin-data/youth-group-safety/config.json`. The default runtime paths expected inside the container are:

```json
{
  "enabled": true,
  "visionEndpoint": "http://host.docker.internal:11434",
  "visionModel": "<local vision model>",
  "whisperBinary": "/workspace/agent/plugin-data/youth-group-safety/bin/whisper-cli",
  "whisperModel": "/workspace/agent/plugin-data/youth-group-safety/models/ggml-small.bin",
  "deleteSource": true,
  "rawMediaMaxAgeMinutes": 60,
  "reviewNoteRetentionDays": 7
}
```

Keep Ollama reachable only from the local host/container boundary. Do not expose its unauthenticated port to the internet.

The linked-device WhatsApp adapter uses Baileys rather than Meta's official Business Cloud API. A separate number is strongly recommended because automated linked-device use can put a WhatsApp account at risk. The official Cloud adapter cannot currently observe WhatsApp groups.

The template contains no credentials and has no automatic cloud fallback. If the main agent provider is cloud-hosted, derived text, transcripts, and local visual descriptions may be sent to that provider; disclose that before activation. A local agent provider is preferred for this use case.

## Group topology

```text
Youth WhatsApp group
        │ every message
        ▼
Youth Group Safety agent
        │ possible concern only
        ▼
moderator-review (trusted adults, outbound-only)
        │
        └─ adults decide whether and how to follow up
```

There is no parents destination, approval command, or automated escalation. If an adult decides parents should be contacted, the adult does that manually in ordinary WhatsApp.

## Disclosure before activation

Adapt this text to the group and local safeguarding policy before monitoring begins:

> This group includes a visible automated assistant that reviews new text, images, stickers, and voice notes for messages that may need an adult's attention. It stays silent here and sends brief, private notes only to the designated adult review group. Adults make every decision. Media processing runs locally and downloaded copies are deleted after review. Video and documents are not analyzed. Please ask the group administrators if you have questions about how it works or how long derived notes are kept.

Obtain the consent or authorization required by the school, club, families, and applicable law. Use at least two trusted adult reviewers where practical, and ensure they understand that the system can miss context and make mistakes.

## Stamping and wiring

```bash
ncl groups create --template lifestyle/youth-group-safety --name "Youth Group Safety"

ncl messaging-groups create \
  --channel-type whatsapp --platform-id '<students-group-jid>@g.us' \
  --name 'Monitored youth group' --is-group 1 --unknown-sender-policy public

ncl wirings create \
  --messaging-group-id '<monitored-messaging-group-id>' \
  --agent-group-id '<agent-group-id>' \
  --engage-mode pattern --engage-pattern '.' \
  --session-mode shared --sender-scope all --ignored-message-policy drop

ncl messaging-groups create \
  --channel-type whatsapp --platform-id '<moderator-group-jid>@g.us' \
  --name 'Adult review group' --is-group 1 --unknown-sender-policy strict

ncl destinations add \
  --agent-group-id '<agent-group-id>' --local-name moderator-review \
  --target-type channel --target-id '<moderator-messaging-group-id>'
```

Do not create a wiring for the moderator group and do not create a parent destination. The monitored wiring automatically creates a named source destination; remove that named destination after wiring so the agent cannot deliberately address it. NanoClaw still permits a model's ordinary reply to its source chat, so silence remains instruction-enforced in this version.

## Test before using a youth group

Create temporary adult-only source and review groups. Verify:

1. Ordinary conversation produces no source reply and no moderator message.
2. A directed insult produces one calm `For review` note.
3. A clear immediate threat uses `Please review now` but reaches only adults.
4. A screenshot, sticker, and voice note are reviewed locally.
5. Stopping Ollama or removing the Whisper model produces a rate-limited `Media not reviewed` note, not a claim about the content.
6. No raw media appears in the adult group.
7. No destination for a parents group exists.

Run the registry checks from the template repository:

```bash
node scripts/check-templates.mjs
node scripts/build-index.mjs
```

## Limits

- This is an attention aid, not a replacement for school safeguarding processes, professional judgment, or emergency services.
- It may misunderstand humor, slang, reclaimed language, sarcasm, translations, images, and noisy speech.
- It sees only messages received after its dedicated WhatsApp account joins the configured group; it cannot monitor a child's private chats.
- WhatsApp and NanoClaw retain their own source history independently of the template's seven-day derived-note cleanup.

Authored by Moshe Krupper.
