import { CommonModule } from '@angular/common'
import { Component, HostListener, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core'
import { ItemRarity, NW_FALLBACK_ICON, getAffixMODs, getItemIconPath, getItemId, getItemRarity } from '@nw-data/common'
import { PerkData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'
import { EmptyComponent } from '~/widgets/empty'
import { IconsModule } from '../../../ui/icons'
import { svgCircleExclamation } from '../../../ui/icons/svg'
import { PerkDetailDescriptionComponent } from '../perk-detail/perk-detail-description.component'
import { PerkDetailStore } from '../perk-detail/perk-detail.store'
import { PerkTableRecord } from './perk-table-cols'

@Component({
  selector: 'nwb-perk-grid-cell',
  template: `
    <nwb-item-header class="gap-2">
      <a [nwbItemIcon]="icon" [nwLinkTooltip]="['perk', perkId]" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content class="z-10" [title]="name | nwText | nwTextBreak: ' - '">
        @if (this.resourceName; as text) {
          <ng-container>
            <div header-title class="text-sm italic opacity-75">{{ text | nwText }}</div>
          </ng-container>
        }
        <div class="flex flex-row items-center gap-1 overflow-clip">
          @for (item of labels; track $index) {
            @if (item.text) {
              <span
                class="badge badge-sm flex-none"
                [class.badge-error]="item.isError"
                [class.badge-warning]="item.isWarning"
                [tooltip]="item.tooltip"
                [tooltipClass]="['bg-error', 'text-error-content']"
              >
                @if (item.text) {
                  {{ item.text }}
                }
              </span>
            } @else {
              <nwb-icon
                [icon]="item.icon"
                class="w-4 h-4 flex-none"
                [tooltip]="item.tooltip"
                [class.text-error]="item.isError"
                [class.text-warning]="item.isWarning"
                [tooltipClass]="['bg-warning', 'text-warning-content']"
              />
            }
          }
          <span class="flex-1"></span>
          @for (mod of mods; track $index) {
            @let isPrimary = mods.length === 1;
            <span
              class="badge badge-sm"
              [class.text-shadow-none]="isPrimary"
              [class.badge-primary]="isPrimary"
              [class.badge-secondary]="!isPrimary"
            >
              {{ mod | nwText }}
            </span>
          }
        </div>
        @if (resourceId) {
          <nwb-item-icon
            header-end
            [nwbItemIcon]="resourceIcon"
            [rarity]="resourceRarity"
            [solid]="true"
            [borderless]="true"
            class="w-10 h-10 rounded-full"
          />
        }
      </nwb-item-header-content>
    </nwb-item-header>
    <div class="p-2 text-xs">
      <nwb-perk-detail-description [preferBonus]="true" />
    </div>
  `,
  imports: [CommonModule, ItemFrameModule, PerkDetailDescriptionComponent, NwModule, TooltipModule, IconsModule],
  hostDirectives: [TooltipDirective],
  providers: [PerkDetailStore],
  host: {
    class: 'block rounded-md overflow-clip m-1 bg-black',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class PerkGridCellComponent implements VirtualGridCellComponent<PerkTableRecord>, OnInit {
  public static buildGridOptions(): VirtualGridOptions<PerkTableRecord> {
    return {
      height: 160,
      width: 320,
      cellDataView: PerkGridCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        if (!item) {
          return ''
        }
        const result: string[] = [
          tl8(item.DisplayName || item.SecondaryEffectDisplayName || ''),
          tl8(item.Description || ''),
        ]
        if (item.$items?.length) {
          result.push(tl8(item.$items[0]?.Name || ''))
        }
        const mods = item.$affixes
          ?.map(getAffixMODs)
          ?.flat()
          .map((it) => it.labelShort)
        result.push(...mods)
        return result.join(' ')
      },
    }
  }

  protected store = inject(PerkDetailStore)

  @Input()
  public selected: boolean

  @Input()
  public set data(value: PerkTableRecord) {
    this.store.load(value?.PerkID)
    this.name = value?.DisplayName || value?.SecondaryEffectDisplayName
    this.icon = value?.IconPath || NW_FALLBACK_ICON
    this.description = value?.Description
    this.type = value?.PerkType
    this.perk = value
    this.mods = value?.$affixes
      ?.map(getAffixMODs)
      ?.flat()
      .map((it) => it.labelShort)
    this.labels = selectLabels(value)
    const resource = value?.$items?.[0]
    this.resourceId = getItemId(resource)
    this.resourceIcon = getItemIconPath(resource)
    this.resourceName = resource?.Name
    this.resourceRarity = getItemRarity(resource)
  }

  protected perk: PerkData
  protected perkId: string
  protected name: string
  protected icon: string
  protected description: string
  protected type: string
  protected mods: string[]
  protected labels: Array<PerkLabel>
  protected resourceId: string
  protected resourceIcon: string
  protected resourceName: string
  protected resourceRarity: ItemRarity

  protected get ctx() {
    return this.context.forPerk(this.perk) as any
  }
  protected trackByIndex = (i: number) => i

  @ViewChild('tplTip', { static: true })
  protected tplTip: TemplateRef<any>

  public constructor(
    protected grid: VirtualGridComponent<PerkData>,
    protected context: NwTextContextService,
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

export interface PerkLabel {
  text: string
  icon: string
  tooltip: string
  isError: boolean
  isWarning: boolean
}
function selectLabels(perks: PerkTableRecord) {
  const labels = perks?.ExclusiveLabels || []
  const errorLabels = perks?.$exclusiveViolation || []

  const result = labels.map((it): PerkLabel => {
    const hasConflict = errorLabels.includes(it)
    return {
      text: it,
      isError: hasConflict,
      isWarning: false,
      tooltip: hasConflict ? 'This perk label conflicts with another perk on the item.' : null,
      icon: hasConflict ? svgCircleExclamation : null,
    }
  })
  if (perks?.$notAplicable) {
    result.unshift({
      text: null,
      isError: false,
      isWarning: true,
      tooltip: "Unrollable perk in this bucket or item configuration. You can still select it, if you don't care.",
      icon: svgCircleExclamation,
    })
  }
  return result
}
