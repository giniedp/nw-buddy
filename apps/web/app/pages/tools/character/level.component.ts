import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { CharacterStore } from '~/data'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { LevelInputModule } from '~/ui/level-input'
import { XpTableModule } from '~/widgets/xp-table'

@Component({
  selector: 'nwb-level-page',
  templateUrl: './level.component.html',
  imports: [CommonModule, XpTableModule, LevelInputModule, LayoutModule, FormsModule, RouterModule, IconsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ion-page',
  },
})
export class LevelXpComponent {
  protected char = inject(CharacterStore)
  protected level = this.char.level
  protected infoIcon = svgInfoCircle

  protected updateLevel(value: number) {
    this.char.update({ level: value })
  }
}
