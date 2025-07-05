import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { NW_MAX_GEAR_SCORE, NW_MIN_GEAR_SCORE } from '@nw-data/common'
import { combineLatest, take } from 'rxjs'
import { GearsetStore } from '~/data'
import { BackendService } from '~/data/backend'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { injectRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'
import { ItemDetailPageStore } from './inventory-detail-page.store'
import { InventoryPickerService } from './inventory-picker.service'

@Component({
  selector: 'nwb-inventory-detail',
  templateUrl: './inventory-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NwModule,
    ItemDetailModule,
    ScreenshotModule,
    LayoutModule,
    ItemFrameModule,
  ],
  providers: [GearsetStore, ItemDetailPageStore],
  host: {
    class: 'block',
  },
})
export class InventoryDetailComponent {
  private backend = inject(BackendService)
  private userId = computed(() => this.backend.session()?.id || 'local')
  private store = inject(ItemDetailPageStore)

  public instance = this.store.instance
  public isLoaded = this.store.isLoaded

  protected minGs = NW_MIN_GEAR_SCORE
  protected maxGs = NW_MAX_GEAR_SCORE
  protected isGearScoreOpen: boolean
  protected overrideGearScore: number
  protected gsTarget: Element

  public constructor(private service: InventoryPickerService) {
    this.store.connect(
      combineLatest({
        gearsetId: injectRouteParam('set'),
        slotId: injectRouteParam('slot'),
        itemId: injectRouteParam('id'),
        userId: toObservable(this.userId),
      }),
    )
  }

  protected handleOpenGsEditor(event: MouseEvent) {
    this.gsTarget = event.currentTarget as Element
  }
  protected handleCloseGsEditor() {
    this.gsTarget = null
  }
  public handleGearScoreChange(gearScore: number) {
    this.overrideGearScore = gearScore
  }
  public handleGearScoreWrite() {
    const value = this.overrideGearScore
    this.overrideGearScore = null
    if (this.store.gearset()) {
      this.store.updateSlotGearScore(this.store.slotId(), value)
    } else {
      this.store.patchItemInstance({ gearScore: value })
    }
  }

  public handlePickPerk(key: string) {
    this.service
      .pickPerkForItem(this.instance(), key)
      .pipe(take(1))
      .subscribe((value) => {
        if (this.store.gearset()) {
          this.store.updateSlotPerk(this.store.slotId(), key, value)
        } else {
          this.store.updateItemInstancePerk(key, value)
        }
      })
  }
}
