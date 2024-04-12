import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { NW_MAX_ENEMY_LEVEL, getVitalCategoryInfo, getVitalFamilyInfo, getVitalTypeMarker } from '@nw-data/common'
import { interval, map, takeUntil } from 'rxjs'
import { NwModule } from '~/nw'
import { humanize, mapProp } from '~/utils'
import { VitalDetailStore } from './vital-detail.store'
import { TooltipModule } from '~/ui/tooltip'
import { GsInputComponent, GsSliderComponent } from '~/ui/gs-input'
import { FormsModule } from '@angular/forms'
import { LayoutModule } from '~/ui/layout'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-header',
  templateUrl: './vital-detail-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterLink, TooltipModule, LayoutModule, GsSliderComponent, FormsModule],
  host: {
    class: 'relative flex flex-col items-center justify-center p-2'
  }
})
export class VitalDetailHeaderComponent {
  @Input()
  public editableLevel = false
  protected levelEditorOpen = false
  protected store = inject(VitalDetailStore)
  protected minLevel = 1
  protected maxLevel = NW_MAX_ENEMY_LEVEL
  protected id = toSignal(this.store.vitalId$)
  protected name = toSignal(this.store.vital$.pipe(mapProp('DisplayName')))
  protected aliasNames = toSignal(this.store.aliasNames$)
  protected health = toSignal(this.store.health$)
  protected level = toSignal(this.store.level$)
  protected typeMarker = toSignal(this.store.vital$.pipe(map(getVitalTypeMarker)))
  protected familyInfo = toSignal(this.store.vital$.pipe(map(getVitalFamilyInfo)))
  protected categoryInfos = toSignal(this.store.vital$.pipe(map(getVitalCategoryInfo)))
  protected familyIcon = computed(() => this.categoryInfos()?.[0]?.IconBane)

  protected setLevel(value: number) {
    this.store.patchState({ level: value })
  }

  public constructor() {
    this.store.vitalId$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.store.patchState({ level: null })
    })
  }
}
