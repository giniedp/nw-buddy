import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { injectRouteParam } from '~/utils'
import { LoreItemDetailMapComponent, LoreItemDetailStore } from '~/widgets/data/lore-item-detail'

@Component({
  standalone: true,
  selector: 'nwb-lore-detail-page',
  templateUrl: './lore-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, LayoutModule, RouterModule, IconsModule, LoreItemDetailMapComponent],
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
  protected grandParentTitle = toSignal(this.store.grandParentTitle$)
  protected grandParentId = toSignal(this.store.grandParentId$)
  protected isTopic = toSignal(this.store.isTopic$)
  protected isChapter = toSignal(this.store.isChapter$)
  protected isPage = toSignal(this.store.isPage$)
  protected image = toSignal(this.store.image$)
  protected nextId = toSignal(this.store.nextId$)
  protected prevId = toSignal(this.store.prevId$)
  protected chevronLeft = svgChevronLeft

  protected titleID1 = computed(() => {
    if (this.isTopic()) {
      return null
    }
    if (this.isChapter()) {
      return this.parentId()
    }
    return this.grandParentId()
  })
  protected titleID2 = computed(() => {
    if (this.isTopic()) {
      return null
    }
    if (this.isChapter()) {
      return null
    }
    return this.parentId()
  })

  protected title1 = computed(() => {
    if (this.isTopic()) {
      return this.title()
    }
    if (this.isChapter()) {
      return this.parentTitle()
    }
    return this.grandParentTitle()
  })
  protected title2 = computed(() => {
    if (this.isTopic()) {
      return null
    }
    if (this.isChapter()) {
      return this.title()
    }
    return this.parentTitle()
  })
  protected title3 = computed(() => {
    if (this.isTopic() || this.isChapter()) {
      return null
    }
    return this.title()
  })
  protected title4 = computed(() => {
    return this.subtitle()
  })

  public constructor() {
    this.store.load(this.loreId$)
  }

  protected linkTo(id: string) {
    return id ? ['/lore/table', id] : null
  }
}
