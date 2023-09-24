import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { filter, firstValueFrom, map, shareReplay, take } from 'rxjs'
import { CharacterStore, GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { AttributeEditorDialogComponent } from '~/widgets/attributes-editor'
import { AttributesStatsComponent } from './stats/attributes-stats.component'
import { VitalityStatsComponent } from './stats/vitality-stats.component'
import { AvatarDialogComponent } from './avatar-dialog.component'
import { EquipLoadStatsComponent } from './stats/equip-load-stats.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset-pane-main',
  templateUrl: './gearset-pane-main.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    PropertyGridModule,
    DialogModule,
    IconsModule,
    TooltipModule,
    CdkMenuModule,
    VitalityStatsComponent,
    AttributesStatsComponent,
    EquipLoadStatsComponent,
  ],
  providers: [PercentPipe, DecimalPipe],
  host: {
    class: 'block flex flex-col layout-pad layout-gap relative justify-end',
  },
})
export class GearsetPaneMainComponent {
  @Input()
  public disabled: boolean

  protected characterLevel$ = this.character.level$
  protected gearScore$ = this.mannequin.gearScore$

  protected image$ = this.gearset.imageUrl$.pipe(shareReplay(1))
  protected isPersistable$ = this.gearset.isPersistable$
  protected hasImage$ = this.image$.pipe(map((it) => !!it))
  protected weaponActive$ = this.mannequin.state$.pipe(map((it) => it?.weaponActive))
  protected weaponUnsheathed$ = this.mannequin.state$.pipe(map((it) => it?.weaponUnsheathed))

  protected iconMenu = svgEllipsisVertical

  public constructor(
    private character: CharacterStore,
    private mannequin: Mannequin,
    private gearset: GearsetStore,
    private dialog: Dialog
  ) {
    //
  }

  protected async editAttributes() {
    if (this.disabled) {
      return
    }
    const attrs = await firstValueFrom(this.mannequin.activeAttributes$)
    const magnify = await firstValueFrom(this.mannequin.activeMagnify$)

    const level = await firstValueFrom(this.characterLevel$)

    AttributeEditorDialogComponent.open(this.dialog, {
      data: {
        level: level,
        assigned: {
          str: attrs.str.assigned,
          dex: attrs.dex.assigned,
          int: attrs.int.assigned,
          foc: attrs.foc.assigned,
          con: attrs.con.assigned,
        },
        base: {
          str: attrs.str.base,
          dex: attrs.dex.base,
          int: attrs.int.base,
          foc: attrs.foc.base,
          con: attrs.con.base,
        },
        buffs: {
          str: attrs.str.bonus,
          dex: attrs.dex.bonus,
          int: attrs.int.bonus,
          foc: attrs.foc.bonus,
          con: attrs.con.bonus,
        },
        magnify: magnify,
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe((res) => {
        this.gearset.updateAttrs({ attrs: res })
      })
  }

  protected async changeAvatar() {
    const gearset = await firstValueFrom(this.gearset.gearset$)
    AvatarDialogComponent.open(this.dialog, {
      data: {
        imageId: gearset?.imageId,
      },
    })
      .closed.pipe(take(1))
      .pipe(filter((it) => !!it))
      .subscribe(({ imageId }) => {
        this.gearset.updateImageId({ imageId })
      })
  }
}
