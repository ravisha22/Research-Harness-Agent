---
mode: 'agent'
description: 'Run the Multi-Agent Adversarial Convergence Protocol on the current topic. Spins up two sub-agents from different model families, drives at least 3 rounds of challenge/response, and returns a synthesized position with a Decision Card listing every assumption used.'
model: 'Claude Sonnet 4.5'
tools: ['codebase', 'search', 'fetch', 'editFiles', 'runCommands']
---

# /converge — Multi-Agent Adversarial Convergence

You are running the **Multi-Agent Adversarial Convergence Protocol**. The full
rule set is in `skills/multi-agent-convergence/SKILL.md` (10 rules). Load it
before you act.

## Topic to converge on

${input:topic:Describe the question, decision, or research finding to converge on. Be specific — include what success looks like and what would invalidate the result.}

## How to run this

1. **Frame the question** in one sentence and restate the success criteria.
2. **Establish or load project goals** from `project-goals.md`. If none exist,
   create one using `templates/project-goals-template.md` before debating.
3. **Run two independent positions from different perspectives.** VS Code Copilot
   Chat does not orchestrate persistent background sub-agents the way the Copilot
   CLI does. Approximate the protocol sequentially: produce Position A
   (e.g., conservative / mechanism-first), then independently produce Position B
   (e.g., contrarian / evidence-first), without letting either see the other
   until both are committed. If the user has the CLI available, recommend running
   the `/agent → convergence` flow there for true two-model debate.
4. **Collect initial positions** from both. Do not proceed until both have
   answered the framed question independently.
5. **Cross-challenge (Round 2).** Forward each sub-agent the *exact* text of the
   other's position. Ask for mechanism-level objections — which step skips
   evidence, which assumption is shaky, which alternative was ignored.
6. **Resolve (Round 3+).** Send each challenge back to its target for
   accept / reject-with-reasoning / modify. Keep going until consensus or until
   the remaining disputes are clearly named and bounded.
7. **Run the research-rigor checklist** against the synthesized position:
   logic gaps, loopholes, whitespaces, biases, leaks, fitting, methodology.
8. **Produce a Decision Card** (Rule 10) using
   `templates/decision-assumptions-template.md`. Every assumption must list its
   source (`user-specified` | `agent-inferred` | `inherited-from-prior-step`),
   confidence, and supporting evidence. Name the knobs the researcher can turn.
9. **Write the convergence log** to
   `.copilot-convergence/{topic-slug}.md` using
   `templates/convergence-log-template.md`. Include all verbatim positions and
   challenges so the researcher can audit how consensus was reached.
10. **Validate the round** against the protocol checklist:
    - ≥ 3 rounds completed
    - ≥ 2 agents involved
    - Real challenges exchanged (not summaries)
    - Remaining disputes documented
    - All assumptions listed in the Decision Card
    Fix violations before presenting.

## Output to the user

Respond with, in order:

1. The synthesized position in plain English.
2. The Decision Card (Rule 10).
3. Remaining disputes, explicitly labeled (or "none, full consensus").
4. Path to the convergence log file.
5. The top 3 adjustments the researcher could make to flip the result, with the
   exact assumption each would override.

## Hard rules to follow

- Verbatim relay between sub-agents. Never paraphrase a position before forwarding.
- Proposer implements, the other agent verifies. Never self-verify.
- No symbols or jargon in user output. Plain English always.
- "Never settle." If a sub-agent appears to accept a mediocre answer, challenge
  it on the user's behalf before closing the round.
- If the project goal becomes unreachable with the current approach, escalate to
  the user with honest reasoning and alternatives.
