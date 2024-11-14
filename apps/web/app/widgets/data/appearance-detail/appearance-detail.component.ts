import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core'
import { outputFromObservable, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { getItemSourceShort } from '@nw-data/common'
import { groupBy } from 'lodash'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgBrush } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, humanize, observeQueryParam, selectStream } from '~/utils'
import { ModelsService, ModelViewerModule } from '~/widgets/model-viewer'
import { ItemDetailModule } from '../item-detail'
import { TRANSMOG_CATEGORIES, TransmogService } from '../transmog'
import { getAppearanceDyeChannels, getAppearanceGender, TransmogItem } from '../transmog/transmog-item'
import { AppearanceDetailStore } from './appearance-detail.store'

@Component({
  standalone: true,
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
  ],
  providers: [AppearanceDetailStore],
  host: {
    class: 'flex flex-col gap-2',
  },
})
export class AppearanceDetailComponent {
  public store = inject(AppearanceDetailStore)
  public appearanceId = input<string>(null)
  public parentItemId = input<string>(null)
  private variant = toSignal(observeQueryParam(inject(ActivatedRoute), 'gender'))

  #fxLoad = effect(() => {
    const appearanceId = this.appearanceId()
    untracked(() => this.store.load(appearanceId))
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
  public appearanceChange$ = outputFromObservable(toObservable(this.store.appearance))

  protected modelViewerOpened = false
  protected iconDye = svgBrush
  protected models$ = this.store.models()
  protected transmogs$ = this.store.transmogs()
  protected similarTransmogs$ = this.store.transmogsWithSameModel()

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

  protected vm$ = this.select(
    combineLatest({
      id: this.appearanceNameIdOrAlike$,
      appearance: this.appearance$,
      icon: this.icon$,
      name: this.name$,
      description: this.description$,
      category: this.category$,
      transmog: this.transmog$,
    }),
    (data) => {
      if (!data.appearance) {
        return null
      }
      const gender = getAppearanceGender(data.appearance)
      let commonText = `Common`
      if (gender) {
        commonText = gender === 'male' ? 'Male' : 'Female'
      }

      const transmog = data.transmog
      const other = gender === 'male' ? transmog?.female : transmog?.male

      return {
        ...data,
        commonText,
        link: ['/transmog', data.id],
        other: gender ? getAppearanceGender(other.appearance) : null,
      }
    },
    {
      debounce: true,
    },
  )

  protected itemset$ = this.select(this.transmog$, (it) => {
    return it?.set?.length > 1 ? it.set : null
  })

  protected similarItemsTab$ = new BehaviorSubject<string>(null)
  protected similarItemsVm$ = this.select(
    combineLatest({
      tabId: this.similarItemsTab$,
      items: this.similarItems$,
      parentId: this.parentItemId$,
    }),
    ({ tabId, items, parentId }) => {
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
    },
  )

  protected dyeSlots(transmog: TransmogItem) {
    return getAppearanceDyeChannels(transmog.appearance)
  }

  protected categoryName(category: string) {
    return TRANSMOG_CATEGORIES.find((it) => it.id === category)?.name
  }
}
