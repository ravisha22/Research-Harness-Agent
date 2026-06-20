# Warm-Start Amortization: Effort vs. Output Break-Even

> **Status:** Design draft (captured from brainstorming session, 2026-06-20)
> **Author/Driver:** @ravisha22
> **Origin:** Inspired by the VS Code blog ["What 50,000 Runs of a 5-Line Eval Taught Us"](https://code.visualstudio.com/blogs/2026/06/19/what-50000-runs-taught-us)
> **Companion reading:** ["The Coding Harness Behind GitHub Copilot in VS Code"](https://code.visualstudio.com/blogs/2026/05/15/agent-harnesses-github-copilot-vscode)

---

## 1. Research Question

When an agent does a task (R1), then is asked to do a **similar-but-different** follow-up (R2),
does it **amortize** its earlier exploration/reasoning investment into later efficiency?

Treating **R1 as baseline effort**, for R2 (and subsequent runs) we ask:

- Does effort **come down**, stay **similar**, or go **up**?
- Decomposed across: **reasoning**, **tool calls**, **exploration**, **accuracy**.
- **Is there a break-even** of effort vs. output — a point where "building on top" stops paying off?

### The "building on top" delta
R2 is intentionally **not** a 100% replay of R1. It is *predictable but different*, with a
**delta of at least ~25%** so the LLM must actually do work rather than replay cached output.

- Anchor example: `say_hello` writes `HELLO` to `HELLO.txt`; the follow-up inserts `"How are you?"`.
- Similar enough to enable transfer, different enough to force genuine work.
- **Guardrail:** R2 must perform a real write (assert it) — otherwise the model no-ops ("already done") and we measure a *skip*, not *transfer*.

---

## 2. Background — How the VS Code Eval Was Built (and why it's reusable)

From inspecting [`microsoft/vscode-copilot-chat`](https://github.com/microsoft/vscode-copilot-chat)
(commit `5863f5a`), the blog's methodology maps directly onto existing, open-source machinery.
**We do not need to build the harness, the agent loop, or the telemetry from scratch.**

### 2.1 The task ("5-line eval")
- A tiny, deterministic, unambiguous task: *"Add HELLO to HELLO.txt."*
- Assertions: file exists + contains expected content.
- Because the task is trivial, **any variance is attributable to the model/system**, not the task.
- It runs **before every benchmark** as a smoke test / canary (catches harness + infra regressions early).

### 2.2 The "run N times" engine (the 50,000-runs loop)
- **`test/testExecutor.ts` → `executeTestNTimes`**: *"Runs a single scenario `nRuns` times."*
  - Loops `nRuns`, runs in parallel, then **aggregates**: pass count, score (`scoreTotal / results.length`),
    and token usage summed across runs (`completion_tokens`, `prompt_tokens`, `total_tokens`, `cached_tokens`).
  - Feeds into baseline comparison + scorecards.
- **`test/simulationMain.ts`**: discovers scenarios, picks models, runs the suite, writes reports.
- **`test/e2e/scenarioTest.ts` → `generateScenarioTestRunner`**: fresh `SimulationWorkspace` per run,
  builds a real `ChatRequest` with the tool set, runs the **real agent loop** (not a mock).
- Scenarios live as JSON folders under **`test/scenarios/`** (e.g. `test-tools`, `test-system`).
  Tool/agent tests gated behind `AGENT_TESTS=1`.
- Tool-call assertions: `test/e2e/toolSimTest.ts` (`IToolCallExpectation`, `validateToolCallExpectation`).

### 2.3 How tool calls / tokens / reasoning effort are captured (OpenTelemetry)
The agent loop emits a hierarchical span tree per run, e.g.:

```
invoke_agent copilot                 [~15s]
  |-- chat gpt-4o                     (LLM requests tool calls)
  |-- execute_tool readFile
  |-- execute_tool runCommand
  '-- chat gpt-4o                     (final response)
```

Key attributes (from `src/platform/otel/common/genAiAttributes.ts`, documented in
`docs/monitoring/agent_monitoring.md`):

| Signal              | OTel attribute                                                                 |
|---------------------|--------------------------------------------------------------------------------|
| Tool calls          | `gen_ai.tool.name`, `gen_ai.tool.call.id`, `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result` |
| Input/output tokens | `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`                       |
| **Reasoning effort**| `gen_ai.usage.reasoning_tokens` (*"Custom: reasoning/thinking token count"*)    |
| Cache reuse         | cached / cache-read tokens (`cached_tokens`)                                    |
| Turns / rounds      | `copilot_chat.turn_count`, `copilot_chat.tool_call_round`                       |

Reasoning content itself is modeled via `ToolCallRound` (`ThinkingData` / `ThinkingDataItem`),
populated from `usage.completion_tokens_details.reasoning_tokens`.

### 2.4 Data collection / export paths
- **JSONL file exporter** — `COPILOT_OTEL_FILE_EXPORTER_PATH=/path/file.jsonl` (best for "run N times, analyze the file").
- **SQLite store** — `src/platform/otel/node/sqlite/otelSqliteStore.ts` denormalizes spans into queryable
  columns (`input_tokens`, `output_tokens`, `reasoning_tokens`, `tool_name`, `tool_call_id`, `llm_calls`, `tool_calls`).
- **OTLP endpoint** — stream to any collector/dashboard.
- OTel is **off by default** (zero overhead); enabled via `COPILOT_OTEL_ENABLED=true`.

> ⚠️ The *exact* 50k-run orchestration, model fleet, and internal dashboards are **not** open-sourced.
> We inherit the **engine**; we supply the **task**, the **loop count**, and the **aggregation/analysis**.

---

## 3. Experiment Design

### 3.1 The critical control: separate the three reasons effort can drop
If we only run R1 → R2 and watch effort fall, we cannot attribute *why*. Three mechanisms reduce effort:
1. genuine **reuse** of prior exploration/reasoning (the thing we want to measure),
2. **workspace priming** (R1's artifacts already exist → less to do),
3. **token caching** (infra serves `cached_tokens`).

So R2 is run under multiple **carryover conditions**, and amortization is the *difference between them*:

| Condition | Context (reasoning history) | Workspace (R1 artifacts) | Isolates                          |
|-----------|------------------------------|---------------------------|-----------------------------------|
| **C0 — Cold control**       | fresh         | fresh    | pure baseline; R2 should ≈ R1     |
| **C1 — Warm workspace**     | fresh         | primed   | environment priming only          |
| **C2 — Warm context**       | same session  | primed   | full warm-start (headline case)   |
| **C3 — Warm context, clean fs** | same session | fresh | *pure* in-context reasoning transfer |

**Amortization ≈ `effort(C2) − effort(C0)`.** Without C0, results are anecdotal.

### 3.2 Effort metric & break-even definition
Per effort dimension `E`, define the **effort ratio**:

```
rho_E = E(R2) / E(R1)
```

- `rho < 1` → effort came down (warm-start paid off)
- `rho ≈ 1` → no transfer
- `rho > 1` → effort went **up** (negative transfer — a real, interesting failure mode)

**Break-even via task delta:** make R2's delta-from-R1 the x-axis and plot `rho` against it.

```
rho (effort ratio)
1.0 |.......................................  <- cold-task asymptote
    |                         ____________
    |                ______/        <- break-even: "building on top"
    |          __/                     stops buying you anything
    |     __/
    |  _/
    | /
    +-----------------------------------> task delta (% different from R1)
   0%(replay)   25%   50%   75%   100%(unrelated)
```

**Break-even = the delta where `rho -> 1`.** Below it, building-on-top saves effort; above it,
R2 is effectively a cold task. The `say_hello -> "How are you?"` pair sits near the left (low delta,
≥25% to force work) — the regime with the steepest expected savings.

### 3.3 Effort dimensions → measures → signals (all already emitted)
| Dimension      | Concrete measure                                  | OTel source                          |
|----------------|---------------------------------------------------|--------------------------------------|
| **Reasoning**  | thinking tokens per run                            | `gen_ai.usage.reasoning_tokens`      |
| **Tool calls** | count of `execute_tool` spans                      | tool spans / `tool_call_round`       |
| **Exploration**| # read/search calls **before first write**         | `gen_ai.tool.name` ordering          |
| **Accuracy**   | success + wasted/redundant calls                   | assertions + tool results            |
| **Cache reuse**| cached vs. fresh tokens (**report separately**)    | `cached_tokens`                      |
| **Latency/turns** | span duration, turn count                       | span tree / `turn_count`             |

> **Report cache reuse as its own channel.** "Model reasoned less" vs. "infra cached the prompt"
> are very different claims and must not be conflated.

### 3.4 Hypotheses (the three outcomes, explicit)
- **H1 — Amortization:** In C2/C3, `rho_reasoning` and `rho_exploration < 1` while success holds.
  The model skips re-exploring because file/structure is already "known."
- **H2 — No transfer:** `rho ≈ 1` across conditions. Task too cheap to amortize; delta must be large
  enough to *have* exploration worth reusing.
- **H3 — Negative transfer:** `rho > 1`. Prior state adds deliberation ("already done?"),
  stale-context confusion, or redundant verification reads. **Most interesting if observed.**

### 3.5 Confounds to design against
- **Idempotency trap:** R2 too close to R1 -> model no-ops. The ≥25% delta guards this;
  **assert R2 performs a write.**
- **Order effects:** R1->R2 can't be reordered; counterbalance *which content* is R1 vs R2 across trials.
- **Stochasticity:** N runs per cell; report **distributions**, not point estimates (the blog's core lesson).

---

## 4. Implementation Plan (on the `vscode-copilot-chat` harness)

### 4.1 Scaffolding shape
- **C2 / C3** -> a **multi-turn scenario** (turn 1 = R1, turn 2 = R2); context persists naturally.
- **C0 / C1** -> two **single-turn** scenarios with workspace reset (C0) or pre-seeded with R1's artifact (C1).
- **Repetition + aggregation** -> `executeTestNTimes`.
- **Tagging** -> stamp each run via resource attributes so JSONL is groupable:
  `OTEL_RESOURCE_ATTRIBUTES=condition=C2,delta=25,pair=hello-howareyou,model=...`
- **Analysis** -> group the JSONL by `(model, condition, delta)` -> compute `rho_E` distributions -> emit the curve.

### 4.2 Experiment matrix
```
condition {C0, C1, C2, C3}
  x  delta {0, 25, 50, 75, 100}
  x  reasoning_effort {low, med, high}
  x  model {...}
  x  N runs
```

### 4.3 Example run setup
```bash
# enable agent/tool scenarios
export AGENT_TESTS=1

# capture tool calls, tokens, reasoning_tokens -> JSONL
export COPILOT_OTEL_ENABLED=true
export COPILOT_OTEL_CAPTURE_CONTENT=true          # include prompt/response + thinking content
export COPILOT_OTEL_FILE_EXPORTER_PATH=/tmp/warm_start.jsonl
export OTEL_RESOURCE_ATTRIBUTES=benchmark.name=warm_start,condition=C2,delta=25,pair=hello-howareyou

# then run the scenario N times via the simulation runner (nRuns -> executeTestNTimes)
```

### 4.4 Reusable vs. bring-your-own
| Component                                   | Status                      |
|---------------------------------------------|-----------------------------|
| Run-N-times + scorecards + baselines        | ✅ Reuse — `testExecutor.ts` |
| Per-run agent loop + tool execution         | ✅ Reuse — `scenarioTest.ts` |
| Tool-call / token / `reasoning_tokens` capture | ✅ Reuse — OTel GenAI attrs |
| Export to JSONL / SQLite / OTLP             | ✅ Reuse — `otelConfig.ts`   |
| The `say_hello -> "How are you?"` task pair  | ✍️ Author small scenarios    |
| Condition sweep + loop count + analysis     | ✍️ Drive + aggregate         |

---

## 5. Deliverables (next steps)
- **A.** Scenario files for the `say_hello -> "How are you?"` delta-pair set (C0–C3 variants).
- **B.** A condition-sweep runner (matrix in §4.2) that tags runs via `OTEL_RESOURCE_ATTRIBUTES`.
- **C.** A JSONL -> `rho`-curve analysis script (pass rate, avg tool calls, avg reasoning tokens, cache
  channel, break-even delta) per `(model, condition, delta)`.

### Open decisions
1. **Target repo:** fork of `microsoft/vscode-copilot-chat` (most faithful) vs. a thinner harness here.
2. **Lever to sweep:** `reasoning_effort` {low, med, high} and/or exploration budget (tool-call cap).
3. **Output axis weighting:** success-only vs. success + quality (LLM-judge) + token cost composite.

---

## Appendix — Key source references (vscode-copilot-chat @ 5863f5a)
- `test/testExecutor.ts` — `executeTestNTimes` (run-N-times + aggregation)
- `test/simulationMain.ts` — suite entry point
- `test/e2e/scenarioTest.ts` — `generateScenarioTestRunner` (per-run agent loop)
- `test/e2e/toolSimTest.ts` — tool-call expectations/validation
- `test/scenarios/` — JSON scenario folders (task definitions)
- `src/platform/otel/common/genAiAttributes.ts` — GenAI OTel attribute schema
- `src/platform/otel/common/otelConfig.ts` — exporter config (JSONL / OTLP)
- `src/platform/otel/node/sqlite/otelSqliteStore.ts` — denormalized analytics store
- `src/extension/intents/node/toolCallingLoop.ts` — `invoke_agent` span emission
- `src/extension/prompt/common/toolCallRound.ts` — `ThinkingData` / reasoning content
- `docs/monitoring/agent_monitoring.md` — monitoring/telemetry documentation
