# AI Project Rules

Drop this file into the root of any new project (works with Claude Code, Cursor, Copilot, Windsurf, etc.) and tell the AI: **"Read AI_PROJECT_RULES.md and follow it for everything in this project."**

Fill in the `[ ]` blanks at the top for each new project, keep the rest as-is.

---

## 0. Project Snapshot (fill this in first, every project)

- **What is this app?** [one or two sentences — what it does, who it's for]
- **Stack:** [e.g. Next.js + Tailwind + Supabase, or React Native + Firebase]
- **Stage:** [prototype / MVP / production]
- **Non-negotiables:** [e.g. "must work offline", "must support 2 languages", "no paid APIs"]

AI tools drift without this. Re-paste this section if the AI starts suggesting a different stack or scope than what you actually want.

---

## 1. Workflow — how we build, step by step

1. **Plan before code.** For any non-trivial feature, first describe in plain text: what it does, what files it touches, what could break. Don't write code until the plan is agreed.
2. **One feature/fix at a time.** Don't bundle unrelated changes in one go. Small, reviewable chunks > one giant dump of code.
3. **Show the diff, not just the result.** When editing existing files, point out exactly what changed and why — don't silently rewrite working code "while you're in there."
4. **Ask before assuming.** If a requirement is ambiguous (naming, behavior, edge case), ask rather than guessing and moving on.
5. **Run it / test it before declaring done.** Don't say "this should work" — actually run the code, check for errors, fix them, then report status.
6. **No silent scope creep.** If you (the AI) think extra refactoring or a new dependency is needed, say so explicitly and explain why before doing it.
7. **Summarize at the end of each task:** what was changed, which files, anything the human needs to do manually (e.g. add an API key, run a migration).

---

## 2. File Structure — how to decide it

Don't let the AI invent structure randomly per feature. Lock in a convention early:

- **Group by feature, not by type**, once the project grows past a few files. (`/features/auth/`, `/features/billing/` — not one giant `/components/` dumping ground.)
- **Keep it flat while small.** Don't over-engineer folder depth for a 10-file prototype.
- **One clear entry point** per logical unit (e.g. each feature folder has an `index`).
- **Config, secrets, and env files live at root**, never duplicated inside feature folders.
- **Naming convention picked once, applied everywhere** — e.g. kebab-case files, PascalCase components. Don't let it mix mid-project.
- Before creating a new file, the AI should **check if an existing file already serves that purpose** instead of creating `utils2.js`, `helper-new.js`, etc.
- Ask the AI to **propose the folder structure first** when starting a new project, and approve it before it starts generating files everywhere.

---

## 3. Frontend Design & Alignment — stop the "default AI theme"

This is the big one. Left alone, most AI tools converge on the same look: rounded cards, purple-to-blue gradient, Inter font, centered hero with a big heading + subtext + two buttons. If you don't specify, you'll get that — every time, regardless of what you're building.

**Give the AI a real design direction, not just "make it look good":**

- **Name the vibe**, anchored to the actual product — not a generic adjective. "Editorial, newspaper-like, lots of whitespace" or "dense dashboard, data-first, dark mode" gives it something to work from. "Modern and clean" gives it nothing — that's the default it already does.
- **Specify colors as actual hex values** (4–6 of them), not "blue theme." If you don't have a palette, ask the AI to propose 2–3 options first and pick one.
- **Specify fonts deliberately.** If you don't, you get Inter/system-ui every time. Pick a display font + a body font, even just by name.
- **Say what NOT to do.** Explicitly ban the default look if you don't want it: "no purple-blue gradients," "no generic rounded SaaS-card layout," "no centered hero with two CTA buttons unless it's actually a landing page."
- **Alignment & spacing aren't optional polish — call them out as requirements**, e.g. "consistent spacing scale, nothing should look hand-placed," "align all form fields and labels on a grid," "buttons same height/padding across the whole app."
- **Responsive is a requirement, not an afterthought.** State it: "must look correct on mobile width too," or the AI will often only check desktop.
- **Ask for a quick design plan before code**, especially for anything user-facing: palette, type, layout concept, in a few lines — review it before it starts writing components. Catching "this looks like every other AI app" at the plan stage saves a rebuild later.
- **One signature detail > ten random flourishes.** Tell the AI to pick one place to be bold (a hero treatment, a unique nav, an interaction) and keep everything else disciplined — overdecorated AI UIs (random gradients, glow effects, too much motion) are often the giveaway that it's AI-generated.

---

## 4. Other Things to Always Keep in Mind

- **Secrets & API keys:** never hardcoded in source, always via `.env`, and `.env` is always in `.gitignore`. Confirm this every time a new key is added.
- **Error handling isn't optional.** Every API call / async action needs a visible failure state — no silent fails, no blank screens on error.
- **Don't trust AI's first pass on edge cases.** Empty states, loading states, slow networks, wrong input — ask explicitly "what happens if X" for anything important.
- **Dependencies:** before adding a new library, ask if it's actually necessary, or if it can be done with what's already in the project. Bloat creeps in fast with AI-generated code.
- **Consistency over cleverness.** If a pattern (how forms are built, how API calls are made, how state is managed) is established, new code should follow it — not introduce a second way of doing the same thing.
- **Keep a running log.** Either in this file or a separate `CHANGELOG.md`, note what's been built feature by feature. Long AI sessions lose context; a log lets you (or a fresh AI session) catch up fast.
- **Re-read the codebase before big changes.** For larger edits, tell the AI to actually look at the relevant existing files first, not assume their contents from memory of earlier in the conversation.
- **Don't accept "done" without verification.** Ask it to walk through what it tested, or test it yourself before moving to the next task.

---

## 5. Standing Instruction (paste this as your first message in a new project)

> Read AI_PROJECT_RULES.md in this project and follow it for everything you build — workflow, file structure, design, and the "always keep in mind" section. Before writing any code, confirm you've understood the Project Snapshot at the top and ask me anything that's unclear.
