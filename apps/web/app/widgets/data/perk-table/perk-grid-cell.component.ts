import { CommonModule } from '@angular/common'
import { Component, HostListener, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core'
import { NW_FALLBACK_ICON, getAffixMODs } from '@nw-data/common'
import { PerkData } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'
import { EmptyComponent } from '~/widgets/empty'
import { PerkDetailDescriptionComponent } from '../perk-detail/perk-detail-description.component'
import { PerkDetailStore } from '../perk-detail/perk-detail.store'
import { PerkTableRecord } from './perk-table-cols'

@Component({
  standalone: true,
  selector: 'nwb-perk-grid-cell',
  template: `
    <nwb-item-header class="gap-2">
      <a [nwbItemIcon]="icon" [nwLinkTooltip]="['perk', perkId]" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content class="z-10" [title]="name | nwText | nwTextBreak: ' - '">
        <div class="flex flex-col">
          <span class="text-xs">perk</span>
          <div class="flex flex-row justify-between items-center">
            <span>{{ type }}</span>
            <div class="flex flex-row items-center gap-1">
              <span *ngFor="let item of exclusiveLabels" class="badge badge-sm" [class.badge-error]="item.isError">
                {{ item.label }}</span
              >
              <span>{{ mods | nwText }}</span>
            </div>
          </div>
        </div>
      </nwb-item-header-content>
    </nwb-item-header>
    <ng-template #tplTip>
      <nwb-perk-detail-description />
    </ng-template>
  `,
  imports: [CommonModule, ItemFrameModule, PerkDetailDescriptionComponent, NwModule, TooltipModule],
  hostDirectives: [TooltipDirective],
  providers: [PerkDetailStore],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class PerkGridCellComponent implements VirtualGridCellComponent<PerkTableRecord>, OnInit {
  public static buildGridOptions(): VirtualGridOptions<PerkTableRecord> {
    return {
      height: 90,
      width: 320,
      cellDataView: PerkGridCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        const mods = getAffixMODs(item?.$affix).map((it) => it.labelShort)
        const name = tl8(item?.DisplayName || item?.SecondaryEffectDisplayName || '')
        return [name, ...mods].join(' ')
      },
    }
  }

  protected store = inject(PerkDetailStore)

  @Input()
  public selected: boolean

  @Input()
  public set data(value: PerkTableRecord) {
    this.store.load({ perkId: value?.PerkID })
    this.name = value?.DisplayName || value?.SecondaryEffectDisplayName
    this.icon = value?.IconPath || NW_FALLBACK_ICON
    this.description = value?.Description
    this.type = value?.PerkType
    this.perk = value
    this.mods = getAffixMODs(value?.$affix).map((it) => it.labelShort)
    this.exclusiveLabels = resolveExclusiveLabels(value)
  }

  protected perk: PerkData
  protected perkId: string
  protected name: string
  protected icon: string
  protected description: string
  protected type: string
  protected mods: string[]
  protected exclusiveLabels: Array<{ label: string; isError: boolean }>
  protected get ctx() {
    return this.context.forPerk(this.perk) as any
  }
  protected trackByIndex = (i: number) => i

  @ViewChild('tplTip', { static: true })
  protected tplTip: TemplateRef<any>

  public constructor(
    protected grid: VirtualGridComponent<PerkData>,
    protected context: NwTextContextService,

    protected db: NwDataService,
    protected tip: TooltipDirective,
  ) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onEvent(e: Event) {
    this.grid.handleItemEvent(this.perk, e)
  }

  public ngOnInit() {
    this.tip.tooltip = this.tplTip
    this.tip.tooltipDelay = 0
  }
}

function resolveExclusiveLabels(perks: PerkData) {
  const labels = perks?.ExclusiveLabels || []
  const errorLabels = extractExclusionError(perks) || []
  return labels.map((it) => {
    const isError = errorLabels.includes(it)
    return { label: it, isError }
  })
}
function extractExclusionError(perks: PerkData): string[] {
  if ('$excludeError' in perks && Array.isArray(perks.$excludeError) && perks.$excludeError.length > 0) {
    return perks.$excludeError
  }
  return null
}
