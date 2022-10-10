import type {
  Affixdefinitions,
  Affixstats,
  Afflictions,
  Areadefinitions,
  Categoricalprogression,
  Crafting,
  ItemDefinitionMaster,
  Craftingcategories,
  Damagetable,
  Damagetypes,
  GameEvent,
  Gamemodes,
  Gatherables,
  VariationsLockedInteractGatherables,
  Housingitems,
  ItemdefinitionsConsumables,
  ItemdefinitionsResources,
  ItemdefinitionsWeapons,
  ItemdefinitionsArmor,
  Lootbuckets,
  Lootlimits,
  Loottable,
  ManacostsPlayer,
  Metaachievements,
  Milestonerewards,
  Perkbuckets,
  Perks,
  Statuseffect,
  Spelltable,
  StaminacostsPlayer,
  Statuseffectcategories,
  TerritoryStanding,
  Territorydefinitions,
  Territorygovernance,
  Tradeskillarcana,
  Tradeskillarmoring,
  Tradeskillazothstaff,
  Tradeskillcooking,
  Tradeskillengineering,
  Tradeskillfishing,
  Tradeskillfurnishing,
  Tradeskillharvesting,
  Tradeskilljewelcrafting,
  Tradeskillleatherworking,
  Tradeskilllogging,
  Tradeskillmining,
  Tradeskillmusician,
  Tradeskillpostcap,
  Tradeskillskinning,
  Tradeskillsmelting,
  Tradeskillstonecutting,
  Tradeskillweaponsmithing,
  Tradeskillweaving,
  Tradeskillwoodworking,
  Umbralgsupgrades,
  Vitals,
  Vitalscategories,
  Vitalsleveldata,
  Vitalsmodifierdata,
  Weaponmastery,
  Xpamountsbylevel,
  Arenadefinitions,
  Cursemutations,
  Elementalmutationperks,
  Elementalmutations,
  Mutationdifficulty,
  Mutationrankdata,
  Promotionmutations,
  PoiDefinition,
  Ability,
} from './types'
import { Observable } from 'rxjs'

export abstract class NwDataloader {
  public abstract load<T>(path: string): Observable<T>
  public affixdefinitions() {
    return this.load<Affixdefinitions[]>('javelindata_affixdefinitions.json')
  }
  public affixstats() {
    return this.load<Affixstats[]>('javelindata_affixstats.json')
  }
  public afflictions() {
    return this.load<Afflictions[]>('javelindata_afflictions.json')
  }
  public areadefinitions() {
    return this.load<Areadefinitions[]>('javelindata_areadefinitions.json')
  }
  public categoricalprogression() {
    return this.load<Categoricalprogression[]>('javelindata_categoricalprogression.json')
  }
  public crafting() {
    return this.load<Crafting[]>('javelindata_crafting.json')
  }
  public itemdefinitionsMasterCrafting() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_crafting.json')
  }
  public itemdefinitionsMasterAi() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_ai.json')
  }
  public itemdefinitionsMasterCommon() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_common.json')
  }
  public itemdefinitionsMasterFaction() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_faction.json')
  }
  public itemdefinitionsMasterLoot() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_loot.json')
  }
  public itemdefinitionsMasterNamed() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_named.json')
  }
  public itemdefinitionsMasterOmega() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_omega.json')
  }
  public itemdefinitionsMasterPlaytest() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_playtest.json')
  }
  public itemdefinitionsMasterPvp() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_pvp.json')
  }
  public itemdefinitionsMasterQuest() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_quest.json')
  }
  public itemdefinitionsMasterStore() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_store.json')
  }
  public craftingcategories() {
    return this.load<Craftingcategories[]>('javelindata_craftingcategories.json')
  }
  public damagetableAlligator() {
    return this.load<Damagetable[]>('javelindata_damagetable_alligator.json')
  }
  public damagetableBoar() {
    return this.load<Damagetable[]>('javelindata_damagetable_boar.json')
  }
  public damagetableBroken() {
    return this.load<Damagetable[]>('javelindata_damagetable_broken.json')
  }
  public damagetableDamned() {
    return this.load<Damagetable[]>('javelindata_damagetable_damned.json')
  }
  public damagetableDamnedCommander() {
    return this.load<Damagetable[]>('javelindata_damagetable_damned_commander.json')
  }
  public damagetableDamnedCommanderFtue() {
    return this.load<Damagetable[]>('javelindata_damagetable_damned_commander_ftue.json')
  }
  public damagetableDungeon() {
    return this.load<Damagetable[]>('javelindata_damagetable_dungeon.json')
  }
  public damagetableElk() {
    return this.load<Damagetable[]>('javelindata_damagetable_elk.json')
  }
  public damagetableGoat() {
    return this.load<Damagetable[]>('javelindata_damagetable_goat.json')
  }
  public damagetableMutators() {
    return this.load<Damagetable[]>('javelindata_damagetable_mutators.json')
  }
  public damagetablePerks() {
    return this.load<Damagetable[]>('javelindata_damagetable_perks.json')
  }
  public damagetableSkeleton() {
    return this.load<Damagetable[]>('javelindata_damagetable_skeleton.json')
  }
  public damagetableSpirit() {
    return this.load<Damagetable[]>('javelindata_damagetable_spirit.json')
  }
  public damagetableStructures() {
    return this.load<Damagetable[]>('javelindata_damagetable_structures.json')
  }
  public damagetableTendrilCorrupted() {
    return this.load<Damagetable[]>('javelindata_damagetable_tendril_corrupted.json')
  }
  public damagetableUndead() {
    return this.load<Damagetable[]>('javelindata_damagetable_undead.json')
  }
  public ftueDamagetableDamned() {
    return this.load<Damagetable[]>('javelindata_ftue_damagetable_damned.json')
  }
  public damagetable() {
    return this.load<Damagetable[]>('javelindata_damagetable.json')
  }
  public damagetypes() {
    return this.load<Damagetypes[]>('javelindata_damagetypes.json')
  }
  public gameevents() {
    return this.load<GameEvent[]>('javelindata_gameevents.json')
  }
  public gamemodes() {
    return this.load<Gamemodes[]>('javelindata_gamemodes.json')
  }
  public gatherables() {
    return this.load<Gatherables[]>('javelindata_gatherables.json')
  }
  public variationsLockedInteractGatherables() {
    return this.load<VariationsLockedInteractGatherables[]>('javelindata_variations_locked_interact_gatherables.json')
  }
  public housingitems() {
    return this.load<Housingitems[]>('javelindata_housingitems.json')
  }
  public itemdefinitionsConsumables() {
    return this.load<ItemdefinitionsConsumables[]>('javelindata_itemdefinitions_consumables.json')
  }
  public itemdefinitionsResources() {
    return this.load<ItemdefinitionsResources[]>('javelindata_itemdefinitions_resources.json')
  }
  public itemdefinitionsWeapons() {
    return this.load<ItemdefinitionsWeapons[]>('javelindata_itemdefinitions_weapons.json')
  }
  public itemdefinitionsArmor() {
    return this.load<ItemdefinitionsArmor[]>('javelindata_itemdefinitions_armor.json')
  }
  public lootbuckets() {
    return this.load<Lootbuckets[]>('javelindata_lootbuckets.json')
  }
  public lootlimits() {
    return this.load<Lootlimits[]>('javelindata_lootlimits.json')
  }
  public loottables() {
    return this.load<Loottable[]>('javelindata_loottables.json')
  }
  public loottablesOmega() {
    return this.load<Loottable[]>('javelindata_loottables_omega.json')
  }
  public loottablesPlaytest() {
    return this.load<Loottable[]>('javelindata_loottables_playtest.json')
  }
  public loottablesPvpRewardsTrack() {
    return this.load<Loottable[]>('javelindata_loottables_pvp_rewards_track.json')
  }
  public loottablesSalvage() {
    return this.load<Loottable[]>('javelindata_loottables_salvage.json')
  }
  public manacostsPlayer() {
    return this.load<ManacostsPlayer[]>('javelindata_manacosts_player.json')
  }
  public metaachievements() {
    return this.load<Metaachievements[]>('javelindata_metaachievements.json')
  }
  public milestonerewards() {
    return this.load<Milestonerewards[]>('javelindata_milestonerewards.json')
  }
  public perkbuckets() {
    return this.load<Perkbuckets[]>('javelindata_perkbuckets.json')
  }
  public perks() {
    return this.load<Perks[]>('javelindata_perks.json')
  }
  public statuseffectsPerks() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_perks.json')
  }
  public statuseffectsAi() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_ai.json')
  }
  public statuseffectsBlunderbuss() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_blunderbuss.json')
  }
  public statuseffectsBow() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_bow.json')
  }
  public statuseffectsCommon() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_common.json')
  }
  public statuseffectsFirestaff() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_firestaff.json')
  }
  public statuseffectsGreataxe() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_greataxe.json')
  }
  public statuseffectsGreatsword() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_greatsword.json')
  }
  public statuseffectsHatchet() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_hatchet.json')
  }
  public statuseffectsIcemagic() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_icemagic.json')
  }
  public statuseffectsItem() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_item.json')
  }
  public statuseffectsLifestaff() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_lifestaff.json')
  }
  public statuseffectsMusket() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_musket.json')
  }
  public statuseffectsRapier() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_rapier.json')
  }
  public statuseffectsSpear() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_spear.json')
  }
  public statuseffectsSword() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_sword.json')
  }
  public statuseffectsVoidgauntlet() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_voidgauntlet.json')
  }
  public statuseffectsWarhammer() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_warhammer.json')
  }
  public statuseffects() {
    return this.load<Statuseffect[]>('javelindata_statuseffects.json')
  }
  public spelltableAi() {
    return this.load<Spelltable[]>('javelindata_spelltable_ai.json')
  }
  public spelltableBlunderbuss() {
    return this.load<Spelltable[]>('javelindata_spelltable_blunderbuss.json')
  }
  public spelltableBow() {
    return this.load<Spelltable[]>('javelindata_spelltable_bow.json')
  }
  public spelltableFiremagic() {
    return this.load<Spelltable[]>('javelindata_spelltable_firemagic.json')
  }
  public spelltableGlobal() {
    return this.load<Spelltable[]>('javelindata_spelltable_global.json')
  }
  public spelltableGreataxe() {
    return this.load<Spelltable[]>('javelindata_spelltable_greataxe.json')
  }
  public spelltableGreatsword() {
    return this.load<Spelltable[]>('javelindata_spelltable_greatsword.json')
  }
  public spelltableHatchet() {
    return this.load<Spelltable[]>('javelindata_spelltable_hatchet.json')
  }
  public spelltableIcemagic() {
    return this.load<Spelltable[]>('javelindata_spelltable_icemagic.json')
  }
  public spelltableLifemagic() {
    return this.load<Spelltable[]>('javelindata_spelltable_lifemagic.json')
  }
  public spelltableMusket() {
    return this.load<Spelltable[]>('javelindata_spelltable_musket.json')
  }
  public spelltableRapier() {
    return this.load<Spelltable[]>('javelindata_spelltable_rapier.json')
  }
  public spelltableSpear() {
    return this.load<Spelltable[]>('javelindata_spelltable_spear.json')
  }
  public spelltableSword() {
    return this.load<Spelltable[]>('javelindata_spelltable_sword.json')
  }
  public spelltableVoidgauntlet() {
    return this.load<Spelltable[]>('javelindata_spelltable_voidgauntlet.json')
  }
  public spelltableWarhammer() {
    return this.load<Spelltable[]>('javelindata_spelltable_warhammer.json')
  }
  public spelltable() {
    return this.load<Spelltable[]>('javelindata_spelltable.json')
  }
  public staminacostsPlayer() {
    return this.load<StaminacostsPlayer[]>('javelindata_staminacosts_player.json')
  }
  public statuseffectcategories() {
    return this.load<Statuseffectcategories[]>('javelindata_statuseffectcategories.json')
  }
  public territoryStanding() {
    return this.load<TerritoryStanding[]>('javelindata_territory_standing.json')
  }
  public territorydefinitions() {
    return this.load<Territorydefinitions[]>('javelindata_territorydefinitions.json')
  }
  public territorygovernance() {
    return this.load<Territorygovernance[]>('javelindata_territorygovernance.json')
  }
  public tradeskillarcana() {
    return this.load<Tradeskillarcana[]>('javelindata_tradeskillarcana.json')
  }
  public tradeskillarmoring() {
    return this.load<Tradeskillarmoring[]>('javelindata_tradeskillarmoring.json')
  }
  public tradeskillazothstaff() {
    return this.load<Tradeskillazothstaff[]>('javelindata_tradeskillazothstaff.json')
  }
  public tradeskillcooking() {
    return this.load<Tradeskillcooking[]>('javelindata_tradeskillcooking.json')
  }
  public tradeskillengineering() {
    return this.load<Tradeskillengineering[]>('javelindata_tradeskillengineering.json')
  }
  public tradeskillfishing() {
    return this.load<Tradeskillfishing[]>('javelindata_tradeskillfishing.json')
  }
  public tradeskillfurnishing() {
    return this.load<Tradeskillfurnishing[]>('javelindata_tradeskillfurnishing.json')
  }
  public tradeskillharvesting() {
    return this.load<Tradeskillharvesting[]>('javelindata_tradeskillharvesting.json')
  }
  public tradeskilljewelcrafting() {
    return this.load<Tradeskilljewelcrafting[]>('javelindata_tradeskilljewelcrafting.json')
  }
  public tradeskillleatherworking() {
    return this.load<Tradeskillleatherworking[]>('javelindata_tradeskillleatherworking.json')
  }
  public tradeskilllogging() {
    return this.load<Tradeskilllogging[]>('javelindata_tradeskilllogging.json')
  }
  public tradeskillmining() {
    return this.load<Tradeskillmining[]>('javelindata_tradeskillmining.json')
  }
  public tradeskillmusician() {
    return this.load<Tradeskillmusician[]>('javelindata_tradeskillmusician.json')
  }
  public tradeskillpostcap() {
    return this.load<Tradeskillpostcap[]>('javelindata_tradeskillpostcap.json')
  }
  public tradeskillskinning() {
    return this.load<Tradeskillskinning[]>('javelindata_tradeskillskinning.json')
  }
  public tradeskillsmelting() {
    return this.load<Tradeskillsmelting[]>('javelindata_tradeskillsmelting.json')
  }
  public tradeskillstonecutting() {
    return this.load<Tradeskillstonecutting[]>('javelindata_tradeskillstonecutting.json')
  }
  public tradeskillweaponsmithing() {
    return this.load<Tradeskillweaponsmithing[]>('javelindata_tradeskillweaponsmithing.json')
  }
  public tradeskillweaving() {
    return this.load<Tradeskillweaving[]>('javelindata_tradeskillweaving.json')
  }
  public tradeskillwoodworking() {
    return this.load<Tradeskillwoodworking[]>('javelindata_tradeskillwoodworking.json')
  }
  public umbralgsupgrades() {
    return this.load<Umbralgsupgrades[]>('javelindata_umbralgsupgrades.json')
  }
  public vitals() {
    return this.load<Vitals[]>('javelindata_vitals.json')
  }
  public vitalscategories() {
    return this.load<Vitalscategories[]>('javelindata_vitalscategories.json')
  }
  public vitalsleveldata() {
    return this.load<Vitalsleveldata[]>('javelindata_vitalsleveldata.json')
  }
  public vitalsmodifierdata() {
    return this.load<Vitalsmodifierdata[]>('javelindata_vitalsmodifierdata.json')
  }
  public weaponmastery() {
    return this.load<Weaponmastery[]>('javelindata_weaponmastery.json')
  }
  public xpamountsbylevel() {
    return this.load<Xpamountsbylevel[]>('javelindata_xpamountsbylevel.json')
  }
  public arenasArenadefinitions() {
    return this.load<Arenadefinitions[]>('arenas/javelindata_arenadefinitions.json')
  }
  public gamemodemutatorsCursemutations() {
    return this.load<Cursemutations[]>('gamemodemutators/javelindata_cursemutations.json')
  }
  public gamemodemutatorsElementalmutationperks() {
    return this.load<Elementalmutationperks[]>('gamemodemutators/javelindata_elementalmutationperks.json')
  }
  public gamemodemutatorsElementalmutations() {
    return this.load<Elementalmutations[]>('gamemodemutators/javelindata_elementalmutations.json')
  }
  public gamemodemutatorsMutationdifficulty() {
    return this.load<Mutationdifficulty[]>('gamemodemutators/javelindata_mutationdifficulty.json')
  }
  public gamemodemutatorsMutationrankdata() {
    return this.load<Mutationrankdata[]>('gamemodemutators/javelindata_mutationrankdata.json')
  }
  public gamemodemutatorsPromotionmutations() {
    return this.load<Promotionmutations[]>('gamemodemutators/javelindata_promotionmutations.json')
  }
  public pointofinterestdefinitionsPoidefinitions0202() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_02_02.json')
  }
  public pointofinterestdefinitionsPoidefinitions0203() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_02_03.json')
  }
  public pointofinterestdefinitionsPoidefinitions0204() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_02_04.json')
  }
  public pointofinterestdefinitionsPoidefinitions0300() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_03_00.json')
  }
  public pointofinterestdefinitionsPoidefinitions0301() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_03_01.json')
  }
  public pointofinterestdefinitionsPoidefinitions0302() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_03_02.json')
  }
  public pointofinterestdefinitionsPoidefinitions0303() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_03_03.json')
  }
  public pointofinterestdefinitionsPoidefinitions0304() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_03_04.json')
  }
  public pointofinterestdefinitionsPoidefinitions0400() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_04_00.json')
  }
  public pointofinterestdefinitionsPoidefinitions0401() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_04_01.json')
  }
  public pointofinterestdefinitionsPoidefinitions0402() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_04_02.json')
  }
  public pointofinterestdefinitionsPoidefinitions0403() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_04_03.json')
  }
  public pointofinterestdefinitionsPoidefinitions0404() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_04_04.json')
  }
  public pointofinterestdefinitionsPoidefinitions0501() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_05_01.json')
  }
  public pointofinterestdefinitionsPoidefinitions0502() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_05_02.json')
  }
  public pointofinterestdefinitionsPoidefinitions0503() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_05_03.json')
  }
  public pointofinterestdefinitionsPoidefinitions0504() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_05_04.json')
  }
  public pointofinterestdefinitionsPoidefinitions0602() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_06_02.json')
  }
  public pointofinterestdefinitionsPoidefinitions0603() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_06_03.json')
  }
  public pointofinterestdefinitionsPoidefinitions0604() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_06_04.json')
  }
  public pointofinterestdefinitionsPoidefinitionsDevworld() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_devworld.json')
  }
  public weaponabilitiesAbilityAi() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_ai.json')
  }
  public weaponabilitiesAbilityAttributethreshold() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_attributethreshold.json')
  }
  public weaponabilitiesAbilityBlunderbuss() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_blunderbuss.json')
  }
  public weaponabilitiesAbilityBow() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_bow.json')
  }
  public weaponabilitiesAbilityFiremagic() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_firemagic.json')
  }
  public weaponabilitiesAbilityGlobal() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_global.json')
  }
  public weaponabilitiesAbilityGreataxe() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_greataxe.json')
  }
  public weaponabilitiesAbilityHatchet() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_hatchet.json')
  }
  public weaponabilitiesAbilityIcemagic() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_icemagic.json')
  }
  public weaponabilitiesAbilityLifemagic() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_lifemagic.json')
  }
  public weaponabilitiesAbilityMusket() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_musket.json')
  }
  public weaponabilitiesAbilityRapier() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_rapier.json')
  }
  public weaponabilitiesAbilitySpear() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_spear.json')
  }
  public weaponabilitiesAbilitySword() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_sword.json')
  }
  public weaponabilitiesAbilityVoidgauntlet() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_voidgauntlet.json')
  }
  public weaponabilitiesAbilityWarhammer() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_warhammer.json')
  }
}