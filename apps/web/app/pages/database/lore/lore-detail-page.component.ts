import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgLocationDot, svgLocationDotSlash } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectRouteParam } from '~/utils'
import { LoreItemDetailMapComponent, LoreDetailStore } from '~/widgets/data/lore-detail'

@Component({
  selector: 'nwb-lore-detail-page',
  templateUrl: './lore-detail-page.component.html',
  styleUrl: './lore-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, LayoutModule, RouterModule, IconsModule, LoreItemDetailMapComponent, TooltipModule],
  providers: [LoreDetailStore],
  host: {
    class: 'ion-page',
  },
})
export class LoreDetailPageComponent {
  protected store = inject(LoreDetailStore)
  protected loreId = toSignal(injectRouteParam('id'))
  protected iconLocation = svgLocationDot
  protected iconNoLocation = svgLocationDotSlash

  protected chevronLeft = svgChevronLeft
  protected backgroundImage = computed(() => {
    return this.store.isTopic() ? this.store.image() : null
  })
  protected chapterImage = computed(() => {
    return this.store.isChapter() ? this.store.image() : null
  })
  protected leftId = computed(() => {
    return this.store.prevId() || this.store.parent()?.LoreID
  })
  protected rightId = computed(() => {
    return this.store.nextId()
  })

  protected titleID1 = computed(() => {
    if (this.store.isTopic()) {
      return null
    }
    if (this.store.isChapter()) {
      return this.store.parent()?.LoreID
    }
    return this.store.grandParent()?.LoreID
  })
  protected titleID2 = computed(() => {
    if (this.store.isTopic()) {
      return null
    }
    if (this.store.isChapter()) {
      return null
    }
    return this.store.parent()?.LoreID
  })

  protected title1 = computed(() => {
    if (this.store.isTopic()) {
      return this.store.title()
    }
    if (this.store.isChapter()) {
      return this.store.parent()?.Title
    }
    return this.store.grandParent()?.Title
  })
  protected title2 = computed(() => {
    if (this.store.isTopic()) {
      return null
    }
    if (this.store.isChapter()) {
      return this.store.record()?.Title
    }
    return this.store.parent()?.Title
  })
  protected title3 = computed(() => {
    if (this.store.isTopic() || this.store.isChapter()) {
      return null
    }
    return this.store.record()?.Title
  })
  protected title4 = computed(() => {
    return this.store.record()?.Subtitle
  })

  public constructor() {
    effect(() => {
      const loreId = this.loreId()
      untracked(() => this.store.load({ id: loreId }))
    })
  }
}
