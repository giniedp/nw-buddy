# Model commands

- All output goes to `.nwbt/models`
- Folder is usually uploaded as is to CDN
- With `pnpm dev:cdn`, app will use models from CDN in dev mode
- With `pnpm dev`, app will use models from `localhost:8000/models` which should serve the `.nwbt/models` folder

## Map models

- `--simplify` get's rid of normal and specular maps as well as normals and tangents. Huge data reduction in this case.
- `--embed` must be used, otherwise `gltf-transform` can't find textures when it loads the model
- `--optimize` run `gltf-transform optimize` tool mainly to compress the geonetry data.
- `--webp` used for minimal size. `--ktx` would be optimal, but 3D viewer can't load them atm.
- `--texture-size` must be high. Single texture is used for a whole region.

```sh
pnpm nwbt models impostors --level ** --region ** --binary --simplify --embed --optimize --webp --texture-size 4096
```

## Common models

This uses no command after `models` to fallback to defaul collection of armor, weapons, costumes, mounts etc

For local development `--ktx` can be omitted for faster processing. KTX encoding is very expensive.

```sh
pnpm nwbt models --binary --ktx --animations --texture-size 2048
```
