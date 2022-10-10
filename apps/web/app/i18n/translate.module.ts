import { NgModule, ModuleWithProviders, Type, LOCALE_ID } from '@angular/core'
import { TranslateLoader } from './translate-loader'

@NgModule({})
export class TranslateModule {

  public static forRoot(options?: {
    loader?: Type<TranslateLoader>
    locale?: string
  }): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        options?.locale ? { provide: LOCALE_ID, useValue: options.locale } : null,
        options?.loader ? TranslateLoader.provideClass(options.loader) : TranslateLoader,
      ].filter((it) => !!it)
    }
  }
}
