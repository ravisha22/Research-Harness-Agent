import { joinSession } from "@github/copilot-sdk/extension";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path discovery for SKILL.md — newest layout first, legacy fallbacks after.
const HOME = process.env.USERPROFILE || process.env.HOME || "";
const SKILL_CANDIDATES = [
  join(__dirname, "skills", "multi-agent-convergence", "SKILL.md"),
  join(__dirname, "SKILL.md"),
  join(__dirname, "..", "..", "skills", "multi-agent-convergence", "SKILL.md"),
  join(HOME, ".copilot", "skills", "multi-agent-convergence", "SKILL.md"),
  join(HOME, ".github", "skills", "multi-agent-convergence", "SKILL.md"),
];

const DECISION_TEMPLATE_CANDIDATES = [
  join(__dirname, "skills", "multi-agent-convergence", "templates", "decision-assumptions-template.md"),
  join(__dirname, "templates", "decision-assumptions-template.md"),
  join(HOME, ".copilot", "skills", "multi-agent-convergence", "templates", "decision-assumptions-template.md"),
];

function loadProtocol() {
  for (const path of SKILL_CANDIDATES) {
    if (existsSync(path)) return readFileSync(path, "utf-8");
  }
  return null;
}

function loadDecisionTemplate() {
  for (const path of DECISION_TEMPLATE_CANDIDATES) {
    if (existsSync(path)) return readFileSync(path, "utf-8");
  }
  return null;
}

const session = await joinSession({
  name: "multi-agent-convergence",
  description:
    "Multi-agent adversarial convergence protocol — enforces multi-turn discussion, transparent assumptions, adversarial verification, and goal-centered research rigor across LLM collaborations.",

  tools: [
    {
      name: "convergence_protocol",
      description:
        'Returns the full multi-agent convergence protocol. Call this when user says "converge", "align", "consensus", "brainstorm", "discuss with other LLMs", or when setting up a multi-agent project.',
      parameters: {
        type: "object",
        properties: {
          section: {
            type: "string",
            description:
              'Optional: specific section to return. One of: "full", "quick-reference", "convergence-steps", "research-rigor", "agent-setup", "assumptions-template", "decision-card". Default: "quick-reference".',
            enum: [
              "full",
              "quick-reference",
              "convergence-steps",
              "research-rigor",
              "agent-setup",
              "assumptions-template",
              "decision-card",
            ],
          },
        },
      },
      execute: async ({ section = "quick-reference" }) => {
        const protocol = loadProtocol();
        if (!protocol) {
          return {
            error:
              "Protocol file not found. Expected at skills/multi-agent-convergence/SKILL.md inside the extension folder, or at ~/.github/skills/multi-agent-convergence/SKILL.md.",
          };
        }

        if (section === "full") return { protocol };

        if (section === "quick-reference") {
          return {
            rules: [
              '1. "Converge" = multi-turn adversarial discussion (min 3 rounds: position → challenge → resolution). NEVER summarize and call it convergence.',
              "2. Three-agent setup: Parent (N-1 frontier) + Sub-agent A (GPT 5.5 persistent) + Sub-agent B (latest Claude persistent). Reuse existing idle agents.",
              "3. Every output answers: What does this mean? What was assumed? Does assumption match user's ask?",
              "4. Proposer implements, other agent verifies adversarially. Never self-verify.",
              "5. Research projects: check logic gaps, biases, fitting, leaks. Define goals first. NEVER settle.",
              "6. No symbols/jargon in user output. Plain English always.",
              "7. Rule 10 — every key decision/finding/result comes with a Decision Card: assumptions (source + confidence + evidence), what would invalidate it, alternatives rejected, adjustments the researcher can make.",
            ],
          };
        }

        if (section === "convergence-steps") {
          return {
            steps: [
              "Step 1: Parent frames question with full context",
              "Step 2: Sub-agent A produces initial position (background)",
              "Step 3: Sub-agent B produces initial position (background)",
              "Step 4: Parent sends A's EXACT position to B for challenge",
              "Step 5: Parent sends B's EXACT position to A for challenge",
              "Step 6: Parent identifies agreements and disputes",
              "Step 7: For each dispute — relay challenge back for response",
              "Step 8: Repeat until consensus or documented impasse",
              "Step 9: Parent synthesizes final position for user",
            ],
            rule: "Relay EXACT content between agents, not summaries. Minimum 3 rounds.",
          };
        }

        if (section === "research-rigor") {
          return {
            checks: [
              "Logic gaps: steps in reasoning that skip necessary evidence",
              "Loopholes: scenarios where conclusion doesn't hold",
              "Whitespaces: areas not covered by analysis",
              "Biases: systematic errors in measurement or interpretation",
              "Leaks: test data contaminating training/evaluation",
              "Fitting: solutions that work for specific cases but don't generalize",
              "Methodology: incorrect statistics, insufficient samples, incomparable baselines",
            ],
            rule: "Each agent checks the OTHER's work. Present summary of what was checked and how each concern was addressed.",
          };
        }

        if (section === "agent-setup") {
          return {
            setup: {
              parent: "Current model (N-1 frontier, e.g. Opus 4.6)",
              subAgentA:
                'GPT 5.5 persistent — task(agent_type="general-purpose", model="gpt-5.5", mode="background")',
              subAgentB:
                'Latest Claude persistent — task(agent_type="general-purpose", model="claude-opus-4.7", mode="background")',
              rule: "Check list_agents first. Reuse existing idle agents before spinning up new ones.",
              persistence:
                "Sub-agents retain context throughout project. Parent ensures they stay alive and context-aware.",
            },
          };
        }

        if (section === "assumptions-template") {
          return {
            template: {
              outcome: "[What this result/decision means in plain terms]",
              assumptions: [
                {
                  assumption: "[What was assumed]",
                  source: "user-specified | agent-inferred",
                  alignment:
                    "[How this aligns with what user asked, or if it fills a gap]",
                },
              ],
              gaps_filled:
                "[Any gaps the agent filled by making assumptions the user didn't specify]",
            },
          };
        }

        if (section === "decision-card") {
          const template = loadDecisionTemplate();
          return {
            rule: "Rule 10 — every key decision/finding/result presented to the researcher needs a Decision Card with fields: decision, what it means in context, assumptions (each with source/confidence/evidence), what would invalidate it, alternatives rejected, adjustments the researcher can make, adversarial verification note.",
            required_when: [
              "A convergence round closes with a synthesized position",
              "A research-rigor check is reported",
              "An experimental result is presented as evidence",
              "A design choice locks in a downstream constraint",
              "A sub-agent's output is forwarded to the user as a recommendation",
            ],
            schema: {
              decision: "One sentence, plain English, no jargon",
              meaning_in_context: "Why this matters for the project goal",
              assumptions: [
                {
                  assumption: "[what was assumed]",
                  source: "user-specified | agent-inferred | inherited-from-prior-step",
                  confidence: "high | medium | low",
                  evidence: "[what backs this up]",
                },
              ],
              would_invalidate: ["[concrete condition that flips the decision]"],
              alternatives_rejected: [
                { alternative: "[option]", reason: "[why rejected]" },
              ],
              researcher_adjustments: [
                {
                  adjustment: "[knob name]",
                  override_assumption: "[which assumption # to override]",
                  expected_effect: "[what changes if overridden]",
                  how_to_communicate:
                    "[exact phrasing the researcher uses to feed the override back]",
                },
              ],
              adversarial_verification: {
                verified_by: "[other agent's name/model]",
                labels_checked:
                  "[confirm all assumption sources/confidence labels, or list mis-labels]",
                new_issues_introduced: "[none, or describe]",
              },
            },
            template_markdown: template,
          };
        }

        return { error: `Unknown section: ${section}` };
      },
    },

    {
      name: "convergence_check",
      description:
        "Validates that a convergence round followed the protocol. Call after completing a multi-agent discussion to verify it was genuine adversarial convergence, not surface agreement.",
      parameters: {
        type: "object",
        properties: {
          rounds_completed: {
            type: "number",
            description: "Number of discussion rounds completed",
          },
          agents_involved: {
            type: "number",
            description: "Number of agents that participated",
          },
          challenges_exchanged: {
            type: "boolean",
            description:
              "Whether agents actually challenged each other's positions",
          },
          disputes_documented: {
            type: "boolean",
            description:
              "Whether remaining disagreements were explicitly documented",
          },
          assumptions_listed: {
            type: "boolean",
            description: "Whether assumptions were explicitly stated",
          },
          decision_card_attached: {
            type: "boolean",
            description:
              "Whether a Rule 10 Decision Card accompanies the synthesized output (assumptions with source/confidence/evidence, alternatives, adjustments).",
          },
        },
        required: ["rounds_completed", "agents_involved"],
      },
      execute: async ({
        rounds_completed,
        agents_involved,
        challenges_exchanged = false,
        disputes_documented = false,
        assumptions_listed = false,
        decision_card_attached = false,
      }) => {
        const violations = [];

        if (rounds_completed < 3) {
          violations.push(
            `VIOLATION: Only ${rounds_completed} rounds completed. Minimum is 3 (position → challenge → resolution).`
          );
        }
        if (agents_involved < 2) {
          violations.push(
            `VIOLATION: Only ${agents_involved} agent(s) involved. Convergence requires at least 2.`
          );
        }
        if (!challenges_exchanged) {
          violations.push(
            "VIOLATION: Agents did not challenge each other. This is summarization, not convergence."
          );
        }
        if (!disputes_documented) {
          violations.push(
            "WARNING: Remaining disagreements not documented. All impasses must be explicitly noted."
          );
        }
        if (!assumptions_listed) {
          violations.push(
            "WARNING: Assumptions not listed. Every convergence output must state its assumptions."
          );
        }
        if (!decision_card_attached) {
          violations.push(
            "VIOLATION (Rule 10): No Decision Card attached. Key decisions/findings/results must ship with a Decision Card listing assumptions (source + confidence + evidence), what would invalidate the result, alternatives rejected, and researcher adjustments."
          );
        }

        return {
          valid: violations.length === 0,
          violations,
          message:
            violations.length === 0
              ? "Convergence protocol followed correctly."
              : `Protocol violations found. Address before presenting to user.`,
        };
      },
    },
  ],
});
