# Engine contract

Node 22, no package dependencies. `cli.mjs COMMAND --input input.json [--data-dir PATH]` accepts `init`, `ingest`, `review`, `accept`, `status`. Default data directory: `/workspace/agent/plugin-data/remote-hands-reviewer`. JSON success goes to stdout. Validation/conflict failures return `{ok:false,error:{code,message,details?}}` with a nonzero exit code. No network or hardware actions occur.

## Inputs

- `init`: `{jobId,title,workOrder,requirements:[{id,label,role,expectedValue,sourceQuote}],confirmation}`. Role is `existing`, `replacement`, or `asset`. Confirmation is exactly `Start job JOBID`. 1–12 requirements, exact supporting quote from the original work order, expected identifier literal in that quote. Work order maximum 20 KiB UTF-8. Job/requirement IDs use 1–64 ASCII letters, digits, `_` or `-`, starting with a letter/digit. Requirements and original work order never change in this version; a revised request starts a new job.
- `ingest`: `{jobId,expectedVersion,files:[{path,label}]}`. 1–12 local JPEG/PNG files, maximum 5 MiB each and 12 distinct files per job. Signatures and header dimensions are checked (at most 12,000 pixels per side and 40 megapixels); this is not full decode validation. If the agent cannot decode/view the supplied image, request a valid image and do not invent an observation. Symlinks and duplicate bytes are rejected. Full filename is retained as data; storage names are generated. The returned evidence list includes IDs for observations.
- `review`: `{jobId,expectedVersion,observations:[{requirementId,evidenceId,observedValue,readability,region,note}]}`. At most one observation per requirement. `readability` is `clear`, `unreadable`, or `uncertain`; clear needs a nonempty observed string. Unreadable/uncertain may use null. Region is `[x,y,width,height]` relative to the original image, all within 0–1, positive dimensions and no overflow beyond image edges. Note is a string. Unmentioned requirements become missing in the new full snapshot. Exact identifier comparison trims outer whitespace only. A prior mismatch/unreadable/uncertain item becoming supported using different evidence needs an explanatory note.
- `accept`: `{jobId,expectedVersion,reviewId,reviewHash,confirmation}`. Confirmation exactly `Record review REVIEWID`. Only the latest, unchanged review of the latest evidence set with zero unresolved items can be recorded. This records a documentary review, never physical acceptance or ticket closure.
- `status`: `{jobId}` for full job state, or `{}` for at most 50 job summaries sorted by job ID. A corrupt job returns its own error and does not hide other jobs. List output includes totalJobs, listedCount and truncated; request a specific job by ID if more than 50 exist.

Each mutation increments `version` including init (version 1). Use the version returned by the latest command, not a guessed version. New evidence invalidates any prior report's current applicability. All reports remain historical snapshots. Re-review all requirements, including previously supported ones, after ingestion.

Serialized records are bounded before publication and read with the same limits: intake 512 KiB (including JSON escaping), each review 1 MiB, active state 8 MiB. All permitted maximum-sized intake fields fit the intake bound. A job reaching a retained-history bound rejects the new mutation with `record_limit`, leaving its prior complete state readable; start a new job for further work.

## Renderer contract

`renderer.mjs` exports `renderReport(view)`, returning self-contained HTML (string, sync or async). All untrusted strings must be HTML-escaped. No remote resources. Engine passes:

```
{
  schemaVersion: 1,
  job: { jobId, title, workOrder, requirements },
  reviewId, reviewHash, generatedAt, version,
  status: 'needs_review' | 'ready_to_record',
  requirements: [{
    id, label, role, expectedValue, sourceQuote,
    status: 'supported' | 'mismatch' | 'unreadable' | 'uncertain' | 'missing',
    observation: null | {
      requirementId, evidenceId, observedValue, readability, region, note
    },
    previousStatus: null | string, changed: boolean
  }],
  evidence: [{
    evidenceId, label, originalName, mimeType, sha256, byteLength,
    relativePath, dataUrl
  }],
  unresolvedCount, followUpDraft,
  previousReviewId: null | string,
  history: [{ reviewId, generatedAt, unresolvedCount, recorded }]
}
```

Evidence `dataUrl` is added only for rendering; review JSON retains the hash and path. `reviewHash` hashes the immutable logical review JSON, excluding itself; the rendered report has a separate stored SHA-256. `relativePath` is job-relative, not HTML-relative. Use data URLs in HTML. Dates are ISO strings. Regions are not verification of a real physical state: they localize the model's candidate observation.

## State and recovery

Each job has immutable version directories. A short job-local mkdir lock serializes publication. The active pointer is atomically renamed only after the complete version and files exist. Hashes are checked on reads and before recording, including original intake, evidence and review/report bytes. A failed write leaves the preceding pointer usable. The engine never removes a stale-looking lock. For operator recovery: stop all operations on that job, inspect `lock/owner.json` and the owning process, retain a copy, then remove the lock only after confirming no operation still owns it. Incomplete staging or unreferenced versions can be retained without affecting the active pointer. This is integrity checking for an owner-operated assistant, not tamper-proof authorization against a compromised agent with the same filesystem permissions.
