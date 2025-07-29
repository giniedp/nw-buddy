import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'

import { AppTestingModule } from '~/test'

import { SkillTreeEditorComponent } from './skill-tree-editor.component'
import { importProvidersFrom } from '@angular/core'
import { SkillTreeEditorModule } from './skill-tree-editor.module'
import { storyControls } from '~/test/story-utils'

export default {
  title: 'Widgets / nwb-skill-tree-editor',
  component: SkillTreeEditorComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [SkillTreeEditorModule],
    }),
  ],
  ...storyControls<SkillTreeEditorComponent>((arg) => {
    arg.select('weaponTag', {
      options: NW_WEAPON_TYPES.map((it) => it.WeaponTag),
    })
    arg.boolean('disabled')
  }),
} satisfies Meta<SkillTreeEditorComponent>

export const Example: StoryObj = {}
