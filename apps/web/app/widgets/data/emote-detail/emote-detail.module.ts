import { NgModule } from '@angular/core'
import { EmoteDetailComponent } from './emote-detail.component'

const components = [EmoteDetailComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class EmoteDetailModule {
  //
}
