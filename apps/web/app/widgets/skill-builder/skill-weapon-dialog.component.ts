import { Dialog, DialogConfig, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Inject } from '@angular/core'
import { NwModule, NwWeaponTypesService } from '~/nw'
import { NwWeaponType } from '~/nw/nw-weapon-types'
import { eqCaseInsensitive } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-skill-weapon-dialog',
  templateUrl: './skill-weapon-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule],
  host: {
    class: 'layout-col bg-base-100 rounded-md',
  },
})
export class SkillWeaponDialogComponent {
  public static open(dialog: Dialog, config: DialogConfig<string>) {
    return dialog.open<string, string, SkillWeaponDialogComponent>(
      SkillWeaponDialogComponent,
      {
        ...config,
      }
    )
  }

  protected value: string

  protected types$ = this.weapons.all$
  protected categories$ = this.weapons.categories$

  public constructor(
    private weapons: NwWeaponTypesService,
    private dialog: DialogRef<string, string>,
    @Inject(DIALOG_DATA)
    data: string
  ) {
    this.value = data
  }

  protected select(item: NwWeaponType) {
    this.value = item.WeaponTag
  }

  protected close() {
    this.dialog.close()
  }

  protected commit() {
    this.dialog.close(this.value)
  }

  protected isSelected(type: NwWeaponType) {
    return eqCaseInsensitive(type.WeaponTag, this.value)
  }
}
