import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core'
import { distinctUntilChanged, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { ItemMeta, NwItemMetaService } from './nw-item-meta.service'

@Component({
  selector: 'nwb-item-tracker',
  template: `
    <ng-container *ngIf="showInput">
      <input
        #input
        type="number"
        min="0"
        class="border-0 bg-transparent focus:outline-none w-10 appearance-none"
        [ngModel]="badgeValue"
        (ngModelChange)="submitValue($event)"
        [ngModelOptions]="{ updateOn: 'blur' }"
        (blur)="closeInput($event)"
        (keydown.enter)="closeInput($event)"
      />
    </ng-container>
    <ng-container *ngIf="!showInput">
      {{ badgeValue }}
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        line-height: 100%;
        cursor: pointer;
      }
      :host input {
        height: 100%;
      }
    `,
  ],
  host: {
    '[class.badge]': 'true',
    '[class.badge-lg]': 'size === "lg"',
    '[class.badge-md]': 'size === "md"',
    '[class.badge-sm]': 'size === "sm"',
    '[class.badge-xs]': 'size === "xs"',
    '[class.badge-success]': 'showSuccess',
    '[class.badge-error]': 'showError',
  },
})
export class ItemTrackerComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input()
  public set itemId(value: string) {
    this.itemId$.next(value)
  }

  @Input()
  public mode: 'gs' | 'price' | 'stock' = 'gs'

  @Input()
  public size: 'lg' | 'md' | 'sm' | 'xs' = 'sm'

  public get badgeValue() {
    switch (this.mode) {
      case 'price':
        return this.data?.price
      case 'stock':
        return this.data?.stock || '-'
      case 'gs':
        return this.data?.gs || '-'
      default:
        return ''
    }

  }

  public get showError() {
    switch (this.mode) {
      case 'gs':
        return !this.data?.gs
      default:
        return false
    }
  }

  public get showSuccess() {
    switch (this.mode) {
      case 'gs':
        return this.data?.gs > 0
      default:
        return false
    }
  }

  @ViewChild('input', { read: ElementRef })
  public input: ElementRef<HTMLInputElement>

  public showInput: boolean

  private destroy$ = new Subject()
  private itemId$ = new ReplaySubject<string>(1)
  private id: string
  private data: ItemMeta

  public constructor(private meta: NwItemMetaService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.itemId$
      .pipe(distinctUntilChanged())
      .pipe(switchMap((id) => this.meta.observe(id)))
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.id = data.id
        this.data = data.meta
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public ngAfterViewChecked(): void {
    if (this.showInput && this.input) {
      this.input.nativeElement.focus()
    }
    this.cdRef.markForCheck()
  }

  public closeInput(e: Event) {
    if (this.showInput) {
      e.stopImmediatePropagation()
      if (e instanceof KeyboardEvent && this.input) {
        this.input.nativeElement.blur()
      } else {
        this.showInput = false
        this.cdRef.markForCheck()
      }
    }
  }

  @HostListener('click', ['$event'])
  public openInput(e: Event) {
    if (!this.showInput) {
      e.stopImmediatePropagation()
      this.showInput = true
      this.cdRef.markForCheck()
    }
  }

  public submitValue(value: string) {
    this.showInput = false
    switch (this.mode) {
      case 'price':
        this.meta.merge(this.id, {
          price: value ? Number(value) : null,
        })
        break
      case 'stock':
        this.meta.merge(this.id, {
          stock: value ? Number(value) : null,
        })
        break
      default:
        this.meta.merge(this.id, {
          gs: value ? Number(value) : null,
        })
        break
    }
    this.cdRef.markForCheck()
  }
}
