import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NwModule } from '~/nw'
import { AppPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgMap } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { AeternumMapComponent } from './aeternum-map.component'

@Component({
  selector: 'nwb-aeternum-map-integration',
  templateUrl: './aeternum-map-integration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, IconsModule, AeternumMapComponent],
  host: {
    class: 'contents',
  },
})
export class AeternumMapIntegrationComponent {
  protected mapIcon = svgMap
  protected mapActive = false
  protected mapCollapsed = false

  public constructor(private preferences: AppPreferencesService) {
    //
    this.mapActive = this.preferences.mapActive.get()
    this.mapCollapsed = this.preferences.mapCollapsed.get()
  }

  protected toggleMap() {
    this.mapActive = !this.mapActive
    this.preferences.mapActive.set(this.mapActive)
  }

  protected toggleMapCollapes() {
    this.mapCollapsed = !this.mapCollapsed
    this.preferences.mapCollapsed.set(this.mapCollapsed)
  }
}
