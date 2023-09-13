import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Mounts } from '@nw-data/generated'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-mount-tile,a[nwbMountTile]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <picture class="block w-full aspect-[5/4] relative">
      <img class="w-full h-full object-cover" [nwImage]="icon" />
    </picture>
  `,
  imports: [CommonModule, NwModule],
  host: {
    class: 'd-block relative overflow-hidden',
  },
})
export class MountTileComponent {
  @Input()
  public set nwbMountTile(value: Mounts) {
    this.item = value
  }

  @Input()
  public set item(value: Mounts) {
    this.icon = value?.MTXIconPath || value?.IconPath || NW_FALLBACK_ICON
  }

  protected icon: string

  public constructor() {
    //
  }
}
