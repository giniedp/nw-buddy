import type { StorybookConfig } from '@storybook/angular'

const config: StorybookConfig = {
  stories: ['../web/**/*.stories.[tj]s'],
  staticDirs: [
    './assets',
    {
      from: '../web/assets',
      to: '/assets',
    },
    {
      from: '../../dist/nw-data',
      to: '/nw-data',
    },
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  addons: [
    '@storybook/addon-controls',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-backgrounds',
    '@storybook/addon-docs',
    '@storybook/addon-outline',
    '@storybook/addon-toolbars',
    '@storybook/addon-viewport',
    '@storybook/addon-links',
  ],
  docs: {
    autodocs: 'tag',
  },
}

export default config
