# Use Biome over eslint+prettier

- Status: provisional — pending Jason confirmation
- Date: 2026-07-11

## Context and Problem Statement

Every repo needs one lint/format toolchain, applied identically everywhere so `pnpm turbo run lint` and CI behave the same in `core`, `platform`-generated apps, `app-template`, and `construction-pm`. PROJECT-CONTEXT.md §3 names Biome as the provisional default over the traditional eslint+prettier pair.

## Decision Drivers

- Single fast Rust-based tool vs. two separate tools with their own config files, plugin ecosystems, and occasional rule conflicts.
- Startup/CI speed matters more here than eslint's much larger plugin ecosystem — this platform doesn't need framework-specific eslint plugins beyond what Biome already covers for TS.
- One config file (`biome.json`) is easier for an agent-operable repo to reason about than eslint+prettier+their interop config.

## Considered Options

- Biome
- eslint + prettier

## Decision Outcome

Chosen option: "Biome", adopted in `core/biome.json` and used identically across every package (`biome check .`, `biome format --write .`).

### Consequences

- Good, because CI and local dev share one fast tool with no config-conflict surface.
- Bad, because Biome's rule set is less mature/extensive than eslint's for some edge cases (e.g. very framework-specific React rules) — revisit if `apps/web` in `app-template` needs something Biome can't cover.

## Links

- Relates to PROJECT-CONTEXT.md §3
- See `platform/docs/standards/conventions.md`
