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
import { ItemMeta, ItemPreferencesService } from '../preferences'

@Component({
  selector: 'nwb-item-tracker',
  exportAs: 'itemTracker',
  template: `
    <ng-container *ngIf="showInput">
      <input
        #input
        type="number"
        min="0"
        class="border-0 bg-transparent focus:outline-none w-12 appearance-none"
        [ngModel]="dataValue"
        (ngModelChange)="submitValue($event)"
        [ngModelOptions]="{ updateOn: 'blur' }"
        (blur)="closeInput($event)"
        (keydown.enter)="closeInput($event)"
      />
    </ng-container>
    <ng-container *ngIf="!showInput">
      <ng-container *ngIf="isModePrice">
        <ng-container *ngIf="displayValue">{{ displayValue | number:'1.2-2' }}{{suffix}}</ng-container>
        <span [class.tooltip]="!!editTip" class="tooltip-left tooltip-info" attr.data-tip="{{editTip}}" *ngIf="!displayValue">{{ editText }}</span>
      </ng-container>
      <ng-container *ngIf="!isModePrice">{{ displayValue }}</ng-container>

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
  public multiply: number = 1

  @Input()
  public suffix: string

  @Input()
  public editText = "✎"

  @Input()
  public editTip = "Edit"

  public get displayValue() {
    if (this.mode === 'price') {
      return (this.data?.price || 0) * this.multiply
    }
    return this.dataValue || '-'
  }

  public get dataValue() {
    switch (this.mode) {
      case 'price':
        return this.data?.price || 0
      case 'stock':
        return this.data?.stock || 0
      case 'gs':
        return this.data?.gs || 0
      default:
        return 0
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

  public get isModePrice() {
    return this.mode === 'price'
  }

  public get isModeGs() {
    return this.mode === 'gs'
  }

  public get isModeStock() {
    return this.mode === 'stock'
  }

  @ViewChild('input', { read: ElementRef })
  public input: ElementRef<HTMLInputElement>

  public showInput: boolean

  private destroy$ = new Subject()
  private itemId$ = new ReplaySubject<string>(1)
  private id: string
  private data: ItemMeta

  public constructor(private meta: ItemPreferencesService, private cdRef: ChangeDetectorRef) {}

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
      setTimeout(() => {
        this.input.nativeElement?.select()
      })
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
