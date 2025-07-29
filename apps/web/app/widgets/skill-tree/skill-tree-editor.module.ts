import { NgModule } from '@angular/core'
import { SkillTreeEditorComponent } from './skill-tree-editor.component'
import { SkillTreeInputComponent } from './skill-tree-input.component'

const COMPONENTS = [SkillTreeInputComponent, SkillTreeEditorComponent]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class SkillTreeEditorModule {}
