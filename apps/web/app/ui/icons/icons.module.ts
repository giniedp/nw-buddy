import { NgModule } from '@angular/core'
import { SvgIconComponent } from './icon.component'

const components = [SvgIconComponent]
@NgModule({
  imports: [components],
  exports: [components],
})
export class IconsModule {}
