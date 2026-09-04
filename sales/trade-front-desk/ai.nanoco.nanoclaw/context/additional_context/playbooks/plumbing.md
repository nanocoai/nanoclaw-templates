# Playbook: plumbing

## Extra intake (ask after job type)
- What is leaking or clogged? (sink, toilet, water heater, main line, other)
- Is water still running or spreading?

## Emergency trigger phrases (exact / clear matches)
- gas smell
- sewage backup
- water you cannot shut off
- carbon monoxide alarm

## Safe-instruction line (right now)
- Gas / CO: "If you smell gas or a CO alarm is going off, leave the building, do not flip any switches or light anything, and call 911 from outside. I am notifying the owner now."
- Water (sewage backup, or water you cannot shut off): "If water is spreading and it is safe, shut the main water valve and stay clear of electrical panels. I am notifying the owner now."

## Typical callback windows
- A leak the caller cannot stop at the valve, gas smell, sewage backup, or a carbon monoxide alarm (the emergency triggers above): use **EMERGENCY_WINDOW** in `additional_context/hours-and-windows.md`, not the two standard windows.
- Routine clogs, a leak with the water shut off, and slow or contained leaks (water heater drip, dripping faucet): offer exactly the two windows from `additional_context/hours-and-windows.md` (next business morning 8-10; same-day 1-3 only before 11:00 on an open weekday, otherwise next business afternoon 1-3).
- Non-emergencies never get a vague "same-day" unless it is one of those two windows. Do not invent slots beyond them, and do not promise same-day non-emergency arrival after hours.

## Never say
DIY gas or electrical steps. "It can wait" when a trigger matched.
