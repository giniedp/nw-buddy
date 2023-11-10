import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonContent, IonHeader } from '@ionic/angular/standalone'
import { QuicksearchModule } from '~/ui/quicksearch'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-leveling-page',
  templateUrl: './leveling.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, QuicksearchModule, ScreenshotModule, IonHeader, IonContent],
  host: {
    class: 'layout-col',
  },
})
export class LevelingComponent {
  //
}
