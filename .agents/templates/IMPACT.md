# IMPACT — Quantified Value Model & Honest Limits

> **Defensibility Standard:** Unverified claims fail hackathon evaluations during Q&A.
> Every value claim must have a sourced baseline, explicit arithmetic, and declared limits.

---

## 1. Problem Disparity & Sourced Baseline
- **Target Market / Ecosystem:** `<e.g._Indian_MSME_credit_underwriting>`
- **The Disparity Identified:** `<The specific friction or loss occurring in the status quo>`
- **Sourced Baseline Metric:**
  - **Metric Value:** `<e.g._30%_post-harvest_produce_spoilage_or_14-day_loan_turnaround>`
  - **Source Citation:** `<e.g._RBI_Report_on_MSME_Lending_2024_/_USDA_Handbook_66>`

---

## 2. Quantified Value Formula (The Arithmetic)
```
Disparity Reduction = <Baseline Metric> - <Engine Optimized Metric>
Total Economic Value Saved = <Volume / Transactions> × <Unit Cost Saved>
```
- **Formula Variables:**
  - `<Variable 1>` = `<definition_and_default_value>`
  - `<Variable 2>` = `<definition_and_default_value>`

---

## 3. Live Telemetry Implementation (`/impact`)
The formula above is implemented directly in code:
- **Backend Route:** `GET /impact`
- **Underlying SQL Query / Event Aggregation:** `<Query aggregating table records>`
- **Frontend Visualization:** `<Component rendering live sparkline or counter>`

---

## 4. Sensitivity Analysis
| Variable Changed | Conservative Case (-20%) | Base Case (Expected) | Aggressive Case (+20%) |
|---|---|---|---|
| `<key_variable_1>` | `<result_value>` | `<result_value>` | `<result_value>` |
| `<key_variable_2>` | `<result_value>` | `<result_value>` | `<result_value>` |

---

## 5. Honest Limits (Our Weakest Assumptions)
*(Naming your boundaries first disarms critical judges and establishes credibility).*

1. **Weakest Assumption:**
   <The most fragile technical or market assumption in the current implementation>.
2. **Current Mitigation:**
   <How the hackathon build mitigates or isolates this limitation>.
3. **Path to Production:**
   <What institutional integration, data contract, or partnership resolves it in production>.
