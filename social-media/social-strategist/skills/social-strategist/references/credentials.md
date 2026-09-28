# Connecting Buffer

Buffer is where this agent sees the creator's posts and numbers. The `buffer` MCP server talks to
`mcp.buffer.com`, and each call carries the key as `Authorization: Bearer <key>`.

## Connect it

1. **Try a cheap read first**: list their Buffer channels. It answers? Already connected; skip to
   step 6.
2. **Ask where OneCLI is.** The vault entry is created in the OneCLI dashboard, in the
   **creator's browser**, and you can't see its address from inside this container. If the error
   carried a connect link, send that instead and skip to step 4. Otherwise ask:

   > *"Can you open the OneCLI dashboard in a browser? What URL do you use for it?"*

   Locally it's usually `http://127.0.0.1:10254`; on a remote box it's something else. **Don't
   guess it, and don't go on with an assumed one.**
3. **Build the link from their URL** (no trailing slash) and send it:

   ```
   <their-onecli-url>/connections/secrets?create=generic&host=mcp.buffer.com&name=Buffer&header=Authorization&format=Bearer%20%7Bvalue%7D
   ```

   It opens a form prefilled for host `mcp.buffer.com`, sent as `Authorization: Bearer`.
4. **Where the key comes from**: signed in to Buffer, open https://publish.buffer.com/settings/api,
   create an API key, copy it, paste it into the form's value field and save. Ask them to say
   when it's saved. If they paste the key into chat instead, after the delete-and-revoke (ground
   rule 4) they make a new one for the form.
5. **Verify**: list their channels again.
6. **Record** the Core Memory fact `Buffer: connected <yyyy-mm-dd>` in `memory/index.md`,
   replacing any earlier `Buffer:` line. Credentials are per agent, so other chats won't ask.

**They can't open the OneCLI dashboard**: send the "No OneCLI dashboard" message below. Whoever
has a terminal on the NanoClaw host runs that one command with the key filled in. Wait for
"done", then continue from step 5.

**They say "later", or nobody can reach the host**: record `Buffer: declined <yyyy-mm-dd>`. Post ideas,
scripts and repurposing still work from their niche and goal; anything about their numbers says
it needs Buffer and offers this flow again.

No OneCLI dashboard:

````
No problem, it works from the terminal too. On the machine NanoClaw runs on, run this with your
Buffer API key (from https://publish.buffer.com/settings/api) in place of <your-buffer-api-key>:

```
onecli secrets create --name "Buffer" --type generic \
  --host-pattern mcp.buffer.com --header-name Authorization \
  --value-format "Bearer {value}" --value "<your-buffer-api-key>"
```

Don't send me the key, just tell me when it's done.
````

## When it doesn't work

Say only what you actually observed; never blame a cause you haven't seen.

| How it looks | What it is | First move |
|---|---|---|
| A Buffer call returns 401 right after they saved | vault entry wrong: host not exactly `mcp.buffer.com`, or format missing `Bearer ` | Fix it through the same link. |
| Worked before, 401 now | key revoked or expired in Buffer | New key at publish.buffer.com/settings/api, update **only the value** of the existing entry. |
| No Buffer tools at all, no 401 anywhere | the server only loads when the agent starts, and it started before the key existed | An operator restarts the agent: `ncl groups restart --id <group-id> --message "connect buffer"`. Still none after a restart: the README's Buffer troubleshooting section, for the operator. |
| 429 Too Many Requests | Buffer's plan quota | Say so plainly, keep what was already fetched, continue next time. Don't retry in a loop. |

A 401 after Core Memory says `Buffer: connected` means the key was removed or revoked: trust the
error, set the fact to `Buffer: disconnected <yyyy-mm-dd>`, and run "Connect it" from step 2.
