import { NgModule, ModuleWithProviders, Type } from '@angular/core'
import { TranslateLoader } from './translate-loader'

@NgModule({})
export class TranslateModule {

  public static forRoot(options?: {
    loader?: Type<TranslateLoader>
  }): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        options?.loader ? TranslateLoader.provideClass(options.loader) : TranslateLoader,
      ]
    }
  }
}
