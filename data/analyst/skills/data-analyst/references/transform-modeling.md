# Transform & Metric Modeling

Reshape raw pulls into one tidy, analysis-ready table, with every metric defined.

## Steps

1. **Load into a working table** — pull each source's result into a dataframe
   (pandas) or a staging table in BigQuery. Keep raw and cleaned versions
   separate.

2. **Clean**:
   - Deduplicate (define the unique key — e.g., user_id, deal_id).
   - Handle nulls explicitly (drop / impute / keep as "unknown" — never silently).
   - Normalize types, dates (to a single timezone), and categorical labels.
   - Remove bot/internal/test traffic per the filters from extraction.

3. **Join** — align grains before joining (don't join per-event to per-user
   without aggregating first). Use consistent keys; check row counts before and
   after to catch fan-out/duplication.

4. **Define the metric** — implement the exact definition from scope. Common ones,
   state the version you use:
   - **Active user** — distinct users with a qualifying event in the window.
   - **Conversion** — (# reached step N) / (# entered step 1), same cohort.
   - **Churn** — customers lost in period / customers at start of period.
   - **Retention** — % of a cohort active in period N after signup.
   - **Revenue / ARR / pipeline** — from HubSpot deal amounts at the stage/close
     definition agreed with the user.

5. **Tidy output** — one row per unit of analysis, one column per variable,
   consistent units. This table feeds analysis and charts directly.

## Rules
- Document every filter, assumption, and metric definition alongside the table.
- Validate: row counts, totals reconcile to the source, no unexpected nulls.
- Keep the transform reproducible (a saved script/SQL, not manual edits).

## Hard stops
- Grains don't align for a join → aggregate first; never fan-out silently.
- A metric isn't defined anywhere → propose a definition and confirm before using.

Next → `references/analysis-visualization.md`
