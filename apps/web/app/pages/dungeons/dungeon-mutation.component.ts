import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, defer, map, switchMap } from 'rxjs'
import { NwService } from '~/core/nw'
import { observeRouteParam, shareReplayRefCount } from '~/core/utils'
import { DungeonDetailComponent } from './dungeon-detail.component'
import { DungeonsService } from './dungeons.service'

@Component({
  selector: 'nwb-dungeon-mutation',
  templateUrl: './dungeon-mutation.component.html',
  styleUrls: ['./dungeon-mutation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DungeonMutationComponent implements OnInit {
  public difficultyLevel$ = defer(() => observeRouteParam(this.route, 'id').pipe(map(Number)))

  public dungeon$ = defer(() => this.parent.dungeon$)

  public difficulty$ = defer(() =>
    combineLatest({
      difficulties: this.parent.difficulties$,
      level: this.difficultyLevel$,
    })
  )
    .pipe(map(({ difficulties, level }) => this.ds.mutationDifficulty(difficulties, level)))
    .pipe(shareReplayRefCount(1))

  public lootItem$ = defer(() =>
    combineLatest({
      dungeon: this.parent.dungeon$,
      difficulty: this.difficulty$,
    })
  )
    .pipe(switchMap(({ dungeon, difficulty }) => this.ds.mutationLoot(dungeon, difficulty)))
    .pipe(shareReplayRefCount(1))

  public constructor(
    private nw: NwService,
    private route: ActivatedRoute,
    private ds: DungeonsService,
    private parent: DungeonDetailComponent
  ) {}

  public ngOnInit(): void {}

  public itemId(item: ItemDefinitionMaster | Housingitems) {
    return this.nw.itemId(item)
  }
}
