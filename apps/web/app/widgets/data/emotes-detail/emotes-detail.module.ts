import { NgModule } from '@angular/core'
import { EmotesDetailComponent } from './emotes-detail.component'
import { EmotesDetailDirective } from './emotes-detail.directive'

const components = [EmotesDetailComponent, EmotesDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class EmotesDetailModule {
  //
}
