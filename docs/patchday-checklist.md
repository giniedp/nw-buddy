# Patchday checklist

## Minor patch

- `pnpm nwbt pull` ~1 minute if images are already processed
- Check generated files and fix build errors
- `pnpm nw-cdn upload` optionally add `--files` flag to upload images to CDN
- Commit and deploy

## Major patch or clean setup

- clear the `dist/nw-data/WORKSPACE` dir. Forces images to be reprocessed, removes unlinked datasheets
- `pnpm nwbt pull` ~5 minutes
- `pnpm nwbt pull tractmap` ~5-10 minutes
- `pnpm nwbt pull heightmap` ~2 minutes
- Check generated files and fix build errors
- `pnpm nw-cdn upload --files` ~10 minutes
- Commit and deploy

## Models update

All generated models are about 50GB in size

- clear the `.nwbt/models` dir. Keep `.nwbt/cache`: its entries are keyed by the content of the game textures, only
  textures changed by the patch are converted again. `pnpm nwbt cache clear` removes it, e.g. to drop old entries
- `pnpm nwbt:models:impostors` ~1 minute
- `pnpm nwbt:models` ~3 hours with an empty cache due to ktx texture encoding. <1 hour for png or webp. Warnings and errors go to `.nwbt/nwbt.log`
- `pnpm nwbt:models:upload` optionally add `--force` flag to upload and override existing models
