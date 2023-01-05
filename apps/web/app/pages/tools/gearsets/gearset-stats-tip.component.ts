import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'

export interface ExplainItem {
  icon?: string
  label: string[] | string
  count: number
  value: number
  percent: number
}

@Component({
  standalone: true,
  selector: 'nwb-explain-tip',
  template: `
    <div class="p-2 bg-base-200 rounded-md shadow">
      <ng-content></ng-content>
      <table class="text-sm text-right">
        <tr *ngFor="let mod of data; let isFirst = first">
          <td class="px-1">
            <img [nwImage]="mod.icon" *ngIf="mod.icon" class="w-6 h-6" />
          </td>
          <td class="px-1">
            <span class="whitespace-nowrap">
              {{ mod.label | nwText }}
            </span>
          </td>
          <td>{{ mod.count }} &times;</td>
          <td class="text-right font-mono px-1">
            <ng-container *ngIf="mod.value">{{ mod.value | number: '0.1-1' }}</ng-container>
            <ng-container *ngIf="mod.percent">{{ mod.percent | percent: '0.1-1' }}</ng-container>
          </td>
        </tr>
      </table>
    </div>
  `,
  imports: [NwModule, CommonModule],
})
export class ExplainTooltip {
  @Input()
  data: ExplainItem[]
}
