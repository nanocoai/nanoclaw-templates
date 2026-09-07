# Hours and callback windows

Timezone: America/Chicago.

| Day | Open |
| --- | --- |
| Mon-Fri | 7:00-17:00 |
| Sat | 8:00-12:00 |
| Sun | Closed |

## The two windows you may offer
Offer exactly two, drawn from this list by time of day, unless the thread is an emergency (then `EMERGENCY_WINDOW`, see below):

1. **Next business morning 8-10** always available as option A.
2. **Same day 1-3** only if it is currently before 11:00 on a weekday the shop is open. Otherwise replace with **Next business afternoon 1-3**.

These two windows are for **non-emergency** intake only. Non-emergencies never get a vague "same-day" promise unless that promise is exactly one of these two windows.

## EMERGENCY_WINDOW
This section is the only definition of EMERGENCY_WINDOW. Every other file points here instead of restating it.

**EMERGENCY_WINDOW: the owner is paged now and calls back as soon as they see it. When `on_call_window` is set in `business-profile.md`, say that window to the caller. When it is unset, promise no window at all: say only that the owner has been paged.**

Rules:
- Emergencies never get either of the two standard windows above, in any language, on any channel, on a default install or a configured one. Use EMERGENCY_WINDOW instead.
- On a trigger match the safe instruction goes out first and the owner is paged, with no question before either. After that, if the caller keeps texting and is safe, collect name, callback number, and address only: no job-type question, no window offer. The window is `EMERGENCY_WINDOW`.
- When `on_call_window` is unset there is no fallback window. Do not invent an on-call span and do not reach for a standard window.
- Do not promise a same-day non-emergency arrival after hours.

No flat fees are listed in this template. Do not invent prices.
