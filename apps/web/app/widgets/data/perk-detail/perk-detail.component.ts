import { DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { PerkDetailDescriptionComponent } from './perk-detail-description.component'
import { PerkDetailHeaderComponent } from './perk-detail-header.component'
import { PerkDetailModsComponent } from './perk-detail-mods.component'
import { PerkDetailPropertiesComponent } from './perk-detail-properties.component'
import { PerkDetailStore } from './perk-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail',
  template: `
    <nwb-perk-detail-header />
    <div class="p-4">
      <nwb-perk-detail-mods class="nw-item-section" />
      <nwb-perk-detail-description class="nw-item-section" />
      @if (!disableProperties) {
        <nwb-perk-detail-properties class="nw-item-section" />
      }
      <ng-content />
    </div>
  `,
  exportAs: 'perkDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PerkDetailDescriptionComponent,
    PerkDetailHeaderComponent,
    PerkDetailModsComponent,
    PerkDetailPropertiesComponent,
  ],
  providers: [DecimalPipe, PerkDetailStore],
  host: {
    class: 'block rounded-md overflow-clip font-nimbus',
  },
})
export class PerkDetailComponent {
  public readonly store = inject(PerkDetailStore)

  @Input()
  public set perkId(value: string) {
    this.store.load({ perkId: value })
  }

  @Input()
  public disableProperties = false

  public perkChange = outputFromObservable(toObservable(this.store.perk))
}
