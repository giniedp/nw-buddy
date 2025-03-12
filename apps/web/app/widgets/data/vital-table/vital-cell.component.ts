import { CommonModule } from '@angular/common'
import { Component, HostListener, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON, getVitalCategoryInfo, getVitalHealth, getVitalTypeMarker } from '@nw-data/common'
import { switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'
import { selectSignal } from '~/utils'
import { EmptyComponent } from '~/widgets/empty'
import { VitalTableRecord } from './vital-table-cols'

@Component({
  selector: 'nwb-vital-grid-cell',
  template: `
    @if (familyIcon; as icon) {
      <a class="absolute left-1" [nwLinkTooltip]="['vitals', vitalId]">
        <img [nwImage]="icon" class="w-12 h-12" />
      </a>
    }
    <a
      class="flex flex-row uppercase text-sm font-serif items-center gap-1 hover:underline leading-none"
      [routerLink]="['vitals', vitalId] | nwLink"
    >
      <span>{{ vitalName | nwText }}</span>
    </a>
    <div
      class="w-52 flex flex-row items-center justify-center leading-none border border-error-content rounded-sm bg-gradient-to-r from-red-600 via-red-950 to-red-600 font-nimbus font-bold text-center text-xs shadow-black text-shadow-sm"
    >
      {{ health() | number: '1.0-0' }}
    </div>
    <div class="relative flex items-center justify-center -mt-4 pointer-events-none">
      <img [nwImage]="typeMarker" class="h-10 w-36 object-cover" />
      <span class="absolute top-2 mx-auto text-shadow-sm shadow-black pointer-events-auto">
        {{ vitalLevel }}
      </span>
    </div>
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule, RouterModule],
  hostDirectives: [TooltipDirective],
  host: {
    class: 'relative flex flex-col items-center justify-center p-2 rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class VitalGridCellComponent
  extends ComponentStore<{ vital: VitalTableRecord }>
  implements VirtualGridCellComponent<VitalTableRecord>
{
  public static buildGridOptions(): VirtualGridOptions<VitalTableRecord> {
    return {
      height: 75,
      width: 320,
      cellDataView: VitalGridCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return tl8(item.DisplayName)
      },
    }
  }

  @Input()
  public selected: boolean

  @Input()
  public set data(value: VitalTableRecord) {
    this.patchState({ vital: value })
  }
  public get data() {
    return this.state()?.vital
  }

  private db = injectNwData()
  protected vital$ = this.select(({ vital }) => vital)
  protected vitalId$ = this.select(({ vital }) => vital?.VitalsID)
  protected vitalLevel$ = this.select(({ vital }) => vital?.Level)
  protected levelData$ = this.vitalLevel$.pipe(switchMap((it) => this.db.vitalsLevelsByLevel(it)))
  protected creatureType$ = this.select(({ vital }) => vital?.CreatureType)
  protected modifier$ = this.creatureType$.pipe(switchMap((it) => this.db.vitalsModifiersById(it)))
  readonly health = selectSignal(
    {
      vital: this.vital$,
      level: this.levelData$,
      modifier: this.modifier$,
    },
    (data) => getVitalHealth(data),
  )

  public get vitalId() {
    return this.data.VitalsID
  }

  public get vitalName() {
    return this.data.DisplayName
  }

  public get vitalLevel() {
    return this.data.Level
  }
  public get typeMarker() {
    return getVitalTypeMarker(this.data)
  }

  public get familyIcon() {
    return getVitalCategoryInfo(this.data)?.[0]?.IconBane
  }

  protected icon = NW_FALLBACK_ICON
  public constructor(
    protected grid: VirtualGridComponent<VitalTableRecord>,
    protected context: NwTextContextService,
  ) {
    super({ vital: null })
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onEvent(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
