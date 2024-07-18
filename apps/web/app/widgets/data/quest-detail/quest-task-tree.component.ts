import { Component, computed, inject, input } from '@angular/core'

import { getItemId, getQuestTypeIcon, isHousingItem } from '@nw-data/common'
import { ObjectiveTasks } from '@nw-data/generated'
import { combineLatest, defer, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { NwLinkService, NwModule } from '~/nw'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { TaskTree } from './quest-task-detail.store'
import { coerceBooleanProperty } from '@angular/cdk/coercion'

@Component({
  standalone: true,
  selector: 'nwb-quest-task-tree',
  templateUrl: './quest-task-tree.component.html',
  host: {
    class: 'flex flex-col',
    '[class.text-stone-700]': 'isHidden()',
  },
  imports: [NwModule],
})
export class QuestTaskTreeComponent {
  private db = inject(NwDataService)
  private tl8 = inject(TranslateService)
  private links = inject(NwLinkService)

  public readonly task = input<ObjectiveTasks>()
  public readonly children = input<TaskTree[]>()

  protected iconObjective = svgEllipsisVertical
  protected icon = computed(() => getQuestTypeIcon(this.task()?.Type))
  protected description = computed(() => this.task()?.TP_DescriptionTag)
  protected isHidden = computed(() => coerceBooleanProperty(this.task()?.IsHidden))

  protected textContext = computed(() => {
    const task = this.task()
    return {
      itemAmount: fallbackToken('itemAmount'),
      timeRemaining: fallbackToken('timeRemaining'),
      destinationName: fallbackToken('destinationName'),
      itemName: defer(() => this.resolveItemName(task)).pipe(map((it) => it || fallbackToken('itemName'))),
      targetName: defer(() => this.resolveTargetName(task)).pipe(map((it) => it || fallbackToken('targetName'))),
      POItags: defer(() => this.resolvePOITags(task)).pipe(map((it) => it || fallbackToken('POItags'))),
      POITags: defer(() => this.resolvePOITags(task)).pipe(map((it) => it || fallbackToken('POITags'))),
      territoryID: defer(() => this.resolveTerritoryID(task)).pipe(map((it) => it || fallbackToken('territoryID'))),
      TerritoryID: defer(() => this.resolveTerritoryID(task)).pipe(map((it) => it || fallbackToken('TerritoryID'))),
      targetAmount: task?.TargetQty,
    }
  })

  private resolveItemName(task: ObjectiveTasks) {
    return this.db.itemOrHousingItem(task.ItemName).pipe(
      map((it) => {
        if (it) {
          const link = this.links.tooltipLink(isHousingItem(it) ? 'housing' : 'item', getItemId(it))
          return `<a href="${link}" target="_blank" class="link">${this.tl8.get(it?.Name)}</a>`
        }
        return null
      }),
    )
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
              const link = this.links.tooltipLink('vitals', String(vital.VitalsID))
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
              const link = this.links.tooltipLink('poi', String(poi.TerritoryID))
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
            const link = this.links.tooltipLink('poi', String(task.TerritoryID))
            return `<a href="${link}" target="_blank" class="link">${it}</a>`
          }),
        )
      }),
    )
  }
}

function fallbackToken(token: string) {
  return `<code class="text-secondary">${token}</code>`
}
