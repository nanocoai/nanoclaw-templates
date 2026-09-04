# Checklist: Seller or Business

For a company, storefront, or individual seller (not tied to one specific
listing).

1. **Independent existence check.** Search the business name plus
   registration/incorporation terms and, where relevant, look for an
   official registry result — a business with no findable trace beyond its
   own website/listing is a signal, not proof of anything on its own.
2. **Domain and site age.** If there's a website, use `tavily-extract` to
   pull its About/Contact page; note whether it gives a real address, phone
   number, or only a contact form. A storefront with no verifiable physical
   or business identity is worth flagging.
3. **Independent reviews.** Search `"<business name>" reviews` and
   `"<business name>" complaint` on sources other than the business's own
   site (review aggregators, forums, local news). Weight independent sources
   over testimonials hosted by the business itself.
4. **Scam-report search.** Search `"<business name>" scam` and, if a
   product/service category is known, `"<category>" scam` plus the business
   name to catch category-specific scam patterns (e.g. dropshipping,
   subscription traps).
5. **Contact responsiveness pattern.** Note if the only way to reach them is
   a single unverifiable channel (a personal cell number, a social DM) with
   no business-registered alternative.

Then run the universal checks in `scam-signals.md` before scoring.
