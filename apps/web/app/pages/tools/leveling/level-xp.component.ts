import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { CharacterStore } from '~/data'
import { LayoutModule } from '~/ui/layout'
import { LevelInputModule } from '~/ui/level-input'
import { injectRouteParam } from '~/utils'
import { XpTableModule } from '~/widgets/xp-table'

@Component({
  selector: 'nwb-level-xp-page',
  templateUrl: './level-xp.component.html',
  imports: [
    CommonModule,
    XpTableModule,
    LevelInputModule,
    LayoutModule,
    FormsModule,
    IonSegment,
    IonSegmentButton,
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ion-page',
  },
})
export class LevelXpComponent {
  protected char = inject(CharacterStore)
  protected level = this.char.level
  protected tab = toSignal(injectRouteParam('tab'))

  protected updateLevel(value: number) {
    this.char.update(this.char.record().id, { level: value })
  }
}
