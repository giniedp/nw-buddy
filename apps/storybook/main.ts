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
    '@storybook/addon-controls',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
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
