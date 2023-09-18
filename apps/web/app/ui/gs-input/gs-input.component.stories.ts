import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { GsInputComponent } from './gs-input.component'

export default {
  title: 'UI / nwb-gs-input',
  component: GsInputComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [GsInputComponent],
    }),
  ],
  argTypes: {
    bars: {
      type: 'boolean',
    },
    values: {
      type: 'boolean',
    },
    step: {
      type: 'number',
    },
    color: {
      type: 'string',
      options: ['primary', 'secondary'],
      control: { type: 'select' },
    },
    size: {
      type: 'string',
      options: ['xs', 'sm', 'md', 'lg'],
      control: { type: 'select' },
    },
  },
} satisfies Meta<GsInputComponent>

export const Example: StoryObj<GsInputComponent> = {
  args: {},
}
