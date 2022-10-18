import { CommonModule } from '@angular/common'
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { ScreenshotModule } from '~/widgets/screenshot'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'

@Component({
  standalone: true,
  selector: 'nwb-vitals-families',
  templateUrl: './vitals-families.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, VitalsFamiliesModule, ScreenshotModule],
  host: {
    class: 'layout-row bg-base-300',
  },
})
export class VitalsFamiliesComponent {}
