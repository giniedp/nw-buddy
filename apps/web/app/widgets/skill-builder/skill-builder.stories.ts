import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'

import { AppTestingModule } from '~/test'

import { SkillBuilderComponent } from './skill-builder.component'
import { importProvidersFrom } from '@angular/core'
import { SkillTreeModule } from './skill-builder.module'
import { storyControls } from '~/test/story-utils'

export default {
  title: 'Widgets / nwb-skill-builder',
  component: SkillBuilderComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)]
    }),
    moduleMetadata({
      imports: [SkillTreeModule]
    })
  ],
  ...storyControls<SkillBuilderComponent>((arg) => {
    arg.select('weaponTag', {
      options: NW_WEAPON_TYPES.map((it) => it.WeaponTag)
    })
    arg.boolean('disabled')
  }),
} satisfies Meta<SkillBuilderComponent>

export const Example: StoryObj = {}
