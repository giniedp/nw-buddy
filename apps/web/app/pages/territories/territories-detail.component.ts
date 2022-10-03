import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DestroyService } from '~/utils'

@Component({
  selector: 'nwb-territories-detail',
  templateUrl: './territories-detail.component.html',
  styleUrls: ['./territories-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class TerritoriesDetailComponent {
  //
}
