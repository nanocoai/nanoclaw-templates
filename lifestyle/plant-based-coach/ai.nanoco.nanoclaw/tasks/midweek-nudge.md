---
schedule: "0 17 * * 4"
script: |
  if [ -f /workspace/agent/plugin-data/plant-based-coach/profile.md ]; then
    echo '{"wakeAgent": true}'
  else
    echo '{"wakeAgent": false}'
  fi
---

Thursday nudge. Run the check-in skill's Thursday section: one unused fun fact from references/fun-facts.md with its source, then a reminder of any dish planned this week in plugin-data/plant-based-coach/plans.md with its day, or one easy plant to add this weekend. Under 50 words, light, one 🌱.
