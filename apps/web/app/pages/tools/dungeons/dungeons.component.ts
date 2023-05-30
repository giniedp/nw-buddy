import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { Gamemodes } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { shareReplayRefCount } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-dungeons',
  templateUrl: './dungeons.component.html',
  styleUrls: ['./dungeons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, NavToolbarModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
})
export class DungeonsComponent {
  protected dungeons$ = this.db.data
    .gamemodes()
    .pipe(map((list) => list.filter((it) => it.IsDungeon).sort((a, b) => a.RequiredLevel - b.RequiredLevel)))
    .pipe(shareReplayRefCount(1))

  protected activeItem: Gamemodes

  public constructor(private db: NwDbService) {
    //
  }

  protected activeChanged(active: boolean, item: Gamemodes) {
    this.activeItem = active ? item : this.activeItem
  }
}
