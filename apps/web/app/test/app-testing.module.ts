import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateModule, TranslateService } from '~/i18n'
import { NwDataInterceptor, NwDataService } from '~/nw'

@NgModule({
  providers: [NwDataInterceptor.provide()],
  imports: [
    FormsModule,
    HttpClientModule,
    RouterTestingModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: NwDataService,
    }),
  ],
})
export class AppTestingModule {
  public constructor(i18n: TranslateService) {
    i18n.use(i18n.locale.value)
  }
}
