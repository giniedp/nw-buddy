import { Component, computed, inject, input } from '@angular/core'

import { coerceBooleanProperty } from '@angular/cdk/coercion'
import { getItemId, getQuestTypeIcon, isHousingItem } from '@nw-data/common'
import { ObjectiveTasks } from '@nw-data/generated'
import { combineLatest, defer, from, map, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { NwLinkService, NwModule } from '~/nw'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { TaskTree } from './quest-task-detail.store'

@Component({
  selector: 'nwb-quest-task-tree',
  template: `
    @if (description(); as text) {
      <div class="flex flex-row gap-1 mb-1">
        <picture class="flex-none mt-1">
          <img [nwImage]="icon()" class="w-5 h-5 " />
        </picture>
        <div [nwHtml]="text | nwText: textContext() | nwTextBreak"></div>
      </div>
    }
    @for (child of children(); track $index) {
      <nwb-quest-task-tree [task]="child.task" [children]="child.children" [class.ml-4]="!!description()" />
    }
  `,
  host: {
    class: 'flex flex-col',
    '[class.text-stone-700]': 'isHidden()',
  },
  imports: [NwModule],
})
export class QuestTaskTreeComponent {
  private db = injectNwData()
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

  private async resolveItemName(task: ObjectiveTasks) {
    const item = await this.db.itemOrHousingItem(task.ItemName)
    if (item) {
      const link = this.links.tooltipLink(isHousingItem(item) ? 'housing' : 'item', getItemId(item))
      return `<a href="${link}" target="_blank" class="link">${this.tl8.get(item.Name)}</a>`
    }
    return null
  }

  private resolveTargetName(task: ObjectiveTasks) {
    const vitalId = task.KillEnemyType || task.ItemDropVC
    const quantity = task.TargetQty
    return combineLatest({
      category: this.db.vitalsCategoriesById(vitalId),
      vital: this.db.vitalsById(vitalId),
    }).pipe(
      switchMap(({ category, vital }) => {
        if (!category) {
          return of(vitalId)
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
        return Number(quantity) > 1 ? `${quantity} ${text} ` : text
      }),
    )
  }

  private resolvePOITags(task: ObjectiveTasks) {
    return from(this.db.territoriesByPoiTagMap()).pipe(
      map((data) => data.get(task.POITag)),
      map((it) => it?.[0] || null),
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
    return from(this.db.territoriesByIdMap()).pipe(
      map((it) => it.get(Number(task.TerritoryID))),
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
