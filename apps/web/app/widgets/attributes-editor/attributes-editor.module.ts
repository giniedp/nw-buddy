import { NgModule } from '@angular/core'
import { AttributesEditorComponent } from './attributes-editor.component'
import { AttributesScaleComponent } from './attributes-scale.component'

@NgModule({
  imports: [AttributesEditorComponent, AttributesScaleComponent],
  exports: [AttributesEditorComponent, AttributesScaleComponent],
})
export class AttributesEditorModule {}
