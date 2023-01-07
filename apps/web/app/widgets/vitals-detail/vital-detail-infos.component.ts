import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Vitals, Vitalsleveldata, Vitalsmodifierdata } from '@nw-data/types'
import { NwModule } from '~/nw'
import { PropertyGridModule } from '~/ui/property-grid'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-infos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, PropertyGridModule],
  host: {
    class: 'relative bg-base-200',
  },
  template: `
   <nwb-property-grid [item]="level"></nwb-property-grid>
   <nwb-property-grid [item]="modifier"></nwb-property-grid>
  `,
})
export class VitalDetailInfosComponent {
  @Input()
  public vital: Vitals

  @Input()
  public level: Vitalsleveldata

  @Input()
  public modifier: Vitalsmodifierdata
}
