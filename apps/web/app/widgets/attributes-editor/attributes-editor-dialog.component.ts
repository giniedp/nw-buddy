import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'
import { AttributeRef } from '@nw-data/common'
import { NwModule } from '~/nw'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { ItemDetailModule } from '../data/item-detail'
import { AttributesEditorComponent } from './attributes-editor.component'
import { AttributesScaleComponent } from './attributes-scale.component'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'

export interface AttributeEditorValue {
  assigned: Record<AttributeRef, number>
  magnify: AttributeRef
}

@Component({
  selector: 'nwb-attributes-editor-dialog',
  templateUrl: './attributes-editor-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    AttributesEditorComponent,
    AttributesScaleComponent,
    ItemDetailModule,
    LayoutModule,
    IonSegment,
    IonSegmentButton,
  ],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class AttributeEditorDialogComponent implements OnInit {
  public static open(modal: ModalService, options: ModalOpenOptions<AttributeEditorDialogComponent>) {
    options.size ??= ['x-md', 'y-lg']
    options.content = AttributeEditorDialogComponent
    return modal.open<AttributeEditorDialogComponent, AttributeEditorValue>(options)
  }

  @Input()
  public level: number
  @Input()
  public base: Record<AttributeRef, number>
  @Input()
  public assigned: Record<AttributeRef, number>
  @Input()
  public buffs?: Record<AttributeRef, number>
  @Input()
  public magnify: number[]
  @Input()
  public magnifyPlacement: AttributeRef

  @Input()
  public weapon1ItemId?: string
  @Input()
  public weapon1AffixId?: string
  @Input()
  public weapon1GearScore?: number
  @Input()
  public weapon2ItemId?: string
  @Input()
  public weapon2AffixId?: string
  @Input()
  public weapon2GearScore?: number

  private result: AttributeEditorValue = {
    assigned: {
      con: 0,
      dex: 0,
      foc: 0,
      int: 0,
      str: 0,
    },
    magnify: null,
  }
  protected tab: string = null

  public constructor(private modalRef: ModalRef<AttributeEditorValue>) {
    //
  }

  public ngOnInit() {
    this.tab = this.weapon1ItemId || this.weapon2ItemId
    this.result = {
      assigned: this.assigned,
      magnify: this.magnifyPlacement,
    }
  }

  protected setAssigned(value: Record<AttributeRef, number>) {
    this.result.assigned = value
  }

  protected setMagnifyPlacement(value: AttributeRef) {
    this.result.magnify = value
  }

  protected close() {
    this.modalRef.close()
  }

  protected commit() {
    console.log(this.result)
    this.modalRef.close(this.result)
  }
}
