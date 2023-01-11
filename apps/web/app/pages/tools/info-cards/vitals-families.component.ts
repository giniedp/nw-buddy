import { CommonModule } from '@angular/common'
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { HtmlHeadService } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { VitalsDetailModule } from '~/widgets/vitals-detail'

@Component({
  standalone: true,
  selector: 'nwb-vitals-families',
  template: `
    <div [nwbScreenshotFrame]="'Vitals-Families'" class="mb-20 content-auto">
      <nwb-vitals-families-list></nwb-vitals-families-list>
      <nwb-vitals-dungeon-bosses></nwb-vitals-dungeon-bosses>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, VitalsDetailModule, ScreenshotModule],
  host: {
    class: 'layout-content layout-pad',
  },
})
export class VitalsFamiliesComponent {
  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Creature families',
      description: 'Overview of all creature families in New World and Expeditions.',
    })
  }
}
