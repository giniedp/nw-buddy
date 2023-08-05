import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'
import { ItemDetailModule } from './item-detail.module'
import { ItemCardComponent } from './item-card.component'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'

export default {
  title: 'Widgets / nwb-item-card',
  component: ItemCardComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [ItemDetailModule],
    }),
  ],
  ...storyControls<ItemCardComponent>((arg) => {
    arg.text('entityId', {
      defaultValue: 'HeavyChest_HugoT5',
    })
    arg.number('playerLevel', {
      defaultValue: NW_MAX_CHARACTER_LEVEL,
      min: 1,
      max: NW_MAX_CHARACTER_LEVEL,
    })
    arg.boolean('enableInfoLink')
    arg.boolean('enableLink')
    arg.boolean('enableTracker')
  }),
} satisfies Meta<ItemCardComponent>

export const Example: StoryObj = {}
