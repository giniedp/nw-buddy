import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateModule, TranslateService } from '~/i18n'

@NgModule({
  providers: [],
  imports: [FormsModule, HttpClientModule, RouterTestingModule, BrowserAnimationsModule, TranslateModule.forRoot()],
})
export class AppTestingModule {
  public constructor(i18n: TranslateService) {
    i18n.use(i18n.locale.value()).subscribe()
  }
}
