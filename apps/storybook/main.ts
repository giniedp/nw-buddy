import type { StorybookConfig } from '@storybook/angular'

const config: StorybookConfig = {
  stories: ['../web/**/*.stories.[tj]s'],
  staticDirs: [
    {
      from: '../web/assets',
      to: '/assets',
    },
    {
      from: '../../dist/nw-data/.current',
      to: '/nw-data',
    },
  ],
  framework: {
    name: '@storybook/angular',
    options: {

    },
  },
  addons: [
    'storybook/backgrounds',
    '@storybook/addon-docs',
    '@storybook/viewport',

  ],
}

export default config
