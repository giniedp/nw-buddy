import { NgModule } from '@angular/core'
import { MetaAchievementDetailComponent } from './meta-achievement-detail.component'

const components = [MetaAchievementDetailComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class MetaAchievementDetailModule {
  //
}
