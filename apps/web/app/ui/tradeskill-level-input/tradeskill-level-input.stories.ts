import { importProvidersFrom } from '@angular/core'
import { Meta, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'
import { TradeskillLevelInputComponent } from './tradeskill-level-input.component'
import { TradeskillLevelInputModule } from './tradeskill-level-input.module'
import { NW_TRADESKILLS_INFOS } from '~/nw/tradeskill'

type StoryArgs = Pick<TradeskillLevelInputComponent, 'icon' | 'label' | 'maxLevel' | 'minWidth'>

export default {
  title: 'UI / Forms / nwb-tradeskill-level-input',
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
      defaultValue: 'Label Text',
    })
    b.number('maxLevel', {
      defaultValue: 200,
    })
    b.select('icon', {
      options: NW_TRADESKILLS_INFOS.map((it) => {
        return {
          value: it.Icon,
          label: it.ID,
        }
      }),
    })
    b.number('minWidth', {
      defaultValue: 200,
    })
  }),
} satisfies Meta<StoryArgs>

export const Example = {}
