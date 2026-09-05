# Evidence Domino — private workspace

A local conversational companion to the NanoClaw template. Add a proposal and delivery notes, ask what you promised, and check what a different supplier price would mean. Confirmed assumptions and exact proposal repairs use the same tested engine as NanoClaw.

This is a **single-owner local pilot**, not a hosted team service. It runs independently of the NanoClaw model provider. Opening NanoClaw chat still uses that agent's configured provider; this companion does not silently switch it to local inference.

## Start on your computer

Requirements: Node 22+, [Ollama](https://ollama.com/download), and locally installed model weights. No npm packages, frontend build or cloud-model API key is required.

In one terminal, run Ollama with cloud features disabled:

```sh
OLLAMA_NO_CLOUD=1 OLLAMA_HOST=127.0.0.1:11434 ollama serve
```

If Ollama is already running, stop that instance first and restart with this setting. Model installation needs internet access and disk space; it is a separate setup action:

```sh
ollama pull qwen3:4b
```

From the template directory, start the workspace in another terminal:

```sh
node workspace/server.mjs --data-dir "$HOME/.local/share/evidence-domino"
```

Open the **private launch link** printed in that terminal. It contains an access token: don't forward it or include it in screenshots. The page removes it from the address bar and keeps it in that tab's session storage. `Ctrl+C` stops the server. Restarting preserves the proposal, conversation and reference documents; use the newly printed link after each restart.

`--port 4318` selects another port. `--model <installed-name>` selects another local model. `--ollama http://127.0.0.1:11434` can change the loopback Ollama port; remote inference endpoints and cloud model names are refused. First inference may be slow while loading weights. Failed inference leaves the approved draft unchanged. A cloud fallback is never attempted.

The default context is 8,192 tokens. Inputs are conservatively bounded in UTF-8 bytes, including the schema and reserved output/template space, to avoid silent truncation. Stored documents can be larger than a single model request: Q&A selects excerpts; an oversized intake or supplier extraction stops with an explicit error. `--context-size 16384` or `32768` increases capacity if your computer has enough memory. `--gpu-layers 99` explicitly requests GPU offload where supported; use it only when the local model fits your GPU/unified memory. No hardware setting changes the local-only boundary.

To open an existing NanoClaw group, point `--data-dir` at that group's **host** `plugin-data/evidence-domino` directory. Do not point at its plugins directory. Existing baselines and immutable reports are read directly, without a migration. The normal core locks, hashes and version checks still govern approval if NanoClaw and the workspace both check a source.

## A practical first run

1. Choose **Set up a proposal**. Paste or upload a UTF-8 `.md`/`.txt` proposal (20 KB maximum), enter the supplier's public HTTPS URL, and paste its supporting price passage explicitly naming **USD**. A bare `$` is not enough. The model selects the three tracked sentences and money literals; code parses the amounts and validates them. A smaller local-model context may require a shorter input or a larger configured context.
2. Inspect the item, unit, quantity, quote, target, passage and exact sentences. If anything is missing or unsupported, fix the input and prepare it again. Nothing is adopted yet. Confirm the displayed mapping using its exact phrase.
3. Add `.md`, `.txt` or `.csv` reference files such as a venue brief or delivery note. These are supporting context, **not newly approved supplier evidence**. This version supports 10 files, 20 KB each, 100 KB total. PDF, Word and Excel binaries need to be exported to readable text first. CSV is treated as reference text, not an authoritative spreadsheet calculation.
4. Ask **“What did we promise about delivery?”** The answer includes exact source quotations you can expand. Questions use a bounded selection of relevant excerpts and recent conversation, not unlimited company memory. An exact citation verifies that the quotation occurs in context; it does not prove the model's conclusion is correct.
5. Ask **“What if the unit price is $55?”** The code calculates the consequences and supplier ceiling. Use this explicit question shape for authoritative scenarios; other natural-language questions are document Q&A. No hypothetical amount is adopted as evidence.
6. Choose **Check proposal health** before sending. A pending or unresolved observation takes priority. The check covers the tracked supplier estimate; other costs, availability, delivery, taxes and commercial terms still need review. Download the currently approved draft when needed.

Removing a reference also clears the conversation, which may contain its quotations. It does not erase approved evidence or historical proposals. **Clear chat** removes only the conversation. There is no automatic scanning of folders or access to other applications.

## Optional public source checks

Local-only mode makes no Tavily request. To enable the public-price workflow, restart with:

```sh
node workspace/server.mjs --data-dir "$HOME/.local/share/evidence-domino" --allow-public-retrieval
```

Each check still requires the **Allow this public source request** checkbox and the retrieve button. The request sends the owner-approved **public supplier URL** and extraction parameters to Tavily. It does not send the proposal, references, conversation, or private customer context. Never use a private/shared-secret URL as a public supplier source.

The local model interprets the saved Tavily extraction. A comparable observation creates the usual cited report; competing prices or changed terms must remain unresolved. Review the proposed document in its sandboxed report and confirm the exact revision phrase. The engine checks the current baseline, latest observation, document and review hashes before adopting anything. No customer quote is automatically raised and nothing is delivered to a customer.

The existing daily HTTP-attempt budget and Tavily keyless/optional operator-owned credential rules still apply. Retrieval time is not publisher modification time and does not guarantee freshness. A controlled replay must be explicitly selected by fixture version and stays labelled. The workspace itself does not schedule monitoring; the NanoClaw task remains paused until enabled by its owner.

## What “local” means here

- Server binds only to `127.0.0.1`, not your LAN. Data endpoints require the private launch token and reject other browser origins/hosts.
- Inference uses direct loopback HTTP to Ollama. The adapter checks local weight metadata, rejects remote/cloud models and redirects, and cannot fall back to OpenAI, DeepSeek or another remote service. Run the documented `OLLAMA_NO_CLOUD=1` configuration too; the workspace trusts the local Ollama process and this operating-system account.
- Documents and conversations are stored on this computer in private-permission files. They are not encrypted by the app. OS backups, disk encryption, browser extensions and other processes under your user account remain outside this app's isolation boundary. Do not put the data directory in a cloud-synced folder if that conflicts with your requirements.
- There are no remote fonts, scripts, analytics or assets in the interface. Optional public retrieval is disclosed separately. Model downloads are network activity during setup.
- **Slack is a cloud service.** This version has no live Slack connector and does not claim Slack messages would stay local. A future Slack access channel would be a separately disclosed connected mode. No Slack workspace credentials are requested by this companion.

The local model can answer incorrectly even with a matching quote. It has no shell, file-write, outbound messaging or approval tools. Calculations and adoption use code; semantic applicability is an owner decision.

## Files and recovery

The core retains `project.json`, `active.json`, `baselines/`, `captures/` and `reviews/`. Companion context and pending intake live in `.workspace/state.json`. Never edit active records while a process is running. Back up the whole data directory with the server stopped. A server upgrade does not need to copy user data into the template.

The workspace takes `.workspace/server.lock` to prevent two instances writing its chat state. An interrupted process can leave the lock behind. Inspect `owner.json`, verify that the specific PID is no longer running this workspace, and only then remove **that lock directory**. Do not delete the core `.lock` or a lock owned by a live process. The app does not guess whether a lock is stale. Preserve corrupt files for inspection rather than resetting them automatically.

To use another proposal, start another instance with a different `--data-dir` and port. Multi-user permissions, multi-project navigation, encrypted storage, arbitrary attachments, cloud connectors and local notifications are not implemented in this slice.

## Verification

From the registry root:

```sh
node --test product/evidence-domino/skills/evidence-domino/scripts/*.test.mjs product/evidence-domino/workspace/*.test.mjs
```

Automated model/network tests use explicit mocks. They do not establish real model interpretation quality or a live Tavily result. Test a real unfamiliar proposal with your installed local model, inspect its mapping and citations, and exercise a changed observation before relying on it for business decisions.
