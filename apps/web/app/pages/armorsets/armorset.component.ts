import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { filter, Subject, take, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { IntersectionObserverService } from '~/core/utils'

@Component({
  selector: 'nwb-armorset',
  templateUrl: './armorset.component.html',
  styleUrls: ['./armorset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmorsetComponent implements OnInit, OnChanges, OnDestroy {

  private destoy$ = new Subject()

  public isVisible: boolean = false

  public constructor(
    private nw: NwService,
    private intersection: IntersectionObserverService,
    private elRef: ElementRef<HTMLElement>,
    private cdRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.intersection
      .observe(this.elRef.nativeElement)
      .pipe(filter((it) => it.isIntersecting))
      .pipe(take(1), takeUntil(this.destoy$))
      .subscribe(() => {
        this.isVisible = true
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }

  public ngOnDestroy(): void {
    this.destoy$.next(null)
    this.destoy$.complete()
  }

}
