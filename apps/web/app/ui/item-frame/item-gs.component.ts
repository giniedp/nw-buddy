import { ChangeDetectionStrategy, Component, input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-item-gs',
  template: `
    <span [class.line-through]="!!actual()" [class.opacity-50]="!!actual()">{{ value() }}</span>
    @if (actual()) {
      <span> {{ actual() }}</span>
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline font-caslon',
  },
})
export class ItemGsComponent {
  public value = input<string | number>()
  public actual = input<string | number>()
}
