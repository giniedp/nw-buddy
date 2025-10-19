import { Component, inject } from '@angular/core'
import { GatherableData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { gridDescriptor, PropertyGridCell, PropertyGridModule } from '../../../ui/property-grid'
import { linkCell, localizedCell, valueCell } from '../../../ui/property-grid/cells'
import { diffButtonCell } from '../../diff-tool'
import { GatherableDetailStore } from './gatherable-detail.store'

@Component({
  selector: 'nwb-gatherable-detail-stats',
  template: `
    @if (store.restriction(); as text) {
      <div class="flex flex-row gap-1">
        <span class="opacity-50">{{ text | nwHumanize }} </span>
      </div>
    }
    @if (store.requiredSkillLevel(); as level) {
      <div class="flex flex-row gap-1">
        <span class="opacity-50">Required skill level: </span>
        <span>{{ level }} {{ store.tradeSkill() }}</span>
      </div>
    }
    <div class="flex flex-row gap-1">
      <span class="opacity-50">Gather time: </span>
      <span>{{ store.baseGatherTime() }}</span>
    </div>
    <div class="flex flex-row gap-1">
      <span class="opacity-50">Min respawn rate: </span>
      <span>{{ store.minRespawnRate() }}</span>
    </div>
    <div class="flex flex-row gap-1">
      <span class="opacity-50">Max respawn rate: </span>
      <span>{{ store.maxRespawnRate() }}</span>
    </div>

    <ng-content select="[slot='start']" />

    <nwb-property-grid
      class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight mt-4"
      [item]="store.properties()"
      [descriptor]="descriptor"
    />

    <ng-content select="[slot='end']" />

    <ng-content />
  `,
  host: {
    class: 'flex flex-col',
  },
  imports: [NwModule, PropertyGridModule],
})
export class GatherableDetailStatsComponent {
  public readonly store = inject(GatherableDetailStore)
  protected descriptor = gridDescriptor<GatherableData>(
    {
      GatherableID: (value) => [
        ...gatherableLinkCell(value),
        diffButtonCell({ record: this.store.gatherable(), idKey: 'GatherableID' }),
      ],
      DisplayName: (value) => localizedCell({ value }),
      RequirementDescription: (value) => localizedCell({ value }),
      AdditionalInfo: (value) => localizedCell({ value }),
      DisplayDescription: (value) => localizedCell({ value }),
      FinalLootTable: (value) => lootTableLinkCell(value),
      GameEventID: (value) => gameEventLinkCell(value),
      AddedStatusEffect: (value) => statusEffectLinkCell(value),
      RequiredStatusEffect: (value) => statusEffectLinkCell(value),
      ConsumedStatusEffect: (value) => statusEffectLinkCell(value),
      // MinRespawnRate: (value) => ({ value: secondsToDuration(value) }),
      // MaxRespawnRate: (value) => ({ value: secondsToDuration(value) }),
      // BaseGatherTime: (value) => ({ value: secondsToDuration(value) }),
    },
    (value) => valueCell({ value }),
  )
}

function gatherableLinkCell(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return linkCell({ value: it, routerLink: ['gatherable', it] })
  })
}

function gameEventLinkCell(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return linkCell({ value: it, routerLink: ['game-event', it] })
  })
}

function lootTableLinkCell(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return linkCell({ value: it, routerLink: ['loot', it] })
  })
}

function statusEffectLinkCell(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return linkCell({ value: it, routerLink: ['status-effect', it] })
  })
}
