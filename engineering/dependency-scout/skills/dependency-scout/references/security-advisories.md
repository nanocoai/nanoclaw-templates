# Security Advisories (OSV.dev)

[OSV.dev](https://osv.dev) is the authoritative, cross-ecosystem
vulnerability database (it aggregates GitHub Security Advisories, language
ecosystem advisories, and more) and needs no API key.

```
POST https://api.osv.dev/v1/query
Content-Type: application/json

{"package": {"name": "<package-name>", "ecosystem": "<ecosystem>"}}
```

Valid `ecosystem` values for the registries this skill covers: `"npm"`,
`"PyPI"`, `"crates.io"`, `"Go"`, `"RubyGems"`, `"Packagist"`. Use the exact
casing shown — OSV's ecosystem field is case-sensitive.

## Reading the response

`vulns` is an array (empty if none found — that's a real, reportable "no
known advisories," not a gap). For each entry, read: `id` (the OSV or GHSA
ID), `summary`, `aliases` (often includes the CVE ID), `published`,
`database_specific.severity` or `severity` (CVSS, if present), and
`affected[].ranges` / `affected[].versions` to determine whether the
**version the user is actually considering** falls in the vulnerable range —
an advisory on an old version that the current release already fixes is a
materially different finding than an unpatched one, so always report which
case it is.

## Reporting

- **Any vulnerability with no fixed version available, or affecting the
  latest release, is an automatic Risky signal** — surface it first, above
  maintenance/community findings.
- A vulnerability that's already fixed in the current version is worth a
  mention (shows the maintainers respond to reports) but isn't itself a
  negative signal.
- Zero results: report as "No known advisories in OSV.dev as of this check"
  — explicitly time-boxed language, since this reflects the database at
  query time, not a permanent guarantee.
