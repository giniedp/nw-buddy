import { Component, HostListener, input, signal } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { ComponentInputs, PropertyGridCell } from '../property-grid-cell.directive'

export function localizedCell(options: ComponentInputs<LocalizedCellComponent>): PropertyGridCell {
  return {
    value: String(options.value || ''),
    component: LocalizedCellComponent,
    componentInputs: options,
  }
}

@Component({
  selector: 'nwb-text-cell',
  template: `
    <nwb-icon [icon]="iconInfo" class="cursor-help w-3 h-3" [tooltip]="tplInfo" />
    <span class="truncate">{{ value() }}</span>
    <ng-template #tplInfo>
      <div [nwHtml]="value() | nwText | nwTextBreak" class="font-nimbus text-nw-description px-2 py-1"></div>
    </ng-template>
  `,
  host: {
    class: 'inline-flex items-center gap-1',
  },
  imports: [NwModule, TooltipModule, IconsModule],
})
export class LocalizedCellComponent {
  public value = input<string>()
  protected showTranslation = signal(false)
  protected iconInfo = svgInfoCircle

  @HostListener('click')
  protected toggleMode() {
    this.showTranslation.set(!this.showTranslation())
  }
}
