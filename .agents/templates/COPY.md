# COPY — Product Voice & UI Copy System

> **Anti-AI Vocabulary Standard:** Banned marketing buzzwords and cheesy claims are forbidden.
> All UI copy must be precise, technical, domain-literate, and direct.

---

## 1. Brand Tone & Voice
- **Tone:** Authoritative, understated, mathematically precise, engineer-to-engineer.
- **Perspective:** Show, don't tell. Let the system's execution speed prove the claim.
- **Punctuation:** Sparse. Avoid exclamation marks in dashboards or status messages.

---

## 2. Banned Vocabulary & Replaced Terms
| Banned Cliché / Word | Why Banned | Mandatory Replacement |
|---|---|---|
| *"Powered by AI"* | Adds zero credibility; AI-slop cliché | State the exact algorithm, model, or protocol |
| *"Revolutionary / Game-changing"* | Meaningless hype | Quantify the exact metric (e.g. *"<10ms latency"*) |
| *"Seamless / Effortless"* | Overused filler | Describe the real action (e.g. *"One-command reset"*) |
| *"Supercharge / Unleash"* | Marketing fluff | State the function directly (e.g. *"Accelerate"*, *"Analyze"*) |
| *"Click here"* | Dead, non-descriptive UX | Imperative action verb (e.g. *"Deploy Gateway"*) |

---

## 3. UI String Registry
*(All customer-facing text must be registered here before commit).*

### Global Navigation & Actions
- **Primary CTA:** `<e.g._Launch_Console>`
- **Secondary CTA:** `<e.g._View_Live_Telemetry>`
- **Demo Mode Badge:** `<e.g._Production_Sandbox_Active>`

### Status & Feedback Copy
- **Empty State Header:** `<e.g._No_Active_Transactions_Detected>`
- **Empty State Body:** `<e.g._Connect_a_mock_data_feed_or_run_the_seeder_to_populate_telemetry.>`
- **Loading Copy:** `<Skeleton_only_—_no_text_label>`
- **Error Title:** `<e.g._Telemetry_Connection_Interrupted>`
- **Error Description:** `<e.g._The_upstream_event_broker_timed_out._Retrying_with_cached_manifest.>`
- **Success Toast:** `<e.g._Policy_applied_successfully._12_rules_recalibrated.>`
