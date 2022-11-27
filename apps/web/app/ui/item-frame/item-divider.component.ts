import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-item-divider',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block nw-item-divider opacity-50',
  },
})
export class ItemDividerComponent {}
