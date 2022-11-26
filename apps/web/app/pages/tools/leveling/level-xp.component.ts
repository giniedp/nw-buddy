import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CharacterStore } from '~/data'
import { LevelInputModule } from '~/ui/level-input'
import { XpTableModule } from '~/widgets/xp-table'

@Component({
  standalone: true,
  selector: 'nwb-level-xp-page',
  templateUrl: './level-xp.component.html',
  imports: [CommonModule, XpTableModule, LevelInputModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block layout-pad',
  },
})
export class LevelXpComponent {

  protected level$ = this.char.level$

  public constructor(private char: CharacterStore) {

  }

  protected updateLevel(value: number) {
    this.char.updateLevel({ level: value })
  }
}
