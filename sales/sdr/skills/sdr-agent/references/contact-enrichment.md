# Contact Research & CRM Sync

For a qualified company, work the right contacts in HubSpot, enrich them with
researched context, dedupe, and log provenance. This template has no
contact-database tool, so it does not source net-new emails or phone numbers — it
works contacts already in HubSpot (or added by the user) and enriches them with
research.

## Steps

1. **Find the contacts in HubSpot**: `hubspot_search_contacts` by company or
   domain. Tier them: Primary (exact ICP title match), Secondary (adjacent
   titles). Limit to 3 per company for first-touch.

2. **Research each Primary contact with Exa**: role, recent posts or news, and
   anything that sharpens personalization. Facts only, each with a source; never
   invent a detail.

3. **Sync to HubSpot**:
   - Contact exists → add the research as a note (do not overwrite the owner or
     any human-entered field).
   - Contact is genuinely new and the user supplied their details →
     `hubspot_create_contact`, then attach the research note.

4. **Log provenance**: HubSpot note, e.g. "Researched via Exa [date]. Source: <link>".

## Hard stops
- No deliverable email on the HubSpot record → log the gap in a note, do NOT
  proceed to sequencing. The agent never guesses or constructs an email address.
- Contact has unsubscribed in HubSpot → stop, do not pass to sequencing.

Next → `references/outbound-sequencing.md`
