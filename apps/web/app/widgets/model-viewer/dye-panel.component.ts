import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, model, output } from '@angular/core'
import { DyeColorData } from '@nw-data/generated'
import { filter } from 'rxjs'
import { NwModule } from '~/nw'
import { ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { DyePickerComponent } from './dye-picker.component'

@Component({
  selector: 'nwb-dye-panel',
  templateUrl: './dye-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule],
  host: {
    class: 'flex flex-row gap-1 padding-2',
  },
})
export class DyePanelComponent {
  public dyeColors = input<DyeColorData[]>([])

  public dyeR = model<DyeColorData>(null)
  public dyeG = model<DyeColorData>(null)
  public dyeB = model<DyeColorData>(null)
  public dyeA = model<DyeColorData>(null)
  public debug = model<boolean>(false)

  public dyeRChange = output<DyeColorData>()
  public dyeGChange = output<DyeColorData>()
  public dyeBChange = output<DyeColorData>()
  public dyeAChange = output<DyeColorData>()
  public debugChange = output<boolean>()

  public dyeRDisabled = input<boolean>(false)
  public dyeGDisabled = input<boolean>(false)
  public dyeBDisabled = input<boolean>(false)
  public dyeADisabled = input<boolean>(false)

  public constructor(
    private modal: ModalService,
    private cdRef: ChangeDetectorRef,
  ) {
    //
  }

  protected pickR() {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: this.dyeColors(),
        color: this.dyeR(),
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.dyeR.set(value)
        this.dyeRChange.emit(value)
        this.cdRef.markForCheck()
      })
  }

  protected pickG() {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: this.dyeColors(),
        color: this.dyeG(),
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.dyeG.set(value)
        this.dyeGChange.emit(value)
        this.cdRef.markForCheck()
      })
  }

  protected pickB() {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: this.dyeColors(),
        color: this.dyeB(),
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.dyeB.set(value)
        this.dyeBChange.emit(value)
        this.cdRef.markForCheck()
      })
  }

  protected pickA() {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: this.dyeColors(),
        color: this.dyeA(),
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.dyeA.set(value)
        this.dyeAChange.emit(value)
        this.cdRef.markForCheck()
      })
  }

  protected toggleDebug() {
    this.debug.set(!this.debug())
    this.debugChange.emit(this.debug())
  }
}
