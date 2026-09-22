---
name: impact-model
description: Load this skill immediately after solution-design and user-journey (before architecture) to construct the mathematical value model, document sourced baselines, and author docs/IMPACT.md with Honest Limits.
---

# WHEN TO LOAD
Load during the `/ps` workflow immediately following `user-journey` (and strictly before `architecture`), or when formalizing the ROI/economic argument of the product.

# INPUTS
- `docs/01-problem.md` (Market disparity and problem context)
- `docs/02-solution.md` (Approved technical differentiator)
- `.agents/templates/IMPACT.md`

# OUTPUTS
- Instantiated `docs/IMPACT.md` containing sourced baseline, arithmetic value formula, sensitivity table, and Honest Limits.

# EXECUTION PROTOCOL

1. **Source the Status Quo Baseline:**
   Find an authoritative market statistic quantifying the current inefficiency, loss, or latency (e.g. "Indian MSMEs wait 14–28 days for working capital underwriting", "25–30% of post-harvest produce is lost to thermal abuse"). Cite a real institutional report or standard industry metric.

2. **Formulate Explicit Arithmetic:**
   Construct a clean, non-handwaving formula:
   ```
   Metric Reduction = (Baseline Inefficiency - Optimized Engine Value)
   Total Economic Value Saved = Transaction Volume × Cost Delta
   ```
   Name every variable and declare reasonable default values.

3. **Design the Live Endpoint Contract (`/impact`):**
   Define how this arithmetic will be calculated dynamically in code:
   - Querying real database records (e.g. sum of processed transactions, average latency).
   - Returning dynamic JSON payload to power the `/impact` client page.

4. **Conduct Sensitivity Analysis:**
   Calculate conservative (-20%), base case, and aggressive (+20%) scenarios to prove the business case survives imperfect market conditions.

5. **Author "Honest Limits" (Mandatory):**
   Name the single weakest assumption in the calculation. Explain what is mitigated in the hackathon build vs what requires institutional partnership in production.

6. **Write `docs/IMPACT.md`:**
   Instantiate the file with complete formulas and sections.

# EXIT CRITERIA
- [ ] `docs/IMPACT.md` instantiated and fully populated
- [ ] Explicit arithmetic formula and sourced baseline present
- [ ] "Honest Limits" section clearly articulated
- [ ] `make verify` exits 0

# NEXT
Execute `architecture` skill.
