import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-character-sheet',
  templateUrl: './character-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content',
  },
})
export class CharacterSheetComponent {
  private char = inject(CharacterStore)
  protected name = this.char.name
  protected level = this.char.level
  //protected serverName = this.char.serverName
  //protected companyName = this.char.companyName
  //protected faction = this.char.faction
}
