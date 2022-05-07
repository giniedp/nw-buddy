import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types';
import { defer, map, switchMap } from 'rxjs';
import { NwService } from '~/core/nw';
import { DungeonDetailComponent } from './dungeon-detail.component';
import { DungeonsService } from './dungeons.service';

@Component({
  selector: 'nwb-dungeon-loot',
  templateUrl: './dungeon-loot.component.html',
  styleUrls: ['./dungeon-loot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DungeonLootComponent implements OnInit {

  public dungeon$ = defer(() => this.parent.dungeon$)
  public dungeonDrops$ = defer(() => this.dungeon$)
    .pipe(switchMap((it) => this.ds.dungeonLoot(it)))
    .pipe(map((items) => {
      return items
        .filter((it) => this.nw.itemRarity(it) >= 1)
        .sort((a, b) => this.nw.itemRarity(b) - this.nw.itemRarity(a))
    }))

  public constructor(
    private nw: NwService,

    private ds: DungeonsService,
    private parent: DungeonDetailComponent
  ) {}

  public ngOnInit(): void {}

  public itemId(item: ItemDefinitionMaster | Housingitems) {
    return this.nw.itemId(item)
  }
}
