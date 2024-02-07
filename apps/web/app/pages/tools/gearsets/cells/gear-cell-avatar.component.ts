import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { filter, take } from 'rxjs'
import { GearsetSignalStore, ImagesDB } from '~/data'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { AvatarDialogComponent } from './ui/avatar-dialog.component'

@Component({
  standalone: true,
  selector: 'nwb-gear-cell-avatar',
  templateUrl: './gear-cell-avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule],
  host: {
    class: 'flex flex-col',
  },
})
export class GearCellAvatarComponent {
  private store = inject(GearsetSignalStore)
  private mannequin = inject(Mannequin)
  private dialog = inject(Dialog)

  @Input()
  public disabled: boolean

  @Input()
  public title: string = null

  public get isEditable() {
    return !this.disabled && !!this.store.gearsetId()
  }

  protected gearScore = this.mannequin.gearScore
  protected image = toSignal(inject(ImagesDB).imageUrl(toObservable(this.store.gearsetImageId)))
  protected iconMenu = svgEllipsisVertical

  protected handleAvatarClicked() {
    if (!this.isEditable) {
      return
    }
    AvatarDialogComponent.open(this.dialog, {
      data: {
        imageId: this.store.gearset()?.imageId,
      },
    })
      .closed.pipe(take(1))
      .pipe(filter((it) => !!it))
      .subscribe(({ imageId }) => {
        this.store.patchGearset({ imageId })
      })
  }
}
