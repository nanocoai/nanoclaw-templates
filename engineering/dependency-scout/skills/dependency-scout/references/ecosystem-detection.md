# Ecosystem Detection

Work out which registry the package lives in before looking anything up —
the same name can exist independently on multiple registries with unrelated
code behind it.

## Strong signals (infer directly, no need to ask)

- An install line names the ecosystem directly: `npm install <x>` / `pnpm
  add <x>` / `yarn add <x>` → **npm**. `pip install <x>` / a `requirements.txt`
  line → **PyPI**. `cargo add <x>` / a `Cargo.toml` line → **crates.io**.
  `go get <x>` → **Go**. `gem install <x>` → **RubyGems**. `composer require
  <x>` → **Packagist**.
- A `package.json`/`requirements.txt`/`Cargo.toml`/`go.mod` snippet pasted
  directly names the ecosystem the same way.
- A registry URL (`npmjs.com/package/<x>`, `pypi.org/project/<x>`,
  `crates.io/crates/<x>`) is unambiguous.

## Weaker signal: a bare GitHub URL only

A GitHub repo isn't itself a registry. Use the repo's primary `language`
field (from `references/github-health.md`'s repo fetch) as a best guess for
which registry to also check (a Rust-flagged repo → try crates.io, a
Python-flagged repo → try PyPI, etc.), but say explicitly in the report that
the registry match is inferred, not confirmed, and skip the registry-lookup
step entirely if the guess doesn't resolve to a real package.

## If genuinely ambiguous

A bare package name with no other context, especially a common word, can
exist on several registries as unrelated projects. Ask a one-line clarifier
("Which ecosystem — npm, PyPI, crates.io, Go, RubyGems, or something else?")
and wait rather than guessing and researching the wrong project.

## Normalize before querying

Lowercase npm scoped packages keep their `@scope/name` form as-is in the
registry URL (URL-encode the `/` as `%2F` when calling the npm registry API
for a scoped package: `GET
https://registry.npmjs.org/@scope%2Fname`). PyPI and crates.io names are
generally case-insensitive but reuse the exact spelling given.
