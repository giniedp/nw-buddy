import { DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { VitalsData } from '@nw-data/generated'
import { ZoneDetailContentComponent } from './zone-detail-content.component'
import { ZoneDetailHeaderComponent } from './zone-detail-header.component'
import { ZoneDetailStore } from './zone-detail.store'

@Component({
  selector: 'nwb-zone-detail',
  template: `
    <nwb-zone-detail-header />
    <ng-content>
      <nwb-zone-detail-content class="p-4" />
    </ng-content>
  `,
  exportAs: 'zoneDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZoneDetailHeaderComponent, ZoneDetailContentComponent],
  providers: [DecimalPipe, ZoneDetailStore],
  host: {
    class: 'flex flex-col rounded-md overflow-clip',
  },
})
export class ZoneDetailComponent {
  public readonly store = inject(ZoneDetailStore)

  @Input()
  public set zoneId(value: string | number) {
    this.store.load({ territoryId: value })
  }

  public markVital(vital: VitalsData) {
    this.store.markVital(vital?.VitalsID || null)
  }
}
