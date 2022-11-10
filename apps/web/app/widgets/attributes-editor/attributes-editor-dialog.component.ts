import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Inject } from '@angular/core'
import { NwModule } from '~/nw'
import { AttributesEditorComponent } from './attributes-editor.component'
import { AttributeName } from './attributes.store'

export interface AttributeEditorDialogData {
  level: number
  base: Record<AttributeName, number>
  assigned: Record<AttributeName, number>
}

@Component({
  standalone: true,
  selector: 'nwb-attributes-editor-dialog',
  templateUrl: './attributes-editor-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, AttributesEditorComponent],
  host: {
    class: 'flex flex-col gap-3 layout-pad h-full bg-base-300 rounded-md',
  },
})
export class AttributeEditorDialogComponent {
  public static open(dialog: Dialog, config: DialogConfig<AttributeEditorDialogData>) {
    return dialog.open<Record<AttributeName, number>, AttributeEditorDialogData, AttributeEditorDialogComponent>(
      AttributeEditorDialogComponent,
      {
        ...config,
      }
    )
  }

  private result: Record<AttributeName, number>

  public constructor(
    private dialog: DialogRef<Record<AttributeName, number>, AttributeEditorDialogData>,
    @Inject(DIALOG_DATA)
    protected data: AttributeEditorDialogData
  ) {
    //
  }

  protected setResult(value: Record<AttributeName, number>) {
    this.result = value
  }

  protected close() {
    this.dialog.close()
  }

  protected commit() {
    this.dialog.close(this.result)
  }
}
