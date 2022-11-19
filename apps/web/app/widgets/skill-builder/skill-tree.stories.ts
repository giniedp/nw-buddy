import { Story } from '@storybook/angular'
import { NW_WEAPON_TYPES } from '~/nw/nw-weapon-types'
import { AppTestingModule } from '~/test'
import { createStory } from '~/test/story-utils'
import { SkillTreeComponent } from './skill-tree.component'


type StoryArgs = Pick<SkillTreeComponent, 'weaponTag' | 'treeID'>

const Story = createStory<StoryArgs, SkillTreeComponent>({
  title: 'Skill Tree Editor',
  component: SkillTreeComponent,
  controls: (b) => {
    b.select("weaponTag", {
      defaultValue: 'sword',
      options: NW_WEAPON_TYPES.map((it) => it.WeaponTag)
    })
    b.select('treeID', {
      options: [0, 1]
    })
  },
  module: {
    imports: [AppTestingModule]
  }
})

export default Story
export const SkillTreeEditor = Story.example((args) => ({
  props: args
}))
