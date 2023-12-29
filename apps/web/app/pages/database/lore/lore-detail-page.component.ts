import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { injectRouteParam } from '~/utils'
import { LoreItemDetailStore } from '~/widgets/data/lore-item-detail'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-lore-detail-page',
  templateUrl: './lore-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, LayoutModule, RouterModule, IconsModule],
  providers: [LoreItemDetailStore],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class LoreDetailPageComponent {
  private store = inject(LoreItemDetailStore)

  protected loreId$ = injectRouteParam('id')
  protected title = toSignal(this.store.title$)
  protected subtitle = toSignal(this.store.subtitle$)
  protected body = toSignal(this.store.body$)
  protected children = toSignal(this.store.children$)
  protected pageNumber = toSignal(this.store.pageNumber$)
  protected pageCount = toSignal(this.store.pageCount$)
  protected orderNumber = toSignal(this.store.order$)
  protected parentTitle = toSignal(this.store.parentTitle$)
  protected parentId = toSignal(this.store.parentId$)
  protected isTopic = toSignal(this.store.isTopic$)
  protected isChapter = toSignal(this.store.isChapter$)
  protected isPage = toSignal(this.store.isPage$)
  protected image = toSignal(this.store.image$)
  protected nextId = toSignal(this.store.nextId$)
  protected prevId = toSignal(this.store.prevId$)
  protected chevronLeft = svgChevronLeft

  public constructor() {
    this.store.load(this.loreId$)
  }
}
