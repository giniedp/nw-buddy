import { Preview } from '@storybook/angular'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: '200',
      values: [
        {
          name: '300',
          value: 'rgb(17, 17, 17)',
        },
        {
          name: '200',
          value: 'rgb(25, 25, 25)',
        },
        {
          name: '100',
          value: 'rgb(34, 34, 34)',
        },
      ],
    },
  },
}

export default preview
