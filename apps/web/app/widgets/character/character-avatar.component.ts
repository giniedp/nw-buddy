import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-character-avatar',
  template: ` <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"></div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'inline avatar',
  },
})
export class CharacterAvatarComponent {
  private char = inject(CharacterStore)
  protected name = this.char.name
  //protected imageUrl = this.char.imageUrl
}
