import { Directive, computed, effect, inject, input, untracked } from '@angular/core'
import { ItemDetailStore } from './item-detail.store'
import { NwLinkService } from '~/nw'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'

@Directive({
  standalone: true,
  selector: '[nwbItemDetail]',
  exportAs: 'itemDetail',
  providers: [ItemDetailStore],
})
export class ItemDetailDirective {
  private linkService = inject(NwLinkService)
  public store = inject(ItemDetailStore)

  public source = input<string | MasterItemDefinitions | HouseItems>(null, { alias: 'nwbItemDetail' })
  public gsOverride = input<number>()
  public perkOverride = input<Record<string, string>>()

  public recordId = this.store.recordId
  public item = this.store.item
  public houseItem = this.store.houseItem
  public record = this.store.record
  public icon = this.store.icon
  public name = this.store.name
  public typeName = this.store.typeName
  public rarity = this.store.rarity
  public rarityLabel = this.store.rarityLabel
  public isNamed = this.store.isNamed
  public isResource = this.store.isResource
  public itemLink = computed(() => {
    if (this.houseItem()) {
      return this.linkService.resourceLink({
        type: 'housing',
        id: this.store.recordId(),
      })
    }
    if (this.item()) {
      return this.linkService.resourceLink({
        type: 'item',
        id: this.store.recordId(),
      })
    }
    return null
  })

  #fxLoad = effect(() => {
    const source = this.source()
    untracked(() => this.store.load(source))
  })

  #fxOverrideGs = effect(() => {
    const gsOverride = this.gsOverride()
    untracked(() => this.store.updateGsOverride(gsOverride))
  })

  #fxOverridePerks = effect(() => {
    const perkOverride = this.perkOverride()
    untracked(() => this.store.updatePerkOverride(perkOverride))
  })
}
