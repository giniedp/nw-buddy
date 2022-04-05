import { ModuleWithProviders, NgModule } from '@angular/core'
import { TranslateSource } from '../i18n/translate-source'
import { NwDataService } from './nw-data.service'
import { NwIconComponent } from './nw-icon.component'
import { NwInfoLinkDirective } from './nw-info-link.directive'
import { NwRarityBgDirective } from './nw-rarity-bg.directive'
import { NwTextDirective } from './nw-text.directive'

@NgModule({
  declarations: [NwTextDirective, NwIconComponent, NwRarityBgDirective, NwInfoLinkDirective],
  exports: [NwTextDirective, NwIconComponent, NwRarityBgDirective, NwInfoLinkDirective],
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
