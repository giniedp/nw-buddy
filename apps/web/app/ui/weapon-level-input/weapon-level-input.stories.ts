import { importProvidersFrom } from '@angular/core'
import { Meta, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'
import { WeaponLevelInputComponent } from './weapon-level-input.component'
import { WeaponLevelInputModule } from './weapon-level-input.module'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'

type StoryArgs = Pick<WeaponLevelInputComponent, 'icon' | 'label' | 'maxLevel'>

export default {
  title: 'UI / Forms / nwb-weapon-level-input',
  component: WeaponLevelInputComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [WeaponLevelInputModule],
    }),
  ],
  ...storyControls<StoryArgs>((b) => {
    b.text('label', {
      defaultValue: 'Label Text',
    })
    b.number('maxLevel', {
      defaultValue: 20,
    })
    b.select('icon', {
      options: NW_WEAPON_TYPES.map((it) => {
        return {
          label: it.UIName,
          value: it.IconPath,
        }
      }),
    })
  }),
} satisfies Meta<StoryArgs>

export const Example = {}
