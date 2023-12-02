import { DialogModule } from '@angular/cdk/dialog'
import { HttpClientModule, provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http'
import { ApplicationConfig, importProvidersFrom } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { provideIonicAngular } from '@ionic/angular/standalone'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { ROUTES } from './app.routes'
import { TranslateModule } from './i18n'
import { NwDataInterceptor } from './nw'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(ROUTES),
    provideIonicAngular({
      rippleEffect: false,
      mode: 'md',
      platform: {
        desktop: (win) =>
          !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(win.navigator.userAgent),
      },
    }),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
      // TODO: refactor to use withInterceptors() instead
      // withInterceptors([]),
    ),
    NwDataInterceptor.provide(),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      FormsModule,
      DialogModule,
      TranslateModule.forRoot(),
      StoreModule.forRoot({}),
      EffectsModule.forRoot(),
    ),

  ],
}
