# Resend behind the Mailer interface

- Status: provisional — pending Jason confirmation
- Date: 2026-07-11

## Context and Problem Statement

Apps need transactional email (signup verification, invite emails, draw/notification alerts down the line). PROJECT-CONTEXT.md §3 names Resend as the provisional provider — but per §5's ejectability rule, no app may call a provider SDK directly.

## Decision Drivers

- Ejectability: a client without a Resend account must still be able to run the app (degraded — no real email — rather than broken).
- Resend has a generous free tier and a simple API, good fit for a low-cost-target product.

## Considered Options

- Resend
- Postmark
- SES directly

## Decision Outcome

Chosen option: "Resend", accessed only through `@kayebuilt/core-config`'s `Mailer` interface (`packages/core-config/src/mailer.ts`). `core-config` itself ships only the interface and a `ConsoleMailer` no-op fallback (used in dev/test and whenever `RESEND_API_KEY` is unset) — the actual `ResendMailer` adapter is an app-template concern (E3), not `core-config`'s, to keep `core-config` free of the `resend` SDK dependency for apps that don't want it.

### Consequences

- Good, because swapping providers later (or self-hosting via SMTP) is a new `Mailer` implementation, not a rewrite of every call site.
- Good, because CI/tests never need a real Resend account — `ConsoleMailer` is the default fallback.
- Bad, because it's one more interface to keep in sync if Resend's API shape changes significantly.

## Links

- Relates to PROJECT-CONTEXT.md §3, §5
- Implemented in `packages/core-config/src/mailer.ts`
