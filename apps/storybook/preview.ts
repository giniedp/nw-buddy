import { Preview } from '@storybook/angular'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#000000',
        },
        {
          name: 'light',
          value: '#FFFFFF',
        },
        {
          name: 'transparent',
          value: 'rgba(0, 0, 0, 0)',
        },
      ],
    },
  },
}

export default preview
