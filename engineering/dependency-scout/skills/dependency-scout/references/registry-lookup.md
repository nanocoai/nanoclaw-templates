# Registry Lookup

All three registries below are public and need no credential. Read only the
fields listed — these responses can be large.

## npm

```
GET https://registry.npmjs.org/<package>
```

(Scoped packages: URL-encode the slash — `@scope%2Fname`.)

Read: `dist-tags.latest` (current version), `time.modified` (last publish,
any version) and `time[dist-tags.latest]` (last publish of the *current*
version — a package can look "actively published" from patch releases on an
old major while the latest tag itself is stale), `maintainers` (count — a
single-maintainer package is a bus-factor signal, not disqualifying on its
own), `repository.url` (feeds into the GitHub health step), and any
`deprecated` field on the current version object — an npm deprecation
message is an explicit, authoritative signal and should be quoted verbatim
if present.

Download volume (adoption signal, not a health signal on its own):

```
GET https://api.npmjs.org/downloads/point/last-month/<package>
```

## PyPI

```
GET https://pypi.org/pypi/<package>/json
```

Read: `info.version` (latest), `releases` (a dict keyed by version — use the
`upload_time_iso_8601` of the most recent key for last-publish date),
`info.project_urls` (feeds GitHub health), `info.yanked` on the latest
release if present, `info.classifiers` for a `"Development Status"` trove
classifier (e.g. "5 - Production/Stable" vs. "2 - Pre-Alpha") as a
maintainer-declared signal.

## crates.io

```
GET https://crates.io/api/v1/crates/<crate>
```

**Requires a descriptive `User-Agent` header** (crates.io rejects generic or
missing ones per their API policy) — send something like
`User-Agent: dependency-scout-agent (nanoclaw template)`.

Read: `crate.max_stable_version`, `crate.updated_at`, `crate.repository`
(feeds GitHub health), `crate.downloads`.

## If the registry lookup 404s

The name doesn't exist on that registry. Say so plainly — don't fall back to
guessing from training-data knowledge of a similarly-named package.
