import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { GsSliderComponent } from './gs-slider.component'

export default {
  title: 'UI / nwb-gs-slider',
  component: GsSliderComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [GsSliderComponent],
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
} satisfies Meta<GsSliderComponent>

export const Example: StoryObj<GsSliderComponent> = {
  args: {},
}

export const WithBars: StoryObj<GsSliderComponent> = {
  args: {
    bars: true,
    color: 'primary',
  },
}
