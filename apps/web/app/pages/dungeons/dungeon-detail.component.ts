import { Component, OnInit, ChangeDetectionStrategy, HostBinding, ChangeDetectorRef } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { defer, map, switchMap, takeUntil, tap } from 'rxjs'
import { NwService } from '~/core/nw'
import { DestroyService, observeRouteParam, shareReplayRefCount } from '~/core/utils'
import { DungeonsService } from './dungeons.service'

@Component({
  selector: 'nwb-dungeon-detail',
  templateUrl: './dungeon-detail.component.html',
  styleUrls: ['./dungeon-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class DungeonDetailComponent implements OnInit {
  public dungeonId$ = defer(() => observeRouteParam(this.route, 'id'))

  public dungeon$ = defer(() => this.dungeonId$)
    .pipe(switchMap((id) => this.ds.dungeon(id)))
    .pipe(shareReplayRefCount(1))

  public dungeonDrops$ = defer(() => this.dungeon$)
    .pipe(switchMap((dungeon) => this.ds.dungeonLoot(dungeon)))
    .pipe(map((items) => items.filter((it) => this.nw.itemRarity(it) >= 2)))

  public dungeonName$ = defer(() => this.dungeon$.pipe(map((it) => it.DisplayName)))
  public dungeonIcon$ = defer(() => this.dungeon$.pipe(map((it) => it.IconPath)))
  public dungeonImage$ = defer(() => this.dungeon$.pipe(map((it) => it.BackgroundImagePath)))

  public backgroundImage: string
  public difficulties$ = defer(() => this.dungeon$).pipe(switchMap((it) => this.ds.dungeonDifficulties(it)))

  public constructor(
    private nw: NwService,
    private ds: DungeonsService,
    private route: ActivatedRoute,
    private destroy: DestroyService,
    private cdRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {

  }

  public itemId(item: ItemDefinitionMaster | Housingitems) {
    return this.nw.itemId(item)
  }
}
