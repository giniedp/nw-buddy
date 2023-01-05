import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { ExplainItem, ExplainTooltip } from './gearset-stats-tip.component'

export interface StatEntry {
  key: string
  label: string[] | string
  value: number
  percent: number
  icon?: string
  explain?: ExplainItem[]
}

@Component({
  standalone: true,
  selector: 'nwb-stats-grid',
  template: `
    <ng-container *ngFor="let group of data; let isFirst = first">
      <ng-container *ngIf="group.length === 1">
        <span class="w-16 text-right font-bold">
          <ng-container *ngIf="group[0].percent">+{{ group[0].percent | percent: '0.0-1' }}</ng-container>
          <ng-container *ngIf="group[0].value">{{ group[0].value | number: '0.0-2' }}</ng-container>
        </span>
        <div class="opacity-50 flex flex-row items-center" [tooltip]="tplEmpTip">
          <img *ngIf="group[0].icon" [nwImage]="group[0].icon" class="w-6 h-6" />
          <span> {{ group[0].label | nwText }} </span>
        </div>
        <ng-template #tplEmpTip>
          <nwb-explain-tip [data]="group[0].explain"></nwb-explain-tip>
        </ng-template>
      </ng-container>
      <ng-container *ngIf="group.length > 1">
        <span class="w-16 text-right font-bold">
          <ng-container *ngIf="group[0].percent">+{{ group[0].percent | percent: '0.0-1' }}</ng-container>
          <ng-container *ngIf="group[0].value">{{ group[0].value | number: '0.0-2' }}</ng-container>
        </span>
        <div class="opacity-50 flex flex-row items-center">
          <ng-container *ngFor="let row of group">
            <img *ngIf="row.icon" [nwImage]="row.icon" [tooltip]="tplEmpTip" class="w-6 h-6" />
            <ng-template #tplEmpTip>
              <nwb-explain-tip [data]="row.explain">
                {{ row.label | nwText }}
              </nwb-explain-tip>
            </ng-template>
          </ng-container>
        </div>
      </ng-container>
    </ng-container>
  `,
  imports: [NwModule, CommonModule, ExplainTooltip, TooltipModule],
  host: {
    class: 'contents',
  },
})
export class GearsetStatsGridComponent {
  @Input()
  data: StatEntry[][]
}
