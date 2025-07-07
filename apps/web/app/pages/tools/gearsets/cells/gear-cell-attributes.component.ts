import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, Input } from '@angular/core'
import { getItemPerkIdsWithOverride } from '@nw-data/common'
import { combineLatest, filter, firstValueFrom, map, of } from 'rxjs'
import { GearsetStore, injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { ActiveAttribute, Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { AttributeEditorDialogComponent } from '~/widgets/attributes-editor'
import { FlashDirective } from './ui/flash.directive'

@Component({
  selector: 'nwb-gear-cell-attributes',
  templateUrl: './gear-cell-attributes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, TooltipModule, FlashDirective],
  host: {
    class: 'block',
  },
})
export class GearCellAttributesComponent {
  private db = injectNwData()
  private store = inject(GearsetStore)
  private mannequin = inject(Mannequin)
  private modal = inject(ModalService)

  public hideTitle = input(false)
  public disabled = input(false)
  public isEditable = computed(() => !this.disabled() && !!this.store.gearsetId())

  private attributes = this.mannequin.activeAttributes
  protected stats = computed(() => {
    const attributes = this.attributes()
    return [
      {
        label: 'ui_Strength_short',
        ...buildRow(attributes?.str),
      },
      {
        label: 'ui_Dexterity_short',
        ...buildRow(attributes?.dex),
      },
      {
        label: 'ui_Intelligence_short',
        ...buildRow(attributes?.int),
      },
      {
        label: 'ui_Focus_short',
        ...buildRow(attributes?.foc),
      },
      {
        label: 'ui_Constitution_short',
        ...buildRow(attributes?.con),
      },
    ]
  })

  protected async handleClicked() {
    if (!this.isEditable()) {
      return
    }
    const level = this.mannequin.level()
    const attrs = this.mannequin.activeAttributes()
    const magnify = this.mannequin.activeMagnify()
    const magnifyPlacement = this.mannequin.magnifyPlacement()
    const weapons = await firstValueFrom(
      combineLatest({
        weapons: of(this.mannequin.equippedWeapons()),
        items: this.db.itemsByIdMap(),
        perks: this.db.perksByIdMap(),
        affix: this.db.affixStatsByIdMap(),
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

    AttributeEditorDialogComponent.open(this.modal, {
      inputs: {
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
        magnifyPlacement,
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe((res) => {
        this.store.patchGearset({ attrs: res.assigned, magnify: res.magnify })
      })
  }
}

function buildRow(attr: ActiveAttribute) {
  return {
    base: attr?.base ?? 0,
    assigned: attr?.assigned ?? 0,
    bonus: attr?.bonus ?? 0,
    total: attr?.total ?? 0,
    magnify: attr?.magnify ?? 0,
  }
}
