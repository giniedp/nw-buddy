import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { LevelInputComponent } from './level-input.component'
import { LevelInputModule } from './level-input.module'

export default {
  title: 'UI / Forms / nwb-level-input',
  component: LevelInputComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [LevelInputModule],
    }),
  ],
  args: {
    width: 100,
  },
} satisfies Meta<LevelInputComponent>

export const Example: StoryObj<LevelInputComponent> = {
  args: {},
}
