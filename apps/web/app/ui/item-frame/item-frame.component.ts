import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'

@Component({
  selector: 'nwb-item-frame',
  template: `
    <div class="nw-item-frame-content flex flex-col flex-1">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block nw-item-frame flex flex-col',
  },
})
export class ItemFrameComponent {
  //
}
