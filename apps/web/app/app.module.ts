import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { ROUTES } from './app.routes'

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { StoreDevtoolsModule } from '@ngrx/store-devtools'
import { environment } from '../environments/environment'
import { AppComponent } from './app.component'
import { TranslateModule } from './i18n'
import { NwDataInterceptor, NwDataService, NwModule } from './nw'
import { TitleBarComponent } from './title-bar.component'
import { UpdateAlertModule } from './widgets/update-alert'
import { LayoutModule } from './ui/layout'
import { IconsModule } from './ui/icons'
import { AeternumMapComponent } from './aeternum-map.component'

@NgModule({
  declarations: [AppComponent, TitleBarComponent],
  imports: [
    RouterModule.forRoot(ROUTES),
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    NwModule,
    TranslateModule.forRoot({
      loader: NwDataService,
    }),
    LayoutModule,
    UpdateAlertModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot(),
    IconsModule,
    IonicModule.forRoot({
      rippleEffect: false,
      mode: 'md',
    }),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
    }),
    AeternumMapComponent
  ],
  providers: [NwDataInterceptor.provide()],
  bootstrap: [AppComponent],
})
export class AppModule {}
