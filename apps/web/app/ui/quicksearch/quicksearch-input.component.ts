import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ElementRef, ViewChild } from '@angular/core'
import { defer, Subject, takeUntil } from 'rxjs';
import { Hotkeys } from '~/utils';
import { QuicksearchService } from './quicksearch.service';

@Component({
  selector: 'nwb-quicksearch-input',
  exportAs: 'quickSearch',
  templateUrl: './quicksearch-input.component.html',
  styleUrls: ['./quicksearch-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'input-group input-group-sm',
  },
})
export class QuicksearchInputComponent implements OnInit, OnDestroy {

  public get value() {
    return this.search.value
  }

  public set value(v: string) {
    this.search.value = v
  }

  public readonly value$ = defer(() => this.search.query)

  @ViewChild('input')
  public input: ElementRef<HTMLInputElement>

  protected get active() {
    return this.search.active
  }

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
