import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core'
import { Dyecolors } from '@nw-data/generated'
import { filter } from 'rxjs'
import { NwModule } from '~/nw'
import { ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { DyePickerComponent } from './dye-picker.component'

@Component({
  standalone: true,
  selector: 'nwb-dye-panel',
  templateUrl: './dye-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DyePickerComponent, TooltipModule],
  host: {
    class: 'flex flex-row gap-1 padding-2',
  },
})
export class DyePanelComponent {
  @Input()
  public dyeColors: Dyecolors[]

  @Input()
  public dyeR: Dyecolors
  @Input()
  public dyeG: Dyecolors
  @Input()
  public dyeB: Dyecolors
  @Input()
  public dyeA: Dyecolors
  @Input()
  public debug: boolean

  @Output()
  public dyeRChange = new EventEmitter<Dyecolors>()
  @Output()
  public dyeGChange = new EventEmitter<Dyecolors>()
  @Output()
  public dyeBChange = new EventEmitter<Dyecolors>()
  @Output()
  public dyeAChange = new EventEmitter<Dyecolors>()
  @Output()
  public debugChange = new EventEmitter<boolean>()

  @Input()
  public dyeRDisabled: boolean
  @Input()
  public dyeGDisabled: boolean
  @Input()
  public dyeBDisabled: boolean
  @Input()
  public dyeADisabled: boolean

  public constructor(
    private modal: ModalService,
    private cdRef: ChangeDetectorRef,
  ) {
    //
  }

  protected pickR() {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: this.dyeColors,
        color: this.dyeR,
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.dyeR = value
        this.dyeRChange.emit(value)
        this.cdRef.markForCheck()
      })
  }

  protected pickG() {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: this.dyeColors,
        color: this.dyeG,
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.dyeG = value
        this.dyeGChange.emit(value)
        this.cdRef.markForCheck()
      })
  }

  protected pickB() {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: this.dyeColors,
        color: this.dyeB,
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.dyeB = value
        this.dyeBChange.emit(value)
        this.cdRef.markForCheck()
      })
  }

  protected pickA() {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: this.dyeColors,
        color: this.dyeA,
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.dyeA = value
        this.dyeAChange.emit(value)
        this.cdRef.markForCheck()
      })
  }

  protected toggleDebug() {
    this.debug = !this.debug
    this.debugChange.emit(this.debug)
  }
}
