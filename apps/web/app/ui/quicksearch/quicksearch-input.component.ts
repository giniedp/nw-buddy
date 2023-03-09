import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core'
import { FormsModule } from '@angular/forms';
import { defer, Subject, takeUntil } from 'rxjs';
import { Hotkeys } from '~/utils';
import { IconsModule } from '../icons';
import { svgMagnifyingGlass, svgXmark } from '../icons/svg';
import { QuicksearchService } from './quicksearch.service';

@Component({
  standalone: true,
  selector: 'nwb-quicksearch-input',
  exportAs: 'quickSearch',
  templateUrl: './quicksearch-input.component.html',
  styleUrls: ['./quicksearch-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule],
  host: {
    class: 'relative',
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

  @Input()
  public placeholder: string = 'Search'

  protected svgSearch = svgMagnifyingGlass
  protected svgXmark = svgXmark

  protected get active() {
    return this.search.active
  }

  private destroy$ = new Subject()
  public constructor(private search: QuicksearchService, private keys: Hotkeys) {
    //
  }

  public ngOnInit(): void {
    this.keys.addShortcut({
      keys: '/'
    }).pipe(takeUntil(this.destroy$)).subscribe(()  => {
      this.input.nativeElement.focus()
    })
    this.keys.addShortcut({
      keys: ':'
    }).pipe(takeUntil(this.destroy$)).subscribe(()  => {
      this.input.nativeElement.focus()
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
