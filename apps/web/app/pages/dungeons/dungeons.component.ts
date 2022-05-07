import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DungeonsService } from './dungeons.service'

@Component({
  selector: 'nwb-dungeons',
  templateUrl: './dungeons.component.html',
  styleUrls: ['./dungeons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
})
export class DungeonsComponent {

  public get dungeon$() {
    return this.ds.dungeon$
  }

  public constructor(private ds: DungeonsService) {
    //
  }

}
