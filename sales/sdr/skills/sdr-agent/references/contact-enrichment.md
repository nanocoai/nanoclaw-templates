# Contact Enrichment & CRM Sync

Find verified human contacts at a qualified company, dedupe against HubSpot, and
log provenance.

## Steps

1. **Apollo people search**: `apollo_search_people` with:
   - `organization_name`: target company
   - `titles`: ICP title list from the instructions
   - `contact_email_status`: "verified" (filter unverified to save credits)

2. **Tier contacts**: Primary (exact title match), Secondary (adjacent titles).
   Limit to 3 contacts per company for first-touch.

3. **Enrich top contacts**: `apollo_enrich_person` for Primary contacts only.

4. **Dedup against HubSpot**: `hubspot_search_contacts` by email before creating.
   - Contact exists → update with new Apollo data as a note (do not overwrite owner).
   - Contact is new → `hubspot_create_contact` with full enriched data.

5. **Log provenance**: HubSpot note: "Enriched via Apollo [date]. Email verified: Y/N"

## Hard stops
- No verified email found → log the gap in a HubSpot note, do NOT proceed to sequencing.
- Contact has unsubscribed in HubSpot → stop, do not pass to sequencing.

Next → `references/outbound-sequencing.md`
