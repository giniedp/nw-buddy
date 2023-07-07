import { importProvidersFrom } from '@angular/core'
import { Meta, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'
import { WeaponLevelInputComponent } from './weapon-level-input.component'
import { WeaponLevelInputModule } from './weapon-level-input.module'

type StoryArgs = Pick<WeaponLevelInputComponent, 'icon' | 'label' | 'maxLevel'>

export default {
  title: 'UI / Weapon Level Input',
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
      defaultValue: 'Weapon Level',
    })
    b.number('maxLevel', {
      defaultValue: 20,
    })
  }),
} satisfies Meta<StoryArgs>

export const Example = {}
