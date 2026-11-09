# Assets policy

- Only commit assets with a clear license: CC0-1.0, PDM, CC-BY-4.0, CC-BY-3.0, PIXABAY, UNSPLASH.
- Every asset needs a manifest.json record: source URL, author, license, license URL, fetch time, hash.
- Only `approved` manifest entries are loaded by the site. New assets start as `pending`.
- CC BY assets must have author credit and note modifications.
- Never commit API keys. Keep secrets in `.env` (gitignored) or GitHub Secrets. `.cache` is gitignored.
- The site must work offline with bundled SVG placeholders.
