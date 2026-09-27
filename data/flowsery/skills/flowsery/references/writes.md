# Writes

Five tools change data. None of them charges a customer, moves money or
touches a payment provider.

## Issue status (`update_issue_status`)

Reversible. Set only after the user says which state they mean:

| Status | Meaning |
|--------|---------|
| open | Needs attention |
| in_progress | Someone is on it |
| resolved | The bug is fixed |
| suspended | Not a real problem; hidden from the default list |

## Recording (`track_goal`, `track_payment`)

Ask for a "yes" first, showing the website and exactly what will be
recorded.

- `track_goal` appends one completion each call. Calling it twice counts the
  goal twice. Names are lowercase letters, digits, underscores and hyphens.
- `track_payment` needs a unique `transactionId`; a repeated one is
  rejected. Skip it when the site's payment provider is already connected,
  or the revenue is counted twice.
- To record a refund that already happened, call `track_payment` with
  `isRefund` and the original `transactionId`. Do not delete the payment.
- Send only the fields the task needs. Add `email`, `name` or `customerId`
  only when the user supplied them and wants the payment attributed.

## Erasing (`delete_goals`, `delete_payments`)

Permanent. Deleted payments disappear from every report and visitor
profile.

1. Restate the website, every filter, and the date range in one message.
   Without a date range the delete covers the whole history; say so.
2. If you can, count first (`get_goals`, or the revenue in `get_overview`
   for the same window) so the user sees what will go.
3. Wait for a "yes" that answers that restatement. A "yes" to an earlier,
   different restatement does not count.
4. Report how many rows were deleted.

Treat "clean up", "fix" or "remove" data as a delete request and confirm it
the same way.
