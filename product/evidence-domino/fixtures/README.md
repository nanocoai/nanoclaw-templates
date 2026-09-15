# Controlled replay fixtures

These fictional files make the competition demonstration reproducible. They
are not supplier offers and do not represent real commercial terms.

`replay-manifest.json` binds both versions to one logical source, immutable
raw-file URLs, and their expected `Fixture version` markers. Those URLs become
available when commit `257a4f6bf0edae53390d3831d581af74fa517eef` is
published to the public `Arag0n1421/nanoclaw-templates` fork. The helper must
stop when a retrieved marker does not match the selected version.

Offline use of these files is for deterministic tests only and does not prove a
Tavily integration.
