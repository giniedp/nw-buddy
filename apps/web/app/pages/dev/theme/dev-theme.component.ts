import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NwModule } from '~/nw'
import { createWorker } from 'tesseract.js'
import { defer, fromEvent, map } from 'rxjs'
import { shareReplayRefCount } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-dev-theme',
  templateUrl: './dev-theme.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content',
  },
})
export class DevThemeComponent {
  public constructor() {
    //
  }
}
