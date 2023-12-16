import type {
  Ability,
  Achievements,
  Affixdefinitions,
  Affixstats,
  Afflictions,
  Areadefinitions,
  Arenadefinitions,
  Attributeconstitution,
  Attributedexterity,
  Attributefocus,
  Attributeintelligence,
  Attributestrength,
  Backstorydata,
  Buffbuckets,
  Categoricalprogression,
  CooldownsPlayer,
  Costumechanges,
  Crafting,
  Craftingcategories,
  Cursemutations,
  Damagetable,
  Damagetypes,
  Dyecolors,
  Elementalmutationperks,
  Elementalmutations,
  Emotedefinitions,
  Entitlements,
  GameEvent,
  Gamemodes,
  Gatherables,
  GatherablesMetadata,
  Housetypes,
  Housingitems,
  ItemDefinitionMaster,
  ItemDefinitionMtx,
  Itemappearancedefinitions,
  ItemdefinitionsAmmo,
  ItemdefinitionsArmor,
  ItemdefinitionsConsumables,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsResources,
  ItemdefinitionsRunes,
  ItemdefinitionsWeaponappearances,
  ItemdefinitionsWeaponappearancesMountattachments,
  ItemdefinitionsWeapons,
  Lootbuckets,
  Lootlimits,
  Loottable,
  Loreitems,
  ManacostsPlayer,
  Metaachievements,
  Milestonerewards,
  Mounts,
  Mutationdifficulty,
  Mutationrankdata,
  Npc,
  Objective,
  Objectivetasks,
  Perkbuckets,
  Perks,
  Playertitles,
  PlayertitlesCategories,
  PoiDefinition,
  Promotionmutations,
  PvpRewards,
  PvpStore,
  PvpbalanceArena,
  PvpbalanceOpenworld,
  PvpbalanceOutpostrush,
  PvpbalanceWar,
  Rewarddata,
  SandelementalHeavySandworm,
  SeasonPassData,
  SpellsMetadata,
  Spelltable,
  StaminacostsPlayer,
  Statuseffect,
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
  Tradeskillriding,
  Tradeskillskinning,
  Tradeskillsmelting,
  Tradeskillstonecutting,
  Tradeskillweaponsmithing,
  Tradeskillweaving,
  Tradeskillwoodworking,
  VariationsAi,
  VariationsCuttrunks,
  VariationsDarkness,
  VariationsGatherables,
  VariationsLockedInteractGatherables,
  VariationsLootcontainers,
  VariationsMetadata,
  VariationsRandomencounters,
  Vitals,
  VitalsFirstlight,
  VitalsMetadata,
  VitalsPlayer,
  Vitalscategories,
  Vitalsleveldata,
  Vitalsmodifierdata,
  Weaponmastery,
  Xpamountsbylevel,
} from './types'
import { Observable } from 'rxjs'

export abstract class NwDataLoader {
  public abstract load<T>(path: string): Observable<T>
  public achievements() {
    return this.load<Achievements[]>('javelindata_achievements.json')
  }
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
  public arenasArenadefinitions() {
    return this.load<Arenadefinitions[]>('arenas/javelindata_arenadefinitions.json')
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
  public backstorydata() {
    return this.load<Backstorydata[]>('javelindata_backstorydata.json')
  }
  public buffbuckets() {
    return this.load<Buffbuckets[]>('javelindata_buffbuckets.json')
  }
  public categoricalprogression() {
    return this.load<Categoricalprogression[]>('javelindata_categoricalprogression.json')
  }
  public charactertablesAdianaDatatablesDamagetableAdianaArcher() {
    return this.load<Damagetable[]>('charactertables/adiana_datatables/javelindata_damagetable_adiana_archer.json')
  }
  public charactertablesAlligatorDatatablesDamagetableAlligatoryoung() {
    return this.load<Damagetable[]>('charactertables/alligator_datatables/javelindata_damagetable_alligatoryoung.json')
  }
  public charactertablesAncientguardianDatatablesDamagetableAgIceBowman() {
    return this.load<Damagetable[]>('charactertables/ancientguardian_datatables/javelindata_damagetable_ag_ice_bowman.json')
  }
  public charactertablesAncientguardianDatatablesDamagetableAgIceGreatsword() {
    return this.load<Damagetable[]>('charactertables/ancientguardian_datatables/javelindata_damagetable_ag_ice_greatsword.json')
  }
  public charactertablesAncientguardianDatatablesDamagetableAgIceSpearman() {
    return this.load<Damagetable[]>('charactertables/ancientguardian_datatables/javelindata_damagetable_ag_ice_spearman.json')
  }
  public charactertablesAncientguardianDatatablesDamagetableAgIceWarhammer() {
    return this.load<Damagetable[]>('charactertables/ancientguardian_datatables/javelindata_damagetable_ag_ice_warhammer.json')
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
  public charactertablesAnubianscarabDatatablesDamagetableAnubianlotusscarab() {
    return this.load<Damagetable[]>('charactertables/anubianscarab_datatables/javelindata_damagetable_anubianlotusscarab.json')
  }
  public charactertablesAnubianscarabDatatablesDamagetableAnubianscarab() {
    return this.load<Damagetable[]>('charactertables/anubianscarab_datatables/javelindata_damagetable_anubianscarab.json')
  }
  public charactertablesArmoredDragonDamagetableArmoreddragon() {
    return this.load<Damagetable[]>('charactertables/armored_dragon/javelindata_damagetable_armoreddragon.json')
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
  public charactertablesBisonDatatablesDamagetableBison() {
    return this.load<Damagetable[]>('charactertables/bison_datatables/javelindata_damagetable_bison.json')
  }
  public charactertablesBisonDatatablesDamagetableBisonStrange() {
    return this.load<Damagetable[]>('charactertables/bison_datatables/javelindata_damagetable_bison_strange.json')
  }
  public charactertablesBogmonsterDatatablesDamagetableBogmonster() {
    return this.load<Damagetable[]>('charactertables/bogmonster_datatables/javelindata_damagetable_bogmonster.json')
  }
  public charactertablesBomberDatatablesDamagetableBloatedCorpse() {
    return this.load<Damagetable[]>('charactertables/bomber_datatables/javelindata_damagetable_bloated_corpse.json')
  }
  public charactertablesBomberDatatablesDamagetableInvasionBomber() {
    return this.load<Damagetable[]>('charactertables/bomber_datatables/javelindata_damagetable_invasion_bomber.json')
  }
  public charactertablesBossDatatablesDamagetableBoss() {
    return this.load<Damagetable[]>('charactertables/boss_datatables/javelindata_damagetable_boss.json')
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
  public charactertablesBrotherUmbertoDatatablesDamagetableBrotherUmberto() {
    return this.load<Damagetable[]>('charactertables/brother_umberto_datatables/javelindata_damagetable_brother_umberto.json')
  }
  public charactertablesBruteDatatablesDamagetableBrute() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_brute.json')
  }
  public charactertablesBruteDatatablesDamagetableBruteYeti() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_brute_yeti.json')
  }
  public charactertablesBruteDatatablesDamagetableFulgoris() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_fulgoris.json')
  }
  public charactertablesBruteDatatablesDamagetableIcegolem() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_icegolem.json')
  }
  public charactertablesBruteDatatablesDamagetableSwampbeast() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_swampbeast.json')
  }
  public charactertablesBruteDatatablesDamagetableYeti2022() {
    return this.load<Damagetable[]>('charactertables/brute_datatables/javelindata_damagetable_yeti_2022.json')
  }
  public charactertablesChameleonDatatablesDamagetableChameleon() {
    return this.load<Damagetable[]>('charactertables/chameleon_datatables/javelindata_damagetable_chameleon.json')
  }
  public charactertablesCommanderlothDatatablesDamagetableCommanderloth() {
    return this.load<Damagetable[]>('charactertables/commanderloth_datatables/javelindata_damagetable_commanderloth.json')
  }
  public charactertablesCorruptedleviathanDatatablesDamagetableCorruptedLeviathan() {
    return this.load<Damagetable[]>('charactertables/corruptedleviathan_datatables/javelindata_damagetable_corrupted_leviathan.json')
  }
  public charactertablesCorruptedleviathanDatatablesDamagetableTendrilLeviathan() {
    return this.load<Damagetable[]>('charactertables/corruptedleviathan_datatables/javelindata_damagetable_tendril_leviathan.json')
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
  public charactertablesDryadDatatablesDamagetableDryadSiren() {
    return this.load<Damagetable[]>('charactertables/dryad_datatables/javelindata_damagetable_dryad_siren.json')
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
  public charactertablesDunephantomDatatablesDamagetableDunephantomBerserker() {
    return this.load<Damagetable[]>('charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_berserker.json')
  }
  public charactertablesDunephantomDatatablesDamagetableDunephantomHuntress() {
    return this.load<Damagetable[]>('charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_huntress.json')
  }
  public charactertablesDunephantomDatatablesDamagetableDunephantomTank() {
    return this.load<Damagetable[]>('charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_tank.json')
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
  public charactertablesEliteaffixDatatablesDamagetableEliteAffix() {
    return this.load<Damagetable[]>('charactertables/eliteaffix_datatables/javelindata_damagetable_elite_affix.json')
  }
  public charactertablesElkDatatablesDamagetableElkCorrupted() {
    return this.load<Damagetable[]>('charactertables/elk_datatables/javelindata_damagetable_elk_corrupted.json')
  }
  public charactertablesElkDatatablesDamagetableElkMotherwell() {
    return this.load<Damagetable[]>('charactertables/elk_datatables/javelindata_damagetable_elk_motherwell.json')
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
  public charactertablesExplosivesproutDatatablesDamagetableExplosivesproutFire() {
    return this.load<Damagetable[]>('charactertables/explosivesprout_datatables/javelindata_damagetable_explosivesprout_fire.json')
  }
  public charactertablesGhastlyDatatablesDamagetableGhastlyVillagerShovel() {
    return this.load<Damagetable[]>('charactertables/ghastly_datatables/javelindata_damagetable_ghastly_villager_shovel.json')
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
  public charactertablesGorillaDatatablesDamagetableGorilla() {
    return this.load<Damagetable[]>('charactertables/gorilla_datatables/javelindata_damagetable_gorilla.json')
  }
  public charactertablesGorillaDatatablesDamagetableGorillaboss() {
    return this.load<Damagetable[]>('charactertables/gorilla_datatables/javelindata_damagetable_gorillaboss.json')
  }
  public charactertablesGruntDatatablesDamagetableFlamegrunt() {
    return this.load<Damagetable[]>('charactertables/grunt_datatables/javelindata_damagetable_flamegrunt.json')
  }
  public charactertablesGruntDatatablesDamagetableGrunt() {
    return this.load<Damagetable[]>('charactertables/grunt_datatables/javelindata_damagetable_grunt.json')
  }
  public charactertablesHercyneDatatablesDamagetableHercyneboar() {
    return this.load<Damagetable[]>('charactertables/hercyne_datatables/javelindata_damagetable_hercyneboar.json')
  }
  public charactertablesHercyneDatatablesDamagetableHercynecorvid() {
    return this.load<Damagetable[]>('charactertables/hercyne_datatables/javelindata_damagetable_hercynecorvid.json')
  }
  public charactertablesHercyneDatatablesDamagetableHercynereindeer() {
    return this.load<Damagetable[]>('charactertables/hercyne_datatables/javelindata_damagetable_hercynereindeer.json')
  }
  public charactertablesHumanDatatablesDamagetableEvilKnightBowIcevariant() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_evil_knight_bow_icevariant.json')
  }
  public charactertablesHumanDatatablesDamagetableEvilKnightFlamekeeper() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_evil_knight_flamekeeper.json')
  }
  public charactertablesHumanDatatablesDamagetableEvilKnightGruntmaster() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_evil_knight_gruntmaster.json')
  }
  public charactertablesHumanDatatablesDamagetableEvilKnightSpearIcevariant() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_evil_knight_spear_icevariant.json')
  }
  public charactertablesHumanDatatablesDamagetableEvilKnightSwordice() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_evil_knight_swordice.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanBlunderbuss() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_blunderbuss.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanBow() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_bow.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanCasterIcevariant() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_caster_icevariant.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanFirechampion() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_firechampion.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanGreataxe() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_greataxe.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanGreataxeIcevariant() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_greataxe_icevariant.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanHeavy() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_heavy.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanLifestaff() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_lifestaff.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanMace() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_mace.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanMaceice() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_maceice.json')
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
  public charactertablesHumanDatatablesDamagetableHumanVoidgauntlet() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_voidgauntlet.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanWarhammer() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_warhammer.json')
  }
  public charactertablesHumanDatatablesDamagetableHumanWarhammerIcevariant() {
    return this.load<Damagetable[]>('charactertables/human_datatables/javelindata_damagetable_human_warhammer_icevariant.json')
  }
  public charactertablesIceDragonDamagetableIcedragon() {
    return this.load<Damagetable[]>('charactertables/ice_dragon/javelindata_damagetable_icedragon.json')
  }
  public charactertablesIceDragonDamagetableIcedragonSolo() {
    return this.load<Damagetable[]>('charactertables/ice_dragon/javelindata_damagetable_icedragon_solo.json')
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
  public charactertablesIcedryadDatatablesDamagetableYeti2022FrostfangMinion() {
    return this.load<Damagetable[]>('charactertables/icedryad_datatables/javelindata_damagetable_yeti_2022_frostfang_minion.json')
  }
  public charactertablesIcedryadDatatablesDamagetableYeti2022FrostgripMinion() {
    return this.load<Damagetable[]>('charactertables/icedryad_datatables/javelindata_damagetable_yeti_2022_frostgrip_minion.json')
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
  public charactertablesIsabellaDatatablesDamagetableIsabellaSoloMsq2() {
    return this.load<Damagetable[]>('charactertables/isabella_datatables/javelindata_damagetable_isabella_solo_msq2.json')
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
  public charactertablesLostsirenDatatablesDamagetableLostSiren() {
    return this.load<Damagetable[]>('charactertables/lostsiren_datatables/javelindata_damagetable_lost_siren.json')
  }
  public charactertablesMammothDatatablesDamagetableMammoth() {
    return this.load<Damagetable[]>('charactertables/mammoth_datatables/javelindata_damagetable_mammoth.json')
  }
  public charactertablesMammothDatatablesDamagetableMammothBoss() {
    return this.load<Damagetable[]>('charactertables/mammoth_datatables/javelindata_damagetable_mammoth_boss.json')
  }
  public charactertablesMammothDatatablesDamagetableMammothWorldBoss() {
    return this.load<Damagetable[]>('charactertables/mammoth_datatables/javelindata_damagetable_mammoth_world_boss.json')
  }
  public charactertablesMedusaDatatablesDamagetableMedusa() {
    return this.load<Damagetable[]>('charactertables/medusa_datatables/javelindata_damagetable_medusa.json')
  }
  public charactertablesMegafloraDatatablesDamagetableMegafloraRazorlotus() {
    return this.load<Damagetable[]>('charactertables/megaflora_datatables/javelindata_damagetable_megaflora_razorlotus.json')
  }
  public charactertablesMordredDatatablesDamagetableMordred() {
    return this.load<Damagetable[]>('charactertables/mordred_datatables/javelindata_damagetable_mordred.json')
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
  public charactertablesNagaDatatablesDamagetableNagaFire() {
    return this.load<Damagetable[]>('charactertables/naga_datatables/javelindata_damagetable_naga_fire.json')
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
  public charactertablesOvergrownbeetleDatatablesDamagetableOvergrownbeetle() {
    return this.load<Damagetable[]>('charactertables/overgrownbeetle_datatables/javelindata_damagetable_overgrownbeetle.json')
  }
  public charactertablesQuestnpcDatatablesDamagetableImhotep() {
    return this.load<Damagetable[]>('charactertables/questnpc_datatables/javelindata_damagetable_imhotep.json')
  }
  public charactertablesQuestnpcDatatablesDamagetableYonasMsq2Trial() {
    return this.load<Damagetable[]>('charactertables/questnpc_datatables/javelindata_damagetable_yonas_msq2_trial.json')
  }
  public charactertablesQuestnpcDatatablesDamagetableZaneTendril() {
    return this.load<Damagetable[]>('charactertables/questnpc_datatables/javelindata_damagetable_zane_tendril.json')
  }
  public charactertablesRatDatatablesDamagetableRatHercynerat() {
    return this.load<Damagetable[]>('charactertables/rat_datatables/javelindata_damagetable_rat_hercynerat.json')
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
  public charactertablesSandElementalSoldierDamagetableSandElementalSoldier() {
    return this.load<Damagetable[]>('charactertables/sand_elemental_soldier/javelindata_damagetable_sand_elemental_soldier.json')
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
  public charactertablesSandelementalDatatablesSandelementalHeavySandworm() {
    return this.load<SandelementalHeavySandworm[]>('charactertables/sandelemental_datatables/sandelemental_heavy_sandworm.json')
  }
  public charactertablesSandwormDatatablesDamagetableSandworm() {
    return this.load<Damagetable[]>('charactertables/sandworm_datatables/javelindata_damagetable_sandworm.json')
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
  public charactertablesScorpionDatatablesDamagetableScorpionSlingerSandworm() {
    return this.load<Damagetable[]>('charactertables/scorpion_datatables/javelindata_damagetable_scorpion_slinger_sandworm.json')
  }
  public charactertablesScorpionDatatablesDamagetableScorpionSulfur() {
    return this.load<Damagetable[]>('charactertables/scorpion_datatables/javelindata_damagetable_scorpion_sulfur.json')
  }
  public charactertablesSeasonsDatatablesSeason02DamagetableBabysandworm() {
    return this.load<Damagetable[]>('charactertables/seasons_datatables/season_02/javelindata_damagetable_babysandworm.json')
  }
  public charactertablesSeasonsDatatablesSeason04DamagetableAgIceguardianboss() {
    return this.load<Damagetable[]>('charactertables/seasons_datatables/season_04/javelindata_damagetable_ag_iceguardianboss.json')
  }
  public charactertablesSeasonsDatatablesSeason04DamagetableAgIceguardianbosssolo() {
    return this.load<Damagetable[]>('charactertables/seasons_datatables/season_04/javelindata_damagetable_ag_iceguardianbosssolo.json')
  }
  public charactertablesSeasonsDatatablesSeason04DamagetableS04Daichi() {
    return this.load<Damagetable[]>('charactertables/seasons_datatables/season_04/javelindata_damagetable_s04_daichi.json')
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
  public charactertablesSprigganDatatablesDamagetableAdolescentspriggan() {
    return this.load<Damagetable[]>('charactertables/spriggan_datatables/javelindata_damagetable_adolescentspriggan.json')
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
  public charactertablesSulfurelementalDamagetablesDamagetableSulfurelementalentity() {
    return this.load<Damagetable[]>('charactertables/sulfurelemental_damagetables/javelindata_damagetable_sulfurelementalentity.json')
  }
  public charactertablesSwarmerDatatablesDamagetableCorruptedswarmer() {
    return this.load<Damagetable[]>('charactertables/swarmer_datatables/javelindata_damagetable_corruptedswarmer.json')
  }
  public charactertablesSwarmerDatatablesDamagetableSkeletoncrawler() {
    return this.load<Damagetable[]>('charactertables/swarmer_datatables/javelindata_damagetable_skeletoncrawler.json')
  }
  public charactertablesTorsobossDatatablesDamagetableIceTorsoBoss() {
    return this.load<Damagetable[]>('charactertables/torsoboss_datatables/javelindata_damagetable_ice_torso_boss.json')
  }
  public charactertablesTorsobossDatatablesDamagetableTorsoBoss() {
    return this.load<Damagetable[]>('charactertables/torsoboss_datatables/javelindata_damagetable_torso_boss.json')
  }
  public charactertablesTurkeyDatatablesDamagetableTurkey() {
    return this.load<Damagetable[]>('charactertables/turkey_datatables/javelindata_damagetable_turkey.json')
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
  public cooldownsPlayer() {
    return this.load<CooldownsPlayer[]>('javelindata_cooldowns_player.json')
  }
  public costumechangesCostumechanges() {
    return this.load<Costumechanges[]>('costumechanges/javelindata_costumechanges.json')
  }
  public crafting() {
    return this.load<Crafting[]>('javelindata_crafting.json')
  }
  public craftingArcana() {
    return this.load<Crafting[]>('javelindata_crafting_arcana.json')
  }
  public craftingArmorer() {
    return this.load<Crafting[]>('javelindata_crafting_armorer.json')
  }
  public craftingCooking() {
    return this.load<Crafting[]>('javelindata_crafting_cooking.json')
  }
  public craftingDungeon() {
    return this.load<Crafting[]>('javelindata_crafting_dungeon.json')
  }
  public craftingEngineer() {
    return this.load<Crafting[]>('javelindata_crafting_engineer.json')
  }
  public craftingGypkilm() {
    return this.load<Crafting[]>('javelindata_crafting_gypkilm.json')
  }
  public craftingJeweler() {
    return this.load<Crafting[]>('javelindata_crafting_jeweler.json')
  }
  public craftingMisc() {
    return this.load<Crafting[]>('javelindata_crafting_misc.json')
  }
  public craftingRefining() {
    return this.load<Crafting[]>('javelindata_crafting_refining.json')
  }
  public craftingSeasons() {
    return this.load<Crafting[]>('javelindata_crafting_seasons.json')
  }
  public craftingWeapon() {
    return this.load<Crafting[]>('javelindata_crafting_weapon.json')
  }
  public craftingcategories() {
    return this.load<Craftingcategories[]>('javelindata_craftingcategories.json')
  }
  public damagetable() {
    return this.load<Damagetable[]>('javelindata_damagetable.json')
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
  public damagetypes() {
    return this.load<Damagetypes[]>('javelindata_damagetypes.json')
  }
  public dyecolors() {
    return this.load<Dyecolors[]>('javelindata_dyecolors.json')
  }
  public emotedefinitions() {
    return this.load<Emotedefinitions[]>('javelindata_emotedefinitions.json')
  }
  public entitlements() {
    return this.load<Entitlements[]>('javelindata_entitlements.json')
  }
  public ftueDamagetableDamned() {
    return this.load<Damagetable[]>('javelindata_ftue_damagetable_damned.json')
  }
  public ftueDamagetableUndeadGrenadier() {
    return this.load<Damagetable[]>('javelindata_ftue_damagetable_undead_grenadier.json')
  }
  public ftwDamagetableRisenFtw() {
    return this.load<Damagetable[]>('ftw/javelindata_damagetable_risen_ftw.json')
  }
  public gameevents() {
    return this.load<GameEvent[]>('javelindata_gameevents.json')
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
  public gamemodes() {
    return this.load<Gamemodes[]>('javelindata_gamemodes.json')
  }
  public gatherables() {
    return this.load<Gatherables[]>('javelindata_gatherables.json')
  }
  public generatedGatherablesMetadata() {
    return this.load<GatherablesMetadata[]>('generated_gatherables_metadata.json')
  }
  public generatedSpellsMetadata() {
    return this.load<SpellsMetadata[]>('generated_spells_metadata.json')
  }
  public generatedVariationsMetadata() {
    return this.load<VariationsMetadata[]>('generated_variations_metadata.json')
  }
  public generatedVitalsMetadata() {
    return this.load<VitalsMetadata[]>('generated_vitals_metadata.json')
  }
  public housetypes() {
    return this.load<Housetypes[]>('javelindata_housetypes.json')
  }
  public housingitems() {
    return this.load<Housingitems[]>('javelindata_housingitems.json')
  }
  public itemappearancedefinitions() {
    return this.load<Itemappearancedefinitions[]>('javelindata_itemappearancedefinitions.json')
  }
  public itemdefinitionsAmmo() {
    return this.load<ItemdefinitionsAmmo[]>('javelindata_itemdefinitions_ammo.json')
  }
  public itemdefinitionsArmor() {
    return this.load<ItemdefinitionsArmor[]>('javelindata_itemdefinitions_armor.json')
  }
  public itemdefinitionsConsumables() {
    return this.load<ItemdefinitionsConsumables[]>('javelindata_itemdefinitions_consumables.json')
  }
  public itemdefinitionsInstrumentsappearances() {
    return this.load<ItemdefinitionsInstrumentsappearances[]>('javelindata_itemdefinitions_instrumentsappearances.json')
  }
  public itemdefinitionsMasterAi() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_ai.json')
  }
  public itemdefinitionsMasterArtifacts() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_artifacts.json')
  }
  public itemdefinitionsMasterCommon() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_common.json')
  }
  public itemdefinitionsMasterCrafting() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_crafting.json')
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
  public itemdefinitionsMasterSeasons() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_seasons.json')
  }
  public itemdefinitionsMasterSkins() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_skins.json')
  }
  public itemdefinitionsMasterStore() {
    return this.load<ItemDefinitionMaster[]>('javelindata_itemdefinitions_master_store.json')
  }
  public itemdefinitionsResources() {
    return this.load<ItemdefinitionsResources[]>('javelindata_itemdefinitions_resources.json')
  }
  public itemdefinitionsRunes() {
    return this.load<ItemdefinitionsRunes[]>('javelindata_itemdefinitions_runes.json')
  }
  public itemdefinitionsWeaponappearances() {
    return this.load<ItemdefinitionsWeaponappearances[]>('javelindata_itemdefinitions_weaponappearances.json')
  }
  public itemdefinitionsWeaponappearancesMountattachments() {
    return this.load<ItemdefinitionsWeaponappearancesMountattachments[]>('javelindata_itemdefinitions_weaponappearances_mountattachments.json')
  }
  public itemdefinitionsWeapons() {
    return this.load<ItemdefinitionsWeapons[]>('javelindata_itemdefinitions_weapons.json')
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
  public loottablesFishing() {
    return this.load<Loottable[]>('javelindata_loottables_fishing.json')
  }
  public loottablesOmega() {
    return this.load<Loottable[]>('javelindata_loottables_omega.json')
  }
  public loottablesPlaytest() {
    return this.load<Loottable[]>('javelindata_loottables_playtest.json')
  }
  public loottablesSalvage() {
    return this.load<Loottable[]>('javelindata_loottables_salvage.json')
  }
  public loottablesSeasons() {
    return this.load<Loottable[]>('javelindata_loottables_seasons.json')
  }
  public loreitems() {
    return this.load<Loreitems[]>('javelindata_loreitems.json')
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
  public mountsMounts() {
    return this.load<Mounts[]>('mounts/javelindata_mounts.json')
  }
  public mtxHousingitemsMtx() {
    return this.load<Housingitems[]>('mtx/javelindata_housingitems_mtx.json')
  }
  public mtxItemdefinitionsMtx202301() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-01.json')
  }
  public mtxItemdefinitionsMtx202302() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-02.json')
  }
  public mtxItemdefinitionsMtx202303() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-03.json')
  }
  public mtxItemdefinitionsMtx202304() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-04.json')
  }
  public mtxItemdefinitionsMtx202305() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-05.json')
  }
  public mtxItemdefinitionsMtx202306() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-06.json')
  }
  public mtxItemdefinitionsMtx202307() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-07.json')
  }
  public mtxItemdefinitionsMtx202308() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-08.json')
  }
  public mtxItemdefinitionsMtx202309() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-09.json')
  }
  public mtxItemdefinitionsMtx202310() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-10.json')
  }
  public mtxItemdefinitionsMtx202311() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-11.json')
  }
  public mtxItemdefinitionsMtx202312() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2023-12.json')
  }
  public mtxItemdefinitionsMtx20242() {
    return this.load<ItemDefinitionMtx[]>('mtx/javelindata_itemdefinitions_mtx_2024-2.json')
  }
  public mtxLoottablesMtx() {
    return this.load<Loottable[]>('mtx/javelindata_loottables_mtx.json')
  }
  public objectives() {
    return this.load<Objective[]>('javelindata_objectives.json')
  }
  public objectivetasks() {
    return this.load<Objectivetasks[]>('javelindata_objectivetasks.json')
  }
  public perkbuckets() {
    return this.load<Perkbuckets[]>('javelindata_perkbuckets.json')
  }
  public perks() {
    return this.load<Perks[]>('javelindata_perks.json')
  }
  public playertitles() {
    return this.load<Playertitles[]>('javelindata_playertitles.json')
  }
  public playertitlesCategories() {
    return this.load<PlayertitlesCategories[]>('javelindata_playertitles_categories.json')
  }
  public pointofinterestdefinitionsPoidefinitions0102() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_01_02.json')
  }
  public pointofinterestdefinitionsPoidefinitions0103() {
    return this.load<PoiDefinition[]>('pointofinterestdefinitions/javelindata_poidefinitions_01_03.json')
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
  public pvpRewardstrackLoottablesPvpRewardsTrack() {
    return this.load<Loottable[]>('pvp_rewardstrack/javelindata_loottables_pvp_rewards_track.json')
  }
  public pvpRewardstrackPvpRewardsV2() {
    return this.load<PvpRewards[]>('pvp_rewardstrack/javelindata_pvp_rewards_v2.json')
  }
  public pvpRewardstrackPvpStoreV2() {
    return this.load<PvpStore[]>('pvp_rewardstrack/javelindata_pvp_store_v2.json')
  }
  public pvpbalancetablesPvpbalanceArena() {
    return this.load<PvpbalanceArena[]>('pvpbalancetables/javelindata_pvpbalance_arena.json')
  }
  public pvpbalancetablesPvpbalanceOpenworld() {
    return this.load<PvpbalanceOpenworld[]>('pvpbalancetables/javelindata_pvpbalance_openworld.json')
  }
  public pvpbalancetablesPvpbalanceOutpostrush() {
    return this.load<PvpbalanceOutpostrush[]>('pvpbalancetables/javelindata_pvpbalance_outpostrush.json')
  }
  public pvpbalancetablesPvpbalanceWar() {
    return this.load<PvpbalanceWar[]>('pvpbalancetables/javelindata_pvpbalance_war.json')
  }
  public questgameevents01Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_01_gameevents.json')
  }
  public questgameevents02Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_02_gameevents.json')
  }
  public questgameevents02aGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_02a_gameevents.json')
  }
  public questgameevents03Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_03_gameevents.json')
  }
  public questgameevents04Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_04_gameevents.json')
  }
  public questgameevents04aGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_04a_gameevents.json')
  }
  public questgameevents05Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_05_gameevents.json')
  }
  public questgameevents06Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_06_gameevents.json')
  }
  public questgameevents06aGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_06a_gameevents.json')
  }
  public questgameevents07Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_07_gameevents.json')
  }
  public questgameevents08Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_08_gameevents.json')
  }
  public questgameevents09Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_09_gameevents.json')
  }
  public questgameevents09aGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_09a_gameevents.json')
  }
  public questgameevents10Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_10_gameevents.json')
  }
  public questgameevents11Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_11_gameevents.json')
  }
  public questgameevents12Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_12_gameevents.json')
  }
  public questgameevents12aGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_12a_gameevents.json')
  }
  public questgameevents13Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_13_gameevents.json')
  }
  public questgameevents13aGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_13a_gameevents.json')
  }
  public questgameevents14Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_14_gameevents.json')
  }
  public questgameevents15Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_15_gameevents.json')
  }
  public questgameevents16Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_16_gameevents.json')
  }
  public questgameevents74Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_74_gameevents.json')
  }
  public questgameevents75Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_75_gameevents.json')
  }
  public questgameevents92Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_92_gameevents.json')
  }
  public questgameevents94Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_94_gameevents.json')
  }
  public questgameevents95Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_95_gameevents.json')
  }
  public questgameevents95S04Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_95_s04_gameevents.json')
  }
  public questgameevents95aGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_95a_gameevents.json')
  }
  public questgameevents98Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_98_gameevents.json')
  }
  public questgameevents99Gameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_99_gameevents.json')
  }
  public questgameevents99aGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_99a_gameevents.json')
  }
  public questgameevents99bGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_99b_gameevents.json')
  }
  public questgameevents99cGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_99c_gameevents.json')
  }
  public questgameevents99dGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_99d_gameevents.json')
  }
  public questgameevents99eGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_99e_gameevents.json')
  }
  public questgameeventsVoicedloreGameevents() {
    return this.load<GameEvent[]>('questgameevents/javelindata_voicedlore_gameevents.json')
  }
  public quests01Starterbeach01Objectives() {
    return this.load<Objective[]>('quests/01_starterbeach/javelindata_01_objectives.json')
  }
  public quests02Brightwood02Objectives() {
    return this.load<Objective[]>('quests/02_brightwood/javelindata_02_objectives.json')
  }
  public quests02aBrightwood02aObjectives() {
    return this.load<Objective[]>('quests/02a_brightwood/javelindata_02a_objectives.json')
  }
  public quests03Greatcleave03Objectives() {
    return this.load<Objective[]>('quests/03_greatcleave/javelindata_03_objectives.json')
  }
  public quests04aEverfall04aObjectives() {
    return this.load<Objective[]>('quests/04a_everfall/javelindata_04a_objectives.json')
  }
  public quests05Reekwater05Objectives() {
    return this.load<Objective[]>('quests/05_reekwater/javelindata_05_objectives.json')
  }
  public quests06Windsward06Objectives() {
    return this.load<Objective[]>('quests/06_windsward/javelindata_06_objectives.json')
  }
  public quests06aWindsward06aObjectives() {
    return this.load<Objective[]>('quests/06a_windsward/javelindata_06a_objectives.json')
  }
  public quests07Shatteredmoutain07Objectives() {
    return this.load<Objective[]>('quests/07_shatteredmoutain/javelindata_07_objectives.json')
  }
  public quests08Queensport08Objectives() {
    return this.load<Objective[]>('quests/08_queensport/javelindata_08_objectives.json')
  }
  public quests09Firstlight09Objectives() {
    return this.load<Objective[]>('quests/09_firstlight/javelindata_09_objectives.json')
  }
  public quests09aFirstlight09aObjectives() {
    return this.load<Objective[]>('quests/09a_firstlight/javelindata_09a_objectives.json')
  }
  public quests10Cutlasskeys10Objectives() {
    return this.load<Objective[]>('quests/10_cutlasskeys/javelindata_10_objectives.json')
  }
  public quests10aCutlasskeys10aObjectives() {
    return this.load<Objective[]>('quests/10a_cutlasskeys/javelindata_10a_objectives.json')
  }
  public quests11Mourningdale11Objectives() {
    return this.load<Objective[]>('quests/11_mourningdale/javelindata_11_objectives.json')
  }
  public quests12Monarchsbluffs12Objectives() {
    return this.load<Objective[]>('quests/12_monarchsbluffs/javelindata_12_objectives.json')
  }
  public quests12aMonarchsbluffs12aObjectives() {
    return this.load<Objective[]>('quests/12a_monarchsbluffs/javelindata_12a_objectives.json')
  }
  public quests13Weaversfen13Objectives() {
    return this.load<Objective[]>('quests/13_weaversfen/javelindata_13_objectives.json')
  }
  public quests13aWeaversfen13aObjectives() {
    return this.load<Objective[]>('quests/13a_weaversfen/javelindata_13a_objectives.json')
  }
  public quests14Edengrove14Objectives() {
    return this.load<Objective[]>('quests/14_edengrove/javelindata_14_objectives.json')
  }
  public quests15Restlessshore15Objectives() {
    return this.load<Objective[]>('quests/15_restlessshore/javelindata_15_objectives.json')
  }
  public quests16Brimstonesands16Objectives() {
    return this.load<Objective[]>('quests/16_brimstonesands/javelindata_16_objectives.json')
  }
  public quests74DevworldRed74Objectives() {
    return this.load<Objective[]>('quests/74_devworld_red/javelindata_74_objectives.json')
  }
  public quests75DevworldBlue75Objectives() {
    return this.load<Objective[]>('quests/75_devworld_blue/javelindata_75_objectives.json')
  }
  public quests92Weaponsandarmor92Objectives() {
    return this.load<Objective[]>('quests/92_weaponsandarmor/javelindata_92_objectives.json')
  }
  public quests94Mounts94Objectives() {
    return this.load<Objective[]>('quests/94_mounts/javelindata_94_objectives.json')
  }
  public quests95S04Seasons95S04Objectives() {
    return this.load<Objective[]>('quests/95_s04_seasons/javelindata_95_s04_objectives.json')
  }
  public quests95Seasons95Objectives() {
    return this.load<Objective[]>('quests/95_seasons/javelindata_95_objectives.json')
  }
  public quests95aSeasonsS0295aObjectives() {
    return this.load<Objective[]>('quests/95a_seasons_s02/javelindata_95a_objectives.json')
  }
  public quests98Factions98Objectives() {
    return this.load<Objective[]>('quests/98_factions/javelindata_98_objectives.json')
  }
  public quests99Msq99Objectives() {
    return this.load<Objective[]>('quests/99_msq/javelindata_99_objectives.json')
  }
  public quests99aMsq99aObjectives() {
    return this.load<Objective[]>('quests/99a_msq/javelindata_99a_objectives.json')
  }
  public quests99bMsqBrightwood99bObjectives() {
    return this.load<Objective[]>('quests/99b_msq_brightwood/javelindata_99b_objectives.json')
  }
  public quests99cMsqWeaversfen99cObjectives() {
    return this.load<Objective[]>('quests/99c_msq_weaversfen/javelindata_99c_objectives.json')
  }
  public quests99dMsqGreatcleave99dObjectives() {
    return this.load<Objective[]>('quests/99d_msq_greatcleave/javelindata_99d_objectives.json')
  }
  public quests99eMsqEdengrove99eObjectives() {
    return this.load<Objective[]>('quests/99e_msq_edengrove/javelindata_99e_objectives.json')
  }
  public seasonsrewardsSeason1RewarddataSeason1() {
    return this.load<Rewarddata[]>('seasonsrewards/season1/javelindata_rewarddata_season1.json')
  }
  public seasonsrewardsSeason1SeasonpassdataSeason1() {
    return this.load<SeasonPassData[]>('seasonsrewards/season1/javelindata_seasonpassdata_season1.json')
  }
  public seasonsrewardsSeason2RewarddataSeason2() {
    return this.load<Rewarddata[]>('seasonsrewards/season2/javelindata_rewarddata_season2.json')
  }
  public seasonsrewardsSeason2SeasonpassdataSeason2() {
    return this.load<SeasonPassData[]>('seasonsrewards/season2/javelindata_seasonpassdata_season2.json')
  }
  public seasonsrewardsSeason3RewarddataSeason3() {
    return this.load<Rewarddata[]>('seasonsrewards/season3/javelindata_rewarddata_season3.json')
  }
  public seasonsrewardsSeason3SeasonpassdataSeason3() {
    return this.load<SeasonPassData[]>('seasonsrewards/season3/javelindata_seasonpassdata_season3.json')
  }
  public seasonsrewardsSeason4RewarddataSeason4() {
    return this.load<Rewarddata[]>('seasonsrewards/season4/javelindata_rewarddata_season4.json')
  }
  public seasonsrewardsSeason4SeasonpassdataSeason4() {
    return this.load<SeasonPassData[]>('seasonsrewards/season4/javelindata_seasonpassdata_season4.json')
  }
  public spelltable() {
    return this.load<Spelltable[]>('javelindata_spelltable.json')
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
  public spelltableFlail() {
    return this.load<Spelltable[]>('javelindata_spelltable_flail.json')
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
  public staminacostsPlayer() {
    return this.load<StaminacostsPlayer[]>('javelindata_staminacosts_player.json')
  }
  public statuseffectcategories() {
    return this.load<Statuseffectcategories[]>('javelindata_statuseffectcategories.json')
  }
  public statuseffects() {
    return this.load<Statuseffect[]>('javelindata_statuseffects.json')
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
  public statuseffectsFlail() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_flail.json')
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
  public statuseffectsPerks() {
    return this.load<Statuseffect[]>('javelindata_statuseffects_perks.json')
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
  public tradeskillriding() {
    return this.load<Tradeskillriding[]>('javelindata_tradeskillriding.json')
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
  public variationsAi() {
    return this.load<VariationsAi[]>('javelindata_variations_ai.json')
  }
  public variationsCuttrunks() {
    return this.load<VariationsCuttrunks[]>('javelindata_variations_cuttrunks.json')
  }
  public variationsDarkness() {
    return this.load<VariationsDarkness[]>('javelindata_variations_darkness.json')
  }
  public variationsGatherablesAlchemy() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_alchemy.json')
  }
  public variationsGatherablesBushes() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_bushes.json')
  }
  public variationsGatherablesCinematic() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_cinematic.json')
  }
  public variationsGatherablesCyclic() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_cyclic.json')
  }
  public variationsGatherablesEssences() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_essences.json')
  }
  public variationsGatherablesHoliday() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_holiday.json')
  }
  public variationsGatherablesHolidayProximity() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_holiday_proximity.json')
  }
  public variationsGatherablesItems() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_items.json')
  }
  public variationsGatherablesLockedgates() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_lockedgates.json')
  }
  public variationsGatherablesLogs() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_logs.json')
  }
  public variationsGatherablesLootcontainers() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_lootcontainers.json')
  }
  public variationsGatherablesMinerals() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_minerals.json')
  }
  public variationsGatherablesNpcrescue() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_npcrescue.json')
  }
  public variationsGatherablesPlants() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_plants.json')
  }
  public variationsGatherablesPoiobjects() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_poiobjects.json')
  }
  public variationsGatherablesQuest() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_quest.json')
  }
  public variationsGatherablesQuestAncientglyph() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_quest_ancientglyph.json')
  }
  public variationsGatherablesQuestDamageable() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_quest_damageable.json')
  }
  public variationsGatherablesQuestProximity() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_quest_proximity.json')
  }
  public variationsGatherablesStones() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_stones.json')
  }
  public variationsGatherablesTrees() {
    return this.load<VariationsGatherables[]>('javelindata_variations_gatherables_trees.json')
  }
  public variationsLockedInteractGatherables() {
    return this.load<VariationsLockedInteractGatherables[]>('javelindata_variations_locked_interact_gatherables.json')
  }
  public variationsLootcontainers() {
    return this.load<VariationsLootcontainers[]>('javelindata_variations_lootcontainers.json')
  }
  public variationsNpcs() {
    return this.load<Npc[]>('javelindata_variations_npcs.json')
  }
  public variationsNpcsWalkaway() {
    return this.load<Npc[]>('javelindata_variations_npcs_walkaway.json')
  }
  public variationsRandomencounters() {
    return this.load<VariationsRandomencounters[]>('javelindata_variations_randomencounters.json')
  }
  public vitals() {
    return this.load<Vitals[]>('javelindata_vitals.json')
  }
  public vitalsPlayer() {
    return this.load<VitalsPlayer[]>('javelindata_vitals_player.json')
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
  public vitalstablesVitalsFirstlight() {
    return this.load<VitalsFirstlight[]>('vitalstables/javelindata_vitals_firstlight.json')
  }
  public weaponabilitiesAbilityAi() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_ai.json')
  }
  public weaponabilitiesAbilityArtifacts() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_artifacts.json')
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
  public weaponabilitiesAbilityFlail() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_flail.json')
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
  public weaponabilitiesAbilityPerks() {
    return this.load<Ability[]>('weaponabilities/javelindata_ability_perks.json')
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
  public weaponmastery() {
    return this.load<Weaponmastery[]>('javelindata_weaponmastery.json')
  }
  public xpamountsbylevel() {
    return this.load<Xpamountsbylevel[]>('javelindata_xpamountsbylevel.json')
  }
}