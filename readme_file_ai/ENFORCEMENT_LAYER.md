# Enforcement Layer — Making the Rules Unbreakable

The first two files (AI_PROJECT_RULES.md and CODEBASE_DISCIPLINE.md) describe good habits. This file is about **not depending on habits at all** — setting up tools so that bad code physically cannot get committed, broken changes get caught automatically, and the app stays consistent without you having to remember to check.

This is scaled for one person or a tiny team — not enterprise DevOps. Every item here is something you genuinely can set up and maintain alone.

---

## 1. Auto-formatting & linting (stops style chaos automatically)

**What it is:** A formatter (Prettier) rewrites code to one consistent style automatically. A linter (ESLint, or the equivalent for your language) flags actual problems — unused variables, risky patterns, inconsistent imports.

**Why it matters:** This removes an entire category of AI inconsistency for free. You stop needing to *ask* the AI to follow naming/style conventions — the tool just won't let inconsistent code through.

**How to set it up (ask your AI tool to do this directly):**
> "Set up Prettier and ESLint for this project with sensible defaults for [your stack]. Add a format-on-save config and a lint script in package.json."

**How to enforce it without thinking about it:** Add a pre-commit hook (using `husky` + `lint-staged` for JS/TS projects) so formatting and linting run automatically every time you commit — broken style literally can't get saved into history.

---

## 2. A minimal but real testing strategy

You don't need 100% coverage. You need tests on the things that are expensive to get wrong.

**Three tiers, in priority order:**

1. **Unit tests** — for pure logic: calculations, formatting, data transforms, validation rules. Fast to write, fast to run, catch the most common AI mistake (subtle logic errors).
2. **Integration tests** — for things that touch multiple parts: "does submitting this form actually save the right data." Fewer of these, but they catch the breaks that unit tests miss.
3. **End-to-end (E2E) tests** — for the 3–5 flows that would be *disasters* if broken: signup, login, checkout/payment, the core action your app exists for. Use something like Playwright or Cypress. You don't need many — just the ones where "this silently broke" would actually hurt.

**Why this matters more than anything else in this document:** Tests are the only thing that proves a change didn't break something *you didn't think to check manually*. Without them, every AI edit is a gamble that you only find out about when a user hits the bug.

**How to set it up:**
> "Set up [Vitest/Jest] for unit tests and Playwright for E2E. Write unit tests for [list your core logic functions] and one E2E test for [your most critical user flow]."

**The habit that matters:** Every time the AI builds or changes something non-trivial, ask: *"Write a test for this before we move on."* Future changes that break it will fail the test immediately instead of failing silently in production.

---

## 3. CI — tests run automatically, not "when I remember to"

**What it is:** A pipeline (GitHub Actions is the easiest free option) that automatically runs your linter and tests every time you push code — and blocks/flags it if anything fails.

**Why it matters:** This is what turns "I should really test this" into "it's impossible to merge broken code," because nobody — not you, not the AI — has to remember to run the checks. The system does it for you, every single time.

**How to set it up:**
> "Set up a GitHub Actions workflow that runs lint and tests on every push and pull request."

This is a ~15 line YAML file. Once it exists, you genuinely never think about it again — it just silently protects you forever.

---

## 4. A design token file — kills the "default AI theme" at the root

**What it is:** One file (or a small set) defining your colors, fonts, spacing scale, and border-radius as named values — and every component pulls from there. Nothing is ever a one-off hardcoded color or random padding value.

**Why it matters:** This is the actual fix for inconsistent alignment/spacing/colors across pages — not asking the AI nicely each time, but making the *inconsistent* version harder to write than the *consistent* version.

**How to set it up:**
> "Create a design tokens file — colors, font scale, spacing scale (e.g. 4/8/12/16/24/32px), and border-radius values. Use [Tailwind config / CSS variables — pick one]. Every new component must use these tokens, never hardcoded values."

**The habit that matters:** When reviewing new UI, ask: *"Does this use the spacing/color tokens, or did you hardcode values?"* Hardcoded values are how design drift creeps back in even with a token system in place.

---

## 5. Architecture Decision Records (ADRs) — lightweight version

**What it is:** A short note (even 5 lines) every time you make a decision that would be expensive to silently reverse — choice of database, choice of auth method, a major library choice, a non-obvious tradeoff.

**Format (keep it this simple):**
```
## [Date] — Decision: [what you chose]
Why: [the reason]
Alternatives considered: [what else, briefly]
```

**Why it matters:** Without this, six months from now (or three AI sessions from now), someone — possibly you — "fixes" a deliberate decision because the reasoning wasn't written down anywhere. This is the single cheapest insurance policy in this whole document.

**Where it lives:** A simple `/docs/decisions.md` file. Add a line whenever it's relevant — don't overthink the format.

---

## 6. Error tracking (your production-time alarm system)

**What it is:** A free-tier tool (Sentry is the standard, has a generous free tier) that automatically captures errors happening in your live app and tells you immediately — file, line, what the user was doing.

**Why it matters:** "Errors fail loud" (from the discipline doc) is the dev-time version of this. This is the production version — you find out about a real bug in minutes, from a clear report, instead of from a confused user message or not at all.

**How to set it up:**
> "Add Sentry error tracking to this project for both frontend and backend, using the free tier."

---

## 7. Secrets scanning (catches what `.gitignore` misses)

**What it is:** A tool or GitHub's built-in secret scanning that checks every commit for accidentally-committed API keys/passwords — catching the moment `.gitignore` was forgotten or misconfigured, not after the key is already public.

**Why it matters:** `.gitignore` is a discipline-based rule, like everything in the second doc — easy to get right 99% of the time and catastrophic the 1% you don't. This is the enforcement layer for that one specific, high-stakes mistake.

**How to set it up:** If your repo is on GitHub, secret scanning is on by default for public repos — verify it's enabled for private ones too in repo settings. For extra safety, ask:
> "Add a pre-commit hook that scans for accidentally committed secrets/API keys before allowing a commit."

---

## 8. A one-page system overview (separate from the changelog)

**What it is:** A `README.md` (or `/docs/overview.md`) that answers, in one read: what the app does, how to run it locally, what the main pieces are and where they live, and what's still missing/known-broken.

**Why it matters:** CHANGELOG.md tells you what happened, in order, over time. This tells you how the system works *right now*, in one place — what a new person (or a fresh AI session with zero memory of your project) needs to get oriented in minutes instead of by reading every file.

**How to set it up:**
> "Write a README covering: what this app does, setup/run instructions, the main folders and what's in each, and a 'known limitations' section."

Update it whenever the *shape* of the app changes — not every small fix (that's what the changelog is for).

---

## Putting it together — what "perfect" actually looks like

A genuinely well-run small app has:

- **Prettier + ESLint + pre-commit hooks** → style chaos is impossible
- **Unit tests on core logic + a few E2E tests on critical flows** → changes prove they didn't break things
- **CI running those tests on every push** → broken code can't merge, automatically
- **A design tokens file** → visual inconsistency is impossible, not just discouraged
- **A lightweight ADR log** → decisions don't get silently undone
- **Sentry (or similar)** → you hear about production bugs in minutes
- **Secret scanning** → leaked keys get caught before they're a disaster
- **A README that reflects current reality** → anyone (including future-you, including a fresh AI session) can get oriented fast

None of this requires a team. Most of it is a single setup command plus one good prompt to your AI tool, and then it runs forever without you thinking about it again. The discipline doc protects you when you're paying attention. This layer protects you when you're not — which, realistically, is most of the time.

**If you only set up two things from this whole file, make it CI + tests, and the design tokens file.** Those two alone catch the large majority of "AI broke something" and "every page looks slightly different" problems — the two complaints you started this whole conversation with.
