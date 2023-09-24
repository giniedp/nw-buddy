import { NgModule } from '@angular/core'
import { ExpressionTreeEditorComponent } from './expression-tree-editor.component'

const COMPONENTS = [ExpressionTreeEditorComponent]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ExpressionTreeModule {}
