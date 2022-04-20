import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Gamemodes } from '@nw-data/types';
import { map, Subject, takeUntil } from 'rxjs';
import { NwService } from '~/core/nw';

@Component({
  selector: 'nwb-dungeons',
  templateUrl: './dungeons.component.html',
  styleUrls: ['./dungeons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DungeonsComponent implements OnInit, OnDestroy {

  public items: Gamemodes[]

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {

  }

  public ngOnInit(): void {
    this.nw.db.data.datatablesGamemodes()
      .pipe(map((data) => data.filter((it) => it.IsDungeon)))
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.items = data
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public dungeonName(item: Gamemodes) {
    return this.nw.translate(item.DisplayName)
  }

  public dungeonDescription(item: Gamemodes) {
    return this.nw.translate(item.Description)
  }

  public dropIds(item: Gamemodes) {
    return item.PossibleItemDropIds?.split(',')
  }
}
