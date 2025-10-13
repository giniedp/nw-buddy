import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NwModule } from '~/nw'

@Component({
  selector: 'nwb-item-stat',
  template: `
    @if (icon()) {
      <img [nwImage]="icon()" class="w-4 h-4" />
    }
    <span class="font-bold">{{ label() }} </span>
    <span class="opacity-50"> <ng-content /></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule],
  host: {
    class: 'block',
  },
})
export class ItemStatComponent {
  public icon = input<string>()
  public label = input<string | number>()
}
