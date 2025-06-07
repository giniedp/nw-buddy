import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http'
import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { provideRouter, withRouterConfig } from '@angular/router'
import { provideIonicAngular } from '@ionic/angular/standalone'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { APP_ROUTES } from './app.routes'
import { TranslateModule } from './i18n'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      APP_ROUTES,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
    ),
    provideIonicAngular({
      useSetInputAPI: true,
      rippleEffect: false,
      mode: 'md',
      platform: {
        desktop: (win) =>
          !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(win.navigator.userAgent),
      },
      navAnimation: () => null,
    }),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
      // TODO: refactor to use withInterceptors() instead
      // withInterceptors([]),
    ),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      FormsModule,
      TranslateModule.forRoot(),
      StoreModule.forRoot({}),
      EffectsModule.forRoot(),
    ),
    provideZonelessChangeDetection(),
  ],
}
