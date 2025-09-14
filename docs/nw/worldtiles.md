Tile Size: 1024
Name Format: map_l[LEVEL]\_y[Y]\_x[X]

- `LEVEL` ranges from `1` (max zoomed in) and `8` (max zoomed out)
- `X` and `Y` are `POW(2, LEVEL-1) * TILE_NUM`
  Examples:
- map_l1_y000_x000.webp
- map_l1_y000_x001.webp
- map_l1_y000_x002.webp
- map_l2_y000_x000.webp
- map_l2_y000_x002.webp
- map_l2_y000_x004.webp
- map_l3_y000_x000.webp
- map_l3_y000_x004.webp
- map_l3_y000_x008.webp
- map_l4_y000_x000.webp
- map_l4_y000_x008.webp
- map_l4_y000_x016.webp
- map_l5_y000_x000.webp
- map_l5_y000_x016.webp
- map_l5_y000_x032.webp
- map_l6_y000_x000.webp
- map_l6_y000_x032.webp
- map_l7_y000_x000.webp
- map_l8_y000_x000.webp

Open World:

| Level | Tiles | Pixel area   |
| ----- | ----- | ------------ |
| 8     | 1x1   | 1024^2       |
| 7     | 1x1   | 1024^2       |
| 6     | 2x2   | (2\*1024)^2  |
| 5     | 4x4   | (4\*1024)^2  |
| 4     | 8x8   | (8\*1024)^2  |
| 3     | 16x16 | (16\*1024)^2 |
| 2     | 32x32 | (32\*1024)^2 |
| 1     | 64x64 | (64\*1024)^2 |
