import type { StorybookConfig } from '@storybook/angular'

const config: StorybookConfig = {
  stories: ['../web/**/*.stories.[tj]s'],
  staticDirs: [
    './assets',
    {
      from: '../web/assets',
      to: '/assets',
    },
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  addons: [
    '@storybook/addon-viewport',
    '@storybook/addon-controls',
    '@storybook/addon-outline',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-coverage',
    '@storybook/addon-docs',
    'storybook-addon-mock',
  ],
  docs: {
    autodocs: 'tag',
  },
}

export default config
