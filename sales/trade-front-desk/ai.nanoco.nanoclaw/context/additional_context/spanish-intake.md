# Spanish intake (exact phrasing)

Use this file when the thread language is `es`. Same five fields as English. Language is set by the caller's first message. Do not switch mid-thread unless the caller does (then follow them, including a switch back to English).

Keep every text under 320 characters. One question per text. No em dashes.

## Five questions

1. Name: "Gracias por comunicar al taller. ¿Qué nombre usamos?"
2. Callback (10 digits): "¿Mejor número para devolver la llamada, diez dígitos?"
3. Job type: "¿Qué tipo de trabajo: plomería, HVAC, electricidad, concreto o techos?"
4. Address plus city: "¿Cuál es la dirección (calle y ciudad) del trabajo?"
5. Window: "Dos horarios: {{A}} o {{B}}. ¿Cuál le sirve?"

La pregunta 5 ofrece los dos horarios estándar, salvo que el hilo sea una emergencia (entonces `EMERGENCY_WINDOW`, ver hours-and-windows.md).

En una emergencia no ofrezca ninguno de los dos horarios estándar. Diga: "Ya avisé al dueño y le va a llamar en cuanto lo vea." Agregue el horario de guardia solo si `on_call_window` está definido en business-profile.md. Si no lo está, no prometa ningún horario.

If the caller gives a street without a city, ask only: "¿Qué ciudad?"

## Confirmation line

"Para confirmar: {{name}}, {{callback_phone}}, {{job_type}} en {{address}}, {{city}}, horario {{window}}. ¿Es correcto?"

Repita los cinco campos, incluido el número de devolución de llamada. No omita ninguno.

## Emergency safe-instruction lines

Give the matching line right now, then notify the owner. Do not add DIY steps. One Spanish line per English playbook safe-instruction, in playbook order. The playbooks own the English wording; these lines say the same things in Spanish.

- Gas / CO (plumbing.md): "Si huele a gas o suena la alarma de monóxido de carbono, salga del edificio, no mueva interruptores ni encienda nada, y llame al 911 desde afuera. Estoy avisando al dueño ahora."
- Plumbing (sewage backup, or water you cannot shut off): "Si el agua se está extendiendo y es seguro, cierre la llave de paso principal y aléjese de los paneles eléctricos. Estoy avisando al dueño ahora."
- HVAC (burning smell from the unit; no heat below 20°F; no cooling above 95°F with an infant or elderly person): "Si huele a quemado en la unidad, apáguela en el termostato y aléjese del equipo. Si no hay calor bajo 20°F o no hay aire sobre 95°F con un bebé o persona mayor en casa, busque una temperatura segura si puede. Estoy avisando al dueño ahora."
- Electrical (sparking, burning smell at an outlet or panel, hot outlets, water near a panel): "Aléjese del panel si está caliente, echa chispas o está mojado. No toque tomas que sienta calientes. Si huele a quemado, salga de esa área. Estoy avisando al dueño ahora. Llame al 911 si hay fuego activo o mucho humo."
- Roofing (active leak during rain, or storm damage with exposed decking): "No suba al techo. Aleje objetos de valor del goteo y recoja el agua en un balde si es seguro. Si el entablado está expuesto, manténgase lejos de esa zona. Estoy avisando al dueño ahora."
- Concrete: not an emergency path. Collect the intake and offer the two windows. If a trigger from another trade appears in the thread, give that trade's Spanish line above and use `EMERGENCY_WINDOW` (see hours-and-windows.md).
