import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Signal, ViewChild, inject } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { getVitalFamilyInfo } from '@nw-data/common'
import { VitalsBaseData, VitalsLevelVariantData } from '@nw-data/generated'
import { map } from 'rxjs'
import { TranslateService } from '~/i18n'

import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgPen } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TabsModule } from '~/ui/tabs'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, observeQueryParam, observeRouteParam, selectSignal } from '~/utils'
import { GatherableDetailModule } from '~/widgets/data/gatherable-detail'
import { VitalDetailModule, VitalDetailStore, VitalMapFeatureProperties } from '~/widgets/data/vital-detail'
import { LootModule } from '~/widgets/loot'
import { LootContextEditorComponent } from '~/widgets/loot/loot-context-editor.component'
import { ScreenshotModule } from '~/widgets/screenshot'
import { ModelViewerModule } from '../../../widgets/model-viewer'

export type DetailTabId = 'stats' | 'buffs' | 'damage-table' | '3d-model' | 'loot'

@Component({
  selector: 'nwb-vital-detail-page',
  templateUrl: './vital-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    VitalDetailModule,
    LootModule,
    LayoutModule,
    ScreenshotModule,
    ModelViewerModule,
    TooltipModule,
    IconsModule,
    GatherableDetailModule,
    TabsModule,
  ],
  providers: [VitalDetailStore],
  host: {
    class: 'block',
  },
})
export class VitalDetailPageComponent {
  protected store = inject(VitalDetailStore)

  protected vital = this.store.vital
  protected vitalId = this.store.vitalId
  protected vitalLevel: Signal<number> = this.store.level

  protected tabId$ = observeQueryParam(this.route, 'tab').pipe(map((it: DetailTabId): DetailTabId => it || 'stats'))
  protected tab = toSignal(this.tabId$)

  protected difficulty$ = observeQueryParam(this.route, 'difficulty').pipe(map((it) => Number(it) || null))
  protected difficulty = this.store.mutaDifficultyId

  protected iconEdit = svgPen

  protected lootTableIds: Signal<string[]> = selectSignal(
    {
      vital: this.store.vital,
      isVitalFromDungeon: this.store.isVitalFromDungeon,
    },
    (it) => {
      const result: string[] = []
      if (it?.vital?.LootTableId) {
        result.push(it.vital.LootTableId)
      }
      if (it?.isVitalFromDungeon) {
        result.push('CreatureLootMaster_MutatedContainer')
      }
      return result
    },
  )
  protected gatherableIds = selectSignal(this.store.metadata, (it) => it?.gthIDs || [])

  @ViewChild(LootContextEditorComponent, { static: false })
  protected editor: LootContextEditorComponent

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private i18n: TranslateService,
    private head: HtmlHeadService,
  ) {
    this.store.load(
      observeRouteParam(this.route, 'id').pipe(
        map((it) => {
          return {
            vitalId: it,
            level: null,
          }
        }),
      ),
    )
    this.store.setMutation(
      observeQueryParam(this.route, 'difficulty').pipe(
        map((it) => {
          return {
            mutaElementId: null,
            mutaDifficultyId: Number(it) || null,
          }
        }),
      ),
    )
  }

  public selectTab(tab: DetailTabId) {
    this.router.navigate([], {
      queryParams: {
        tab: tab,
      },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }

  public selectDifficulty(value: number) {
    this.router.navigate([], {
      queryParams: {
        difficulty: this.difficulty() === value ? null : value,
      },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }

  protected async onEntity(entity: VitalsBaseData & VitalsLevelVariantData) {
    if (!entity) {
      return
    }
    const info = getVitalFamilyInfo(entity)
    this.head.updateMetadata({
      title: [this.i18n.get(entity.DisplayName), 'Creature'].join(' - '),
      description: [this.i18n.get(info?.Name), `Level: ${entity.Level}`].join(' - '),
      url: this.head.currentUrl,
      image: info?.Icon,
    })
  }

  protected onPointClicked(payload: VitalMapFeatureProperties) {
    if (!payload || !this.editor) {
      return
    }
    this.editor.territoryId = null
    this.editor.poiId = null
    for (const id of payload.territories) {
      if (id < 1000) {
        this.editor.territoryId = id
      } else if (id < 10000) {
        //
      } else {
        this.editor.poiId = id
      }
    }
    this.editor.vitalLevel = payload.level
    this.editor.contLevel = payload.level
    this.editor.poiLevel = payload.level
  }
}
