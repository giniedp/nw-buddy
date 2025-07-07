import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { SkillTreeValue, SkillTreeEditorComponent } from './skill-tree-editor.component'

@Component({
  standalone: true,
  selector: 'nwb-skill-tree-dialog',
  templateUrl: './skill-tree-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, SkillTreeEditorComponent],
  host: {
    class: 'flex flex-col gap-3 layout-pad h-full bg-base-300 rounded-md',
  },
})
export class AttributeEditorDialogComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<AttributeEditorDialogComponent>) {
    options.size ??= ['x-md', 'y-lg']
    options.content = AttributeEditorDialogComponent
    return modal.open<AttributeEditorDialogComponent, SkillTreeValue>(options)
  }

  @Input()
  public value: SkillTreeValue

  public constructor(private modalRef: ModalRef<SkillTreeValue>) {
    //
  }

  protected close() {
    this.modalRef.close()
  }

  protected commit() {
    this.modalRef.close(this.value)
  }
}
