import { Story } from '@storybook/angular'
import { NW_WEAPON_TYPES } from '~/nw/nw-weapon-types'
import { AppTestingModule } from '~/test'
import { createStory } from '~/test/story-utils'
import { SkillBuilderComponent } from './skill-builder.component'


type StoryArgs = Pick<SkillBuilderComponent, 'weaponTag'>

const Story = createStory<StoryArgs, SkillBuilderComponent>({
  title: 'Skill Builder',
  component: SkillBuilderComponent,
  controls: (b) => {
    b.select("weaponTag", {
      defaultValue: 'sword',
      options: NW_WEAPON_TYPES.map((it) => it.WeaponTag)
    })
  },
  module: {
    imports: [AppTestingModule]
  }
})

export default Story
export const SkillBuilder = Story.example((args) => ({
  props: args
}))
