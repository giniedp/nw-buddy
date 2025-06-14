import { ChangeDetectionStrategy, Component, effect, inject, input, Input, untracked } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { AttributeRef, getItemId } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { skip } from 'rxjs'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailAttributionComponent } from './item-detail-attribution.component'
import { ItemDetailDescriptionHeargemComponent } from './item-detail-description-heargem.component'
import { ItemDetailDescriptionComponent } from './item-detail-description.component'
import { ItemDetailGsDamage } from './item-detail-gs-damage.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { ItemDetailInfoComponent } from './item-detail-info.component'
import { ItemDetailPerkTasksComponent } from './item-detail-perk-tasks.component'
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemDetailStatsComponent } from './item-detail-stats.component'
import { ItemDetailStore } from './item-detail.store'
import { ItemEditorEventsService } from './item-editor-events.service'

@Component({
  selector: 'nwb-item-card',
  templateUrl: './item-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemDetailAttributionComponent,
    ItemDetailDescriptionComponent,
    ItemDetailDescriptionHeargemComponent,
    ItemDetailGsDamage,
    ItemDetailHeaderComponent,
    ItemDetailInfoComponent,
    ItemDetailPerksComponent,
    ItemDetailPerkTasksComponent,
    ItemDetailStatsComponent,
    ItemFrameModule,
  ],
  exportAs: 'card',
  host: {
    class: 'block bg-black rounded-md overflow-clip font-nimbus',
  },
  providers: [ItemEditorEventsService, ItemDetailStore],
})
export class ItemCardComponent {
  public readonly store = inject(ItemDetailStore)
  private events = inject(ItemEditorEventsService)

  public entity = input<string, string | MasterItemDefinitions | HouseItems>(null, {
    alias: 'entity',
    transform: (value) => (typeof value === 'string' ? value : getItemId(value)),
  })
  public gsOverride = input<number, string | number>(null, {
    transform: (value) => {
      if (typeof value === 'string') {
        return Number(value)
      }
      return value
    }
  })
  public gsEditable = input<boolean>()
  public perkOverride = input<Record<string, string>>()
  public perkEditable = input<boolean>()

  public playerLevel = input<number>()
  public attrValueSums = input<Record<AttributeRef, number>>()

  public perkEdit = outputFromObservable(this.events.editPerk)
  public gsEdit = outputFromObservable(this.events.editGearScore)
  public itemChange = outputFromObservable(toObservable(this.store.item).pipe(skip(1)))
  public entityChange = outputFromObservable(toObservable(this.store.record).pipe(skip(1)))
  public housingItemChange = outputFromObservable(toObservable(this.store.houseItem).pipe(skip(1)))

  #fxLoad = effect(() => {
    const itemId = this.entity()
    untracked(() => {
      this.store.load({
        recordId: itemId,
        gsOverride: this.gsOverride(),
        perkOverride: this.perkOverride(),
      })
    })
  })
  #fxOverrideGs = effect(() => {
    const gsOverride = this.gsOverride()
    untracked(() => {
      this.store.updateGsOverride(gsOverride)
    })
  })
  #fxOverridePerks = effect(() => {
    const perkOverride = this.perkOverride()
    untracked(() => {
      this.store.updatePerkOverride(perkOverride)
    })
  })
  #fxSettings = effect(() => {
    const playerLevel = this.playerLevel()
    const gsEditable = this.gsEditable()
    const perkEditable = this.perkEditable()
    const attrValueSums = this.attrValueSums()
    untracked(() => {
      this.store.updateSettings({
        playerLevel,
        gsEditable,
        attrValueSums,
        perkEditable,
      })
    })
  })

  @Input()
  public enableTracker: boolean

  @Input()
  public enableInfoLink: boolean

  @Input()
  public enableLink: boolean

  @Input()
  public enableTasks: boolean

  @Input()
  public disableStats: boolean

  @Input()
  public disableInfo: boolean

  @Input()
  public disableDescription: boolean

  @Input()
  public disablePerks: boolean

  @Input()
  public square: boolean
}
