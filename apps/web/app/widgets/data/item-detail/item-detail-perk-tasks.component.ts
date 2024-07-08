import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { getQuestTypeIcon } from '@nw-data/common'
import { ObjectiveTasks, TerritoryDefinition } from '@nw-data/generated'
import { combineLatest, defer, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { NwLinkService, NwModule } from '~/nw'
import { NwExpressionContext } from '~/nw/expression'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { selectStream } from '~/utils'
import { ItemDetailStore } from './item-detail.store'

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
  private db = inject(NwDataService)
  private tl8 = inject(TranslateService)
  private nwdb = inject(NwLinkService)

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
    }),
  )

  protected trackByIndex = (i: number) => i
  protected iconObjective = svgEllipsisVertical

  public constructor(private store: ItemDetailStore) {
    //
  }

  protected textContext(task: ObjectiveTasks) {
    return {
      targetName: task.TargetQty,
      POITags: task.POITag,
    }
  }

  private selectTask(task: ObjectiveTasks): PerkTask {
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

  private resolveTargetName(task: ObjectiveTasks) {
    return combineLatest({
      category: this.db.vitalsCategory(task.KillEnemyType),
      vital: this.db.vital(task.KillEnemyType),
    }).pipe(
      switchMap(({ category, vital }) => {
        if (!category) {
          return of(task.KillEnemyType)
        }
        return this.tl8.observe(category.DisplayName).pipe(
          map((it) => {
            if (vital) {
              const link = this.nwdb.tooltipLink('vitals', String(vital.VitalsID))
              return `<a href="${link}" target="_blank" class="link">${it}</a>`
            }
            return it
          }),
        )
      }),
      map((text) => {
        return Number(task.TargetQty) > 1 ? `${task.TargetQty} ${text} ` : text
      }),
    )
  }

  private resolvePOITags(task: ObjectiveTasks) {
    return this.db.territoriesByPoiTag
      .pipe(map((data) => data.get(task.POITag)))
      .pipe(map((it) => it?.[0] || null))
      .pipe(
        switchMap((poi) => {
          if (!poi) {
            return of(task.POITag)
          }
          return this.tl8.observe(poi.NameLocalizationKey).pipe(
            map((it) => {
              const link = this.nwdb.tooltipLink('poi', String(poi.TerritoryID))
              return `<a href="${link}" target="_blank" class="link">${it}</a>`
            }),
          )
        }),
      )
  }

  private resolveTerritoryID(task: ObjectiveTasks) {
    return this.db.territoriesMap.pipe(map((it) => it.get(Number(task.TerritoryID)))).pipe(
      switchMap((it) => {
        if (!it) {
          return of(task.TerritoryID)
        }
        return this.tl8.observe(it.NameLocalizationKey).pipe(
          map((it) => {
            const link = this.nwdb.tooltipLink('poi', String(task.TerritoryID))
            return `<a href="${link}" target="_blank" class="link">${it}</a>`
          }),
        )
      }),
    )
  }
}
