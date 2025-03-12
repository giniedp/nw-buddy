import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { ChipsInputComponent } from './chips-input.component'
import { ChipsInputModule } from './chips-input.module'
import { FormsModule } from '@angular/forms'

export default {
  title: 'UI / nwb-chips-input',
  component: ChipsInputComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [ChipsInputModule, FormsModule],
    }),
  ],
  render: () => {
    return {
      template: `<nwb-chips-input [ngModel]="['foo', 'bar', 'baz']" placeholder="type here"></nwb-chips-input>`,
    }
  },
} satisfies Meta

export const Example: StoryObj = {}
