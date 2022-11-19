import { NgModule } from '@angular/core'
import { SkillBuilderComponent } from './skill-builder.component'
import { SkillTreeComponent } from './skill-tree.component'

const COMPONENTS = [SkillTreeComponent, SkillBuilderComponent]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class SkillTreeModule {}
