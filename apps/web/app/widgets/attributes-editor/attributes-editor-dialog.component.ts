import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { AttributeRef } from '@nw-data/common'
import { NwModule } from '~/nw'
import { AttributesEditorComponent } from './attributes-editor.component'

export interface AttributeEditorDialogData {
  level: number
  base: Record<AttributeRef, number>
  assigned: Record<AttributeRef, number>
  buffs?: Record<AttributeRef, number>
  magnify: number[]
}

@Component({
  standalone: true,
  selector: 'nwb-attributes-editor-dialog',
  templateUrl: './attributes-editor-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, AttributesEditorComponent],
  host: {
    class: 'flex flex-col h-full bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class AttributeEditorDialogComponent {
  public static open(dialog: Dialog, config: DialogConfig<AttributeEditorDialogData>) {
    return dialog.open<Record<AttributeRef, number>, AttributeEditorDialogData, AttributeEditorDialogComponent>(
      AttributeEditorDialogComponent,
      {
        panelClass: ['max-h-screen', 'w-screen', 'max-w-2xl', 'm-2', 'shadow', 'self-end', 'sm:self-center'],
        ...config,
      }
    )
  }

  private result: Record<AttributeRef, number>

  public constructor(
    private dialog: DialogRef<Record<AttributeRef, number>, AttributeEditorDialogData>,
    @Inject(DIALOG_DATA)
    protected data: AttributeEditorDialogData
  ) {
    //
  }

  protected setResult(value: Record<AttributeRef, number>) {
    this.result = value
  }

  protected close() {
    this.dialog.close()
  }

  protected commit() {
    this.dialog.close(this.result)
  }
}
