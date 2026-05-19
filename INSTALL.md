# Multi-Agent Convergence — Install & Use Guide

**Aimed at: research-grade work.**
Use this when "an LLM said so" is not an acceptable answer — when you need
independent models to actually argue, name their assumptions, verify each other
adversarially, and hand you a result you can audit and adjust.

This package is *not* a productivity prompt. It is a protocol that makes multi-LLM
collaboration honest. If you only need a quick second opinion, use a normal model
swap. If you need a result you would defend in a paper, a design review, or a
post-mortem, install this.

---

## Why this exists

Most "have another model review this" workflows collapse into one of three
failure modes:

1. **Summarization disguised as consensus.** Two models say similar things in
   different words; the orchestrator writes "both agreed" and ships.
2. **Assumption layering.** Model A assumes X. Model B builds on X without
   questioning it. The user gets a conclusion built on two unchecked assumptions
   that nobody named.
3. **Settling.** The first working answer wins, even when the project goal is far
   from reached, because no one is tracking the gap.

This package fixes all three by enforcing ten rules:

1. **Convergence = multi-turn adversarial discussion.** Minimum 3 rounds (position → challenge → resolution). Summarization is not convergence.
2. **Three-agent setup.** A parent agent plus two persistent sub-agents from *different model families* (e.g., GPT 5.5 + latest Claude). Idle agents are reused across rounds so context persists.
3. **Transparent assumptions.** Every output answers three questions: what does this mean in plain English, what was assumed, does that assumption match what the user actually asked.
4. **Verbatim relay.** The parent forwards each sub-agent's *exact* position to the other for challenge — never a summary.
5. **Proposer implements, verifier tests.** The agent who suggested the fix writes it. The other agent verifies. No self-verification.
6. **Adversarial verification.** The verifier's job is to find problems, not to confirm correctness. "Looks good" is rejected.
7. **Research rigor.** Each round runs a checklist for logic gaps, loopholes, whitespaces, biases, leaks, fitting, and methodology issues.
8. **Goal-centered research.** Project goals (primary goal, success factors, north-star metrics, guardrails) are defined up front and persisted; every decision is evaluated against them.
9. **Never settle.** Agents track the gap to the north star and escalate honestly when the goal looks unreachable, instead of inventing a smaller win.
10. **Per-decision Decision Cards.** Every key decision, finding, or result is delivered with a structured card listing each assumption (with source, confidence, and supporting evidence), the conditions that would invalidate the result, the alternatives that were rejected and why, and the exact adjustments the researcher can make to override the outcome.

Rule 10 is what makes the package usable for real research: the researcher can
scan a Decision Card, override an assumption that does not match the actual
experimental setup, and send the override back without re-reading the entire
conversation.

---

## Who should use this

- Researchers running experiments where reproducibility, baselines, and leakage matter.
- Engineers making architectural decisions that lock in downstream constraints.
- Teams using multiple frontier models and tired of getting average-of-models output.
- Anyone who needs an audit trail of *how* a conclusion was reached, not just *what* was concluded.

If you just want a faster code edit, this is overkill. Use your normal agent.

---

## What you get

| Surface | Trigger | What it does |
|---|---|---|
| Copilot CLI agent | `/agent` → `convergence` | Orchestrates the full protocol end-to-end |
| Copilot CLI skill | Trigger words: `converge`, `align`, `consensus`, `brainstorm`, `discuss with other LLMs`, `adversarial review`, `multi-model` | Auto-injects the rules when the user uses those words |
| Copilot CLI extension tools | `convergence_protocol`, `convergence_check` | Loads the rules; checklist-validates each round (agent self-reports — not deep enforcement) |
| VS Code Copilot Chat | `/converge` slash command | Same protocol from inside VS Code (sequential single-agent simulation, not persistent multi-agent) |
| Plugin manifest | `.github/plugin/plugin.json` | Lets the agent + skill install via the `/plugin` system. **Does not load `extension.mjs` or the VS Code prompt today** — copy those separately. |

---

## Install — Copilot CLI

### Option 1: Drop-in (works today)

The package is self-contained. Copy or clone the whole `multi-agent-convergence/`
folder into:

```
%USERPROFILE%\.copilot\extensions\multi-agent-convergence\          # Windows
~/.copilot/extensions/multi-agent-convergence/                       # macOS / Linux
```

Then restart `copilot`. On launch you should see the extension load and the two
tools (`convergence_protocol`, `convergence_check`) register.

Verify:

```text
> /env
```

You should see `multi-agent-convergence` listed under extensions/skills/agents.

Use it:

```text
> /agent
# → select "convergence"

# or directly:
> converge with another LLM on whether our retrieval baseline is leaking test data
```

### Option 2: As a plugin (recommended for sharing across machines)

The package ships a `.github/plugin/plugin.json` manifest, so it can be installed
through the Copilot CLI plugin system. From any folder containing this package
(or directly from the GitHub repo):

```text
> /plugin
# → Install from local path or GitHub URL → point at the folder/repo
```

**What plugin install gives you (today):**
- The **agent** (`convergence`) — invokable via `/agent`.
- The **skill** (`multi-agent-convergence`) — auto-loaded on trigger words.

**What plugin install does NOT give you (today):**
- The **extension tools** (`convergence_protocol`, `convergence_check`). The
  Copilot CLI plugin schema does not currently load `extension.mjs` from a
  plugin. To get the tools, also do Option 1: copy the package folder to
  `~/.copilot/extensions/multi-agent-convergence/`.
- The **VS Code `/converge` slash command**. To get it in VS Code, copy
  `.github/prompts/converge.prompt.md` into your workspace's `.github/prompts/`
  folder (see the VS Code section below).

A complete install is therefore: plugin install for the agent/skill, plus a copy
of the folder under `~/.copilot/extensions/` for the validator tools, plus the
prompt file in your VS Code workspace if you also use VS Code.

### Option 3: Persistent injection via `CLAUDE.md` / `AGENTS.md`

If you want the rules in scope for *every* session in a repo, add this to your
`AGENTS.md` (or `~/.claude/CLAUDE.md` for global):

```markdown
## Multi-Agent Convergence Protocol — MANDATORY FOR ALL MULTI-LLM WORK

Full protocol: `~/.copilot/extensions/multi-agent-convergence/skills/multi-agent-convergence/SKILL.md`

### Quick Reference
1. "Converge" / "align" / "consensus" / "brainstorm" = multi-turn adversarial discussion. Minimum 3 rounds.
2. Three-agent setup: parent + GPT 5.5 + latest Claude, both persistent.
3. Every output: what it means, what was assumed, does the assumption match the ask.
4. Proposer implements, the other agent verifies. Never self-verify.
5. Research projects: check logic gaps, biases, fitting, leaks. NEVER settle.
6. No symbols or jargon in user output. Plain English always.
7. Rule 10 — every key decision/result ships with a Decision Card (assumptions, evidence, what would invalidate, adjustments).
```

---

## Install — VS Code Copilot Chat (GHCP)

VS Code Copilot Chat supports custom slash commands via prompt files in
`.github/prompts/`. To get `/converge`:

1. Copy `.github/prompts/converge.prompt.md` from this package into your
   workspace's `.github/prompts/` folder (create it if it does not exist).
2. Reload the VS Code window.
3. In Copilot Chat, type `/converge` and supply the topic.

For the rule text itself, also drop `skills/multi-agent-convergence/SKILL.md`
into the workspace (or a referenced location) so the prompt can load it. Easiest:
keep the whole folder under `.github/copilot/multi-agent-convergence/`.

> Note: VS Code Copilot Chat cannot spin up persistent background sub-agents the
> same way the CLI can. In VS Code, the `/converge` prompt will run the rounds
> sequentially within a single chat. Use the CLI for the full three-agent setup;
> use VS Code for solo-driven convergence and Decision Cards on a single result.

---

## How to actually use it

The first time you say "converge", the protocol will:

1. Ask you to confirm or define the project goal (north star metric, guardrails).
2. Spin up two sub-agents from different model families and keep them alive.
3. Take their independent initial positions on your question.
4. Relay each verbatim to the other for mechanism-level challenges.
5. Iterate accept / reject-with-reason / modify for at least three rounds.
6. Run the research-rigor checklist over the synthesized position.
7. Hand you a Decision Card.

The Decision Card is the deliverable you can act on. It will look like:

```
Decision: Adopt rerank-then-rrf for retrieval.
Meaning in context: Reduces tail-latency variance below the 250ms guardrail.

Assumptions:
  1. Eval set is independent of training set.    [user-specified, high, "split documented in eval/README"]
  2. Latency budget is end-to-end, not per call. [agent-inferred, medium, "user said 'fast'; not defined"]
  3. RRF k=60 is acceptable.                     [agent-inferred, low, "default from MS Marco paper"]

What would invalidate this:
  - Assumption 2 is wrong and budget is per call → reranking step alone exceeds it.
  - Eval set overlaps training set → measured quality gain is leakage.

Alternatives rejected:
  - Dense-only retrieval: failed recall@10 on long-tail queries.
  - Sparse-only: failed latency guardrail under load.

Researcher adjustments:
  - "Budget is per-call, 80ms max" → flips assumption 2 → re-run round on
     latency-constrained variants.
  - "Eval set is shared with training" → flips assumption 1 → invalidates the
     decision; rerun with held-out set.
```

You scan it. You override what does not match your reality. You feed the
override back. The agents re-run only the affected steps.

---

## Validating a round

After each convergence round, the agent should call the
`convergence_check` tool with the round's facts:

- `rounds_completed`
- `agents_involved`
- `challenges_exchanged` (did A and B actually challenge each other's positions,
  or did they just restate?)
- `disputes_documented` (were unresolved disagreements named — `true` is also
  acceptable when there are no disputes left, as long as that is stated)
- `assumptions_listed`
- `decision_card_attached` (Rule 10)

The tool returns a structured report of violations and warnings. **It does not
inspect the conversation itself** — it relies on the agent reporting honestly
about the round it just ran. Treat it as a protocol checklist with teeth (the
agent must address violations before presenting), not as deep enforcement. Real
enforcement comes from the rules in `SKILL.md` and your willingness to push
back when the agent skips a step.

---

## Trigger phrases the skill listens for

- "converge with another LLM on ..."
- "align with [model] on ..."
- "build consensus on ..."
- "brainstorm with other LLMs"
- "have another model adversarially review this"
- "set up a multi-agent research project"
- "/converge" (VS Code Copilot Chat)
- "/agent → convergence" (Copilot CLI)

---

## What this package will not do

- It will not promise speed. Three rounds of debate is slower than one model
  answering once. That is the point.
- It will not hide disagreement. If sub-agents cannot agree, the Decision Card
  will say so.
- It will not pretend to verify what it cannot run. If a claim needs an
  experiment you have not provided, the rigor pass will flag it as unverified.
- It will not "polish" disagreement away. If a sub-agent is settling, the parent
  agent challenges it on your behalf before closing the round.

---

## Troubleshooting

- **"Protocol file not found."** The extension looks for `SKILL.md` in
  `skills/multi-agent-convergence/`, then `templates/` alongside the extension,
  then `~/.github/skills/...`. Make sure the package was copied as a whole, not
  just `extension.mjs`.
- **Only one sub-agent spun up.** Check `list_agents` — the parent reuses idle
  agents. If only one model family is available, the rule-2 check will warn but
  proceed; convergence requires two.
- **`/converge` not visible in VS Code.** Reload the window after dropping the
  prompt file. Check that `.github/prompts/converge.prompt.md` is in the workspace
  root, not in a nested folder.
- **Rounds end at 1 or 2.** The agent skipped the challenge step. Re-prompt with
  "the convergence_check tool will reject this — please run a real challenge
  round between A and B".

---

## License

MIT.
