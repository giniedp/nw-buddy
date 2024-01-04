import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Vitals } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { selectSignal } from '~/utils'
import { ZoneDetailMapComponent } from './zone-detail-map.component'
import { ZoneDetailStore } from './zone-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-zone-detail',
  templateUrl: './zone-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, ZoneDetailMapComponent],
  providers: [DecimalPipe, ZoneDetailStore],
  host: {
    class: 'flex flex-col rounded-md overflow-clip',
  },
})
export class ZoneDetailComponent {
  public readonly store = inject(ZoneDetailStore)

  @Input()
  public set zoneId(value: string | number) {
    this.store.patchState({ recordId: value })
  }

  @Output()
  public vitalClicked = new EventEmitter<string>()

  @Output()
  public zoneClicked = new EventEmitter<string>()

  public readonly recordId = selectSignal(this.store.recordId$, (it) => String(it))
  public readonly icon = toSignal(this.store.icon$)
  public readonly name = toSignal(this.store.name$)
  public readonly description = toSignal(this.store.description$)
  public readonly type = toSignal(this.store.type$)

  public markVital(vital: Vitals) {
    this.store.patchState({ markedVitalId: vital?.VitalsID || null })
  }

  protected onVitalClicked(vitalId: string) {
    this.vitalClicked.emit(vitalId)
  }

  protected onZoneClicked(zoneId: string) {
    this.zoneClicked.emit(zoneId)
  }
}
