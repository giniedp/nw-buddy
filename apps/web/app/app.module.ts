import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'

import { AppRoutingModule } from './app-routing.module'

import { AppComponent } from './app.component'
import { TranslateModule } from './i18n'
import { NwDataService } from './nw'
import { TitleBarComponent } from './title-bar.component'

@NgModule({
  declarations: [AppComponent, TitleBarComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: NwDataService,
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {

}
