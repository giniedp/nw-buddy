import { DialogModule } from '@angular/cdk/dialog'
import { HttpClientModule } from '@angular/common/http'
import { ApplicationConfig, importProvidersFrom } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { ROUTES } from './app.routes'
import { TranslateModule } from './i18n'
import { NwDataInterceptor } from './nw'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(ROUTES),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      FormsModule,
      DialogModule,
      HttpClientModule,
      TranslateModule.forRoot(),
      StoreModule.forRoot({}),
      EffectsModule.forRoot(),
      IonicModule.forRoot({
        rippleEffect: false,
        mode: 'md',
        platform: {
          desktop: (win) =>
            !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(win.navigator.userAgent),
        },
      })
    ),
    NwDataInterceptor.provide(),
  ],
}
