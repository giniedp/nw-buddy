import { Directive, computed, effect, inject, input, untracked } from '@angular/core'
import { ItemDetailStore } from './item-detail.store'
import { NwLinkService } from '~/nw'

@Directive({
  standalone: true,
  selector: '[nwbItemDetail]',
  exportAs: 'itemDetail',
  providers: [ItemDetailStore],
})
export class ItemDetailDirective {
  private linkService = inject(NwLinkService)
  public store = inject(ItemDetailStore)

  public itemId = input<string>(null, { alias: 'nwbItemDetail' })
  public gsOverride = input<number>()
  public perkOverride = input<Record<string, string>>()

  public item = this.store.item
  public houseItem = this.store.houseItem
  public record = this.store.record
  public icon = this.store.icon
  public name = this.store.name
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
    const itemId = this.itemId()
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
    untracked(() => this.store.updateGsOverride(gsOverride))
  })

  #fxOverridePerks = effect(() => {
    const perkOverride = this.perkOverride()
    untracked(() => this.store.updatePerkOverride(perkOverride))
  })
}
