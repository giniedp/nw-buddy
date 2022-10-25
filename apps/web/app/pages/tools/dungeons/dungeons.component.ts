import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { Gamemodes } from '@nw-data/types'
import { NwModule } from '~/nw'
import { NavToobalModule } from '~/ui/nav-toolbar'
import { DungeonsService } from './dungeons.service'

@Component({
  standalone: true,
  selector: 'nwb-dungeons',
  templateUrl: './dungeons.component.html',
  styleUrls: ['./dungeons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, NavToobalModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
})
export class DungeonsComponent {

  public get dungeon$() {
    return this.ds.dungeon$
  }

  protected activeItem: Gamemodes

  public constructor(private ds: DungeonsService) {
    //
  }

  protected activeChanged(active: boolean, item: Gamemodes) {
    this.activeItem = active ? item : this.activeItem
  }
}
