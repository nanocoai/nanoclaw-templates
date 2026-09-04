# Report Format

Lead with the verdict, then the breakdown by signal type, then what wasn't
checkable. Scannable in under a minute.

## Verdict line (always first)

One of, in **bold**:

- **✅ Healthy** — actively maintained, no unpatched known vulnerabilities,
  reasonable community signal.
- **⚠️ Caution** — one moderate signal (slow-but-present maintenance, thin
  community trace, a since-fixed advisory, single-maintainer bus factor) or
  meaningful gaps in what could be verified.
- **🚩 Risky** — archived/abandoned, an unpatched known vulnerability
  (especially one affecting the latest version), an explicit npm/PyPI
  deprecation notice, or multiple compounding caution signals.

## Breakdown

Three short sections, each with its sourced findings as bare URLs:

```
### Maintenance
<publish recency, GitHub pushed_at, release cadence, maintainer count>
<source URLs>

### Security
<OSV result — specific advisory or "none found as of <date>">
<source URL(s)>

### Community
<sentiment findings, with dates on any complaint/praise cited>
<source URLs>
```

Include an **Alternatives** section only when Step 4 ran.

## What wasn't checkable

Always include, even when short — e.g. "no GitHub repo linked from the
registry entry, so maintenance signal is registry-publish-date only."

## Closing line

Whether you're saving this to the watchlist (ask first), and that this is
evidence to weigh — the adoption decision is the user's.
