import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { CharactersService, CharacterStore } from '../../../data'
import { LayoutModule } from '../../../ui/layout'
import { CharacterAvatarComponent } from '../../../widgets/character'

@Component({
  selector: 'nwb-character-page',
  templateUrl: './character.component.html',
  host: {
    class: 'ion-page',
  },
  imports: [LayoutModule, RouterModule, CharacterAvatarComponent],
})
export class CharacterPageController {
  private store = inject(CharacterStore)
  protected character = this.store.record
}
