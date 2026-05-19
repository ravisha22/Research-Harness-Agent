---
name: multi-agent-convergence
description: |
  Multi-agent adversarial convergence protocol for research and engineering projects.
  Use when:
  - User asks agents to "converge", "align", "build consensus", or "brainstorm"
  - Multiple LLMs are needed for a project
  - Research projects require rigorous verification
  - User wants adversarial review between models
  Triggers on: converge, align, consensus, brainstorm, discuss with other LLMs,
  have others review, multi-model, adversarial review, research project setup
---

# Multi-Agent Adversarial Convergence Protocol

## Purpose

This protocol governs how multiple LLM agents collaborate on projects. It ensures genuine multi-turn adversarial discussion, not surface-level agreement. It prevents assumption layering, enforces verification, and drives toward project goals relentlessly.

## Protocol Rules

### Rule 1: Convergence Means Multi-Turn Discussion

When the user says "converge", "align", "build consensus", "brainstorm", or "discuss with other LLMs", this means:

1. Each agent produces an initial position
2. Each agent receives the OTHER agent's position
3. Each agent challenges the other's position with specific mechanism-level objections
4. Each agent responds to challenges — accepting, rejecting with reasoning, or modifying
5. Repeat until genuine consensus emerges or irreducible disagreements are clearly documented
6. The parent agent synthesizes the final position, noting what was agreed and what remains disputed

**NEVER** reduce convergence to: "both said similar things, converged." That is not convergence. That is summarization.

**Minimum rounds**: 3 (initial position → challenge → resolution). More rounds if disagreements remain.

### Rule 2: Agent Setup for Multi-Agent Projects

When a project requires multiple LLMs:

- **Parent agent**: The agent the user is talking to (e.g., Opus 4.6). Orchestrates, arbitrates, provides data.
- **Sub-agent A**: Persistent background agent from a different model family (e.g., GPT 5.5). Retains context across the project. Spun up at project start, kept alive throughout.
- **Sub-agent B**: Persistent background agent from the same family as parent but latest frontier (e.g., Opus 4.7). Retains context across the project.

The parent agent is responsible for:
- Keeping sub-agents alive and context-aware throughout the project
- Feeding sub-agents complete context on each task
- Ensuring sub-agents communicate WITH EACH OTHER (via the parent relaying messages), not just independently
- Never letting a sub-agent's context go stale

### Rule 3: Transparent Assumptions

Every output from any agent (parent or sub) that goes to the user or influences a decision must answer:

1. **What does this outcome mean in plain terms?** No jargon, no symbols, no shorthand.
2. **What assumptions did the agent make?** List each one explicitly.
3. **How do those assumptions align with what the user asked?** If the agent filled a gap by assuming something the user didn't specify, flag it clearly: "ASSUMPTION: [what was assumed] — User did not specify this. I assumed X because Y."

Sub-agents must do this for ALL outputs consumed by the parent agent or the user, preventing assumption layering where Agent A assumes X, Agent B builds on X without questioning it, and the user gets a conclusion built on two unchecked assumptions.

### Rule 4: Convergence Protocol for Discussions

When multi-agent convergence is triggered:

```
Step 1: Parent frames the question with full context
Step 2: Sub-agent A produces initial position (background)
Step 3: Sub-agent B produces initial position (background)
Step 4: Parent sends A's position to B for challenge
Step 5: Parent sends B's position to A for challenge
Step 6: Parent reads challenges, identifies agreements and disputes
Step 7: For each dispute — send the other agent's challenge back for response
Step 8: Repeat Step 7 until consensus or documented impasse
Step 9: Parent synthesizes final position for user
```

The parent MUST relay actual content between agents, not summaries. Agents must see each other's exact words.

### Rule 5: Proposer Implements, Verifier Tests

When an agent identifies an issue during convergence:

- The agent who PROPOSED the fix implements it
- The OTHER agent verifies by:
  - Reading the actual code changes
  - Running tests or checks where possible
  - Confirming the fix addresses the identified issue
  - Flagging any new issues introduced

Never let the same agent both implement and verify its own work.

### Rule 6: Adversarial Verification

All verification between agents is adversarial:

- The verifying agent's job is to find problems, not confirm correctness
- "Looks good" is not acceptable verification — the agent must explain what it checked and why it's satisfied
- The verifying agent should actively try to break the implementation
- Common adversarial checks:
  - Edge cases the implementer didn't consider
  - Assumptions that don't hold under different conditions
  - Dependencies that could change
  - Performance under stress
  - Security implications

### Rule 7: Research Project Rigor

For research projects, agents must continuously check for:

- **Logic gaps**: Steps in reasoning that skip necessary evidence
- **Loopholes**: Scenarios where the conclusion doesn't hold
- **Whitespaces**: Areas not covered by the analysis
- **Biases**: Systematic errors in measurement or interpretation
- **Leaks**: Information from test data contaminating training/evaluation
- **Fitting**: Solutions that work for specific cases but don't generalize
- **Methodology issues**: Incorrect statistical methods, insufficient sample sizes, incomparable baselines

Each agent checks the OTHER agent's work for these issues. Results are summarized for the user showing what was checked and how each concern was addressed or acknowledged.

### Rule 8: Goal-Centered Research

For research projects:

1. If project goals are not established, the parent agent works with the user to define:
   - Primary goal (what success looks like)
   - Success factors (measurable criteria)
   - North star metrics (the numbers that matter)
   - Guardrails (what must not happen)
   
2. Once established, goals are documented in a persistent memory file accessible to all agents.

3. Every discussion, decision, and implementation is evaluated against these goals.

4. If a proposed solution doesn't advance toward the goals, agents must flag it and propose alternatives that do.

### Rule 9: Never Settle

For research projects, agents must:

- **Not accept** solutions that merely achieve "a" solution — push toward the project's north star
- **Not stop** at the first working approach — evaluate whether a better approach exists
- **Not declare victory** on intermediate metrics — only the final project goals matter
- **Challenge each other** when either agent appears to settle for "good enough"
- **Track the gap** between current performance and the goal at all times
- **Escalate to the user** when the agents believe the goal may be unreachable with current approach, with honest reasoning about why and what alternatives exist

### Rule 10: Per-Decision Assumption Disclosure (Decision Cards)

Rule 3 says every output must state its assumptions. Rule 10 makes that **structured and actionable** so a researcher can scan, override, and re-run without re-reading the whole conversation.

For every key decision, review finding, design choice, or result that the researcher will act on, the responsible agent must produce a **Decision Card** with these fields:

1. **Decision / Finding / Result** — one sentence, plain English. No symbols, no jargon.
2. **What it means in context** — why this matters for the project goal.
3. **Assumptions used** — bulleted list. For each:
   - The assumption
   - Source: `user-specified` | `agent-inferred` | `inherited-from-prior-step`
   - Confidence: `high` | `medium` | `low`
   - What evidence supports it
4. **What would invalidate this** — concrete conditions under which the decision flips. If none can be stated, the decision is too vague to act on.
5. **Alternatives considered and rejected** — at least one, with the reason for rejection.
6. **Adjustments the researcher can make** — explicit knobs. Each adjustment names:
   - The assumption to override
   - The expected effect on the result
   - How to communicate the override back to the agents

A Decision Card is required whenever:

- A convergence round closes with a synthesized position
- A research-rigor check is reported
- An experimental result is presented as evidence
- A design choice locks in a downstream constraint
- A sub-agent's output is forwarded to the user as a recommendation

Scope discipline: list **decision-critical** assumptions, not exhaustive ones. If
no real alternative existed, write "Alternatives: not applicable — observed
result" instead of inventing one. If the only adjustment is "rerun with new
data", say so. The goal is researcher-actionable disclosure, not paperwork.

**Adversarial check:** the verifying agent must read the Decision Card and either confirm each assumption is correctly labeled, or flag mis-labelings (e.g., an `agent-inferred` assumption masquerading as `user-specified`). Mis-labelings are violations, not stylistic issues.

Template: `templates/decision-assumptions-template.md`.

## Implementation Notes

### Spinning Up Persistent Sub-Agents

Use the `task` tool with `mode: "background"` to create persistent agents. Keep their `agent_id` stored for the duration of the project. Use `write_agent` to send follow-up messages and maintain context.

```
Sub-agent A: task(agent_type="general-purpose", model="gpt-5.5", mode="background", name="project-gpt55")
Sub-agent B: task(agent_type="general-purpose", model="claude-opus-4.7", mode="background", name="project-opus47")
```

### Memory File for Project Goals

Store in: `{session_folder}/files/project-goals.md`

Contents:
- Project name and description
- Primary goal
- Success factors with measurable criteria
- North star metrics with current values
- Guardrails
- Key decisions made (with rationale)
- Current status relative to goals

### Convergence Log

For each convergence round, maintain a log:
- Question posed
- Agent A's initial position
- Agent B's initial position
- Challenges exchanged
- Resolutions reached
- Remaining disputes
- Final synthesized position

This log helps the user understand HOW consensus was reached, not just WHAT was agreed.
