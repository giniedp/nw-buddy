import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, HostBinding, inject } from '@angular/core'
import { getQuestTypeIcon, isMasterItem } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { MasterItemDefinitions, ObjectiveTasks } from '@nw-data/generated'
import { combineLatest, defer, from, map, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { NwLinkService, NwModule } from '~/nw'
import { NwExpressionContext } from '~/nw/expression'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { apiResource } from '~/utils'
import { ItemDetailStore } from './item-detail.store'

export interface PerkTask {
  icon: string
  description: string
  context: NwExpressionContext
}

@Component({
  selector: 'nwb-item-detail-perk-tasks',
  templateUrl: './item-detail-perk-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, IconsModule],
  host: {
    class: 'flex flex-col gap-1',
    '[class.hidden]': 'isHidden()',
  },
})
export class ItemDetailPerkTasksComponent {
  private db = injectNwData()
  private tl8 = inject(TranslateService)
  private nwdb = inject(NwLinkService)
  private store = inject(ItemDetailStore)

  protected isHidden = computed(() => {
    return !this.tasks()?.length
  })

  protected resource = apiResource({
    request: () => this.store.item(),
    loader: async ({ request }) => fetchTasks(this.db, request),
  })

  protected iconObjective = svgEllipsisVertical
  protected tasks = computed(() => {
    return this.resource.value()?.map((task) => this.selectTask(task))
  })

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
    const enemyType = task.KillEnemyType || task.ItemDropVC
    const quantity = task.TargetQty
    return combineLatest({
      category: this.db.vitalsCategoriesById(enemyType),
      vital: this.db.vitalsById(enemyType),
    }).pipe(
      switchMap(({ category, vital }) => {
        if (!category) {
          return of(enemyType)
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
        return Number(quantity) > 1 ? `${quantity} ${text} ` : text
      }),
    )
  }

  private resolvePOITags(task: ObjectiveTasks) {
    return from(this.db.territoriesByPoiTagMap())
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
    return from(this.db.territoriesByIdMap())
      .pipe(map((it) => it.get(Number(task.TerritoryID))))
      .pipe(
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

async function fetchTasks(db: NwData, item: MasterItemDefinitions) {
  if (!item || !isMasterItem(item)) {
    return null
  }
  const task = await db.objectiveTasksById(`Task_ContainerPerks_${item.ItemID}`)
  if (!task) {
    return null
  }
  return Promise.all([
    db.objectiveTasksById(task.SubTask1),
    db.objectiveTasksById(task.SubTask2),
    db.objectiveTasksById(task.SubTask3),
    db.objectiveTasksById(task.SubTask4),
    db.objectiveTasksById(task.SubTask5),
  ]).then((list) => list.filter((it) => !!it))
}
