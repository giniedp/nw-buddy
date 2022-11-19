import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { SkillBuilderComponent, SkillBuildValue } from './skill-builder.component'


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
  public static open(dialog: Dialog, config: DialogConfig<SkillBuildValue>) {
    return dialog.open<SkillBuildValue, SkillBuildValue, AttributeEditorDialogComponent>(
      AttributeEditorDialogComponent,
      {
        ...config,
      }
    )
  }

  protected value: SkillBuildValue

  public constructor(
    private dialog: DialogRef<SkillBuildValue, SkillBuildValue>,
    @Inject(DIALOG_DATA)
    data: SkillBuildValue
  ) {
    this.value = data
  }

  protected close() {
    this.dialog.close()
  }

  protected commit() {
    this.dialog.close(this.value)
  }
}
