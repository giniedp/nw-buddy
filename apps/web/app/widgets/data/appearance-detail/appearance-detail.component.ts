import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core'
import { outputFromObservable, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { getItemSourceShort } from '@nw-data/common'
import { groupBy } from 'lodash'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgBrush } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, humanize, observeQueryParam } from '~/utils'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { ItemDetailModule } from '../item-detail'
import { TRANSMOG_CATEGORIES } from '../transmog'
import {
  getAppearanceDyeChannels,
  getAppearanceGender,
  getAppearanceId,
  TransmogAppearance,
  TransmogItem,
} from '../transmog/transmog-item'
import { AppearanceDetailStore } from './appearance-detail.store'
import { TabsModule } from '~/ui/tabs'

@Component({
  selector: 'nwb-appearance-detail',
  templateUrl: './appearance-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemFrameModule,
    RouterModule,
    ItemDetailModule,
    IconsModule,
    TooltipModule,
    ModelViewerModule,
    TabsModule,
  ],
  providers: [AppearanceDetailStore],
  host: {
    class: 'flex flex-col gap-2',
  },
})
export class AppearanceDetailComponent {
  public store = inject(AppearanceDetailStore)
  public appearance = input<string | TransmogAppearance>(null)
  public parentItemId = input<string>(null)
  private variant = toSignal(observeQueryParam(inject(ActivatedRoute), 'gender'))

  protected showSkeleton = computed(() => this.store.isLoading() && !this.store.appearance())
  protected showMissing = computed(() => !this.store.isLoading() && !this.store.appearance())
  protected showContent = computed(() => !this.showSkeleton() && !this.showMissing())

  #fxLoad = effect(() => {
    const appearance = this.appearance()
    const appearanceId = typeof appearance === 'string' ? appearance : getAppearanceId(appearance)
    untracked(() =>
      this.store.load({
        appearanceIdOrName: appearanceId,
        parentItemId: this.parentItemId(),
        variant: this.variant() as any,
      }),
    )
  })
  #fxParent = effect(() => {
    const parentItemId = this.parentItemId()
    untracked(() => this.store.setParent(parentItemId))
  })
  #fxGender = effect(() => {
    const variant = this.variant()
    untracked(() => this.store.setVariant(variant as any))
  })

  public disableProperties = input<boolean>(false)
  public appearanceChange = outputFromObservable(toObservable(this.store.appearance))

  protected modelViewerOpened = false
  protected iconDye = svgBrush
  protected models = toSignal(this.store.models())
  protected transmog = toSignal(this.store.transmogs())
  protected similarItems = toSignal(this.store.similarItems())
  protected similarTransmogs = toSignal(this.store.transmogsWithSameModel())
  protected transmogDyeSlots = computed(() => {
    return this.dyeSlots(this.transmog())
  })

  protected gender = computed(() => getAppearanceGender(this.store.appearance()))
  protected commonText = computed(() => {
    if (this.gender() === 'male') {
      return 'Male'
    }
    if (this.gender() === 'female') {
      return 'Female'
    }
    return 'Common'
  })
  protected link = computed(() => {
    return ['/transmog', this.store.appearanceId()]
  })
  protected other = computed(() => {
    if (!this.store.variants()?.length) {
      return null
    }
    const transmog = this.transmog()
    const gender = this.gender()
    if (gender) {
      const other = gender === 'male' ? transmog?.female : transmog?.male
      const result = getAppearanceGender(other?.appearance)
      return getAppearanceGender(other?.appearance)
    }
    return null
  })
  protected itemset = computed(() => {
    const it = this.transmog()
    return it?.set?.length > 1 ? it.set : null
  })

  protected similarItemsTab = signal<string>(null)
  protected similarItemsVm = computed(() => {
    const tabId = this.similarItemsTab()
    const items = this.similarItems()
    const parentId = this.store.parentItemId()
    if (!items?.length) {
      if (parentId) {
        return null
      }
      return {
        count: 0,
        tabs: [],
        items: [],
      }
    }

    const groups = groupBy(items, (it) => it['$source'])
    const tabs = Object.entries(groups).map(([name, group]) => {
      return {
        name: humanize(getItemSourceShort(group[0])),
        items: group,
        active: false,
      }
    })

    const tab = tabs.find((it) => eqCaseInsensitive(it.name, tabId)) || tabs[0]
    tab.active = true
    return {
      count: items.length,
      tabs: tabs,
      items: tab?.items,
    }
  })

  protected dyeSlots(transmog: TransmogItem) {
    if (!transmog) {
      return null
    }
    return getAppearanceDyeChannels(transmog.appearance)
  }

  protected categoryName(category: string) {
    return TRANSMOG_CATEGORIES.find((it) => it.id === category)?.name
  }
}
