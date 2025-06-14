import { Component, computed, effect, input } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { AttributeRef } from '@nw-data/common'
import { AttributeDefinition } from '@nw-data/generated'
import { combineLatest, from, map } from 'rxjs'
import { injectNwData } from '../../data'
import { NwModule } from '../../nw'

@Component({
  selector: 'nwb-checkpoint-tip',
  template: `
    <div [class.text-success]="total() >= points()">
      @for (item of tips(); track $index) {
        <span [nwHtml]="item.Description | nwText | nwTextBreak"></span>
      }
    </div>
    <div class="nw-item-divider my-3"></div>
    <div>{{ 'ui_attributemodifier_required_points' | nwText }} {{ points() }}</div>
  `,
  imports: [NwModule],
  host: {
    class: 'block w-80 p-3'
  }
})
export class CheckpointTipComponent {
  private db = injectNwData()
  public ref = input<AttributeRef>()
  public points = input<number>(0)
  public total = input<number>(0)

  public resource = rxResource({
    params: this.ref,
    stream: ({ params }) => {
      return combineLatest({
        abilities: this.db.abilitiesByIdMap(),
        levels: this.abilitiesLevels(params),
      })
    },
  })

  public tips = computed(() => {
    const data = this.resource.value()
    if (!data) {
      return []
    }
    const abilities = data.abilities
    const levels = data.levels
    const points = this.points()
    const ids = levels.find((it) => it.Level === points)?.EquipAbilities || []
    return ids.map((id) => {
      const ability = abilities.get(id)
      return {
        Name: ability.DisplayName,
        Description: ability.Description,
        Icon: ability.Icon,
      }
    })
  })

  private async attrLevels(ref: AttributeRef): Promise<AttributeDefinition[]> {
    switch (resolveShortType(ref)) {
      case 'con':
        return this.db.attrCon()
      case 'str':
        return this.db.attrStr()
      case 'foc':
        return this.db.attrFoc()
      case 'int':
        return this.db.attrInt()
      case 'dex':
        return this.db.attrDex()
      default:
        return []
    }
  }

  private abilitiesLevels(ref: AttributeRef) {
    return from(this.attrLevels(ref)).pipe(
      map((table) => {
        return table
          .filter((it) => it.EquipAbilities?.length)
          .map((it) => ({
            Level: it.Level,
            EquipAbilities: it.EquipAbilities,
          }))
      }),
    )
  }
}

function resolveShortType(type: string) {
  if (!type) {
    return null
  }
  if (type.length !== 3) {
    type = type.substring(0, 3)
  }
  return type.toLowerCase()
}
