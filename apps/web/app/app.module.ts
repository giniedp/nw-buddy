import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { RouterModule } from '@angular/router'

import { ROUTES } from './app.routes'

import { AppComponent } from './app.component'
import { TranslateModule } from './i18n'
import { NwDataService } from './nw'
import { TitleBarComponent } from './title-bar.component'
import { ScreenModule } from './ui/screen'
import { UpdateAlertModule } from './widgets/update-alert'

@NgModule({
  declarations: [AppComponent, TitleBarComponent],
  imports: [
    RouterModule.forRoot(ROUTES),
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ScreenModule,
    TranslateModule.forRoot({
      loader: NwDataService,
    }),
    UpdateAlertModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {

}
