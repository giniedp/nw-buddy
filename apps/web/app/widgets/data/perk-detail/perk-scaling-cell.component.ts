import { Component, computed, input } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ComponentInputs, PropertyGridCell } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { PerkScalingPerGsGraphComponent } from './perk-scaling-per-gs-graph.component'
import { parseScalingPerGearScore } from '@nw-data/common'
import { CommonModule } from '@angular/common'

export function perkScalingCell(options: ComponentInputs<PerkScalingCellComponent>): PropertyGridCell {
  return {
    value: String(options.value || ''),
    component: PerkScalingCellComponent,
    componentInputs: options,
  }
}

@Component({
  selector: 'nwb-perk-scaling-cell',
  template: `
    <nwb-icon [icon]="iconInfo" class="cursor-help w-3 h-3" [popover]="tplInfo" />
    <span>
      @for (step of scaling(); track $index; let first = $first) {
        <span class="font-mono text-success">
          @if (first) {
            {{ step.scaling | number: '0.0-7' }}
          } @else {
            {{ step.scaling | number: '0.0-7' }}:{{ step.score }}
          }
        </span>
      }
    </span>
    <ng-template #tplInfo>
      <div class="bg-base-300 p-2 w-[100vw] max-w-3xl">
        <nwb-perk-scaling-per-gs-graph [data]="value()" [bonus]="bonus()" class="w-full h-full" />
      </div>
    </ng-template>
  `,
  host: {
    class: 'inline-flex items-center gap-1',
  },
  imports: [CommonModule, NwModule, TooltipModule, IconsModule, PerkScalingPerGsGraphComponent],
})
export class PerkScalingCellComponent {
  public value = input<string>()
  public bonus = input<number>()
  protected scaling = computed(() => parseScalingPerGearScore(this.value()))
  protected iconInfo = svgInfoCircle
}
