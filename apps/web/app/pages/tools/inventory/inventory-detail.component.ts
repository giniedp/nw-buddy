import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { take } from 'rxjs'
import { GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { injectRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'
import { ItemDetailPageStore } from './inventory-detail-page.store'
import { InventoryPickerService } from './inventory-picker.service'

@Component({
  standalone: true,
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
  private store = inject(ItemDetailPageStore)

  public get instance() {
    return this.store.instance()
  }

  public get isLoaded() {
    return this.store.isLoaded()
  }

  protected isGearScoreOpen: boolean
  protected overrideGearScore: number
  protected gsTarget: Element

  public constructor(private service: InventoryPickerService) {
    this.store.syncInstance(injectRouteParam('id'))
    this.store.syncGearset(injectRouteParam('set'))
    this.store.syncSlot(injectRouteParam('slot') as any)
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
      .pickPerkForItem(this.instance, key)
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
