# Decision Card Template (Rule 10)

Use this template whenever an agent presents a key decision, finding, design choice,
or experimental result that the researcher is expected to act on.

One card per decision. Keep it scannable. Plain English only.

---

## Decision / Finding / Result
{One sentence. No symbols. No jargon. State the conclusion the way you would tell
a collaborator in conversation.}

## What it means in context
{Why does this matter for the project goal? Tie it back to the north-star metric
or guardrail it affects.}

## Assumptions used

| # | Assumption | Source | Confidence | Evidence |
|---|------------|--------|------------|----------|
| 1 | {what was assumed} | user-specified \| agent-inferred \| inherited-from-prior-step | high \| medium \| low | {what backs this up} |
| 2 | | | | |
| 3 | | | | |

> Source rules:
> - **user-specified**: the user wrote this constraint in their request or in `project-goals.md`.
> - **agent-inferred**: the agent filled a gap the user did not specify. Flag clearly.
> - **inherited-from-prior-step**: came from an earlier decision in this project. Cite the step.

## What would invalidate this
{Concrete conditions under which the decision flips. If you cannot name any, the
decision is too vague to act on — sharpen it before presenting.}

- {condition 1}
- {condition 2}

## Alternatives considered and rejected
| Alternative | Why rejected |
|-------------|--------------|
| {option A}  | {reason}     |
| {option B}  | {reason}     |

## Adjustments the researcher can make

For each knob the researcher can turn, state the assumption to override, the expected
effect, and how to feed the override back to the agents.

| Adjustment | Override which assumption | Expected effect | How to communicate the override |
|------------|---------------------------|-----------------|---------------------------------|
| {name}     | {assumption #}            | {what changes}  | {e.g., "tell the parent: assumption 2 should be X, re-run convergence on step Y"} |

## Adversarial verification
- Verified by: {agent name / model}
- Labels checked: {all assumptions confirmed correctly sourced and scored, or list mis-labels found}
- New issues introduced: {none, or describe}
