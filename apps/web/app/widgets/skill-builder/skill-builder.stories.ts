import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'

import { AppTestingModule } from '~/test'

import { SkillBuilderComponent } from './skill-builder.component'
import { importProvidersFrom } from '@angular/core'


type StoryArgs = Pick<SkillBuilderComponent, 'weaponTag'>

export default {
  title: 'Skill Builder',
  component: SkillBuilderComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)]
    }),
    moduleMetadata({

      imports: [AppTestingModule]
    })
  ]
} satisfies Meta

export const SkillBuilder: StoryObj = {}
