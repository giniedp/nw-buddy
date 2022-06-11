import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'
import { CoreModule } from './core/core.module'

import { AppRoutingModule } from './app-routing.module'

import { AppComponent } from './app.component'
import { NwModule } from './core/nw'
import { TitleBarComponent } from './title-bar.component'

@NgModule({
  declarations: [AppComponent, TitleBarComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    AppRoutingModule,
    NwModule.forRoot(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
