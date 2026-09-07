# Source tiers

## Tier 1: guidelines and consensus bodies

who.int, efsa.europa.eu, gov.uk (SACN, NHS), dietaryguidelines.gov and health.gov (US DGA), cochranelibrary.com, nice.org.uk, eatright.org (Academy of Nutrition and Dietetics), bda.uk.com, nutritionsource.hsph.harvard.edu, ods.od.nih.gov (Office of Dietary Supplements), heart.org and diabetes.org position statements, wcrf.org (cancer and diet).

## Tier 2: primary research and reviews

europepmc.org and pubmed.ncbi.nlm.nih.gov (abstracts; use the Europe PMC page for screenshots, PubMed blocks browsers), pmc.ncbi.nlm.nih.gov (free full text), journal pages via doi.org (thelancet.com, bmj.com, nejm.org, ajcn.nutrition.org, academic.oup.com, nature.com, sciencedirect.com), examine.com (secondary, well-referenced; cite the underlying study, not Examine).

## Tier 3: reporting

Reputable science reporting (reuters.com, nytimes.com/well, theguardian.com/science, sciencemediacentre.org expert reactions) is useful to find the study and the criticism of it. Never cite reporting as the evidence; follow the link to the study.

## Never the evidence

Supplement and product sellers, anyone selling the thing the claim promotes, influencer posts, "studies show" with no study, press releases quoted without the paper, and anything you cannot open.

## Red flags to name in the verdict

- The only human evidence is from the seller.
- The study is in rats, cells, or fewer than 30 people, and the claim is about you.
- The claim's number comes from a relative risk with no absolute baseline.
- The study measured a marker (a blood value) and the claim talks about an outcome (a disease).
- The claim cites a study that says the opposite, which happens more than you would think. Say it plainly.

## Search recipes (Tavily)

- Guideline pass: the claim's topic plus `guideline OR position statement OR recommendation`, with `include_domains` set to the Tier 1 list, `search_depth: advanced`, `max_results: 5`.
- Review pass: the topic plus `systematic review OR meta-analysis`, `include_domains: ["europepmc.org", "pubmed.ncbi.nlm.nih.gov", "cochranelibrary.com", "pmc.ncbi.nlm.nih.gov"]`, `max_results: 5`, `time_range` unset (the best review may be a few years old).
- Recency pass: the topic, `time_range: "year"`, no domain filter, `max_results: 5`, to catch a new trial or a retraction.
- Counter pass, only if the first three found nothing: the claim's own wording, to find what its proponents cite, then open that source and read it critically.
