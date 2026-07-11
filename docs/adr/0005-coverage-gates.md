# Coverage gates: 85% domain / 70% overall

- Status: provisional — pending Jason confirmation
- Date: 2026-07-11

## Context and Problem Statement

PROJECT-CONTEXT.md §3 names provisional coverage floors: 85% for domain/business-logic packages (money, schedule, tenancy math), 70% overall elsewhere. This needs to be a concrete, enforceable number, not just a stated intention.

## Decision Drivers

- Construction PM's core differentiator (schedule↔cost linkage, cash engine, draws) is math-heavy and high-stakes (real money, real contractors) — under-tested domain logic is the single biggest risk to the product's credibility.
- 100% coverage everywhere is not a useful target this early (Phase 0 is plumbing, not domain code yet) — a two-tier floor lets infra packages move fast while flagging domain code for stricter scrutiny once it exists (Phase 1+).

## Considered Options

- Flat 80% everywhere
- 85% domain / 70% overall (two-tier)
- No enforced gate, review-only

## Decision Outcome

Chosen option: "85% domain / 70% overall", adopted as policy now, **enforcement deferred**: `platform/.github/workflows/ci.yml`'s `coverage-threshold` input exists and is wired to an env var, but no package currently fails CI on a coverage miss — there's no domain code yet to gate (Phase 0 is E0–E5 plumbing; domain code starts Phase 1). Turning this into a hard `vitest --coverage` gate per package is deferred to whichever epic first adds real domain logic (construction-pm's schedule/cash/ledger packages).

### Consequences

- Good, because the number is decided now, before domain code exists, so there's no "we'll add tests later" negotiation once real money math ships.
- Bad, because an unenforced gate can silently rot — whoever adds the first domain package must actually wire `--coverage` thresholds into that package's `vitest.config.ts`, not just point at this ADR.

## Links

- Relates to PROJECT-CONTEXT.md §3, §5
- Relates to `platform/docs/standards/testing.md`
