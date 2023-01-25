import type {
  Affixdefinitions,
  Affixstats,
  Afflictions,
  Areadefinitions,
  Attributeconstitution,
  Attributedexterity,
  Attributefocus,
  Attributeintelligence,
  Attributestrength,
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
  Housetypes,
  ItemdefinitionsConsumables,
  ItemdefinitionsResources,
  ItemdefinitionsWeapons,
  ItemdefinitionsArmor,
  ItemdefinitionsRunes,
  Itemappearancedefinitions,
  ItemdefinitionsWeaponappearances,
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
  StaminacostsAncientguardian,
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

export abstract class NwDataLoader {
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
  public attributeconstitution() {
    return this.load<Attributeconstitution[]>('javelindata_attributeconstitution.json')
  }
  public attributedexterity() {
    return this.load<Attributedexterity[]>('javelindata_attributedexterity.json')
  }
  public attributefocus() {
    return this.load<Attributefocus[]>('javelindata_attributefocus.json')
  }
  public attributeintelligence() {
    return this.load<Attributeintelligence[]>('javelindata_attributeintelligence.json')
  }
  public attributestrength() {
    return this.load<Attributestrength[]>('javelindata_attributestrength.json')
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
  public itemdefinitionsMasterMakegoods() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_makegoods.json')
  }
  public itemdefinitionsMasterNamed() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_named.json')
  }
  public itemdefinitionsMasterNamedDepricated() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_named_depricated.json')
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
  public itemdefinitionsMasterSkins() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_skins.json')
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
  public ftueDamagetableUndeadGrenadier() {
    return this.load<Damagetable[]>('javelindata_ftue_damagetable_undead_grenadier.json')
  }
  public damagetable() {
    return this.load<Damagetable[]>('javelindata_damagetable.json')
  }
  public charactertablesAlligatorDatatablesDamagetableAlligatoryoung() {
    return this.load<Damagetable[]>('charactertables/alligator_datatables/javelindata_damagetable_alligatoryoung.json')
  }
  public charactertablesAnubianguardianDatatablesDamagetableAnubianguardianBrute() {
    return this.load<Damagetable[]>('charactertables/anubianguardian_datatables/javelindata_damagetable_anubianguardian_brute.json')
  }
  public charactertablesAnubianguardianDatatablesDamagetableAnubianguardianHorus() {
    return this.load<Damagetable[]>('charactertables/anubianguardian_datatables/javelindata_damagetable_anubianguardian_horus.json')
  }
  public charactertablesAnubianguardianDatatablesDamagetableGoliathbruteboss() {
    return this.load<Damagetable[]>('charactertables/anubianguardian_datatables/javelindata_damagetable_goliathbruteboss.json')
  }
  public charactertablesAnubianguardianDatatablesDamagetableGoliathhorusboss() {
    return this.load<Damagetable[]>('charactertables/anubianguardian_datatables/javelindata_damagetable_goliathhorusboss.json')
  }
  public charactertablesAncientguardianDatatablesDamagetableAncientamalgam() {
    return this.load<Damagetable[]>('charactertables/ancientguardian_datatables/javelindata_damagetable_ancientamalgam.json')
  }
  public charactertablesAncientguardianDatatablesDamagetableAncientguardian() {
    return this.load<Damagetable[]>('charactertables/ancientguardian_datatables/javelindata_damagetable_ancientguardian.json')
  }
  public charactertablesAncientguardianDatatablesDamagetableAncientguardianheavyboss() {
    return this.load<Damagetable[]>('charactertables/ancientguardian_datatables/javelindata_damagetable_ancientguardianheavyboss.json')
  }
  public charactertablesAnubianscarabDatatablesDamagetableAnubianlotusscarab() {
    return this.load<Damagetable[]>('charactertables/anubianscarab_datatables/javelindata_damagetable_anubianlotusscarab.json')
  }
  public charactertablesAnubianscarabDatatablesDamagetableAnubianscarab() {
    return this.load<Damagetable[]>('charactertables/anubianscarab_datatables/javelindata_damagetable_anubianscarab.json')
  }
  public charactertablesBisonDatatablesDamagetableBison() {
    return this.load<Damagetable[]>('charactertables/bison_datatables/javelindata_damagetable_bison.json')
  }
  public charactertablesBisonDatatablesDamagetableBisonStrange() {
    return this.load<Damagetable[]>('charactertables/bison_datatables/javelindata_damagetable_bison_strange.json')
  }
  public charactertablesBearDatatablesDamagetableBear() {
    return this.load<Damagetable[]>('charactertables/bear_datatables/javelindata_damagetable_bear.json')
  }
  public charactertablesBearDatatablesDamagetableBearBlack() {
    return this.load<Damagetable[]>('charactertables/bear_datatables/javelindata_damagetable_bear_black.json')
  }
  public charactertablesBearDatatablesDamagetableBearCub() {
    return this.load<Damagetable[]>('charactertables/bear_datatables/javelindata_damagetable_bear_cub.json')
  }
  public charactertablesBearDatatablesDamagetableBearDamned() {
    return this.load<Damagetable[]>('charactertables/bear_datatables/javelindata_damagetable_bear_damned.json')
  }
  public charactertablesBearDatatablesDamagetableBearElemental() {
    return this.load<Damagetable[]>('charactertables/bear_datatables/javelindata_damagetable_bear_elemental.json')
  }
  public charactertablesBearDatatablesDamagetableBearThorpeMinion() {
    return this.load<Damagetable[]>('charactertables/bear_datatables/javelindata_damagetable_bear_thorpe_minion.json')
  }
  public charactertablesArmoredDragonDamagetableArmoreddragon() {
    return this.load<Damagetable[]>('charactertables/armored_dragon/javelindata_damagetable_armoreddragon.json')
  }
  public charactertablesBomberDatatablesDamagetableBloatedCorpse() {
    return this.load<Damagetable[]>('charactertables/bomber_datatables/javelindata_damagetable_bloated_corpse.json')
  }
  public charactertablesBomberDatatablesDamagetableInvasionBomber() {
    return this.load<Damagetable[]>('charactertables/bomber_datatables/javelindata_damagetable_invasion_bomber.json')
  }
  public charactertablesBogmonsterDatatablesDamagetableBogmonster() {
    return this.load<Damagetable[]>('charactertables/bogmonster_datatables/javelindata_damagetable_bogmonster.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillager2haxe() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_2haxe.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillager2hpick() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_2hpick.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerAxethrower() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_axethrower.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerCleaver() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_cleaver.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerHammer() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_hammer.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerKnife() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_knife.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerLadel() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_ladel.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerPitchfork() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_pitchfork.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerProng() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_prong.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerRake() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_rake.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerShovel() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_shovel.json')
  }
  public charactertablesBrokenDatatablesDamagetableBrokenvillagerSickle() {
    return this.load<Damagetable[]>('charactertables/broken_datatables/javelindata_damagetable_brokenvillager_sickle.json')
  }
  public charactertablesBossDatatablesDamagetableBoss() {
    return this.load<Damagetable[]>('charactertables/boss_datatables/javelindata_damagetable_boss.json')
  }
  public charactertablesBruteDatatablesDamagetableBrute() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_brute.json')
  }
  public charactertablesBruteDatatablesDamagetableBruteYeti() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_brute_yeti.json')
  }
  public charactertablesBruteDatatablesDamagetableSwampbeast() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_swampbeast.json')
  }
  public charactertablesCorruptionheavyDatatablesDamagetableCorruptionHeavy() {
    return this.load<Damagetable[]>('charactertables/corruptionheavy_datatables/javelindata_damagetable_corruption_heavy.json')
  }
  public charactertablesCorruptionheavyDatatablesDamagetableDynastyHeavy() {
    return this.load<Damagetable[]>('charactertables/corruptionheavy_datatables/javelindata_damagetable_dynasty_heavy.json')
  }
  public charactertablesDamnedDatatablesDamagetableDamnedAcolyte() {
    return this.load<Damagetable[]>('charactertables/damned_datatables/javelindata_damagetable_damned_acolyte.json')
  }
  public charactertablesDamnedDatatablesDamagetableDamnedCultist() {
    return this.load<Damagetable[]>('charactertables/damned_datatables/javelindata_damagetable_damned_cultist.json')
  }
  public charactertablesDamnedDatatablesDamagetableDamnedGreataxe() {
    return this.load<Damagetable[]>('charactertables/damned_datatables/javelindata_damagetable_damned_greataxe.json')
  }
  public charactertablesDamnedDatatablesDamagetableDamnedPriest() {
    return this.load<Damagetable[]>('charactertables/damned_datatables/javelindata_damagetable_damned_priest.json')
  }
  public charactertablesDamnedDatatablesDamagetableOverseerzane() {
    return this.load<Damagetable[]>('charactertables/damned_datatables/javelindata_damagetable_overseerzane.json')
  }
  public charactertablesDryadDatatablesDamagetableDryadarcher() {
    return this.load<Damagetable[]>('charactertables/dryad_datatables/javelindata_damagetable_dryadarcher.json')
  }
  public charactertablesDryadDatatablesDamagetableDryadprowler() {
    return this.load<Damagetable[]>('charactertables/dryad_datatables/javelindata_damagetable_dryadprowler.json')
  }
  public charactertablesDryadDatatablesDamagetableDryadshaman() {
    return this.load<Damagetable[]>('charactertables/dryad_datatables/javelindata_damagetable_dryadshaman.json')
  }
  public charactertablesDryadDatatablesDamagetableDryadsoldier() {
    return this.load<Damagetable[]>('charactertables/dryad_datatables/javelindata_damagetable_dryadsoldier.json')
  }
  public charactertablesDryadDatatablesDamagetableDryadtendril() {
    return this.load<Damagetable[]>('charactertables/dryad_datatables/javelindata_damagetable_dryadtendril.json')
  }
  public charactertablesDryadDatatablesDamagetableDryadSiren() {
    return this.load<Damagetable[]>('charactertables/dryad_datatables/javelindata_damagetable_dryad_siren.json')
  }
  public charactertablesDynastyDatatablesDamagetableDynastyMusketeer() {
    return this.load<Damagetable[]>('charactertables/dynasty_datatables/javelindata_damagetable_dynasty_musketeer.json')
  }
  public charactertablesDynastyDatatablesDamagetableDynastySpearman() {
    return this.load<Damagetable[]>('charactertables/dynasty_datatables/javelindata_damagetable_dynasty_spearman.json')
  }
  public charactertablesDynastyDatatablesDamagetableDynastySummoner() {
    return this.load<Damagetable[]>('charactertables/dynasty_datatables/javelindata_damagetable_dynasty_summoner.json')
  }
  public charactertablesDynastyDatatablesDamagetableDynastyWarrior() {
    return this.load<Damagetable[]>('charactertables/dynasty_datatables/javelindata_damagetable_dynasty_warrior.json')
  }
  public charactertablesDunephantomDatatablesDamagetableDunephantomBerserker() {
    return this.load<Damagetable[]>('charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_berserker.json')
  }
  public charactertablesDunephantomDatatablesDamagetableDunephantomHuntress() {
    return this.load<Damagetable[]>('charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_huntress.json')
  }
  public charactertablesDunephantomDatatablesDamagetableDunephantomTank() {
    return this.load<Damagetable[]>('charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_tank.json')
  }
  public charactertablesEliteaffixDatatablesDamagetableEliteAffix() {
    return this.load<Damagetable[]>('charactertables/eliteaffix_datatables/javelindata_damagetable_elite_affix.json')
  }
  public charactertablesElkDatatablesDamagetableElkCorrupted() {
    return this.load<Damagetable[]>('charactertables/elk_datatables/javelindata_damagetable_elk_corrupted.json')
  }
  public charactertablesElkDatatablesDamagetableElkSpringstag() {
    return this.load<Damagetable[]>('charactertables/elk_datatables/javelindata_damagetable_elk_springstag.json')
  }
  public charactertablesEmpressDatatablesDamagetableEmpress() {
    return this.load<Damagetable[]>('charactertables/empress_datatables/javelindata_damagetable_empress.json')
  }
  public charactertablesEmpressDatatablesDamagetableMaiden() {
    return this.load<Damagetable[]>('charactertables/empress_datatables/javelindata_damagetable_maiden.json')
  }
  public charactertablesEmpressDatatablesDamagetablePedestal() {
    return this.load<Damagetable[]>('charactertables/empress_datatables/javelindata_damagetable_pedestal.json')
  }
  public charactertablesGhostDatatablesDamagetableGhost() {
    return this.load<Damagetable[]>('charactertables/ghost_datatables/javelindata_damagetable_ghost.json')
  }
  public charactertablesGhostDatatablesDamagetableGhostCharred() {
    return this.load<Damagetable[]>('charactertables/ghost_datatables/javelindata_damagetable_ghost_charred.json')
  }
  public charactertablesGhostDatatablesDamagetableGhostFrozen() {
    return this.load<Damagetable[]>('charactertables/ghost_datatables/javelindata_damagetable_ghost_frozen.json')
  }
  public charactertablesGhostDatatablesDamagetableGhostPlagued() {
    return this.load<Damagetable[]>('charactertables/ghost_datatables/javelindata_damagetable_ghost_plagued.json')
  }
  public charactertablesGhostDatatablesDamagetableGhostShackled() {
    return this.load<Damagetable[]>('charactertables/ghost_datatables/javelindata_damagetable_ghost_shackled.json')
  }
  public charactertablesGhostDatatablesDamagetableGhostShipwrecked() {
    return this.load<Damagetable[]>('charactertables/ghost_datatables/javelindata_damagetable_ghost_shipwrecked.json')
  }
  public charactertablesGhostDatatablesDamagetableOrGhostBoss() {
    return this.load<Damagetable[]>('charactertables/ghost_datatables/javelindata_damagetable_or_ghost_boss.json')
  }
  public charactertablesGruntDatatablesDamagetableGrunt() {
    return this.load<Damagetable[]>('charactertables/grunt_datatables/javelindata_damagetable_grunt.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanBow() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_bow.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanGreataxe() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_greataxe.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanMace() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_mace.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanRapier() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_rapier.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanSpear() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_spear.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanSpellcaster() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_spellcaster.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanSword() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_sword.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanWarhammer() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_warhammer.json')
  }
  public charactertablesIcedryadDatatablesDamagetableIcedryadFiendShivers() {
    return this.load<Damagetable[]>('charactertables/icedryad_datatables/javelindata_damagetable_icedryad_fiend_shivers.json')
  }
  public charactertablesIcedryadDatatablesDamagetableIcedryadFiendShivers2() {
    return this.load<Damagetable[]>('charactertables/icedryad_datatables/javelindata_damagetable_icedryad_fiend_shivers_2.json')
  }
  public charactertablesIcedryadDatatablesDamagetableIcedryadFrostfang() {
    return this.load<Damagetable[]>('charactertables/icedryad_datatables/javelindata_damagetable_icedryad_frostfang.json')
  }
  public charactertablesIcedryadDatatablesDamagetableIcedryadFrostgrip() {
    return this.load<Damagetable[]>('charactertables/icedryad_datatables/javelindata_damagetable_icedryad_frostgrip.json')
  }
  public charactertablesInvasionDatatablesDamagetableInvasionPriest() {
    return this.load<Damagetable[]>('charactertables/invasion_datatables/javelindata_damagetable_invasion_priest.json')
  }
  public charactertablesInvasionDatatablesDamagetableSprigganInvasion() {
    return this.load<Damagetable[]>('charactertables/invasion_datatables/javelindata_damagetable_spriggan_invasion.json')
  }
  public charactertablesIsabellaDatatablesDamagetableIsabellaDynastyshipyard() {
    return this.load<Damagetable[]>('charactertables/isabella_datatables/javelindata_damagetable_isabella_dynastyshipyard.json')
  }
  public charactertablesIsabellaDatatablesDamagetableIsabellaLairPhase1() {
    return this.load<Damagetable[]>('charactertables/isabella_datatables/javelindata_damagetable_isabella_lair_phase1.json')
  }
  public charactertablesIsabellaDatatablesDamagetableIsabellaLairPhase2() {
    return this.load<Damagetable[]>('charactertables/isabella_datatables/javelindata_damagetable_isabella_lair_phase2.json')
  }
  public charactertablesLegionDatatablesDamagetableCorruptedlegionCyclops() {
    return this.load<Damagetable[]>('charactertables/legion_datatables/javelindata_damagetable_corruptedlegion_cyclops.json')
  }
  public charactertablesLegionDatatablesDamagetableLegionGeneralCrassusBoss() {
    return this.load<Damagetable[]>('charactertables/legion_datatables/javelindata_damagetable_legion_general_crassus_boss.json')
  }
  public charactertablesLegionDatatablesDamagetableLegionLegionnaire() {
    return this.load<Damagetable[]>('charactertables/legion_datatables/javelindata_damagetable_legion_legionnaire.json')
  }
  public charactertablesLegionDatatablesDamagetableLegionSagittarii() {
    return this.load<Damagetable[]>('charactertables/legion_datatables/javelindata_damagetable_legion_sagittarii.json')
  }
  public charactertablesLegionDatatablesDamagetableLegionSignifer() {
    return this.load<Damagetable[]>('charactertables/legion_datatables/javelindata_damagetable_legion_signifer.json')
  }
  public charactertablesLionDatatablesDamagetableCorruptedTiger() {
    return this.load<Damagetable[]>('charactertables/lion_datatables/javelindata_damagetable_corrupted_tiger.json')
  }
  public charactertablesLionDatatablesDamagetableIsabellaTiger() {
    return this.load<Damagetable[]>('charactertables/lion_datatables/javelindata_damagetable_isabella_tiger.json')
  }
  public charactertablesLionDatatablesDamagetableLion() {
    return this.load<Damagetable[]>('charactertables/lion_datatables/javelindata_damagetable_lion.json')
  }
  public charactertablesLionDatatablesDamagetableTiger() {
    return this.load<Damagetable[]>('charactertables/lion_datatables/javelindata_damagetable_tiger.json')
  }
  public charactertablesLostknightsDatatablesDamagetableLostFencer() {
    return this.load<Damagetable[]>('charactertables/lostknights_datatables/javelindata_damagetable_lost_fencer.json')
  }
  public charactertablesLostknightsDatatablesDamagetableLostKnightBow() {
    return this.load<Damagetable[]>('charactertables/lostknights_datatables/javelindata_damagetable_lost_knight_bow.json')
  }
  public charactertablesLostknightsDatatablesDamagetableLostKnightTank() {
    return this.load<Damagetable[]>('charactertables/lostknights_datatables/javelindata_damagetable_lost_knight_tank.json')
  }
  public charactertablesLostknightsDatatablesDamagetableLostMonarch() {
    return this.load<Damagetable[]>('charactertables/lostknights_datatables/javelindata_damagetable_lost_monarch.json')
  }
  public charactertablesLostknightsDatatablesDamagetableLostPikeman() {
    return this.load<Damagetable[]>('charactertables/lostknights_datatables/javelindata_damagetable_lost_pikeman.json')
  }
  public charactertablesLostknightsDatatablesDamagetableMedea() {
    return this.load<Damagetable[]>('charactertables/lostknights_datatables/javelindata_damagetable_medea.json')
  }
  public charactertablesLostknightsDatatablesDamagetableSwarmancerMedeaMinion() {
    return this.load<Damagetable[]>('charactertables/lostknights_datatables/javelindata_damagetable_swarmancer_medea_minion.json')
  }
  public charactertablesNagaDatatablesDamagetableNaga() {
    return this.load<Damagetable[]>('charactertables/naga_datatables/javelindata_damagetable_naga.json')
  }
  public charactertablesNagaDatatablesDamagetableNagaAncientguardian() {
    return this.load<Damagetable[]>('charactertables/naga_datatables/javelindata_damagetable_naga_ancientguardian.json')
  }
  public charactertablesNagaDatatablesDamagetableNagaAngryearth() {
    return this.load<Damagetable[]>('charactertables/naga_datatables/javelindata_damagetable_naga_angryearth.json')
  }
  public charactertablesNagaDatatablesDamagetableNagaCorrupted() {
    return this.load<Damagetable[]>('charactertables/naga_datatables/javelindata_damagetable_naga_corrupted.json')
  }
  public charactertablesNagaDatatablesDamagetableNagaWithered() {
    return this.load<Damagetable[]>('charactertables/naga_datatables/javelindata_damagetable_naga_withered.json')
  }
  public charactertablesOgreDatatablesDamagetableCorruptedOgre() {
    return this.load<Damagetable[]>('charactertables/ogre_datatables/javelindata_damagetable_corrupted_ogre.json')
  }
  public charactertablesOgreDatatablesDamagetableCorruptedOgreMinion() {
    return this.load<Damagetable[]>('charactertables/ogre_datatables/javelindata_damagetable_corrupted_ogre_minion.json')
  }
  public charactertablesLostsirenDatatablesDamagetableLostSiren() {
    return this.load<Damagetable[]>('charactertables/lostsiren_datatables/javelindata_damagetable_lost_siren.json')
  }
  public charactertablesQuestnpcDatatablesDamagetableImhotep() {
    return this.load<Damagetable[]>('charactertables/questnpc_datatables/javelindata_damagetable_imhotep.json')
  }
  public charactertablesQuestnpcDatatablesDamagetableZaneTendril() {
    return this.load<Damagetable[]>('charactertables/questnpc_datatables/javelindata_damagetable_zane_tendril.json')
  }
  public charactertablesRisenDatatablesDamagetableBlightfiend() {
    return this.load<Damagetable[]>('charactertables/risen_datatables/javelindata_damagetable_blightfiend.json')
  }
  public charactertablesRisenDatatablesDamagetableCorruptionentity() {
    return this.load<Damagetable[]>('charactertables/risen_datatables/javelindata_damagetable_corruptionentity.json')
  }
  public charactertablesRisenDatatablesDamagetableRisen() {
    return this.load<Damagetable[]>('charactertables/risen_datatables/javelindata_damagetable_risen.json')
  }
  public charactertablesRisenDatatablesDamagetableSwampFiend() {
    return this.load<Damagetable[]>('charactertables/risen_datatables/javelindata_damagetable_swamp_fiend.json')
  }
  public charactertablesRisenDatatablesDamagetableWitheredFeculent() {
    return this.load<Damagetable[]>('charactertables/risen_datatables/javelindata_damagetable_withered_feculent.json')
  }
  public charactertablesRisenDatatablesDamagetableWitheredSwarmancer() {
    return this.load<Damagetable[]>('charactertables/risen_datatables/javelindata_damagetable_withered_swarmancer.json')
  }
  public charactertablesSandelementalDatatablesDamagetableSandelementalHeavy() {
    return this.load<Damagetable[]>('charactertables/sandelemental_datatables/javelindata_damagetable_sandelemental_heavy.json')
  }
  public charactertablesSandelementalDatatablesDamagetableSandelementalQuestboss() {
    return this.load<Damagetable[]>('charactertables/sandelemental_datatables/javelindata_damagetable_sandelemental_questboss.json')
  }
  public charactertablesSandelementalDatatablesDamagetableSandelementalShaman() {
    return this.load<Damagetable[]>('charactertables/sandelemental_datatables/javelindata_damagetable_sandelemental_shaman.json')
  }
  public charactertablesSandElementalSoldierDamagetableSandElementalSoldier() {
    return this.load<Damagetable[]>('charactertables/sand_elemental_soldier/javelindata_damagetable_sand_elemental_soldier.json')
  }
  public charactertablesScorpionDatatablesDamagetableScorpion() {
    return this.load<Damagetable[]>('charactertables/scorpion_datatables/javelindata_damagetable_scorpion.json')
  }
  public charactertablesScorpionDatatablesDamagetableScorpionImpaler() {
    return this.load<Damagetable[]>('charactertables/scorpion_datatables/javelindata_damagetable_scorpion_impaler.json')
  }
  public charactertablesScorpionDatatablesDamagetableScorpionSlinger() {
    return this.load<Damagetable[]>('charactertables/scorpion_datatables/javelindata_damagetable_scorpion_slinger.json')
  }
  public charactertablesScorpionDatatablesDamagetableScorpionSulfur() {
    return this.load<Damagetable[]>('charactertables/scorpion_datatables/javelindata_damagetable_scorpion_sulfur.json')
  }
  public charactertablesSkeletonDatatablesDamagetableEzraforgemaster() {
    return this.load<Damagetable[]>('charactertables/skeleton_datatables/javelindata_damagetable_ezraforgemaster.json')
  }
  public charactertablesSkeletonDatatablesDamagetableSkeleton1hsword() {
    return this.load<Damagetable[]>('charactertables/skeleton_datatables/javelindata_damagetable_skeleton1hsword.json')
  }
  public charactertablesSkeletonDatatablesDamagetableSkeleton2hsword() {
    return this.load<Damagetable[]>('charactertables/skeleton_datatables/javelindata_damagetable_skeleton2hsword.json')
  }
  public charactertablesSkeletonDatatablesDamagetableSkeletonarcher() {
    return this.load<Damagetable[]>('charactertables/skeleton_datatables/javelindata_damagetable_skeletonarcher.json')
  }
  public charactertablesSkeletonDatatablesDamagetableSkeletonclub() {
    return this.load<Damagetable[]>('charactertables/skeleton_datatables/javelindata_damagetable_skeletonclub.json')
  }
  public charactertablesSkeletonDatatablesDamagetableSkeletonmage() {
    return this.load<Damagetable[]>('charactertables/skeleton_datatables/javelindata_damagetable_skeletonmage.json')
  }
  public charactertablesSkeletonDatatablesDamagetableSkeletonspear() {
    return this.load<Damagetable[]>('charactertables/skeleton_datatables/javelindata_damagetable_skeletonspear.json')
  }
  public charactertablesSpellbotDatatablesDamagetableSpellbot() {
    return this.load<Damagetable[]>('charactertables/spellbot_datatables/javelindata_damagetable_spellbot.json')
  }
  public charactertablesSprigganDatatablesDamagetableSpriggan() {
    return this.load<Damagetable[]>('charactertables/spriggan_datatables/javelindata_damagetable_spriggan.json')
  }
  public charactertablesSprigganDatatablesDamagetableSprigganCorrupted() {
    return this.load<Damagetable[]>('charactertables/spriggan_datatables/javelindata_damagetable_spriggan_corrupted.json')
  }
  public charactertablesSulfurDragonDamagetableSulfurdragon() {
    return this.load<Damagetable[]>('charactertables/sulfur_dragon/javelindata_damagetable_sulfurdragon.json')
  }
  public charactertablesSulfurDragonDamagetableSulfurlizard() {
    return this.load<Damagetable[]>('charactertables/sulfur_dragon/javelindata_damagetable_sulfurlizard.json')
  }
  public charactertablesSwarmerDatatablesDamagetableCorruptedswarmer() {
    return this.load<Damagetable[]>('charactertables/swarmer_datatables/javelindata_damagetable_corruptedswarmer.json')
  }
  public charactertablesSwarmerDatatablesDamagetableSkeletoncrawler() {
    return this.load<Damagetable[]>('charactertables/swarmer_datatables/javelindata_damagetable_skeletoncrawler.json')
  }
  public charactertablesTorsobossDatatablesDamagetableTorsoBoss() {
    return this.load<Damagetable[]>('charactertables/torsoboss_datatables/javelindata_damagetable_torso_boss.json')
  }
  public charactertablesTurkeyDatatablesDamagetableTurkey() {
    return this.load<Damagetable[]>('charactertables/turkey_datatables/javelindata_damagetable_turkey.json')
  }
  public charactertablesSulfurelementalDamagetablesDamagetableSulfurelementalentity() {
    return this.load<Damagetable[]>('charactertables/sulfurelemental_damagetables/javelindata_damagetable_sulfurelementalentity.json')
  }
  public charactertablesWispywaspswarmDatatablesDamagetableWispyWaspSwarm() {
    return this.load<Damagetable[]>('charactertables/wispywaspswarm_datatables/javelindata_damagetable_wispy_wasp_swarm.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadAdmiralBrute() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_admiral_brute.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadBerserker() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_berserker.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadBrute() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_brute.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadGravedigger() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_gravedigger.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadGrenadier() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_grenadier.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadHunter() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_hunter.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadJavelineer() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_javelineer.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadNavigator() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_navigator.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadOfficer() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_officer.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadPirateBrute() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_pirate_brute.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadPistoleer() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_pistoleer.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadSailor() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_sailor.json')
  }
  public charactertablesUndeadDatatablesDamagetableUndeadShaman() {
    return this.load<Damagetable[]>('charactertables/undead_datatables/javelindata_damagetable_undead_shaman.json')
  }
  public charactertablesWitheredbeetleDatatablesDamagetableWitheredbeetle() {
    return this.load<Damagetable[]>('charactertables/witheredbeetle_datatables/javelindata_damagetable_witheredbeetle.json')
  }
  public charactertablesWolfDatatablesDamagetableDamnedHound() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_damned_hound.json')
  }
  public charactertablesWolfDatatablesDamagetableEvilKnightHound() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_evil_knight_hound.json')
  }
  public charactertablesWolfDatatablesDamagetableKnightWolf() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_knight_wolf.json')
  }
  public charactertablesWolfDatatablesDamagetablePriestLesserDamnedHound() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_priest_lesser_damned_hound.json')
  }
  public charactertablesWolfDatatablesDamagetableWolf() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_wolf.json')
  }
  public charactertablesWolfDatatablesDamagetableWolfAlpha() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_wolf_alpha.json')
  }
  public charactertablesWolfDatatablesDamagetableWolfBrown() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_wolf_brown.json')
  }
  public charactertablesWolfDatatablesDamagetableWolfWhite() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_wolf_white.json')
  }
  public charactertablesWolfDatatablesDamagetableWolfWinter() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/javelindata_damagetable_wolf_winter.json')
  }
  public charactertablesWolfDatatablesNamedDamagetableWolfBarkimedes() {
    return this.load<Damagetable[]>('charactertables/wolf_datatables/named/javelindata_damagetable_wolf_barkimedes.json')
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
  public housetypes() {
    return this.load<Housetypes[]>('javelindata_housetypes.json')
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
  public itemdefinitionsRunes() {
    return this.load<ItemdefinitionsRunes[]>('javelindata_itemdefinitions_runes.json')
  }
  public itemappearancedefinitions() {
    return this.load<Itemappearancedefinitions[]>('javelindata_itemappearancedefinitions.json')
  }
  public itemdefinitionsWeaponappearances() {
    return this.load<ItemdefinitionsWeaponappearances[]>('javelindata_itemdefinitions_weaponappearances.json')
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
  public statuseffectsRunes() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_runes.json')
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
  public spelltableRunes() {
    return this.load<Spelltable[]>('javelindata_spelltable_runes.json')
  }
  public spelltableSpear() {
    return this.load<Spelltable[]>('javelindata_spelltable_spear.json')
  }
  public spelltableSword() {
    return this.load<Spelltable[]>('javelindata_spelltable_sword.json')
  }
  public spelltableThrowables() {
    return this.load<Spelltable[]>('javelindata_spelltable_throwables.json')
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
  public charactertablesAncientguardianDatatablesStaminacostsAncientguardian() {
    return this.load<StaminacostsAncientguardian[]>('charactertables/ancientguardian_datatables/javelindata_staminacosts_ancientguardian.json')
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
  public weaponabilitiesAbilityGreatsword() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_greatsword.json')
  }
  public weaponabilitiesAbilityHatchet() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_hatchet.json')
  }
  public weaponabilitiesAbilityIcemagic() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_icemagic.json')
  }
  public weaponabilitiesAbilityItems() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_items.json')
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
  public weaponabilitiesAbilityRune() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_rune.json')
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