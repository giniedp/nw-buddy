import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { RouterModule } from '@angular/router'

import { ROUTES } from './app.routes'

import { AppComponent } from './app.component'
import { TranslateModule } from './i18n'
import { NwDataInterceptor, NwDataService, NwModule } from './nw'
import { TitleBarComponent } from './title-bar.component'
import { ScreenModule } from './ui/screen'
import { UpdateAlertModule } from './widgets/update-alert'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { StoreModule } from '@ngrx/store'
import { EffectsModule } from '@ngrx/effects'
import { StoreDevtoolsModule } from '@ngrx/store-devtools'
import { environment } from '../environments/environment'

@NgModule({
  declarations: [AppComponent, TitleBarComponent],
  imports: [
    RouterModule.forRoot(ROUTES),
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ScreenModule,
    NwModule,
    TranslateModule.forRoot({
      loader: NwDataService,
    }),
    UpdateAlertModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot(),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
    }),
  ],
  providers: [NwDataInterceptor.provide()],
  bootstrap: [AppComponent],
})
export class AppModule {}
