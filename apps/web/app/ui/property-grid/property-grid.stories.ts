import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { PropertyGridComponent } from './property-grid.component'
import { PropertyGridModule } from './property-grid.module'

export default {
  title: 'UI / nwb-property-grid',
  component: PropertyGridComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [PropertyGridModule],
    }),
  ],
  args: {},
} satisfies Meta<PropertyGridComponent>

export const Example: StoryObj<PropertyGridComponent> = {
  args: {
    item: {
      text: 'Text Property',
      bool: true,
      number: 42,
      object: {},
      array: ['foo', 'bar', 1, false],
    },
  },
}
