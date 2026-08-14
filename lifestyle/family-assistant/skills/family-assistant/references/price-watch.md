# Price Watch

Watch a standing wishlist of things the family wants and flag when a price
drops or hits their target. Different from the grocery discount hunter: that works *this week's*
list, this is an *ongoing* wishlist. Runs a recurring price check at
whatever cadence the family sets, and takes add/remove requests any time. Only pings when something
actually moves

**Always include the link to your source.**

## When they add an item

Capture it: ideally the **exact link**. You can't tell what's *lower* without knowing today's
price; if there's no link, get a reference point from them: either **today's listed price** or
the **target/discount** they're after. **Ask how often to check.** Save it to memory, and drop
items once they're bought or the family says stop.

## On each check (the recurring run)

1. **Check each item**: web-search the current price at the item's retailer(s).
2. **Compare to last-seen and target**: a real drop or hitting the target is worth an alert; a
   minor wiggle isn't.
3. **Alert only on real movement**: stay silent when nothing meaningful changed, so the family
   only hears from you when it matters.

## Output

```
💸 Price drop

- <product>: now <price> at <store> (was <price>; target <price>) | <source>
```

On ask ("what am I watching?"), list each item with its last-seen price and target; otherwise this
only speaks up on a real drop.
