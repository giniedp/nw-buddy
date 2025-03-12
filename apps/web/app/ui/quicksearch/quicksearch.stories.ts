import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { QuicksearchInputComponent } from './quicksearch-input.component'
import { QuicksearchModule } from './quicksearch.module'

export default {
  title: 'UI / nwb-quicksearch-input',
  component: QuicksearchInputComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [QuicksearchModule],
    }),
  ],
  args: {},
} satisfies Meta

export const Example: StoryObj = {
  args: {},
}
