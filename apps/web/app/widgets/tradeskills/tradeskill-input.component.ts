import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { combineLatest, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { NwTradeskillInfo } from '~/core/nw/nw-tradeskill.service'

@Component({
  selector: 'nwb-tradeskill-input',
  templateUrl: './tradeskill-input.component.html',
  styleUrls: ['./tradeskill-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bg-base-100 shadow-xl rounded-md aspect-square flex flex-col'
  }
})
export class TradeskillInputComponent implements OnInit, OnDestroy {
  @Input()
  public set tradeskill(value: string) {
    this.id = value
    this.id$.next(value)
  }

  public data: NwTradeskillInfo

  public get level() {
    return this.nw.tradeskills.preferences.get(this.id)?.level || 0
  }
  public set level(value: number) {
    this.nw.tradeskills.preferences.merge(this.id, {
      level: Number(value) || 0,
    })
  }

  private id: string
  private id$ = new ReplaySubject<string>(1)
  private destroy$ = new Subject()

  constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    combineLatest({
      skills: this.nw.tradeskills.skillsMap,
      id: this.id$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ skills, id }) => {
        this.data = skills.get(id)
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
