# GitHub Health

Extract `owner/repo` from the registry's `repository` URL (or the URL the
user gave directly). Public, unauthenticated GitHub REST API calls are rate
limited to 60 requests/hour per source IP — that's enough for one scout run,
but don't loop over many repos in a single session without noting the limit
in the report if you hit a 403 with a `X-RateLimit-Remaining: 0` header.

## Repo metadata

```
GET https://api.github.com/repos/<owner>/<repo>
```

Read: `pushed_at` (last commit to any branch — the single best staleness
signal), `archived` (an archived repo is explicitly end-of-life — treat as
an automatic Risky signal regardless of anything else), `open_issues_count`,
`stargazers_count`, `license.spdx_id`, `language`.

## Release cadence

```
GET https://api.github.com/repos/<owner>/<repo>/releases?per_page=5
```

Read the `published_at` gaps between the last few releases. Irregular but
present beats none at all; a project with commits but zero releases ever may
just not tag releases — don't penalize that alone if `pushed_at` is recent.

## Security advisories (secondary — OSV.dev in `security-advisories.md` is
the primary check, this is a cross-check on GitHub-native ones)

```
GET https://api.github.com/repos/<owner>/<repo>/security-advisories
```

May 404 or return empty even for a repo with known vulnerabilities recorded
elsewhere (e.g. filed against a different package name, or predating
GitHub's native advisory database) — that's expected; OSV.dev is the
authoritative source, this is a supplementary check only.

## If no GitHub repo is linked or found

Say so explicitly in the report and skip this section's findings rather than
guessing at a same-named repo — a registry entry with no linked repository
is itself worth noting (reduces verifiability of the maintenance signal).
