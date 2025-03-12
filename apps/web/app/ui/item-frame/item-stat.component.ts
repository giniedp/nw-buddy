import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { NwModule } from '~/nw'

@Component({
  selector: 'nwb-item-stat',
  template: `
    <img [nwImage]="icon" *ngIf="icon" class="w-4 h-4" />
    <span class="font-bold">{{ label }} </span>
    <span class="opacity-50"> <ng-content></ng-content></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
  },
})
export class ItemStatComponent {
  @Input()
  public icon: string

  @Input()
  public label: string | number

  public constructor() {
    //
  }
}
