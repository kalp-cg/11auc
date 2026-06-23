# Codebase Discipline for AI-Assisted Coding

**The real problem isn't "AI writes bad code."** First drafts are usually fine. The problem is: AI has no memory of *why* something was built a certain way, so when you ask it to change something later, it doesn't know what else is quietly depending on it — and it breaks that thing without realizing.

Every point below exists to fix one thing: **make the invisible visible**, so the AI (or you) can't break something without seeing it coming.

---

## 1. One file = one job

**What it means:** Every file should do exactly one thing — one component, one feature's logic, one set of related helpers. Not "this file has the button AND the API call AND the formatting logic AND three other components."

**Why it breaks things:** When a file does five jobs, asking the AI to fix job #2 means it's reading and silently touching jobs #1, #3, #4, #5 too. It can't help but blur the edges.

**How to enforce it:** If a file is doing more than one job, say so out loud: *"This file is mixing UI and data-fetching, split it before we add anything else."* Rule of thumb: if you can't describe a file's job in one sentence, it's doing too much.

---

## 2. Every function/component has ONE clear responsibility, and ONE clear input/output

**What it means:** A function should take clear inputs and return a clear, predictable output — no hidden side effects, no quietly modifying something outside itself.

**Why it breaks things:** AI loves to make a function "smarter" by adding a side effect (e.g. a function called `formatPrice()` that *also* updates some global state). Six weeks later you change `formatPrice()` and something unrelated breaks, and nobody knows why, because the connection was invisible.

**How to enforce it:** Ask directly: *"Does this function do anything other than what its name says?"* If yes, separate it.

---

## 3. A "contract" for anything shared across files

**What it means:** If a function, component, or data shape is used in more than one place, treat it like a contract: define exactly what it expects in, and what it gives back, and don't let that shape change quietly.

**Why it breaks things:** This is the #1 cause of "I asked AI to change one screen and three other screens broke." Shared functions/components/types get edited in place for the screen at hand, and every *other* place using them breaks silently.

**How to enforce it:** Before editing anything shared, ask the AI: *"What else uses this? Show me, before you change it."* If it's used in 4 places, the AI must either keep the contract identical or update all 4 call sites — never just one.

---

## 4. Single source of truth for data and config

**What it means:** Any given piece of information (a user's data, an API URL, a price, a feature flag) should live in exactly one place. Everything else reads from there — nothing duplicates it.

**Why it breaks things:** AI, working file-by-file, will often just copy a value or a small bit of logic into the new file it's working on instead of importing/reusing the original — because it's faster in the moment. Now you have two copies. You update one, forget the other exists, and now you have a bug that only happens "sometimes."

**How to enforce it:** Keep one config file (URLs, constants, env values) and one place for shared types/data shapes. Tell the AI explicitly: *"Don't redefine this — import it from [file]."*

---

## 5. Read before write

**What it means:** Before the AI edits a file (especially one it didn't just write itself), it should actually open and read the current version — not rely on what it remembers from earlier in the conversation.

**Why it breaks things:** In long sessions, the AI's "memory" of a file can drift from what's actually on disk — especially if you edited something manually, or several turns have passed. It edits based on a stale mental picture and silently undoes or conflicts with something.

**How to enforce it:** For any non-trivial edit, ask: *"Re-read the current file before changing it."* This single habit prevents a huge share of "wait, why did my earlier fix disappear?" bugs.

---

## 6. Small, isolated changes — never a silent rewrite

**What it means:** When fixing or changing something, only the lines/functions related to that change should move. Don't let the AI "clean up while it's in there" — reformatting, renaming, or restructuring things you didn't ask about.

**Why it breaks things:** A silent rewrite mixes your *requested* change with *unrequested* changes in the same diff. If something breaks, you can't tell which of the ten things that changed actually caused it.

**How to enforce it:** Explicitly say: *"Only touch what's needed for this fix. Don't refactor or rename anything else."* If the AI thinks a refactor is genuinely needed, that should be its own separate, called-out step — never bundled in.

---

## 7. Commit (save a checkpoint) before every meaningful AI change

**What it means:** Use git (or even just a manual copy) to save a working snapshot before letting AI make a change of any real size.

**Why it breaks things:** Without a checkpoint, "AI broke something" has no clean undo. You end up trying to manually reverse-engineer which part of a big change caused the issue.

**How to enforce it:** Commit after every feature/fix that works. Before a risky or large change, say: *"This is a checkpoint — if this change breaks something, I want to be able to go back to exactly this point."* This turns "something's broken, ugh" into a 10-second `git diff` instead of an hour of guessing.

---

## 8. Naming has to be predictable, not clever

**What it means:** File, function, and variable names should describe *what they are*, consistently, so anyone (human or AI) can guess where something lives without searching.

**Why it breaks things:** When names are vague (`utils.js`, `helper2.js`, `data.js`, `handleStuff()`), the AI itself can't tell what's already there — so instead of reusing existing logic, it writes a new version of the same thing in a new spot. Now there are two `formatDate` functions doing slightly different things, and nobody knows which one is "real."

**How to enforce it:** Pick one naming convention on day one (e.g. `feature-name.component.tsx`, `feature-name.api.ts`) and never deviate. Before creating a new file, ask the AI: *"Search the codebase first — does something like this already exist?"*

---

## 9. No dead code, no commented-out leftovers

**What it means:** If code isn't used, delete it. Don't leave old versions commented out "just in case."

**Why it breaks things:** Dead code confuses future edits — the AI (or you) might accidentally "fix" the dead version, or get confused about which version is actually running. It also makes files longer and harder to scan, which increases the odds of missing something important.

**How to enforce it:** After any change that replaces old logic, explicitly ask: *"Did you leave the old version commented out? Remove it."* Trust git history to remember old code, not the file itself.

---

## 10. Errors fail loud, not silent

**What it means:** Every place something can go wrong (an API call, a file read, user input) should visibly show that it failed — not swallow the error and continue like nothing happened.

**Why it breaks things:** Silent failures are the hardest bugs to catch, because nothing looks wrong until much later, far from the actual cause. You end up debugging the *symptom* location instead of the *real* one.

**How to enforce it:** Ask: *"What happens here if this fails?"* for every async/risky operation. If the answer is "nothing visible," that's a gap to fix immediately, not later.

---

## 11. One log of what's been built (a running changelog)

**What it means:** Keep a simple `CHANGELOG.md` — one line per feature/fix, in plain language, in the order it happened.

**Why it breaks things:** This isn't about preventing a break directly — it's about *recovery speed*. When the AI's context resets (new session, long conversation, new chat), it has zero memory of past decisions. A changelog lets you re-brief it in 30 seconds instead of re-explaining the whole project, and lets you spot "wait, didn't we already build this differently?" before it duplicates work.

**How to enforce it:** After any meaningful change: *"Add a line to CHANGELOG.md describing what we just did."* Takes 10 seconds, saves a lot of confusion later.

---

## 12. Types/interfaces wherever possible (even loosely)

**What it means:** Define the *shape* of your data explicitly — what fields a "user" object has, what a function expects, what an API returns. (TypeScript is ideal; even plain JSDoc comments or a written-out shape helps if you're not using a typed language.)

**Why it breaks things:** Without a defined shape, AI guesses field names from context — and guesses wrong often enough that "undefined is not a function" becomes the most common bug in vibe-coded projects. A defined type means the AI (and any tooling) can catch a mismatch *immediately*, instead of it surfacing as a confusing runtime crash three steps later.

**How to enforce it:** Ask for a type/interface to be defined the first time a new data shape appears, and reused everywhere after — never redefined ad hoc per file.

---

## 13. Don't let context get stale in long sessions

**What it means:** In a long back-and-forth, the AI is working off its memory of the conversation, which can drift from the actual current state of your files — especially after several edits, or if you changed something outside the chat.

**Why it breaks things:** The AI confidently edits based on an outdated picture of the code, producing changes that conflict with what's actually there.

**How to enforce it:** For long sessions, periodically ask the AI to re-scan the actual current project structure/files before continuing, especially before any major feature. If something feels "off," that's the signal to refresh context rather than push forward.

---

## Quick checklist (paste this in when starting any task)

> Before you make this change:
> 1. Re-read the current version of any file you're touching.
> 2. Tell me what else in the codebase depends on what you're about to change.
> 3. Only touch what's needed — no unrelated cleanup or renaming.
> 4. After the change: confirm it runs, tell me what you tested, and add a line to CHANGELOG.md.

---

## Why this all matters together

No single rule here prevents breakage on its own. What prevents breakage is **never letting anything be implicit** — not the data shape, not the dependency, not the current file state, not what changed and why. AI doesn't break things out of carelessness; it breaks things because something was invisible to it at the moment of the edit. Every rule above is just a different way of forcing that invisible thing into view before the edit happens.
