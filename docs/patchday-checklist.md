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

All generated models are about 35GB in size

- clear the `.nwbt` dir. Mainly `cache` and `models`
- `pnpm nwbt models impostors --level ** --region ** --binary --simplify --embed --optimize --webp --texture-size 4096` ~1 minute 
- `pnpm nwbt models --binary --ktx --animations --texture-size 2048` ~3 hours due to ktx texture encoding. <1 hour for png or webp  
- `pnpm nw-cdn upload-models` optionally add `--force` flag to upload and override existing models
