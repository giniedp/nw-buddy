import { ModuleWithProviders, NgModule } from '@angular/core'
import { TranslateModule as NgxTranslate } from '@ngx-translate/core'
import { TranslationLoader } from './translation-loader'

@NgModule({
  imports: [NgxTranslate],
  exports: [NgxTranslate],
})
export class TranslateModule {
  public static forRoot(): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        ...(NgxTranslate.forRoot({
          fallbackLang: 'en-us',
          loader: TranslationLoader.provide(),
        }).providers || []),
      ],
    }
  }
}
