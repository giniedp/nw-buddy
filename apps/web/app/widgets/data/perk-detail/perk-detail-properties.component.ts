import { DecimalPipe } from '@angular/common'
import { Component, TemplateRef, inject, viewChild } from '@angular/core'
import { parseScalingPerGearScore } from '@nw-data/common'
import { AffixStatData, PerkData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, tagsCell, localizedCell, valueCell, textCell } from '~/ui/property-grid/cells'
import { PerkDetailStore } from './perk-detail.store'
import { PerkScalingPerGsGraphComponent } from './perk-scaling-per-gs-graph.component'
import { perkScalingCell } from './perk-scaling-cell.component'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail-properties',
  template: `
    <nwb-property-grid
      class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight"
      [item]="properties()"
      [descriptor]="perkDescriptor"
    />
    @if (affixProps(); as affix) {
      <nwb-item-divider />
      <nwb-property-grid
        class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight"
        [item]="affix"
        [descriptor]="affixDescriptor"
      />
    }
  `,
  imports: [NwModule, PropertyGridModule, ItemFrameModule, PerkScalingPerGsGraphComponent],
  host: {
    class: 'flex flex-col gap-2',
  },
})
export class PerkDetailPropertiesComponent {
  protected store = inject(PerkDetailStore)
  protected properties = this.store.properties
  protected affixProps = this.store.affixProps
  protected tplCategoryInfo = viewChild<TemplateRef<any>>('tplCategoryInfo')
  protected decimals = inject(DecimalPipe)

  public perkDescriptor = gridDescriptor<PerkData>(
    {
      PerkID: (value) => linkCell({ value: String(value), routerLink: ['perk', value] }),
      Affix: (value) => textCell({ value: String(value), textPrimary: true, fontItalic: true }),
      ItemClass: (value) => tagsCell({ value }),
      ExcludeItemClass: (value) => tagsCell({ value }),
      ExclusiveLabels: (value) => tagsCell({ value }),
      EquipAbility: (value) => value?.map((it) => linkCell({ value: it, routerLink: ['ability', it] })),
      ConditionEvent: (value) => tagsCell({ value }),
      StatDisplayText: (value) => localizedCell({ value }),
      SecondaryEffectDisplayName: (value) => localizedCell({ value }),
      AppliedSuffix: (value) => localizedCell({ value }),
      AppliedPrefix: (value) => localizedCell({ value }),
      ItemPerkConflictsLocText: (value) => localizedCell({ value }),
      ScalingPerGearScore: (value) => perkScalingCell({ value, bonus: this.store.itemClassGsBonus()?.value }),
      ScalingPerGearScoreAttributes: (value) => perkScalingCell({ value, bonus: this.store.itemClassGsBonus()?.value }),
    },
    (value) => valueCell({ value }),
  )

  public affixDescriptor = gridDescriptor<AffixStatData>(
    {
      StatusID: (value) => textCell({ value, textPrimary: true, fontItalic: true }),
      StatusEffect: (value) => statusEffectCells(value),
    },
    (value) => valueCell({ value }),
  )
}

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    const isLink = it !== 'All'
    return linkCell({ value: it, routerLink: isLink ? ['status-effect', it] : null })
  })
}
