# Uploading media

Every `mediaUrls` value must be a `publicUrl` that AdaptlyPost returned. Any
other URL fails the post with "Media file(s) not found in storage".

## A public https URL

Call `upload_media` with `urls`. The server streams the file into storage
and returns `mediaUrls` to pass straight into the post. Private, internal and
plain-http addresses are refused, and the source must send a
Content-Length.

## A file in the workspace

For an attachment the user sent or a file you made, upload the bytes
yourself instead of pasting base64 into a tool call:

1. Call `get_upload_urls` with the file name (keep the extension) and its
   MIME type. You get `uploadUrl` and `publicUrl`.
2. PUT the file to `uploadUrl` with the same Content-Type:

   ```bash
   curl -sS -o /dev/null -w '%{http_code}\n' -X PUT \
     -H 'Content-Type: image/jpeg' \
     --data-binary @/path/to/photo.jpg \
     '<uploadUrl>'
   ```

3. Use `publicUrl` only after the PUT printed a 2xx code.

Do not add an Authorization header to the upload URL. It is presigned, and
it is not an AdaptlyPost API host.

## Limits

| Kind | Types | Max size |
|------|-------|----------|
| Image | JPEG, PNG, WebP | 50 MB |
| Video | MP4, QuickTime | 250 MB from a URL |
| Document (LinkedIn only) | PDF, PPT, PPTX, DOC, DOCX | 100 MB, 300 pages |

Networks have their own limits on top of these (aspect ratios, video length,
carousel counts). When a network rejects a file, `list_post_results` says
why; read the message before changing anything.

## Alt text

Pass `mediaAltTexts` in the same order as `mediaUrls`, one per image, up to
1,000 characters, `""` to skip one. X, Bluesky, Mastodon, LinkedIn,
Facebook, Instagram and Threads use it; Pinterest takes the first one. Write
alt text for every image unless the user says not to.
