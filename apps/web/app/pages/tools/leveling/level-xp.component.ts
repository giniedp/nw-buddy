import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CharacterPreferencesService } from '~/preferences'
import { LevelInputModule } from '~/ui/level-input'
import { XpTableModule } from '~/widgets/xp-table'

@Component({
  standalone: true,
  selector: 'nwb-level-xp-page',
  templateUrl: './level-xp.component.html',
  imports: [CommonModule, XpTableModule, LevelInputModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-col layout-pad',
  },
})
export class LevelXpComponent {

  protected get level() {
    return this.pref.level.value
  }

  protected set level(value: number) {
    this.pref.level.value = Math.min(60, value)
  }

  public constructor(private pref: CharacterPreferencesService) {

  }
}
