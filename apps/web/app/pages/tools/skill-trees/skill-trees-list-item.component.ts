import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { Ability } from '@nw-data/generated'
import { combineLatest } from 'rxjs'
import { SkillBuildRecord } from '~/data'
import { NwDbService, NwModule } from '~/nw'
import { getAbilityCategoryTag } from '~/nw/utils/abilities'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { IconsModule } from '~/ui/icons'
import { svgTrashCan } from '~/ui/icons/svg'

export interface SkillTreesListItemState {
  item: SkillBuildRecord
}

@Component({
  standalone: true,
  selector: 'nwb-skill-trees-list-item',
  templateUrl: './skill-trees-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class SkillTreesListItemComponent extends ComponentStore<SkillTreesListItemState> {

  @Input()
  public set item(value: SkillBuildRecord) {
    this.patchState({ item: value })
  }

  @Output()
  public create = new EventEmitter()

  private item$ = this.select(({ item }) => item)
  private abilities$ = this.select(this.item$, this.db.abilitiesMap, selectAbilities)
  protected trackByIndex = (i: number) => i
  protected deleteIcon = svgTrashCan

  protected vm$ = combineLatest({
    item: this.item$,
    abilities: this.abilities$
  })

  public constructor(private db: NwDbService) {
    super({ item: null })
  }

  protected abilityCategory(it: Ability) {
    return getAbilityCategoryTag(it)
  }
}

function selectAbilities(item: SkillBuildRecord, abilities: Map<string, Ability>) {
  const result = [
    ...(item?.tree1 || []),
    ...(item?.tree2 || []),
  ]
  .map((it) => abilities?.get(it))
  .filter((it) => it?.IsActiveAbility)

  while (result.length < 3) {
    result.push(null)
  }
  return result.map((ability) => {
    return {
      id: ability?.AbilityID,
      category: ability ? getAbilityCategoryTag(ability) : 'none',
      icon: ability?.Icon || NW_FALLBACK_ICON
    }
  })

}
