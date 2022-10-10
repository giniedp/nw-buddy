import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core"
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "~/i18n";
import { NwDataService, NwModule } from "~/nw";

@NgModule({
  imports: [
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: NwDataService,
    })
  ]
})
export class AppTestingModule {
  public constructor(i18n: TranslateService) {
    i18n.use(i18n.locale.value)
  }
}
