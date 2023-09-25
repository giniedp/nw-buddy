import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailStore } from './item-detail.store'
import { Objectivetasks, PoiDefinition } from '@nw-data/generated'
import { selectStream } from '~/utils'
import { Observable, combineLatest, defer, map, of, switchMap, tap } from 'rxjs'
import { getQuestTypeIcon } from '@nw-data/common'
import { TranslateService } from '~/i18n'
import { NwExpressionContext } from '~/nw/expression'
import { takeRight } from 'lodash'

export interface PerkTask {
  icon: string
  description: string
  context: NwExpressionContext
}

@Component({
  standalone: true,
  selector: 'nwb-item-detail-perk-tasks',
  templateUrl: './item-detail-perk-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, IconsModule],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class ItemDetailPerkTasksComponent {
  private db = inject(NwDbService)
  private tl8 = inject(TranslateService)

  protected tasks$ = selectStream(this.store.artifactPerkTasks$).pipe(
    map((tasks) => {
      if (!tasks) {
        return null
      }
      const list = [tasks.task, tasks.perk1, tasks.perk2, tasks.perk3, tasks.perk4].filter((it) => !!it)
      if (!list.length) {
        return null
      }
      return list.map((task) => this.selectTask(task))
    })
  )

  protected trackByIndex = (i: number) => i
  protected iconObjective = svgEllipsisVertical

  public constructor(private store: ItemDetailStore) {
    //
  }

  protected textContext(task: Objectivetasks) {
    return {
      targetName: task.TargetQty,
      POITags: task.POITag,
    }
  }

  private selectTask(task: Objectivetasks): PerkTask {
    return {
      icon: task.Type === 'SimpleTaskContainer' ? null : getQuestTypeIcon(task.Type),
      description: task.TP_DescriptionTag,
      context: {
        charLevel: null,
        gearScore: null,
        targetName: defer(() => this.resolveTargetName(task)),
        POITags: defer(() => this.resolvePOITags(task)),
        territoryID: defer(() => this.resolveTerritoryID(task)),
        targetAmount: task.TargetQty,
      },
    }
  }

  private resolveTargetName(task: Objectivetasks) {
    return this.db.vitalsCategory(task.KillEnemyType).pipe(
      switchMap((vital) => {
        if (!vital) {
          return of(task.KillEnemyType)
        }
        return this.tl8.observe(vital.DisplayName)
      }),
      map((text) => {
        return task.TargetQty > 1 ? `${task.TargetQty} ${text} ` : text
      })
    )
  }

  private resolvePOITags(task: Objectivetasks) {
    return this.db.poiByPoiTag
      .pipe(map((pois) => pois.get(task.POITag)))
      .pipe(
        map((it): PoiDefinition => {
          return it?.size ? it.values().next().value : null
        })
      )
      .pipe(
        switchMap((poi) => {
          if (!poi) {
            return of(task.POITag)
          }
          return this.tl8.observe(poi.NameLocalizationKey)
        })
      )
  }

  private resolveTerritoryID(task: Objectivetasks) {
    return this.db.territoriesMap.pipe(map((it) => it.get(task.TerritoryID))).pipe(
      switchMap((it) => {
        if (!it) {
          return of(task.TerritoryID)
        }
        return this.tl8.observe(it.NameLocalizationKey)
      })
    )
  }
}
