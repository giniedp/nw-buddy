import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input, Output } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { AppearanceDetailStore } from './appearance-detail.store'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { RouterModule } from '@angular/router'
import { ItemDetailModule } from '../item-detail'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { svgBrush } from '~/ui/icons/svg'
import {
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'
import { groupBy } from 'lodash'
import { eqCaseInsensitive } from '~/utils'
import { ModelViewerModule } from '~/widgets/model-viewer'

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
    class: 'flex flex-col gap-1',
  },
})
export class AppearanceDetailComponent extends AppearanceDetailStore {
  @Input()
  public set appearanceId(value: string) {
    this.patchState({ appearanceId: value })
  }

  @Input()
  public set parentItemId(value: string) {
    this.patchState({ parentItemId: value })
  }

  @Input()
  public set appearance(
    value: Itemappearancedefinitions | ItemdefinitionsInstrumentsappearances | ItemdefinitionsWeaponappearances
  ) {
    this.load(value)
  }

  @Input()
  public disableProperties: boolean

  @Output()
  public appearanceChange$ = this.appearance$

  protected modelViewerOpened = false
  protected iconDye = svgBrush
  protected vm$ = this.select(
    combineLatest({
      id: this.appearanceId$,
      appearance: this.appearance$,
      icon: this.icon$,
      name: this.name$,
      description: this.description$,
      category: this.category$,
    }),
    (data) => {
      if (!data.appearance || !data.category) {
        return null
      }
      return {
        ...data,
        link: ['/transmog', data.category.id, data.id],
      }
    }
  )

  protected trackByIndex = (index: number) => index
  protected similarItemsTab$ = new BehaviorSubject<string>(null)
  protected similarItemsVm$ = this.select(
    combineLatest({
      tabId: this.similarItemsTab$,
      items: this.similarItems$,
    }),
    ({ tabId, items }) => {
      if (!items?.length) {
        return null
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
}
