import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { SkillBuildValue, SkillBuilderComponent } from './skill-builder.component'

@Component({
  standalone: true,
  selector: 'nwb-skill-tree-dialog',
  templateUrl: './skill-tree-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, SkillBuilderComponent],
  host: {
    class: 'flex flex-col gap-3 layout-pad h-full bg-base-300 rounded-md',
  },
})
export class AttributeEditorDialogComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<AttributeEditorDialogComponent>) {
    options.size ??= ['x-md', 'y-lg']
    options.content = AttributeEditorDialogComponent
    return modal.open<AttributeEditorDialogComponent, SkillBuildValue>(options)
  }

  @Input()
  public value: SkillBuildValue

  public constructor(private modalRef: ModalRef<SkillBuildValue>) {
    //
  }

  protected close() {
    this.modalRef.close()
  }

  protected commit() {
    this.modalRef.close(this.value)
  }
}
