import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { LayoutModule } from '@angular/cdk/layout'
import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import {
  Ability,
  Affixstats,
  Damagetypes,
  ItemDefinitionMaster,
  ItemdefinitionsArmor,
  ItemdefinitionsConsumables,
  ItemdefinitionsWeapons,
  Perks,
  Statuseffect,
} from '@nw-data/types'
import { sum, sumBy } from 'lodash'
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs'
import { CharacterStore, GearsetStore, ItemInstance, ItemInstancesDB, SkillBuildsDB } from '~/data'
import { NwDbService, NwModule } from '~/nw'
import { AttributeRef, NwAttributesService, NW_ATTRIBUTE_TYPES } from '~/nw/attributes'
import {
  getAffixABSs,
  getAffixDMGs,
  getAffixMODs,
  getArmorRatingElemental,
  getArmorRatingPhysical,
  getItemMaxGearScore,
  getItemPerkBucketKeys,
  getItemPerkKeys,
  getPerkMultiplier,
  patchPrecision,
  stripAbilityProperties,
  stripAffixProperties,
  totalGearScore,
} from '~/nw/utils'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { mapFilter, shareReplayRefCount, tapDebug } from '~/utils'
import { AttributeEditorDialogComponent } from '~/widgets/attributes-editor'

interface PerkInfo {
  perk: Perks
  count: number
  scale: number
  abilities: Array<Partial<Ability>>
  affix: Partial<Affixstats>
  maybeStackable?: boolean
  isWeapon: boolean
  isArmor: boolean
  isJewelery: boolean
  isShield: boolean
}

export interface StatEntry {
  key: string
  label: string[] | string
  value: number
  percent: number
  icon?: string
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-stats',
  templateUrl: './gearset-stats.component.html',
  styleUrls: ['./gearset-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, PropertyGridModule, DialogModule, IconsModule, TooltipModule, CdkMenuModule],
  providers: [PercentPipe, DecimalPipe],
  host: {
    class: 'block flex flex-col layout-pad layout-gap relative justify-end',
  },
})
export class GearsetStatsComponent {
  protected slots$ = this.resolveSlots().pipe(shareReplayRefCount(1))
  protected slotsArmor$ = this.slots$.pipe(mapFilter((it) => !!it.armor))
  protected slotsWeapon$ = this.slots$.pipe(mapFilter((it) => !!it.weapon))
  protected characterLevel$ = this.character.level$
  protected baseElementalRating$ = this.slots$.pipe(map((slots) => this.sumRatingElemental(slots)))
  protected baseElementalRatingArmor$ = this.slotsArmor$.pipe(map((slots) => this.sumRatingElemental(slots)))
  protected baseElementalRatingWeapon$ = this.slotsWeapon$.pipe(map((slots) => this.sumRatingElemental(slots)))
  protected basePhysicalRating$ = this.slots$.pipe(map((slots) => this.sumRatingPhysical(slots)))
  protected basePhysicalRatingArmor$ = this.slotsArmor$.pipe(map((slots) => this.sumRatingPhysical(slots)))
  protected basePhysicalRatingWeapon$ = this.slotsWeapon$.pipe(map((slots) => this.sumRatingPhysical(slots)))
  protected elementalRating$ = defer(() => this.resolveElementalRating()).pipe(shareReplayRefCount(1))
  protected physicalRating$ = defer(() => this.resolvePhysicalRating()).pipe(shareReplayRefCount(1))
  protected health$ = defer(() => this.resolveHealth())

  protected perkInfos$ = this.resolvePerkInfos().pipe(shareReplayRefCount(1))
  protected gearScore$ = this.slots$.pipe(map((slots) => this.sumGearScore(slots)))
  protected weight$ = this.slots$.pipe(map((slots) => this.sumWeight(slots)))
  protected elementalAbs$ = combineLatest({ perks: this.perkInfos$, types: this.db.damagetypesMap })
    .pipe(
      map(({ perks, types }) => {
        return this.sumAbsorbtions(perks, types, 'Elemental')
      })
    )
    .pipe(shareReplayRefCount(1))
  protected physicalAbs$ = combineLatest({ perks: this.perkInfos$, types: this.db.damagetypesMap })
    .pipe(
      map(({ perks, types }) => {
        return this.sumAbsorbtions(perks, types, 'Physical')
      })
    )
    .pipe(shareReplayRefCount(1))
  protected otherAbs$ = combineLatest({ perks: this.perkInfos$, types: this.db.damagetypesMap })
    .pipe(
      map(({ perks, types }) => {
        return this.sumAbsorbtions(perks, types, null)
      })
    )
    .pipe(shareReplayRefCount(1))
  protected dmg$ = combineLatest({ perks: this.perkInfos$, types: this.db.damagetypesMap })
    .pipe(
      map(({ perks, types }) => {
        return this.sumDamages(perks, types)
      })
    )
    .pipe(shareReplayRefCount(1))
  protected consumables$ = defer(() => this.slots$).pipe(
    map((it) => it.filter((e) => e.consumable).map((it) => it.consumable))
  )
  protected attrsAssigned$ = this.gearset.gearsetAttrs$
  protected attrsBase$ = defer(() => this.perkInfos$).pipe(map((it) => this.sumMods(it)))
  protected attrsBuff$ = defer(() =>
    combineLatest({
      consumables: this.consumables$,
      effects: this.db.statusEffectsMap,
    })
  ).pipe(
    map(({ consumables, effects }) => {
      return this.sumModBuffs(consumables, effects)
    })
  )

  protected attrs$ = combineLatest({
    base: this.attrsBase$,
    assigned: this.attrsAssigned$,
    buffs: this.attrsBuff$,
  })
    .pipe(
      map(({ base, assigned, buffs }) => {
        return NW_ATTRIBUTE_TYPES.map(({ ref }) => {
          const ba = base?.[ref] || 0
          const bu = buffs?.[ref] || 0
          const as = assigned?.[ref] || 0
          return {
            key: ref,
            base: ba,
            buffs: bu,
            assigned: as,
            total: ba + bu + as,
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  protected attrsAbilities$ = defer(() => this.resolveAttributeAbilities()).pipe(shareReplay(1))
  protected skillAbilities$ = defer(() => this.resolveSkillAbilities()).pipe(shareReplay(1))
  protected armorAbilities$ = defer(() => this.perkInfos$)
    .pipe(map((it) => it?.map((e) => e.abilities)))
    .pipe(map((it) => it?.flat(1)))
    .pipe(shareReplay(1))

  protected image$ = this.gearset.imageUrl$.pipe(shareReplay(1))
  protected hasImage$ = this.image$.pipe(map((it) => !!it))
  protected iconMenu = svgEllipsisVertical

  public constructor(
    private db: NwDbService,
    private character: CharacterStore,
    private items: ItemInstancesDB,
    private gearset: GearsetStore,
    private skillBuilds: SkillBuildsDB,
    private weaponTypes: NwWeaponTypesService,
    private attributes: NwAttributesService,
    private dialog: Dialog
  ) {
    //
    this.attrsAbilities$.subscribe()
  }

  protected damageIcon(type: string) {
    return this.weaponTypes.wardTypeIcon(type) || this.weaponTypes.damageTypeIcon(type)
  }

  protected getPerkMultiplier(info: PerkInfo) {
    if (info.maybeStackable) {
      return info.count * info.scale
    }
    return info.scale
  }

  private resolveSlots() {
    return this.gearset.gearsetSlots$.pipe(
      switchMap((slots) => {
        const slots$ = Object.entries(slots || {}).map(([id, slot]) => {
          return this.resolveSlotInstance(slot).pipe(switchMap((instance) => this.resolveSlot(id, instance)))
        })
        return combineLatest(slots$)
      })
    )
    //.pipe(tap(console.log))
  }

  private resolveSlotInstance(slot: string | ItemInstance) {
    if (typeof slot === 'string') {
      return this.items.live((t) => t.get(slot))
    }
    return of(slot)
  }

  private resolveSlot(id: string, instance: ItemInstance) {
    return combineLatest({
      items: this.db.itemsMap,
      perks: this.db.perksMap,
      armors: this.db.armorsMap,
      weapons: this.db.weaponsMap,
      consumables: this.db.consumablesMap,
    }).pipe(
      switchMap(({ items, perks, armors, weapons, consumables }) => {
        const item = items.get(instance?.itemId)
        return this.resolveSlotPerks(instance, item, perks).pipe(
          map((perks) => {
            return {
              id: id,
              instance: instance,
              gearScore: instance?.gearScore ?? getItemMaxGearScore(item),
              item: item,
              armor: armors.get(item?.ItemStatsRef),
              weapon: weapons.get(item?.ItemStatsRef),
              consumable: consumables.get(item?.ItemID),
              perks: perks,
            }
          })
        )
      })
    )
  }

  private resolveSlotPerks(instance: ItemInstance, item: ItemDefinitionMaster, perks: Map<string, Perks>) {
    if (!item || !instance) {
      return of<Perks[]>([])
    }
    const fixedPerks = getItemPerkKeys(item)
      .map((key) => perks.get(instance?.perks?.[key] || item[key]))
      .filter((it) => !!it)
    const addedPerks = (getItemPerkBucketKeys(item) || [])
      .map((key) => perks.get(instance?.perks?.[key]))
      .filter((it) => !!it)
    return of([...fixedPerks, ...addedPerks])
  }

  private resolvePerkInfos() {
    return combineLatest({
      slots: this.slots$,
      affixMap: this.db.affixstatsMap,
      abilityMap: this.db.abilitiesMap,
    }).pipe(
      map(({ slots, affixMap, abilityMap }) => {
        const infos: Record<string, PerkInfo> = {}
        for (const slot of slots) {
          for (const perk of slot.perks) {
            if (infos[perk.PerkID]) {
              infos[perk.PerkID].count += 1
              continue
            }
            const affix = affixMap.get(perk.Affix)
            const abilities = perk.EquipAbility?.map((id) => abilityMap.get(id))?.map(stripAbilityProperties)
            infos[perk.PerkID] = {
              count: 1,
              perk: perk,
              scale: getPerkMultiplier(perk, slot.gearScore),
              affix: affix ? stripAffixProperties(affix) : null,
              abilities: abilities,
              maybeStackable: abilities?.some((it) => it.IsStackableAbility),
              isWeapon: !!slot.weapon,
              isArmor: !!slot.armor || perk?.ItemClass?.includes('Armor'),
              isJewelery:
                perk?.ItemClass?.includes('EquippableAmulet') ||
                perk?.ItemClass?.includes('EquippableToken') ||
                perk?.ItemClass?.includes('EquippableRing'),
              isShield:
                perk?.ItemClass?.includes('Shield') ||
                perk?.ItemClass?.includes('RoundShield') ||
                perk?.ItemClass?.includes('KiteShield') ||
                perk?.ItemClass?.includes('TowerShield'),
            }
          }
        }
        return Object.values(infos)
      })
    )
  }

  private resolveAttributeAbilities() {
    return this.attrs$.pipe(
      switchMap((attributes) => {
        return combineLatest(attributes.map((it) => this.attributes.unlockedAbilities(it.key, it.total))).pipe(
          map((it) => it.flat(1))
        )
      })
    )
  }

  private resolveSkillAbilities() {
    return combineLatest({
      primary: this.gearset.skillsPrimary$.pipe(
        switchMap((it) => (typeof it === 'string' ? this.skillBuilds.observeByid(it) : of(it)))
      ),
      secondary: this.gearset.skillsSecondary$.pipe(
        switchMap((it) => (typeof it === 'string' ? this.skillBuilds.observeByid(it) : of(it)))
      ),
      abilities: this.db.abilitiesMap,
    }).pipe(
      map(({ primary, secondary, abilities }) => {
        return [primary, secondary]
          .map((it) => [it?.tree1, it?.tree2])
          .flat(2)
          .filter((it) => !!it)
          .map((id) => abilities.get(id))
          .filter((it) => !!it)
      })
    )
  }

  private resolvePhysicalRating() {
    return combineLatest({
      baseArmor: this.basePhysicalRatingArmor$,
      baseWeapon: this.basePhysicalRatingWeapon$,
      attrsAbilities: this.attrsAbilities$.pipe(mapFilter((it) => !!it?.PhysicalArmor)),
      skillAbilities: this.skillAbilities$.pipe(mapFilter((it) => !!it?.PhysicalArmor)),
    }).pipe(
      map(({ baseArmor, baseWeapon, attrsAbilities, skillAbilities }) => {
        const summary: Array<{
          icon?: string
          label?: string
          text?: string
          value: number
        }> =[]

        const modAttrs = sum(attrsAbilities.map((it) => patchPrecision(it.PhysicalArmor))) || 0
        const modSkills = sum(skillAbilities.map((it) => patchPrecision(it.PhysicalArmor))) || 0
        const baseRating = baseArmor + baseWeapon
        summary.push({
          label: 'Base',
          value: baseRating
        })
        if (modAttrs) {
          summary.push({
            label: 'Attributes Bonus',
            value: modAttrs * baseArmor
          })
        }
        if (modSkills) {
          summary.push({
            label: 'Skills Bonus',
            value: modSkills * baseArmor
          })
        }
        const total = sum(summary.map((it) => it.value)) || 0
        const totalForHealth = baseRating * (1 + modAttrs + modSkills)
        return {
          total, summary, totalForHealth
        }
      })
    )
  }

  private resolveElementalRating() {
    return combineLatest({
      baseArmor: this.baseElementalRatingArmor$,
      baseWeapon: this.baseElementalRatingWeapon$,
      attrsAbilities: this.attrsAbilities$.pipe(mapFilter((it) => !!it?.ElementalArmor)),
      skillAbilities: this.skillAbilities$.pipe(mapFilter((it) => !!it?.ElementalArmor)),
    })
    .pipe(
      map(({ baseArmor, baseWeapon, attrsAbilities, skillAbilities }) => {
        const summary: Array<{
          icon?: string
          label?: string
          text?: string
          value: number
        }> =[]
        const modAttrs = sum(attrsAbilities.map((it) => patchPrecision(it.ElementalArmor))) || 0
        const modSkills = sum(skillAbilities.map((it) => patchPrecision(it.ElementalArmor))) || 0
        summary.push({
          label: 'Base',
          value: baseArmor + baseWeapon
        })
        if (modAttrs) {
          summary.push({
            label: 'Attributes Bonus',
            value: modAttrs * baseArmor
          })
        }
        if (modSkills) {
          summary.push({
            label: 'Skills Bonus',
            value: modSkills * baseArmor
          })
        }
        const total = sum(summary.map((it) => it.value)) || 0
        return {
          total, summary
        }
      })
    )
  }

  private resolveHealth() {
    const level$ = this.character.level$.pipe(distinctUntilChanged())
    const constitution$ = this.attrs$
      .pipe(map((it) => it.find((e) => e.key === 'con')?.total || 0))
      .pipe(distinctUntilChanged())
    return combineLatest({
      fromLevel: this.attributes.healthContributionFromLevel(level$),
      fromConst: this.attributes.healthContributionFromConstitution(constitution$),
      attrAbilities: this.attrsAbilities$.pipe(mapFilter((it) => !!it?.PhysicalArmorMaxHealthMod)),
      perks: this.perkInfos$,
      physicalRating: this.physicalRating$.pipe(map((it) => it.totalForHealth)),
    }).pipe(
      map(({ fromLevel, fromConst, physicalRating, attrAbilities, perks }) => {
        const baseHealth = fromLevel + fromConst
        const summary: Array<{
          icon?: string
          label?: string
          text?: string
          value: number
        }> =[]

        summary.push({
          label: 'Character Level',
          value: fromLevel
        })
        summary.push({
          label: 'Constitution',
          value: fromConst
        })

        for (const ability of attrAbilities) {
          const physicalContribution = patchPrecision(ability.PhysicalArmorMaxHealthMod) || 0
          summary.push({
            label: `Physical Armor`,
            text: ability.Description,
            value: physicalContribution * physicalRating
          })
        }

        for (const perk of perks || []) {
          const ability = perk.abilities?.find((it) => it.MaxHealth)
          if (!ability) {
            continue
          }
          summary.push({
            icon: perk.perk.IconPath,
            label: perk.perk.DisplayName,
            // text: perk.perk.Description,
            value: perk.scale * patchPrecision(ability.MaxHealth) * baseHealth
          })
        }
        const total = sum(summary.map((it) => it.value)) || 0

        return {
          total: total,
          summary: summary,
          haleAndHeartyBonus: baseHealth * 0.1
        }
      })
    )
  }

  private sumWeight(slots: Array<{ item: ItemDefinitionMaster; armor: ItemdefinitionsArmor }>) {
    return sumBy(slots, (it) => (it?.armor ? it.armor.WeightOverride || it.item.Weight || 0 : 0))
  }
  private sumRatingElemental(
    slots: Array<{ gearScore: number; armor: ItemdefinitionsArmor; weapon: ItemdefinitionsWeapons }>
  ) {
    return sumBy(slots, (it) => {
      return getArmorRatingElemental(it.armor || it.weapon, it.gearScore)
    })
  }
  private sumRatingPhysical(
    slots: Array<{ gearScore: number; armor: ItemdefinitionsArmor; weapon: ItemdefinitionsWeapons }>
  ) {
    return sumBy(slots, (it) => {
      return getArmorRatingPhysical(it.armor || it.weapon, it.gearScore)
    })
  }
  private sumGearScore(slots: Array<{ id: string; gearScore: number }>) {
    return totalGearScore(slots.map((it) => ({ id: it.id as any, gearScore: it.gearScore })))
  }
  private sumAbsorbtions(infos: Array<PerkInfo>, types: Map<string, Damagetypes>, category: string) {
    const stats: Record<string, StatEntry> = {}
    for (const perk of infos) {
      if (perk.isArmor || perk.isJewelery || perk.isShield) {
        for (const mod of getAffixABSs(perk.affix, perk.scale)) {
          const type = types.get(mod.type)
          if ((!category && !type) || type?.Category === category) {
            stats[mod.key] = stats[mod.key] || { key: mod.key, label: mod.label, value: 0, percent: 0 }
            stats[mod.key].percent += Number(mod.value) * perk.count
            stats[mod.key].icon = this.damageIcon(mod.type)
          }
        }
      }
    }
    return Object.values(stats)
  }
  private sumDamages(infos: Array<PerkInfo>, types: Map<string, Damagetypes>) {
    const stats: Record<string, StatEntry> = {}
    for (const perk of infos) {
      if (perk.isArmor || perk.isJewelery || perk.isShield) {
        for (const mod of getAffixDMGs(perk.affix, perk.scale)) {
          stats[mod.key] = stats[mod.key] || { key: mod.key, label: mod.label, value: 0, percent: 0 }
          stats[mod.key].percent += Number(mod.value) * perk.count
          stats[mod.key].icon = this.damageIcon(mod.key.replace('DMG', ''))
        }
      }
    }
    return Object.values(stats)
  }

  private sumModBuffs(items: ItemdefinitionsConsumables[], effects: Map<string, Statuseffect>) {
    const item = items
      .map((it) => it.AddStatusEffects?.split('+').map((e) => effects.get(e)))
      .flat(1)
      .filter((it) => !!it)
      .filter((it) => it.EffectCategories?.includes('Attributes'))?.[0]
    const mods: Record<AttributeRef, number> = {
      con: item?.MODConstitution || 0,
      dex: item?.MODDexterity || 0,
      foc: item?.MODFocus || 0,
      int: item?.MODIntelligence || 0,
      str: item?.MODStrength || 0,
    }
    return mods
  }

  private sumMods(infos: Array<PerkInfo>) {
    const mapping: Record<string, AttributeRef> = {
      MODConstitution: 'con',
      MODDexterity: 'dex',
      MODFocus: 'foc',
      MODIntelligence: 'int',
      MODStrength: 'str',
    }
    const mods: Record<AttributeRef, number> = {
      con: 5,
      dex: 5,
      foc: 5,
      int: 5,
      str: 5,
    }
    for (const perk of infos) {
      for (const mod of getAffixMODs(perk.affix, perk.scale)) {
        const key = mapping[mod.key]
        if (key in mods) {
          mods[key] = mods[key] + Number(mod.value) * perk.count
        } else {
          console.warn('unknown mod', mod.key)
        }
      }
    }
    return mods
  }

  protected async editAttributes() {
    const base = await firstValueFrom(this.attrsBase$)
    const assigned = await firstValueFrom(this.attrsAssigned$)
    const buffs = await firstValueFrom(this.attrsBuff$)
    const level = await firstValueFrom(this.characterLevel$)
    AttributeEditorDialogComponent.open(this.dialog, {
      maxWidth: 800,
      maxHeight: 400,
      panelClass: ['w-full', 'h-full', 'layout-pad', 'self-end', 'sm:self-center', 'shadow'],
      data: {
        level: level,
        assigned: assigned,
        base: base,
        buffs: buffs,
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe((res) => {
        this.gearset.updateAttrs({ attrs: res })
      })
  }

  protected async uploadFile(e: Event) {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (file.size > 1024 * 1024) {
      this.showFileTooLargeError()
      return
    }
    this.gearset.updateImage({ file: file })
  }

  protected showFileTooLargeError() {
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'File too large',
        body: `
        Maximum file size is 1MB. Reduce image resolution or use an
        <a href="https://www.google.com/search?q=online+image+optimizer" target="_blank" tabindex="-1" class="link">image optimizer</a>
        `,
        html: true,
        positive: 'OK',
      },
    })
  }
}
