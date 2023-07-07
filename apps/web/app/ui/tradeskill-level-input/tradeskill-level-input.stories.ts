import { importProvidersFrom } from '@angular/core'
import { Meta, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'
import { TradeskillLevelInputComponent } from './tradeskill-level-input.component'
import { TradeskillLevelInputModule } from './tradeskill-level-input.module'


type StoryArgs = Pick<TradeskillLevelInputComponent, 'icon' | 'label' | 'maxLevel'>

export default {
  title: 'UI / Tradeskill Level Input',
  component: TradeskillLevelInputComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({

      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [TradeskillLevelInputModule],
    }),
  ],
  ...storyControls<StoryArgs>((b) => {
    b.text('label', {
      defaultValue: 'Tradeskill Level',
    })
    b.number('maxLevel', {
      defaultValue: 200,
    })
  }),
} satisfies Meta<StoryArgs>

export const Example = {}
