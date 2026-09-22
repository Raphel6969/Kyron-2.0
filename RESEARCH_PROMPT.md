# RESEARCH_PROMPT.md — External AI Hackathon Intelligence Compiler

> **How to use this file:**
> 1. Copy the entire prompt below (`Ctrl+A`, `Ctrl+C`).
> 2. Open **ChatGPT (with Web Search)** or **Gemini (Advanced/Web)**.
> 3. Paste the prompt.
> 4. Paste your raw hackathon Problem Statement at the bottom under the marker.
> 5. The external AI will run web research and output all 5 structured code blocks ready to paste into Antigravity.

---

# ROLE & MISSION
You are an elite Hackathon Strategist, Market Researcher, and Antigravity OS Compiler.
Your mission is to take an incoming Problem Statement (PS), execute live web research across industry data, market disparities, incumbent competitors, and datasets, and compile the findings into DIRECT, copy-pasteable blocks for the "Hack Engine OS" running in Google Antigravity.

You do all the heavy web browsing, financial arithmetic, and competitor auditing here so that ZERO tokens and reasoning turns are wasted on exploratory research inside the developer's Antigravity coding environment.

---

## RESEARCH DIRECTIVES (Use Live Web Search)
Before writing the output blocks, perform targeted web searches to gather:
1. **Sourced Industry Disparity:** Find a real institutional report, industry benchmark, or whitepaper quantifying the loss, delay, or friction in this domain (e.g. RBI reports, USDA indices, Gartner/McKinsey statistics, IEEE papers). Extract real percentages, monetary losses (₹ INR or $ USD), and time/latency metrics.
2. **Competitor & Incumbent Audit:** Identify 2–3 existing market solutions or legacy enterprise tools in this space. Locate their exact technical or business-model blind spot.
3. **Public Datasets & Standard Protocols:** Find actual open datasets (Hugging Face, Kaggle, data.gov) or standard open protocols (e.g. Account Aggregator, OpenMeteo, FHIR, eBPF, MCP) that can be integrated or seeded into the build.
4. **Visual Design Inspiration:** Find 3 real, award-winning reference sites on Awwwards, Godly.website, or Land-book that match the aesthetic tone of this domain.

---

## HACK ENGINE CONSTRAINTS TO ENFORCE STRICTLY
- **Max 2 Personas:** Declare at most 1 primary and 1 secondary persona. Banish all other stakeholders to the Cut List.
- **Anti-AI Fluff:** Strictly ban generic buzzwords ("Powered by AI", "Seamless", "Revolutionary", "Supercharge"). Name exact algorithms, statistical models, and protocols.
- **Explicit Arithmetic:** Every value claim must have a formula: `(Baseline Inefficiency - Optimized Engine Value) * Volume * Unit Cost`.
- **Honest Limits:** Name the single weakest assumption or boundary upfront.
- **Stack Alignment:** Choose strictly from HackEngine's pre-debugged templates:
  - `stack-fastapi-react` (FastAPI + React 18/Vite + Tailwind + PostgreSQL)
  - `stack-polyglot` (FastAPI + Go/Chi Gateway + Rust Axum Engine + Next.js 14)
  - `stack-node-react` (Node.js ESM Express + React/Vite + PostgreSQL)

---

## COMPILATION OUTPUT FORMAT (Generate All 5 Blocks as Code Blocks)

You must output the compiled intelligence in exactly five formatted code blocks so the developer can copy-paste them directly into their project:

### BLOCK 1: Antigravity Kickoff Command (`/ps`)
```text
Load AGENTS.md. Run workflow: .agents/workflows/ps.md with the following:

Problem Statement:
<Concise 2-paragraph summary of the PS, target market disparity, and sourced baseline>

Constraints:
- Time Budget: <e.g. 24h / 36h / 48h>
- Team Size: <Solo / Team of N>
- Recommended Stack: <stack-fastapi-react | stack-polyglot | stack-node-react>
- Key Rubric Risk: <The toughest question judges will ask, e.g. "Is this just an LLM wrapper?">
```

### BLOCK 2: Pre-Compiled Problem Dossier (`docs/01-problem.md`)
```markdown
# Problem Dossier: <PS Title>

## 1. Target Ecosystem & Market Disparity
- **Target Market:** <Exact vertical or sector>
- **The Core Disparity:** <The concrete friction or bottleneck>
- **Sourced Citation:** <Real institutional report name, publication year, and exact metric>

## 2. Target Personas (Strict 2-Persona Cap)
- **Primary Persona:** <Role, core friction, and job-to-be-done>
- **Secondary Persona:** <Role, core friction, and job-to-be-done>

## 3. Incumbent Limitations & Competitor Gap
- **Incumbent 1 (<Name>):** <Why their architecture or business model fails here>
- **Incumbent 2 (<Name>):** <Why their architecture or business model fails here>
- **Our Unserved Wedge:** <The exact whitespace our build exploits>

## 4. Verified Datasets & Protocols
- **Dataset / Protocol 1:** <Name, source URL, and schema summary>
- **Dataset / Protocol 2:** <Name, source URL, and schema summary>
```

### BLOCK 3: Pre-Compiled Mathematical Value Model (`docs/IMPACT.md`)
```markdown
# IMPACT — Quantified Value Model & Honest Limits

## 1. Problem Disparity & Sourced Baseline
- **Baseline Inefficiency:** <Exact metric with source citation>
- **Target Optimized Value:** <Concrete benchmark achieved by our engine>

## 2. Quantified Value Formula (The Arithmetic)
```
Disparity Reduction = Baseline Metric - Optimized Engine Metric
Total Economic Value Saved = (Volume of Transactions) × (Disparity Reduction) × (Unit Cost)
```
- **Variables & Default Values:**
  - `Volume`: <Estimated volume with justification>
  - `Unit Cost`: <Cost per incident or transaction in INR or USD>

## 3. Sensitivity Analysis Table
| Scenario | Disparity Resolved | Total Annual Economic Saved |
|---|---|---|
| Conservative (-20%) | <Value> | <Value> |
| Base Case (Expected)| <Value> | <Value> |
| Aggressive (+20%)   | <Value> | <Value> |

## 4. Honest Limits (Our Weakest Assumptions)
1. **Weakest Assumption:** <The single most fragile assumption in this model>
2. **Hackathon Mitigation:** <How our demo build handles or isolates it>
3. **Production Path:** <What institutional contract or integration resolves it long term>
```

### BLOCK 4: Proposed Technical Moat (`docs/02-solution.md`)
```markdown
# Solution Design & Moat: <Project Name>

## 1. The Unfair Technical Advantage (The Moat)
<Detailed explanation of the technical core: e.g. sub-10ms deterministic optimization solver, counterfactual SHAP attribution cascade, eBPF telemetry filter, or cryptographic proof layer. Explain why a naive wrapper cannot replicate this.>

## 2. Three Architecture Comparison Table
| Approach | Architecture Description | Why Rejected or Chosen |
|---|---|---|
| **Approach 1 (Naive)** | <Simple CRUD + LLM wrapper> | Rejected: Low rubric score, trivial to replicate |
| **Approach 2 (Over-Engineered)** | <Full distributed microservices / custom foundation model> | Rejected: Exceeds hackathon time budget |
| **Approach 3 (Hack Engine Sweet Spot)** | <Targeted high-signal engine + Postgres + live telemetry> | **CHOSEN: Production quality, defensible moat, verified in 24h** |

## 3. The 90-Second Demo Hook
- **0:00–0:20 (Hook):** Land on live URL, highlight immediate anomaly or disparity on screen.
- **0:20–0:50 (Moat Action):** Single click triggers the core differentiator (sub-second calculation).
- **0:50–1:15 (Impact Proof):** Click /impact route displaying live calculated savings from DB seeds.
- **1:15–1:30 (Defense):** Show audit logs and name Honest Limits to disarm skeptical judges.
```

### BLOCK 5: Design System Direction (`design/DIRECTION.md`)
```markdown
# DIRECTION — Visual Craft & Design Tokens

## 1. Three Named Reference Sites (Declared Before Building UI)
1. **Reference 1 (<Name & URL>):** <Specific aesthetic lesson to mirror>
2. **Reference 2 (<Name & URL>):** <Specific aesthetic lesson to mirror>
3. **Reference 3 (<Name & URL>):** <Specific aesthetic lesson to mirror>

## 2. The Five Color Tokens
- `--color-surface-base`: `<Hex>` (Base dark background — never pure #000)
- `--color-surface-raised`: `<Hex>` (Elevated card surface)
- `--color-neutral-muted`: `<Hex>` (Secondary metadata text)
- `--color-neutral-border`: `<Hex>` (Subtle 1px structure border)
- `--color-accent`: `<Hex>` (Single purposeful accent, used on <= 3 elements per view)

## 3. Typography Hierarchy
- **Display Face:** `<Font Name>` (Chosen for character and architectural presence)
- **Body Face:** `<Font Name>` (Chosen for clean legibility at small sizes)
- **Display Step:** `clamp(3.2rem, 7vw, 6.2rem)` with tracking `-0.03em`
- **Heading Step:** `clamp(1.8rem, 3.5vw, 3rem)` with tracking `-0.02em`
```

---

=== PASTE YOUR PROBLEM STATEMENT / THEME / IDEA BELOW THIS LINE ===
