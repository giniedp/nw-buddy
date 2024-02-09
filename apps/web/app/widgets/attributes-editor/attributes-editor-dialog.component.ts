import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'
import { AttributeRef } from '@nw-data/common'
import { NwModule } from '~/nw'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { ItemDetailModule } from '../data/item-detail'
import { AttributesEditorComponent } from './attributes-editor.component'
import { AttributesScaleComponent } from './attributes-scale.component'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'

@Component({
  standalone: true,
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
    return modal.open<AttributeEditorDialogComponent, Record<AttributeRef, number>>(options)
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

  private result: Record<AttributeRef, number>
  protected tab: string = null

  public constructor(private modalRef: ModalRef<Record<AttributeRef, number>>) {
    //
  }

  public ngOnInit() {
    this.tab = this.weapon1ItemId || this.weapon2ItemId
  }

  protected setResult(value: Record<AttributeRef, number>) {
    this.result = value
  }

  protected close() {
    this.modalRef.close()
  }

  protected commit() {
    this.modalRef.close(this.result)
  }
}
