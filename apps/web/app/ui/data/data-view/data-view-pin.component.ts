import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core'

import { toSignal } from '@angular/core/rxjs-interop'
import { firstValueFrom } from 'rxjs'
import { AgGrid, fromGridEvent } from '~/ui/data/ag-grid'
import { IconsModule } from '~/ui/icons'
import { svgThumbtack } from '~/ui/icons/svg'
import { selectStream } from '~/utils'
import { gridGetPinnedTopRows } from '../ag-grid/utils'
import { DataViewService } from './data-view.service'
import { TooltipModule } from '~/ui/tooltip'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'

@Component({
  selector: 'nwb-data-view-pin,[nwbDataViewPin]',
  template: ` <nwb-icon [icon]="svgPin" class="w-5 h-5 transition-transform" [class.rotate-45]="!isPinned$()" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule, TooltipModule],
  hostDirectives: [TooltipDirective],
  host: {
    class: '',
    '[disabled]': '!isEnabled$()',
    '[class.text-primary]': 'isPinned$()',
  },
})
export class DataViewPinComponent {
  @Input()
  public nwbDataViewPin: void

  protected grid$ = selectStream(this.service.agGrid$)
  protected pinnedItems$ = selectStream(fromGridEvent(this.grid$, 'pinnedRowDataChanged'), selectPinnedItems)
  protected selectedItem$ = selectStream(fromGridEvent(this.grid$, 'selectionChanged'), selectSelectedItem)
  protected isPinned$ = toSignal(
    selectStream(
      {
        pinned: this.pinnedItems$,
        item: this.selectedItem$,
      },
      ({ pinned, item }) => selectPinnedState(pinned, item),
    ),
    {
      initialValue: false,
    },
  )

  protected isEnabled$ = toSignal(
    selectStream(this.selectedItem$, (item) => !!item),
    { initialValue: false },
  )

  protected svgPin = svgThumbtack

  public constructor(
    protected service: DataViewService<unknown>,
    protected tip: TooltipDirective,
  ) {
    tip.tooltipContext = 'Pin/Unpin selected item'
  }

  @HostListener('click')
  public async onClick() {
    const item = await firstValueFrom(this.selectedItem$)
    if (!item) {
      return
    }
    const pinned = await firstValueFrom(this.pinnedItems$)
    const grid = await firstValueFrom(this.grid$)
    if (this.isPinned$()) {
      grid.api.setGridOption(
        'pinnedTopRowData',
        (pinned || []).filter((it) => it !== item),
      )
    } else {
      grid.api.setGridOption('pinnedTopRowData', [...(pinned || []), item])
    }
  }
}

function selectSelectedItem({ api }: AgGrid) {
  return api.getSelectedRows()?.[0]
}

function selectPinnedItems({ api }: AgGrid) {
  return gridGetPinnedTopRows(api)?.map((it) => it.data)
}

function selectPinnedState(pinned: any[], selected: any) {
  return pinned?.some((a) => a === selected)
}
