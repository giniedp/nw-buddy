import { addons } from '@storybook/manager-api'
import { create } from '@storybook/theming'

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'New World Buddy',
    brandUrl: 'https://nw-buddy.de',
    brandImage: 'https://nw-buddy.de/assets/icons/favicon.png',
    gridCellSize: 16,
  }),
})
