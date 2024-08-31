import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, inject, Input, OnInit, Output } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { groupBy } from 'lodash'
import { BehaviorSubject, combineLatest, map } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgBrush } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, humanize, observeQueryParam } from '~/utils'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { ItemDetailModule } from '../item-detail'
import {
  getAppearanceDyeChannels,
  getAppearanceGender,
  getAppearanceIdName,
  TransmogAppearance,
  TransmogGender,
  TransmogItem,
} from '../transmog/transmog-item'
import { AppearanceDetailStore } from './appearance-detail.store'
import { TRANSMOG_CATEGORIES } from '../transmog'

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
  providers: [
    {
      provide: AppearanceDetailStore,
      useExisting: forwardRef(() => AppearanceDetailComponent),
    },
  ],
  host: {
    class: 'flex flex-col gap-2',
  },
})
export class AppearanceDetailComponent extends AppearanceDetailStore implements OnInit {
  @Input()
  public set appearanceId(value: string) {
    this.patchState({ appearanceId: value })
  }

  @Input()
  public set parentItemId(value: string) {
    this.patchState({ parentItemId: value })
  }

  @Input()
  public set appearance(value: TransmogAppearance) {
    this.load(value)
  }

  @Input()
  public disableProperties: boolean

  @Output()
  public appearanceChange$ = this.appearance$

  protected gender$ = observeQueryParam(inject(ActivatedRoute), 'gender')
  protected modelViewerOpened = false
  protected iconDye = svgBrush
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
    }
  )

  protected itemset$ = this.select(this.transmog$, (it) => {
    return it?.set?.length > 1 ? it.set : null
  })

  protected trackByIndex = (index: number) => index
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
          name,
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
    }
  )

  protected dyeSlots(transmog: TransmogItem) {
    return getAppearanceDyeChannels(transmog.appearance)
  }

  protected categoryName(category: string) {
    return TRANSMOG_CATEGORIES.find((it) => it.id === category)?.name
  }

  public ngOnInit() {
    this.loadVariant(this.gender$.pipe(map((it) => it as TransmogGender)))
  }
}
