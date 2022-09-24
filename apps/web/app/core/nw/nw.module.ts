import { CommonModule } from '@angular/common'
import { ModuleWithProviders, NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateSource } from '../i18n/translate-source'
import { NwDataService } from './nw-data.service'
import { NwIconComponent, NwImageComponent } from './nw-icon.component'
import { NwInfoLinkDirective } from './nw-info-link.directive'
import { NwTextDirective } from './nw-text.directive'

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [
    NwTextDirective,
    NwIconComponent,
    NwImageComponent,
    NwInfoLinkDirective,
  ],
  exports: [
    NwTextDirective,
    NwIconComponent,
    NwImageComponent,
    NwInfoLinkDirective,
  ],
})
export class NwModule {
  public static forRoot(): ModuleWithProviders<NwModule> {
    return {
      ngModule: NwModule,
      providers: [
        {
          provide: TranslateSource,
          useExisting: NwDataService,
        },
      ],
    }
  }
}
