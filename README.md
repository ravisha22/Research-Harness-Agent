# Research Harness Agent

> A Copilot CLI + VS Code Copilot Chat package that implements the
> **Multi-Agent Adversarial Convergence Protocol** — a research-grade harness
> for multi-LLM collaboration.

A research-grade Copilot package that enforces rigorous multi-LLM collaboration.
Real multi-turn debate, transparent assumptions, adversarial verification, and a
"never settle" stance toward the project's north star.

> **New here?** Read **[INSTALL.md](./INSTALL.md)** for the full story: who this is
> for, how it works, and how to install in Copilot CLI or VS Code Copilot Chat.

## What you get

| Surface | Trigger | What it does | Install path |
|---|---|---|---|
| Copilot CLI agent | `/agent` → `convergence` | Orchestrates the full protocol | Plugin install **or** folder copy |
| Copilot CLI skill | Keywords: `converge`, `align`, `consensus`, `brainstorm`, `discuss with other LLMs`, `adversarial review` | Auto-loaded by the model when these words appear | Plugin install **or** folder copy |
| Copilot CLI extension tools | `convergence_protocol`, `convergence_check` | Loads the rules; checklist-validates each round | Folder copy to `~/.copilot/extensions/` (plugin install does **not** load `extension.mjs` today) |
| VS Code Copilot Chat | `/converge` | Same protocol, one slash command | Copy `.github/prompts/converge.prompt.md` into your workspace's `.github/prompts/` |

A complete install on a single machine is: clone or unzip the repo into
`~/.copilot/extensions/multi-agent-convergence/` (one step gives you the agent,
skill, and extension tools), then copy the VS Code prompt into your workspace
if you also use VS Code. See **[INSTALL.md](./INSTALL.md)** for details and
alternatives.

## The 10 rules in one screen

1. **Convergence = multi-turn adversarial discussion.** Minimum 3 rounds. Never summarize and call it convergence.
2. **Three-agent setup.** Parent + two persistent sub-agents from different model families. Reuse idle agents.
3. **Transparent assumptions.** Every output answers: what does this mean, what was assumed, does it match the ask.
4. **Convergence protocol.** Parent relays *verbatim* content between sub-agents, not summaries.
5. **Proposer implements, verifier tests.** Never self-verify.
6. **Adversarial verification.** "Looks good" is not acceptable. State what was checked and why you are satisfied.
7. **Research rigor.** Check logic gaps, loopholes, whitespaces, biases, leaks, fitting, methodology.
8. **Goal-centered research.** Define primary goal, success factors, north-star metrics, guardrails. Evaluate everything against them.
9. **Never settle.** Push toward the north star; escalate honestly if the goal is unreachable.
10. **Per-decision Decision Cards.** Every key decision, finding, or result ships with a Decision Card: assumptions (source + confidence + evidence), what would invalidate the result, alternatives rejected, and the exact adjustments the researcher can make.

## Files in this package

```
multi-agent-convergence/
├── README.md                                    ← this file
├── INSTALL.md                                   ← research-grade overview + install guide
├── extension.mjs                                ← CLI extension (convergence_protocol, convergence_check)
├── .github/
│   ├── plugin/plugin.json                       ← Copilot CLI plugin manifest
│   └── prompts/converge.prompt.md               ← VS Code Copilot Chat /converge slash command
├── agents/
│   └── convergence.md                           ← CLI agent (invokable via /agent)
└── skills/multi-agent-convergence/
    ├── SKILL.md                                 ← Full protocol (10 rules)
    └── templates/
        ├── project-goals-template.md            ← North star + guardrails
        ├── convergence-log-template.md          ← Per-round debate log
        ├── research-rigor-checklist.md          ← 25-point rigor checklist
        └── decision-assumptions-template.md     ← Rule 10 Decision Card
```

## Tools exposed by `extension.mjs`

### `convergence_protocol`
Returns protocol text. Sections:
`full`, `quick-reference` (default), `convergence-steps`, `research-rigor`,
`agent-setup`, `assumptions-template`, `decision-card`.

### `convergence_check`
Validates a finished round. Inputs: `rounds_completed`, `agents_involved`,
`challenges_exchanged`, `disputes_documented`, `assumptions_listed`,
`decision_card_attached`. Flags violations (e.g., fewer than 3 rounds, no Decision
Card, summarization instead of challenges).

## License

MIT.
