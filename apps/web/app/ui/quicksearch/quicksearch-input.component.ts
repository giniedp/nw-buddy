import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ElementRef, ViewChild } from '@angular/core'
import { Subject, takeUntil } from 'rxjs';
import { Hotkeys } from '~/core/utils';
import { QuicksearchService } from './quicksearch.service';

@Component({
  selector: 'nwb-quicksearch-input',
  templateUrl: './quicksearch-input.component.html',
  styleUrls: ['./quicksearch-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'input-group input-group-sm',
  },
})
export class QuicksearchInputComponent implements OnInit, OnDestroy {

  public get value() {
    return this.search.query.value
  }

  public set value(v: string) {
    this.search.query.next(v)
  }

  @ViewChild('input')
  public input: ElementRef<HTMLInputElement>

  private destroy$ = new Subject()
  public constructor(private search: QuicksearchService, private keys: Hotkeys) {
    //
  }

  public ngOnInit(): void {
    this.keys.addShortcut({
      keys: 'control.f'
    }).pipe(takeUntil(this.destroy$)).subscribe(()  => {
      this.input.nativeElement.focus()
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
