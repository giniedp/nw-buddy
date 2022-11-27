import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-item-gs',
  template: `
    <span [class.line-through]="!!actual" [class.opacity-50]="!!actual">{{ value }}</span>
    <span *ngIf="actual"> {{ actual }}</span>
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'inline font-caslon',
  },
})
export class ItemGsComponent {
  @Input()
  public value: string | number

  @Input()
  public actual: string | number

  public constructor() {
    //
  }
}
