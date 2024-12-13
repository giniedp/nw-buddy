import { NgModule } from '@angular/core'
import { CodeEditorComponent } from './code-editor.component'
import { DiffHistoryEditorComponent } from './diff-history-editor.component'

@NgModule({
  imports: [CodeEditorComponent, DiffHistoryEditorComponent],
  exports: [CodeEditorComponent, DiffHistoryEditorComponent],
})
export class CodeEditorModule {}
