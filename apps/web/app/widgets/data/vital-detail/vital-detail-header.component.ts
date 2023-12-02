import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { getVitalCategoryInfo, getVitalFamilyInfo, getVitalTypeMarker } from '@nw-data/common'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { humanize, mapProp } from '~/utils'
import { VitalDetailStore } from './vital-detail.store'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-header',
  templateUrl: './vital-detail-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterLink, TooltipModule],
  host: {
    class: 'relative flex flex-col items-center justify-center p-2'
  }
})
export class VitalDetailHeaderComponent {
  protected store = inject(VitalDetailStore)

  protected id = toSignal(this.store.vitalId$)
  protected name = toSignal(this.store.vital$.pipe(mapProp('DisplayName')))
  protected health = toSignal(this.store.health$)
  protected level = toSignal(this.store.level$)
  protected typeMarker = toSignal(this.store.vital$.pipe(map(getVitalTypeMarker)))
  protected familyInfo = toSignal(this.store.vital$.pipe(map(getVitalFamilyInfo)))
  protected categoryInfo = toSignal(this.store.vital$.pipe(map(getVitalCategoryInfo)))
  protected familyIcon = computed(() => this.categoryInfo()?.IconBane)
  protected familyTip = computed(() => {
    if (this.familyInfo()?.ID === this.id()) {
      return null
    }
    if (!this.categoryInfo()?.ID) {
      return `Not affected by ward, bane or trophy`
    }
    return `Is affected by ${humanize(this.categoryInfo().Name)} ward, bane and trophy`
  })
}
