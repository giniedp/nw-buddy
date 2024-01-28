import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { getItemPerkIdsWithOverride } from '@nw-data/common'
import { combineLatest, filter, firstValueFrom, map, take } from 'rxjs'
import { CharacterStore, GearsetSignalStore, ImagesDB, NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { AttributeEditorDialogComponent } from '~/widgets/attributes-editor'
import { AttributesStatsComponent } from '../stats/attributes-stats.component'
import { EquipLoadStatsComponent } from '../stats/equip-load-stats.component'
import { VitalityStatsComponent } from '../stats/vitality-stats.component'
import { AvatarDialogComponent } from './avatar-dialog.component'

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
  private store = inject(GearsetSignalStore)

  @Input()
  public disabled: boolean

  protected characterLevel$ = this.character.level$
  protected gearScore$ = this.mannequin.gearScore$

  protected image$ = inject(ImagesDB).imageUrl(toObservable(this.store.gearsetImageId))
  protected hasImage$ = this.image$.pipe(map((it) => !!it))

  protected isPersistable = computed(() => !!this.store.gearsetId())

  protected weaponActive$ = this.mannequin.state$.pipe(map((it) => it?.weaponActive))
  protected weaponUnsheathed$ = this.mannequin.state$.pipe(map((it) => it?.weaponUnsheathed))

  protected iconMenu = svgEllipsisVertical

  public constructor(
    private character: CharacterStore,
    private mannequin: Mannequin,
    private dialog: Dialog,
    private db: NwDataService,
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
    const weapons = await firstValueFrom(
      combineLatest({
        weapons: this.mannequin.equippedWeapons$,
        items: this.db.itemsMap,
        perks: this.db.perksMap,
        affix: this.db.affixStatsMap,
      }).pipe(
        map(({ weapons, items, perks, affix }) => {
          const weapon1 = weapons.find((it) => it.slot === 'weapon1')
          const weapon2 = weapons.find((it) => it.slot === 'weapon2')
          const item1 = items.get(weapon1?.itemId)
          const item2 = items.get(weapon2?.itemId)
          const perks1 = item1 ? getItemPerkIdsWithOverride(item1, weapon1.perks) : null
          const perks2 = item2 ? getItemPerkIdsWithOverride(item2, weapon2.perks) : null
          const affix1 = perks1
            ?.map((perkId) => perks.get(perkId)?.Affix)
            .find((affixId) => {
              return !!affix.get(affixId)?.DamagePercentage || !!affix.get(affixId)?.PreferHigherScaling
            })
          const affix2 = perks2
            ?.map((perkId) => perks.get(perkId)?.Affix)
            .find((affixId) => {
              return !!affix.get(affixId)?.DamagePercentage || !!affix.get(affixId)?.PreferHigherScaling
            })

          return {
            weapon1ItemId: weapon1?.itemId,
            weapon1GearScore: weapon1?.gearScore,
            weapon1AffixId: affix1,
            weapon2ItemId: weapon2?.itemId,
            weapon2GearScore: weapon2?.gearScore,
            weapon2AffixId: affix2,
          }
        }),
      ),
    )

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
        weapon1ItemId: weapons.weapon1ItemId,
        weapon1GearScore: weapons.weapon1GearScore,
        weapon1AffixId: weapons.weapon1AffixId,
        weapon2ItemId: weapons.weapon2ItemId,
        weapon2GearScore: weapons.weapon2GearScore,
        weapon2AffixId: weapons.weapon2AffixId,
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
        this.store.patchGearset({ attrs: res })
      })
  }

  protected changeAvatar() {
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
