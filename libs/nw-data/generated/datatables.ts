import type {
  AITargetingData,
  AbilityData,
  AchievementData,
  AchievementMetaData,
  AffixData,
  AffixStatData,
  AfflictionData,
  AfkModeData,
  AmmoItemDefinitions,
  AppearanceTransforms,
  ArchetypeData,
  ArenaBalanceData,
  ArmorAppearanceDefinitions,
  ArmorItemDefinitions,
  AttackTypes,
  AttributeDefinition,
  BackstoryDefinition,
  BeamData,
  BlueprintItemDefinitions,
  BuffBucketData,
  CameraShakeData,
  CampSkinData,
  CaptureTheFlagBalanceData,
  CategoricalProgressionData,
  CategoricalProgressionRankData,
  CinematicVideoStaticData,
  CollectibleStaticData,
  CombatProfilesData,
  CombatSettingsData,
  CombatTextData,
  ConsumableItemDefinitions,
  ContributionData,
  ConversationStateData,
  ConversationTopicData,
  CooldownData,
  CostumeChangeData,
  CraftingCategoryData,
  CraftingRecipeData,
  CrestPartData,
  CurrencyExchangeData,
  CurseMutationStaticData,
  CutsceneCameraStaticData,
  DamageData,
  DamageTypeData,
  DarknessData,
  DarknessDifficultyData,
  DataPointData,
  DifficultyScalingData,
  DivertedLootData,
  DuelBalanceData,
  DungeonClusterStaticData,
  DungeonGrammarStaticData,
  DungeonRoomStaticData,
  DungeonTileStaticData,
  DyeColorData,
  DyeItemDefinitions,
  EconomyTrackerData,
  ElementalMutationStaticData,
  EmoteData,
  EncumbranceData,
  EntitlementData,
  EquipmentSetData,
  ExpansionData,
  ExperienceData,
  FFAZoneBalanceData,
  FactionControlBuffDefinitions,
  FactionData,
  FactionStatusEffectData,
  FishData,
  FishingBaitData,
  FishingBehaviorsData,
  FishingCatchablesData,
  FishingHotspotsData,
  FishingPolesData,
  FishingWaterData,
  GameEventData,
  GameModeData,
  GameModeMapData,
  GameModeSchedulerStaticData,
  GatherableData,
  GeneratorRecipes,
  GenericInviteData,
  HouseItems,
  HouseTypeData,
  HousingSystemMessaging,
  HunterSightData,
  ImpactAudioTable,
  ImpactSurfaceAlignmentTable,
  ImpactTable,
  InfluenceTowerDefinitions,
  InputProfileData,
  InteractionAnimationData,
  ItemCurrencyConversionData,
  ItemPerkSwapData,
  ItemSkinData,
  ItemSoundEvents,
  ItemTooltipLayout,
  ItemTransform,
  JointAliasData,
  LeaderboardData,
  LeaderboardRewardsData,
  LeaderboardStatData,
  LevelDisparityData,
  LootBucketData,
  LootLimitData,
  LootTablesData,
  LootTagPresetData,
  LoreData,
  LoreItemDefinitions,
  ManaData,
  MasterItemDefinitions,
  MetaAchievementData,
  MissionData,
  MissionWeightsData,
  Moonshot,
  MountData,
  MountDyeItemDefinitions,
  MountItemAppearanceDefinitions,
  MountMovementData,
  MountTypeData,
  MusicalInstrumentSlot,
  MusicalPerformanceRewards,
  MusicalRanking,
  MusicalScoring,
  MutationDifficultyStaticData,
  MutationPerksStaticData,
  NPAData,
  NPCData,
  NotificationData,
  ObjectiveTasks,
  Objectives,
  ObjectivesGlobalReleaseData,
  OpenWorldBalanceData,
  OutpostRushBalanceData,
  OutpostRush_NoPerksBalanceData,
  PUGActivityInfo,
  PUGRewardData,
  ParticleContextualPriorityOverrideData,
  ParticleData,
  PerkBucketData,
  PerkData,
  PerkExclusiveLabelData,
  PlayerMilestoneModalStaticData,
  PlayerTitleData,
  ProgressionPointData,
  ProgressionPoolData,
  PromotionMutationStaticData,
  PvPRankData,
  PvPStoreData,
  QuickCourseData,
  QuickCourseNodeTypeData,
  RandomEncounterDefinitions,
  RefiningRecipes,
  ResourceItemDefinitions,
  RewardData,
  RewardMilestoneData,
  RewardModifierData,
  RewardTrackItemData,
  RotationalQueueData,
  ScheduleData,
  SeasonPassRankData,
  SeasonsRewardData,
  SeasonsRewardsActivitiesConfig,
  SeasonsRewardsActivitiesTasksData,
  SeasonsRewardsCardData,
  SeasonsRewardsCardTemplates,
  SeasonsRewardsChapterData,
  SeasonsRewardsJourneyData,
  SeasonsRewardsSeasonData,
  SeasonsRewardsStats,
  SeasonsRewardsTasks,
  ShopData,
  SimpleTreeCategoryData,
  SkillData,
  SkillExperienceData,
  Socketables,
  SongBookData,
  SongBookSheets,
  SpecializationDefinitions,
  SpellData,
  StaminaData,
  StatMultiplierData,
  StatusEffectCategoryData,
  StatusEffectData,
  StoreCategoryProperties,
  StoreProductData,
  StoryProgressData,
  StructureFootprintData,
  StructurePieceData,
  TerritoryDefinition,
  TerritoryProgressionData,
  TerritoryUpkeepDefinition,
  ThrowableItemDefinitions,
  TimelineRegistryEntryData,
  TradeSkillPostCapData,
  TradeskillRankData,
  TutorialConditionData,
  TutorialContentData,
  TutorialData,
  TwitchDropsStatDefinitions,
  TwitchTagsStatDefinitions,
  VariationData,
  VariationDataGatherable,
  VitalsBaseData,
  VitalsCategoryData,
  VitalsData,
  VitalsLevelData,
  VitalsLevelVariantData,
  VitalsModifierData,
  WarBalanceData,
  WarboardStatDefinitions,
  WeaponAccessoryDefinitions,
  WeaponAppearanceDefinitions,
  WeaponEffectData,
  WeaponItemDefinitions,
  WhisperData,
  WhisperVfxData,
  WorldEventCategoryData,
  WorldEventRuleData,
} from './types'

export type DataSheetUri<T> = {
  uri: string | string[]
}

export const DATASHEETS = {
  AITargetingData: {
    AITargeting: <DataSheetUri<AITargetingData>>{
      uri: "datatables/javelindata_aitargeting.json",
    },
  },
  AbilityData: {
    AIAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_ai.json",
    },
    ArtifactsAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_artifacts.json",
    },
    AttributeThresholdAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_attributethreshold.json",
    },
    BlunderbussAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_blunderbuss.json",
    },
    BowAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_bow.json",
    },
    EquipmentSetBonusesAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/equipmentsetbonuses/javelindata_ability_equipmentsetbonusesinfix.json",
    },
    FireMagicAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_firemagic.json",
    },
    FlailAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_flail.json",
    },
    GlobalAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_global.json",
    },
    GreatAxeAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_greataxe.json",
    },
    GreatswordAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_greatsword.json",
    },
    HatchetAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_hatchet.json",
    },
    IceMagicAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_icemagic.json",
    },
    ItemsAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_items.json",
    },
    LifeMagicAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_lifemagic.json",
    },
    MusketAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_musket.json",
    },
    PerksAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_perks.json",
    },
    RapierAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_rapier.json",
    },
    RuneAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_rune.json",
    },
    SeasonalItemsAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_seasonalitems.json",
    },
    SpearAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_spear.json",
    },
    SwordAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_sword.json",
    },
    VoidGauntletAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_voidgauntlet.json",
    },
    WarHammerAbilityTable: <DataSheetUri<AbilityData>>{
      uri: "datatables/weaponabilities/javelindata_ability_warhammer.json",
    },
  },
  AchievementData: {
    AchievementDataTable: <DataSheetUri<AchievementData>>{
      uri: "datatables/javelindata_achievements.json",
    },
  },
  AchievementMetaData: {
    AchievementMetaDataTable: <DataSheetUri<AchievementMetaData>>{
      uri: "datatables/javelindata_achievementmetadata.json",
    },
  },
  AffixData: {
    AffixDataTable: <DataSheetUri<AffixData>>{
      uri: "datatables/javelindata_affixdefinitions.json",
    },
  },
  AffixStatData: {
    AffixStatDataTable: <DataSheetUri<AffixStatData>>{
      uri: "datatables/javelindata_affixstats.json",
    },
  },
  AfflictionData: {
    Afflictions: <DataSheetUri<AfflictionData>>{
      uri: "datatables/javelindata_afflictions.json",
    },
  },
  AfkModeData: {
    AfkModes: <DataSheetUri<AfkModeData>>{
      uri: "datatables/javelindata_afkmodes.json",
    },
  },
  AmmoItemDefinitions: {
    AmmoItemDefinitions: <DataSheetUri<AmmoItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_ammo.json",
    },
  },
  AppearanceTransforms: {
    DefaultAppearanceTransforms: <DataSheetUri<AppearanceTransforms>>{
      uri: "datatables/javelindata_appearancetransformdata.json",
    },
  },
  ArchetypeData: {
    ArchetypeDataTable: <DataSheetUri<ArchetypeData>>{
      uri: "datatables/javelindata_archetypes.json",
    },
  },
  ArenaBalanceData: {
    ArenaPvpBalanceTable: <DataSheetUri<ArenaBalanceData>>{
      uri: "datatables/pvpbalancetables/javelindata_pvpbalance_arena.json",
    },
  },
  ArmorAppearanceDefinitions: {
    ArmorAppearances: <DataSheetUri<ArmorAppearanceDefinitions>>{
      uri: "datatables/javelindata_itemappearancedefinitions.json",
    },
  },
  ArmorItemDefinitions: {
    ArmorItemDefinitions: <DataSheetUri<ArmorItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_armor.json",
    },
  },
  AttackTypes: {
    AttackTypes: <DataSheetUri<AttackTypes>>{
      uri: "datatables/javelindata_attacktypes.json",
    },
  },
  AttributeDefinition: {
    Constitution: <DataSheetUri<AttributeDefinition>>{
      uri: "datatables/javelindata_attributeconstitution.json",
    },
    Dexterity: <DataSheetUri<AttributeDefinition>>{
      uri: "datatables/javelindata_attributedexterity.json",
    },
    Focus: <DataSheetUri<AttributeDefinition>>{
      uri: "datatables/javelindata_attributefocus.json",
    },
    Intelligence: <DataSheetUri<AttributeDefinition>>{
      uri: "datatables/javelindata_attributeintelligence.json",
    },
    Strength: <DataSheetUri<AttributeDefinition>>{
      uri: "datatables/javelindata_attributestrength.json",
    },
  },
  BackstoryDefinition: {
    Backstory: <DataSheetUri<BackstoryDefinition>>{
      uri: "datatables/javelindata_backstorydata.json",
    },
  },
  BeamData: {
    Beams: <DataSheetUri<BeamData>>{
      uri: "datatables/javelindata_beams.json",
    },
  },
  BlueprintItemDefinitions: {
    Blueprint: <DataSheetUri<BlueprintItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_blueprints.json",
    },
  },
  BuffBucketData: {
    BuffBuckets: <DataSheetUri<BuffBucketData>>{
      uri: "datatables/javelindata_buffbuckets.json",
    },
  },
  CameraShakeData: {
    CameraShakeDataTable: <DataSheetUri<CameraShakeData>>{
      uri: "datatables/javelindata_camerashake.json",
    },
  },
  CampSkinData: {
    CampSkinDataTable: <DataSheetUri<CampSkinData>>{
      uri: "datatables/javelindata_campskins.json",
    },
  },
  CaptureTheFlagBalanceData: {
    CaptureTheFlagPvpBalanceTable: <DataSheetUri<CaptureTheFlagBalanceData>>{
      uri: "datatables/pvpbalancetables/javelindata_pvpbalance_capturetheflag.json",
    },
  },
  CategoricalProgressionData: {
    CategoricalProgression: <DataSheetUri<CategoricalProgressionData>>{
      uri: "datatables/javelindata_categoricalprogression.json",
    },
  },
  CategoricalProgressionRankData: {
    AzothCurrency: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_azothcurrency.json",
    },
    AzothSaltCurrency: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_azothsaltcurrency.json",
    },
    BattleToken: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_battletokens.json",
    },
    BerlaurCurrency: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_affinity_berlaurcurrency.json",
    },
    BerlaurRep: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_affinity_berlaurrep.json",
    },
    BountyGuild: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_owg_bounty.json",
    },
    Camping: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_camping.json",
    },
    CatacombsCurrencyCrowns: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_catacombscurrency_crowns.json",
    },
    CatacombsCurrencyCursedCrowns: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_catacombscurrency_cursedcrowns.json",
    },
    CatacombsCurrencyCursedSilvers: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_catacombscurrency_cursedsilvers.json",
    },
    CatacombsCurrencySilvers: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_catacombscurrency_silvers.json",
    },
    CollectiblesRankData: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/collectibles/javelindata_collectiblerankdata.json",
    },
    CovenantTokens: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_owg_progression_covenanttokens.json",
    },
    EventRanks: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_event.json",
    },
    ExplorerGuild: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_owg_explorer.json",
    },
    HalloweenEventRanks: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_halloweenevent.json",
    },
    HouseBonus: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_housebonus.json",
    },
    MarauderTokens: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_owg_progression_marauderstokens.json",
    },
    MerchantGuild: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_owg_merchant.json",
    },
    MutatorRankData: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/gamemodemutators/javelindata_mutationrankdata.json",
    },
    ProcurerGuild: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_owg_procurer.json",
    },
    Repair_T1: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_repair_t1.json",
    },
    Repair_T2: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_repair_t2.json",
    },
    Repair_T3: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_repair_t3.json",
    },
    Repair_T4: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_repair_t4.json",
    },
    Repair_T5: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_repair_t5.json",
    },
    SpringEventRanks: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_springevent.json",
    },
    SummerEventRanks: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_progression_summerevent.json",
    },
    SyndicateTokens: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_owg_progression_syndicatetokens.json",
    },
    Territory_Standing: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_territory_standing.json",
    },
    UpyrCurrency: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_affinity_upyrcurrency.json",
    },
    UpyrRep: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_affinity_upyrrep.json",
    },
    WeaponMastery: <DataSheetUri<CategoricalProgressionRankData>>{
      uri: "datatables/javelindata_weaponmastery.json",
    },
  },
  CinematicVideoStaticData: {
    CinematicVideo: <DataSheetUri<CinematicVideoStaticData>>{
      uri: "datatables/cinematics/javelindata_cinematicvideoregistry.json",
    },
  },
  CollectibleStaticData: {
    Collectibles: <DataSheetUri<CollectibleStaticData>>{
      uri: "datatables/collectibles/javelindata_collectiblestaticdata.json",
    },
  },
  CombatProfilesData: {
    CombatProfilesDataTable: <DataSheetUri<CombatProfilesData>>{
      uri: "datatables/combatsettings/javelindata_combatprofiles.json",
    },
  },
  CombatSettingsData: {
    CombatSettingsDataTable: <DataSheetUri<CombatSettingsData>>{
      uri: "datatables/combatsettings/javelindata_combatsettings.json",
    },
  },
  CombatTextData: {
    CombatTextSettings: <DataSheetUri<CombatTextData>>{
      uri: "datatables/javelindata_combattextsettings.json",
    },
  },
  ConsumableItemDefinitions: {
    ConsumableItemDefinitions: <DataSheetUri<ConsumableItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_consumables.json",
    },
  },
  ContributionData: {
    ArenaContribution: <DataSheetUri<ContributionData>>{
      uri: "datatables/contribution/javelindata_contribution_arena.json",
    },
    Contribution: <DataSheetUri<ContributionData>>{
      uri: "datatables/contribution/javelindata_contribution_default.json",
    },
    DarknessContribution: <DataSheetUri<ContributionData>>{
      uri: ["datatables/contribution/javelindata_contribution_darkness.json","datatables/contribution/javelindata_contribution_worldboss.json"]
    },
    DefendObjectContribution: <DataSheetUri<ContributionData>>{
      uri: "datatables/contribution/javelindata_contribution_defendobject.json",
    },
    InvasionContribution: <DataSheetUri<ContributionData>>{
      uri: "datatables/contribution/javelindata_contribution_invasion.json",
    },
    QuestEncContribution: <DataSheetUri<ContributionData>>{
      uri: "datatables/contribution/javelindata_contribution_questencounter.json",
    },
    Season_02_Event_Contribution: <DataSheetUri<ContributionData>>{
      uri: "datatables/contribution/javelindata_contribution_season_02_event.json",
    },
  },
  ConversationStateData: {
    ConversationStates: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/javelindata_conversationstate.json",
    },
    ConversationStates_74: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/74_devworld_red/javelindata_74_conversationstate.json",
    },
    ConversationStates_75: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/75_devworld_blue/javelindata_75_conversationstate.json",
    },
    ConversationStates_C01: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c01_starterbeach/javelindata_c01_conversationstates.json",
    },
    ConversationStates_C02A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c02a_brightwood/javelindata_c02a_conversationstates.json",
    },
    ConversationStates_C03: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c03_greatcleave/javelindata_c03_conversationstate.json",
    },
    ConversationStates_C04A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c04a_everfall/javelindata_c04a_conversationstates.json",
    },
    ConversationStates_C05: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c05_reekwater/javelindata_c05_conversationstate.json",
    },
    ConversationStates_C06A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c06a_windsward/javelindata_c06a_conversationstates.json",
    },
    ConversationStates_C07: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c07_shatteredmoutain/javelindata_c07_conversationstate.json",
    },
    ConversationStates_C08: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c08_ebonscalereach/javelindata_c08_conversationstate.json",
    },
    ConversationStates_C09A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c09a_firstlight/javelindata_c09a_conversationstate.json",
    },
    ConversationStates_C10A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c10a_cutlasskeys/javelindata_c10a_conversationstate.json",
    },
    ConversationStates_C11: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c11_mourningdale/javelindata_c11_conversationstate.json",
    },
    ConversationStates_C12A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c12a_monarchsbluffs/javelindata_c12a_conversationstates.json",
    },
    ConversationStates_C13A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c13a_weaversfen/javelindata_c13a_conversationstates.json",
    },
    ConversationStates_C14: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c14_edengrove/javelindata_c14_conversationstate.json",
    },
    ConversationStates_C15: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c15_restlessshore/javelindata_c15_conversationstate.json",
    },
    ConversationStates_C16: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c16_brimstonesands/javelindata_c16_conversationstate.json",
    },
    ConversationStates_C80: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c80_holidays/javelindata_c80_conversationstates.json",
    },
    ConversationStates_C81: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c81_pushquests/javelindata_c81_conversationstates.json",
    },
    ConversationStates_C91: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c91_fishing/javelindata_c91_conversationstates.json",
    },
    ConversationStates_C94: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c94_mounts/javelindata_c94_conversationstates.json",
    },
    ConversationStates_C95: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c95_seasons/javelindata_c95_conversationstates.json",
    },
    ConversationStates_C95A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c95a_seasons_s02/javelindata_c95a_conversationstates.json",
    },
    ConversationStates_C95_S04: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c95_seasons_s04/javelindata_c95_s04_conversationstates.json",
    },
    ConversationStates_C98: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c98_factions/javelindata_c98_conversationstates.json",
    },
    ConversationStates_C99A: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c99a_msq/javelindata_c99a_conversationstates.json",
    },
    ConversationStates_C99B: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c99b_msq_brightwood/javelindata_c99b_conversationstates.json",
    },
    ConversationStates_C99C: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c99c_msq_weaversfen/javelindata_c99c_conversationstates.json",
    },
    ConversationStates_C99D: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c99d_msq_greatcleave/javelindata_c99d_conversationstates.json",
    },
    ConversationStates_C99E: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c99e_msq_edengrove/javelindata_c99e_conversationstates.json",
    },
    ConversationStates_C99F: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c99f_msq_ebonscale/javelindata_c99f_conversationstates.json",
    },
    ConversationStates_C99G: <DataSheetUri<ConversationStateData>>{
      uri: "datatables/quests/console/c99g_msq_shattered/javelindata_c99g_conversationstates.json",
    },
    'NPC_03976.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_03976.json",
    },
    'NPC_04288.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04288.json",
    },
    'NPC_04289.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04289.json",
    },
    'NPC_04290.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04290.json",
    },
    'NPC_04291.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04291.json",
    },
    'NPC_04292.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04292.json",
    },
    'NPC_04293.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04293.json",
    },
    'NPC_04294.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04294.json",
    },
    'NPC_04295.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04295.json",
    },
    'NPC_04296.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04296.json",
    },
    'NPC_04297.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04297.json",
    },
    'NPC_04627.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04627.json",
    },
    'NPC_04628.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04628.json",
    },
    'NPC_04629.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04629.json",
    },
    'NPC_04630.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04630.json",
    },
    'NPC_04631.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04631.json",
    },
    'NPC_04632.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04632.json",
    },
    'NPC_04633.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04633.json",
    },
    'NPC_04634.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04634.json",
    },
    'NPC_04635.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04635.json",
    },
    'NPC_04636.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_04636.json",
    },
    'NPC_08012.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_08012.json",
    },
    'NPC_08013.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_08013.json",
    },
    'NPC_16003.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16003.json",
    },
    'NPC_16004.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16004.json",
    },
    'NPC_16005.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16005.json",
    },
    'NPC_16006.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16006.json",
    },
    'NPC_16007.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16007.json",
    },
    'NPC_16008.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16008.json",
    },
    'NPC_16009.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16009.json",
    },
    'NPC_16010.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16010.json",
    },
    'NPC_16011.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16011.json",
    },
    'NPC_16012.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16012.json",
    },
    'NPC_16013.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16013.json",
    },
    'NPC_16014.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16014.json",
    },
    'NPC_16015.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16015.json",
    },
    'NPC_16017.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16017.json",
    },
    'NPC_16018.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16018.json",
    },
    'NPC_16019.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16019.json",
    },
    'NPC_16020.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16020.json",
    },
    'NPC_16021.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16021.json",
    },
    'NPC_16022.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16022.json",
    },
    'NPC_16023.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16023.json",
    },
    'NPC_16024.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16024.json",
    },
    'NPC_16025.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16025.json",
    },
    'NPC_16026.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16026.json",
    },
    'NPC_16027.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16027.json",
    },
    'NPC_16028.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16028.json",
    },
    'NPC_16029.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16029.json",
    },
    'NPC_16030.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16030.json",
    },
    'NPC_16031.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16031.json",
    },
    'NPC_16032.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16032.json",
    },
    'NPC_16033.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16033.json",
    },
    'NPC_16034.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16034.json",
    },
    'NPC_16035.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16035.json",
    },
    'NPC_16036.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16036.json",
    },
    'NPC_16037.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16037.json",
    },
    'NPC_16038.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16038.json",
    },
    'NPC_16039.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16039.json",
    },
    'NPC_16040.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16040.json",
    },
    'NPC_16041.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16041.json",
    },
    'NPC_16042.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16042.json",
    },
    'NPC_16043.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16043.json",
    },
    'NPC_16044.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16044.json",
    },
    'NPC_16045.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16045.json",
    },
    'NPC_16046.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16046.json",
    },
    'NPC_16047.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16047.json",
    },
    'NPC_16048.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16048.json",
    },
    'NPC_16049.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16049.json",
    },
    'NPC_16050.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16050.json",
    },
    'NPC_16051.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16051.json",
    },
    'NPC_16052.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16052.json",
    },
    'NPC_16053.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16053.json",
    },
    'NPC_16054.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16054.json",
    },
    'NPC_16055.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16055.json",
    },
    'NPC_16058.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16058.json",
    },
    'NPC_16059.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16059.json",
    },
    'NPC_16060.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16060.json",
    },
    'NPC_16061.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16061.json",
    },
    'NPC_16062.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16062.json",
    },
    'NPC_16063.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16063.json",
    },
    'NPC_16064.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16064.json",
    },
    'NPC_16065.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16065.json",
    },
    'NPC_16066.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16066.json",
    },
    'NPC_16067.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16067.json",
    },
    'NPC_16068.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16068.json",
    },
    'NPC_16069.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16069.json",
    },
    'NPC_16070.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16070.json",
    },
    'NPC_16071.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16071.json",
    },
    'NPC_16072.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16072.json",
    },
    'NPC_16073.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16073.json",
    },
    'NPC_16074.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16074.json",
    },
    'NPC_16075.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16075.json",
    },
    'NPC_16076.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16076.json",
    },
    'NPC_16077.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16077.json",
    },
    'NPC_16078.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16078.json",
    },
    'NPC_16079.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16079.json",
    },
    'NPC_16080.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16080.json",
    },
    'NPC_16081.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16081.json",
    },
    'NPC_16082.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16082.json",
    },
    'NPC_16083.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16083.json",
    },
    'NPC_16084.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16084.json",
    },
    'NPC_16085.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16085.json",
    },
    'NPC_16086.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16086.json",
    },
    'NPC_16087.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16087.json",
    },
    'NPC_16088.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16088.json",
    },
    'NPC_16089.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16089.json",
    },
    'NPC_16090.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16090.json",
    },
    'NPC_16091.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16091.json",
    },
    'NPC_16092.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16092.json",
    },
    'NPC_16093.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16093.json",
    },
    'NPC_16094.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16094.json",
    },
    'NPC_16095.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16095.json",
    },
    'NPC_16096.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16096.json",
    },
    'NPC_16097.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16097.json",
    },
    'NPC_16098.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16098.json",
    },
    'NPC_16099.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16099.json",
    },
    'NPC_16129.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16129.json",
    },
    'NPC_16130.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16130.json",
    },
    'NPC_16131.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16131.json",
    },
    'NPC_16132.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16132.json",
    },
    'NPC_16133.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16133.json",
    },
    'NPC_16134.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16134.json",
    },
    'NPC_16135.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16135.json",
    },
    'NPC_16136.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16136.json",
    },
    'NPC_16137.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16137.json",
    },
    'NPC_16138.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16138.json",
    },
    'NPC_16139.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16139.json",
    },
    'NPC_16140.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16140.json",
    },
    'NPC_16141.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16141.json",
    },
    'NPC_16142.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16142.json",
    },
    'NPC_16143.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16143.json",
    },
    'NPC_16144.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16144.json",
    },
    'NPC_16145.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16145.json",
    },
    'NPC_16146.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16146.json",
    },
    'NPC_16147.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16147.json",
    },
    'NPC_16148.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16148.json",
    },
    'NPC_16149.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16149.json",
    },
    'NPC_16150.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16150.json",
    },
    'NPC_16151.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16151.json",
    },
    'NPC_16152.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16152.json",
    },
    'NPC_16153.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16153.json",
    },
    'NPC_16154.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16154.json",
    },
    'NPC_16155.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16155.json",
    },
    'NPC_16156.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16156.json",
    },
    'NPC_16157.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16157.json",
    },
    'NPC_16158.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16158.json",
    },
    'NPC_16159.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16159.json",
    },
    'NPC_16160.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16160.json",
    },
    'NPC_16161.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16161.json",
    },
    'NPC_16162.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16162.json",
    },
    'NPC_16163.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16163.json",
    },
    'NPC_16164.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16164.json",
    },
    'NPC_16165.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16165.json",
    },
    'NPC_16166.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16166.json",
    },
    'NPC_16167.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16167.json",
    },
    'NPC_16168.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16168.json",
    },
    'NPC_16169.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16169.json",
    },
    'NPC_16170.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16170.json",
    },
    'NPC_16171.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16171.json",
    },
    'NPC_16172.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16172.json",
    },
    'NPC_16173.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16173.json",
    },
    'NPC_16174.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16174.json",
    },
    'NPC_16176.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16176.json",
    },
    'NPC_16179.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16179.json",
    },
    'NPC_16180.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16180.json",
    },
    'NPC_16181.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16181.json",
    },
    'NPC_16182.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16182.json",
    },
    'NPC_16183.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16183.json",
    },
    'NPC_16184.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16184.json",
    },
    'NPC_16185.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16185.json",
    },
    'NPC_16186.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16186.json",
    },
    'NPC_16187.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16187.json",
    },
    'NPC_16188.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16188.json",
    },
    'NPC_16189.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16189.json",
    },
    'NPC_16190.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16190.json",
    },
    'NPC_16191.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16191.json",
    },
    'NPC_16192.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16192.json",
    },
    'NPC_16193.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16193.json",
    },
    'NPC_16194.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16194.json",
    },
    'NPC_16195.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16195.json",
    },
    'NPC_16196.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16196.json",
    },
    'NPC_16197.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16197.json",
    },
    'NPC_16198.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16198.json",
    },
    'NPC_16199.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16199.json",
    },
    'NPC_16200.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16200.json",
    },
    'NPC_16201.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16201.json",
    },
    'NPC_16202.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16202.json",
    },
    'NPC_16203.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16203.json",
    },
    'NPC_16204.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_16204.json",
    },
    'NPC_18000.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18000.json",
    },
    'NPC_18001.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18001.json",
    },
    'NPC_18002.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18002.json",
    },
    'NPC_18003.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18003.json",
    },
    'NPC_18004.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18004.json",
    },
    'NPC_18005.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18005.json",
    },
    'NPC_18006.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18006.json",
    },
    'NPC_18007.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18007.json",
    },
    'NPC_18008.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18008.json",
    },
    'NPC_18009.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18009.json",
    },
    'NPC_18010.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18010.json",
    },
    'NPC_18011.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18011.json",
    },
    'NPC_18012.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18012.json",
    },
    'NPC_18013.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18013.json",
    },
    'NPC_18014.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18014.json",
    },
    'NPC_18015.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18015.json",
    },
    'NPC_18016.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18016.json",
    },
    'NPC_18017.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18017.json",
    },
    'NPC_18018.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18018.json",
    },
    'NPC_18019.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18019.json",
    },
    'NPC_18020.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18020.json",
    },
    'NPC_18021.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18021.json",
    },
    'NPC_18022.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18022.json",
    },
    'NPC_18023.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18023.json",
    },
    'NPC_18024.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18024.json",
    },
    'NPC_18025.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18025.json",
    },
    'NPC_18026.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18026.json",
    },
    'NPC_18027.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18027.json",
    },
    'NPC_18028.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18028.json",
    },
    'NPC_18029.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18029.json",
    },
    'NPC_18030.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18030.json",
    },
    'NPC_18031.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18031.json",
    },
    'NPC_18032.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18032.json",
    },
    'NPC_18033.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18033.json",
    },
    'NPC_18034.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18034.json",
    },
    'NPC_18035.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18035.json",
    },
    'NPC_18036.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18036.json",
    },
    'NPC_18037.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18037.json",
    },
    'NPC_18038.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18038.json",
    },
    'NPC_18039.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18039.json",
    },
    'NPC_18040.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18040.json",
    },
    'NPC_18041.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18041.json",
    },
    'NPC_18042.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18042.json",
    },
    'NPC_18043.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18043.json",
    },
    'NPC_18044.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18044.json",
    },
    'NPC_18045.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18045.json",
    },
    'NPC_18046.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18046.json",
    },
    'NPC_18047.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18047.json",
    },
    'NPC_18048.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18048.json",
    },
    'NPC_18049.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18049.json",
    },
    'NPC_18050.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18050.json",
    },
    'NPC_18051.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18051.json",
    },
    'NPC_18052.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18052.json",
    },
    'NPC_18053.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18053.json",
    },
    'NPC_18054.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18054.json",
    },
    'NPC_18055.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18055.json",
    },
    'NPC_18056.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18056.json",
    },
    'NPC_18057.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18057.json",
    },
    'NPC_18059.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18059.json",
    },
    'NPC_18060.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18060.json",
    },
    'NPC_18061.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18061.json",
    },
    'NPC_18062.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_18062.json",
    },
    'NPC_22000.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_22000.json",
    },
    'NPC_22010.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_22010.json",
    },
    'NPC_22011.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_22011.json",
    },
    'NPC_28000.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28000.json",
    },
    'NPC_28001.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28001.json",
    },
    'NPC_28002.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28002.json",
    },
    'NPC_28003.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28003.json",
    },
    'NPC_28004.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28004.json",
    },
    'NPC_28006.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28006.json",
    },
    'NPC_28007.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28007.json",
    },
    'NPC_28008.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28008.json",
    },
    'NPC_28009.datasheet': <DataSheetUri<ConversationStateData>>{
      uri: "datatables/questdata/conversationstatedata_npc_28009.json",
    },
  },
  ConversationTopicData: {
    ConversationTopics: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/javelindata_conversationtopics.json",
    },
    ConversationTopics_75: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/75_devworld_blue/javelindata_75_conversationtopic.json",
    },
    ConversationTopics_C01: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c01_starterbeach/javelindata_c01_conversationtopics.json",
    },
    ConversationTopics_C02A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c02a_brightwood/javelindata_c02a_conversationtopics.json",
    },
    ConversationTopics_C03: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c03_greatcleave/javelindata_c03_conversationtopics.json",
    },
    ConversationTopics_C04A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c04a_everfall/javelindata_c04a_conversationtopics.json",
    },
    ConversationTopics_C05: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c05_reekwater/javelindata_c05_conversationtopics.json",
    },
    ConversationTopics_C06A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c06a_windsward/javelindata_c06a_conversationtopics.json",
    },
    ConversationTopics_C07: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c07_shatteredmoutain/javelindata_c07_conversationtopics.json",
    },
    ConversationTopics_C08: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c08_ebonscalereach/javelindata_c08_conversationtopics.json",
    },
    ConversationTopics_C09A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c09a_firstlight/javelindata_c09a_conversationtopics.json",
    },
    ConversationTopics_C10A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c10a_cutlasskeys/javelindata_c10a_conversationtopics.json",
    },
    ConversationTopics_C11: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c11_mourningdale/javelindata_c11_conversationtopics.json",
    },
    ConversationTopics_C12A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c12a_monarchsbluffs/javelindata_c12a_conversationtopics.json",
    },
    ConversationTopics_C13A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c13a_weaversfen/javelindata_c13a_conversationtopics.json",
    },
    ConversationTopics_C14: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c14_edengrove/javelindata_c14_conversationtopics.json",
    },
    ConversationTopics_C15: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c15_restlessshore/javelindata_c15_conversationtopics.json",
    },
    ConversationTopics_C16: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c16_brimstonesands/javelindata_c16_conversationtopics.json",
    },
    ConversationTopics_C80: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c80_holidays/javelindata_c80_conversationtopics.json",
    },
    ConversationTopics_C81: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c81_pushquests/javelindata_c81_conversationtopics.json",
    },
    ConversationTopics_C91: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c91_fishing/javelindata_c91_conversationtopics.json",
    },
    ConversationTopics_C94: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c94_mounts/javelindata_c94_conversationtopics.json",
    },
    ConversationTopics_C95: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c95_seasons/javelindata_c95_conversationtopics.json",
    },
    ConversationTopics_C95A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c95a_seasons_s02/javelindata_c95a_conversationtopics.json",
    },
    ConversationTopics_C95_S04: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c95_seasons_s04/javelindata_c95_s04_conversationtopics.json",
    },
    ConversationTopics_C98: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c98_factions/javelindata_c98_conversationtopics.json",
    },
    ConversationTopics_C99A: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c99a_msq/javelindata_c99a_conversationtopics.json",
    },
    ConversationTopics_C99B: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c99b_msq_brightwood/javelindata_c99b_conversationtopics.json",
    },
    ConversationTopics_C99C: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c99c_msq_weaversfen/javelindata_c99c_conversationtopics.json",
    },
    ConversationTopics_C99D: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c99d_msq_greatcleave/javelindata_c99d_conversationtopics.json",
    },
    ConversationTopics_C99E: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c99e_msq_edengrove/javelindata_c99e_conversationtopics.json",
    },
    ConversationTopics_C99F: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c99f_msq_ebonscale/javelindata_c99f_conversationtopics.json",
    },
    ConversationTopics_C99G: <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/quests/console/c99g_msq_shattered/javelindata_c99g_conversationtopics.json",
    },
    'NPC_03976.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_03976.json",
    },
    'NPC_04288.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04288.json",
    },
    'NPC_04289.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04289.json",
    },
    'NPC_04290.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04290.json",
    },
    'NPC_04291.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04291.json",
    },
    'NPC_04292.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04292.json",
    },
    'NPC_04293.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04293.json",
    },
    'NPC_04294.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04294.json",
    },
    'NPC_04295.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04295.json",
    },
    'NPC_04296.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04296.json",
    },
    'NPC_04297.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04297.json",
    },
    'NPC_04627.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04627.json",
    },
    'NPC_04628.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04628.json",
    },
    'NPC_04629.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04629.json",
    },
    'NPC_04630.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04630.json",
    },
    'NPC_04631.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04631.json",
    },
    'NPC_04632.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04632.json",
    },
    'NPC_04633.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04633.json",
    },
    'NPC_04634.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04634.json",
    },
    'NPC_04635.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04635.json",
    },
    'NPC_04636.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_04636.json",
    },
    'NPC_08012.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_08012.json",
    },
    'NPC_08013.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_08013.json",
    },
    'NPC_16003.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16003.json",
    },
    'NPC_16004.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16004.json",
    },
    'NPC_16005.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16005.json",
    },
    'NPC_16006.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16006.json",
    },
    'NPC_16007.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16007.json",
    },
    'NPC_16008.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16008.json",
    },
    'NPC_16009.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16009.json",
    },
    'NPC_16010.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16010.json",
    },
    'NPC_16011.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16011.json",
    },
    'NPC_16012.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16012.json",
    },
    'NPC_16013.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16013.json",
    },
    'NPC_16014.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16014.json",
    },
    'NPC_16015.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16015.json",
    },
    'NPC_16017.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16017.json",
    },
    'NPC_16018.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16018.json",
    },
    'NPC_16019.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16019.json",
    },
    'NPC_16020.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16020.json",
    },
    'NPC_16021.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16021.json",
    },
    'NPC_16022.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16022.json",
    },
    'NPC_16023.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16023.json",
    },
    'NPC_16024.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16024.json",
    },
    'NPC_16025.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16025.json",
    },
    'NPC_16026.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16026.json",
    },
    'NPC_16027.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16027.json",
    },
    'NPC_16028.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16028.json",
    },
    'NPC_16029.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16029.json",
    },
    'NPC_16030.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16030.json",
    },
    'NPC_16031.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16031.json",
    },
    'NPC_16032.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16032.json",
    },
    'NPC_16033.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16033.json",
    },
    'NPC_16034.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16034.json",
    },
    'NPC_16035.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16035.json",
    },
    'NPC_16036.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16036.json",
    },
    'NPC_16037.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16037.json",
    },
    'NPC_16038.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16038.json",
    },
    'NPC_16039.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16039.json",
    },
    'NPC_16040.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16040.json",
    },
    'NPC_16041.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16041.json",
    },
    'NPC_16042.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16042.json",
    },
    'NPC_16043.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16043.json",
    },
    'NPC_16044.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16044.json",
    },
    'NPC_16045.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16045.json",
    },
    'NPC_16046.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16046.json",
    },
    'NPC_16047.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16047.json",
    },
    'NPC_16048.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16048.json",
    },
    'NPC_16049.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16049.json",
    },
    'NPC_16050.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16050.json",
    },
    'NPC_16051.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16051.json",
    },
    'NPC_16052.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16052.json",
    },
    'NPC_16053.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16053.json",
    },
    'NPC_16054.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16054.json",
    },
    'NPC_16055.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16055.json",
    },
    'NPC_16058.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16058.json",
    },
    'NPC_16059.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16059.json",
    },
    'NPC_16060.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16060.json",
    },
    'NPC_16061.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16061.json",
    },
    'NPC_16062.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16062.json",
    },
    'NPC_16063.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16063.json",
    },
    'NPC_16064.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16064.json",
    },
    'NPC_16065.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16065.json",
    },
    'NPC_16066.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16066.json",
    },
    'NPC_16067.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16067.json",
    },
    'NPC_16068.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16068.json",
    },
    'NPC_16069.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16069.json",
    },
    'NPC_16070.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16070.json",
    },
    'NPC_16071.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16071.json",
    },
    'NPC_16072.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16072.json",
    },
    'NPC_16073.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16073.json",
    },
    'NPC_16074.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16074.json",
    },
    'NPC_16075.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16075.json",
    },
    'NPC_16076.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16076.json",
    },
    'NPC_16077.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16077.json",
    },
    'NPC_16078.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16078.json",
    },
    'NPC_16079.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16079.json",
    },
    'NPC_16080.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16080.json",
    },
    'NPC_16081.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16081.json",
    },
    'NPC_16082.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16082.json",
    },
    'NPC_16083.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16083.json",
    },
    'NPC_16084.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16084.json",
    },
    'NPC_16085.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16085.json",
    },
    'NPC_16086.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16086.json",
    },
    'NPC_16087.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16087.json",
    },
    'NPC_16088.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16088.json",
    },
    'NPC_16089.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16089.json",
    },
    'NPC_16090.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16090.json",
    },
    'NPC_16091.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16091.json",
    },
    'NPC_16092.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16092.json",
    },
    'NPC_16093.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16093.json",
    },
    'NPC_16094.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16094.json",
    },
    'NPC_16095.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16095.json",
    },
    'NPC_16096.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16096.json",
    },
    'NPC_16097.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16097.json",
    },
    'NPC_16098.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16098.json",
    },
    'NPC_16099.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16099.json",
    },
    'NPC_16129.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16129.json",
    },
    'NPC_16130.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16130.json",
    },
    'NPC_16131.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16131.json",
    },
    'NPC_16132.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16132.json",
    },
    'NPC_16133.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16133.json",
    },
    'NPC_16134.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16134.json",
    },
    'NPC_16135.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16135.json",
    },
    'NPC_16136.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16136.json",
    },
    'NPC_16137.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16137.json",
    },
    'NPC_16138.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16138.json",
    },
    'NPC_16139.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16139.json",
    },
    'NPC_16140.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16140.json",
    },
    'NPC_16141.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16141.json",
    },
    'NPC_16142.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16142.json",
    },
    'NPC_16143.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16143.json",
    },
    'NPC_16144.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16144.json",
    },
    'NPC_16145.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16145.json",
    },
    'NPC_16146.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16146.json",
    },
    'NPC_16147.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16147.json",
    },
    'NPC_16148.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16148.json",
    },
    'NPC_16149.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16149.json",
    },
    'NPC_16150.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16150.json",
    },
    'NPC_16151.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16151.json",
    },
    'NPC_16152.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16152.json",
    },
    'NPC_16153.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16153.json",
    },
    'NPC_16154.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16154.json",
    },
    'NPC_16155.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16155.json",
    },
    'NPC_16156.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16156.json",
    },
    'NPC_16157.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16157.json",
    },
    'NPC_16158.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16158.json",
    },
    'NPC_16159.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16159.json",
    },
    'NPC_16160.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16160.json",
    },
    'NPC_16161.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16161.json",
    },
    'NPC_16162.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16162.json",
    },
    'NPC_16163.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16163.json",
    },
    'NPC_16164.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16164.json",
    },
    'NPC_16165.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16165.json",
    },
    'NPC_16166.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16166.json",
    },
    'NPC_16167.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16167.json",
    },
    'NPC_16168.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16168.json",
    },
    'NPC_16169.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16169.json",
    },
    'NPC_16170.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16170.json",
    },
    'NPC_16171.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16171.json",
    },
    'NPC_16172.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16172.json",
    },
    'NPC_16173.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16173.json",
    },
    'NPC_16174.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16174.json",
    },
    'NPC_16176.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16176.json",
    },
    'NPC_16179.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16179.json",
    },
    'NPC_16180.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16180.json",
    },
    'NPC_16181.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16181.json",
    },
    'NPC_16182.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16182.json",
    },
    'NPC_16183.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16183.json",
    },
    'NPC_16184.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16184.json",
    },
    'NPC_16185.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16185.json",
    },
    'NPC_16186.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16186.json",
    },
    'NPC_16187.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16187.json",
    },
    'NPC_16188.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16188.json",
    },
    'NPC_16189.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16189.json",
    },
    'NPC_16190.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16190.json",
    },
    'NPC_16191.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16191.json",
    },
    'NPC_16192.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16192.json",
    },
    'NPC_16193.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16193.json",
    },
    'NPC_16194.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16194.json",
    },
    'NPC_16195.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16195.json",
    },
    'NPC_16196.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16196.json",
    },
    'NPC_16197.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16197.json",
    },
    'NPC_16198.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16198.json",
    },
    'NPC_16199.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16199.json",
    },
    'NPC_16200.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16200.json",
    },
    'NPC_16201.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16201.json",
    },
    'NPC_16202.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16202.json",
    },
    'NPC_16203.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16203.json",
    },
    'NPC_16204.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_16204.json",
    },
    'NPC_18000.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18000.json",
    },
    'NPC_18001.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18001.json",
    },
    'NPC_18002.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18002.json",
    },
    'NPC_18003.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18003.json",
    },
    'NPC_18004.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18004.json",
    },
    'NPC_18005.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18005.json",
    },
    'NPC_18006.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18006.json",
    },
    'NPC_18007.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18007.json",
    },
    'NPC_18008.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18008.json",
    },
    'NPC_18009.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18009.json",
    },
    'NPC_18010.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18010.json",
    },
    'NPC_18011.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18011.json",
    },
    'NPC_18012.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18012.json",
    },
    'NPC_18013.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18013.json",
    },
    'NPC_18014.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18014.json",
    },
    'NPC_18015.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18015.json",
    },
    'NPC_18016.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18016.json",
    },
    'NPC_18017.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18017.json",
    },
    'NPC_18018.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18018.json",
    },
    'NPC_18019.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18019.json",
    },
    'NPC_18020.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18020.json",
    },
    'NPC_18021.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18021.json",
    },
    'NPC_18022.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18022.json",
    },
    'NPC_18023.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18023.json",
    },
    'NPC_18024.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18024.json",
    },
    'NPC_18025.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18025.json",
    },
    'NPC_18026.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18026.json",
    },
    'NPC_18027.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18027.json",
    },
    'NPC_18028.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18028.json",
    },
    'NPC_18029.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18029.json",
    },
    'NPC_18030.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18030.json",
    },
    'NPC_18031.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18031.json",
    },
    'NPC_18032.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18032.json",
    },
    'NPC_18033.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18033.json",
    },
    'NPC_18034.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18034.json",
    },
    'NPC_18035.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18035.json",
    },
    'NPC_18036.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18036.json",
    },
    'NPC_18037.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18037.json",
    },
    'NPC_18038.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18038.json",
    },
    'NPC_18039.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18039.json",
    },
    'NPC_18040.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18040.json",
    },
    'NPC_18041.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18041.json",
    },
    'NPC_18042.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18042.json",
    },
    'NPC_18043.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18043.json",
    },
    'NPC_18044.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18044.json",
    },
    'NPC_18045.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18045.json",
    },
    'NPC_18046.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18046.json",
    },
    'NPC_18047.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18047.json",
    },
    'NPC_18048.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18048.json",
    },
    'NPC_18049.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18049.json",
    },
    'NPC_18050.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18050.json",
    },
    'NPC_18051.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18051.json",
    },
    'NPC_18052.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18052.json",
    },
    'NPC_18053.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18053.json",
    },
    'NPC_18054.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18054.json",
    },
    'NPC_18055.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18055.json",
    },
    'NPC_18056.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18056.json",
    },
    'NPC_18057.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18057.json",
    },
    'NPC_18059.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18059.json",
    },
    'NPC_18060.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18060.json",
    },
    'NPC_18061.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18061.json",
    },
    'NPC_18062.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_18062.json",
    },
    'NPC_22000.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_22000.json",
    },
    'NPC_22010.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_22010.json",
    },
    'NPC_22011.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_22011.json",
    },
    'NPC_28000.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28000.json",
    },
    'NPC_28001.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28001.json",
    },
    'NPC_28002.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28002.json",
    },
    'NPC_28003.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28003.json",
    },
    'NPC_28004.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28004.json",
    },
    'NPC_28006.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28006.json",
    },
    'NPC_28007.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28007.json",
    },
    'NPC_28008.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28008.json",
    },
    'NPC_28009.datasheet': <DataSheetUri<ConversationTopicData>>{
      uri: "datatables/questdata/conversationtopicdata_npc_28009.json",
    },
  },
  CooldownData: {
    Cooldowns_Player: <DataSheetUri<CooldownData>>{
      uri: "datatables/javelindata_cooldowns_player.json",
    },
  },
  CostumeChangeData: {
    CostumeChanges: <DataSheetUri<CostumeChangeData>>{
      uri: "datatables/costumechanges/javelindata_costumechanges.json",
    },
  },
  CraftingCategoryData: {
    CraftingCategories: <DataSheetUri<CraftingCategoryData>>{
      uri: "datatables/javelindata_craftingcategories.json",
    },
  },
  CraftingRecipeData: {
    CraftingRecipes: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting.json",
    },
    CraftingRecipesArcana: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_arcana.json",
    },
    CraftingRecipesArmorer: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_armorer.json",
    },
    CraftingRecipesCooking: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_cooking.json",
    },
    CraftingRecipesDungeon: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_dungeon.json",
    },
    CraftingRecipesEngineer: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_engineer.json",
    },
    CraftingRecipesGypKilm: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_gypkilm.json",
    },
    CraftingRecipesJeweler: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_jeweler.json",
    },
    CraftingRecipesMisc: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_misc.json",
    },
    CraftingRecipesRaid: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_raid.json",
    },
    CraftingRecipesRefining: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_refining.json",
    },
    CraftingRecipesSeasonalServers: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_seasonalserver.json",
    },
    CraftingRecipesSeasons: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_seasons.json",
    },
    CraftingRecipesSpecialtyShops: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_specialtyshops.json",
    },
    CraftingRecipesWeapon: <DataSheetUri<CraftingRecipeData>>{
      uri: "datatables/javelindata_crafting_weapon.json",
    },
  },
  CrestPartData: {
    Crests: <DataSheetUri<CrestPartData>>{
      uri: "datatables/javelindata_crestdata.json",
    },
  },
  CurrencyExchangeData: {
    CurrencyExchange: <DataSheetUri<CurrencyExchangeData>>{
      uri: "datatables/javelindata_currencyexchangerates.json",
    },
  },
  CurseMutationStaticData: {
    CurseMutation: <DataSheetUri<CurseMutationStaticData>>{
      uri: "datatables/gamemodemutators/javelindata_cursemutations.json",
    },
  },
  CutsceneCameraStaticData: {
    CutsceneCameraPresets: <DataSheetUri<CutsceneCameraStaticData>>{
      uri: "datatables/cinematics/javelindata_cutscenecamerapresets.json",
    },
  },
  DamageData: {
    AGIceGuardianBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/seasons_datatables/season_04/javelindata_damagetable_ag_iceguardianboss.json",
    },
    AGIceGuardianBossSoloDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/seasons_datatables/season_04/javelindata_damagetable_ag_iceguardianbosssolo.json",
    },
    AbominableLiangDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/grunt_datatables/javelindata_damagetable_abominable_liang.json",
    },
    AdianaAIDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/adiana_datatables/javelindata_damagetable_adiana_archer.json",
    },
    AdolescentSprigganDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/spriggan_datatables/javelindata_damagetable_adolescentspriggan.json",
    },
    AlligatorDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_alligator.json",
    },
    AlligatorYoungDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/alligator_datatables/javelindata_damagetable_alligatoryoung.json",
    },
    AncientAmalgamDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ancientguardian_datatables/javelindata_damagetable_ancientamalgam.json",
    },
    AncientGuardianDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ancientguardian_datatables/javelindata_damagetable_ancientguardian.json",
    },
    AncientGuardianHeavyBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ancientguardian_datatables/javelindata_damagetable_ancientguardianheavyboss.json",
    },
    AncientGuardian_Bowman_IceVariant_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ancientguardian_datatables/javelindata_damagetable_ag_ice_bowman.json",
    },
    AncientGuardian_Greatsword_IceVariant_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ancientguardian_datatables/javelindata_damagetable_ag_ice_greatsword.json",
    },
    AncientGuardian_Spearman_IceVariant_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ancientguardian_datatables/javelindata_damagetable_ag_ice_spearman.json",
    },
    AncientGuardian_Warhammer_IceVariant_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ancientguardian_datatables/javelindata_damagetable_ag_ice_warhammer.json",
    },
    AnubianGuardian_BruteDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/anubianguardian_datatables/javelindata_damagetable_anubianguardian_brute.json",
    },
    AnubianGuardian_HorusDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/anubianguardian_datatables/javelindata_damagetable_anubianguardian_horus.json",
    },
    AnubianLotusScarabDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/anubianscarab_datatables/javelindata_damagetable_anubianlotusscarab.json",
    },
    AnubianLotusScarabWorldBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/worldboss_datatables/javelindata_damagetable_anubianlotusscarab_worldboss.json",
    },
    AnubianScarabDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/anubianscarab_datatables/javelindata_damagetable_anubianscarab.json",
    },
    ArmoredDragonDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/armored_dragon/javelindata_damagetable_armoreddragon.json",
    },
    BabySandwormDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/seasons_datatables/season_02/javelindata_damagetable_babysandworm.json",
    },
    BaronessHainDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghost_datatables/javelindata_damagetable_or_ghost_boss.json",
    },
    BearBlackDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bear_datatables/javelindata_damagetable_bear_black.json",
    },
    BearCubDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bear_datatables/javelindata_damagetable_bear_cub.json",
    },
    BearDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bear_datatables/javelindata_damagetable_bear.json",
    },
    BearDamnedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bear_datatables/javelindata_damagetable_bear_damned.json",
    },
    BearElementalDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bear_datatables/javelindata_damagetable_bear_elemental.json",
    },
    BearThorpeMinionDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bear_datatables/javelindata_damagetable_bear_thorpe_minion.json",
    },
    BisonDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bison_datatables/javelindata_damagetable_bison.json",
    },
    BisonStrangeDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bison_datatables/javelindata_damagetable_bison_strange.json",
    },
    BlightFiendDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/risen_datatables/javelindata_damagetable_blightfiend.json",
    },
    BloatedCorpseDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bomber_datatables/javelindata_damagetable_bloated_corpse.json",
    },
    BloodOfTheSandsDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/seasons_datatables/season_02/javelindata_damagetable_malek_bloodofthesands.json",
    },
    BloodbeastDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/grunt_datatables/javelindata_damagetable_bloodbeast.json",
    },
    BoarDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_boar.json",
    },
    BogMonsterDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bogmonster_datatables/javelindata_damagetable_bogmonster.json",
    },
    BrokenAxeThrowerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_axethrower.json",
    },
    BrokenDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_broken.json",
    },
    BrokenPitchforkDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_pitchfork.json",
    },
    BrokenVillager2hAxeDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_2haxe.json",
    },
    BrokenVillager2hPickDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_2hpick.json",
    },
    BrokenVillagerCleaverDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_cleaver.json",
    },
    BrokenVillagerHammerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_hammer.json",
    },
    BrokenVillagerKnifeDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_knife.json",
    },
    BrokenVillagerLadelDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_ladel.json",
    },
    BrokenVillagerProngDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_prong.json",
    },
    BrokenVillagerRakeDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_rake.json",
    },
    BrokenVillagerShovelDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_shovel.json",
    },
    BrokenVillagerSickleDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/broken_datatables/javelindata_damagetable_brokenvillager_sickle.json",
    },
    BrotherUmbertoDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/brother_umberto_datatables/javelindata_damagetable_brother_umberto.json",
    },
    BruteDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/brute_datatables/javelindata_damagetable_brute.json",
    },
    Brute_Yeti_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/brute_datatables/javelindata_damagetable_brute_yeti.json",
    },
    ChameleonDragonDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/chameleon_datatables/javelindata_damagetable_chameleon.json",
    },
    CommanderLothDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/commanderloth_datatables/javelindata_damagetable_commanderloth.json",
    },
    CorruptedLegion_Cyclops_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/legion_datatables/javelindata_damagetable_corruptedlegion_cyclops.json",
    },
    CorruptedLeviathanDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/corruptedleviathan_datatables/javelindata_damagetable_corrupted_leviathan.json",
    },
    CorruptedSwarmerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/swarmer_datatables/javelindata_damagetable_corruptedswarmer.json",
    },
    CorruptedTigerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lion_datatables/javelindata_damagetable_corrupted_tiger.json",
    },
    CorruptionEntityDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/risen_datatables/javelindata_damagetable_corruptionentity.json",
    },
    CorruptionHeavyDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/corruptionheavy_datatables/javelindata_damagetable_corruption_heavy.json",
    },
    DaichiSotoDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/seasons_datatables/season_04/javelindata_damagetable_s04_daichi.json",
    },
    DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable.json",
    },
    DamageTable_Perks: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_perks.json",
    },
    DamageTable_Structures: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_structures.json",
    },
    DamnedAcolyteDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/damned_datatables/javelindata_damagetable_damned_acolyte.json",
    },
    DamnedCommanderFireDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_damned_commander.json",
    },
    DamnedCommanderFireDamageTable_FTUE: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_damned_commander_ftue.json",
    },
    DamnedCultistDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/damned_datatables/javelindata_damagetable_damned_cultist.json",
    },
    DamnedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_damned.json",
    },
    DamnedDamageTable_Damned_FTUE: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_ftue_damagetable_damned.json",
    },
    DamnedFirstMateDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/damned_datatables/javelindata_damagetable_damned_firstmate.json",
    },
    DamnedGreatAxeDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/damned_datatables/javelindata_damagetable_damned_greataxe.json",
    },
    DamnedHoundDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_damned_hound.json",
    },
    DamnedPriestDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/damned_datatables/javelindata_damagetable_damned_priest.json",
    },
    DryadProwlerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dryad_datatables/javelindata_damagetable_dryadprowler.json",
    },
    DryadSirenDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dryad_datatables/javelindata_damagetable_dryad_siren.json",
    },
    DryadSoldierDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dryad_datatables/javelindata_damagetable_dryadsoldier.json",
    },
    DryadTendrilDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dryad_datatables/javelindata_damagetable_dryadtendril.json",
    },
    DunePhantomBerserkerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_berserker.json",
    },
    DunePhantom_Huntress_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_huntress.json",
    },
    DunePhantom_Tank_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dunephantom_datatables/javelindata_damagetable_dunephantom_tank.json",
    },
    DungeonDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_dungeon.json",
    },
    DynastyEmpressDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/empress_datatables/javelindata_damagetable_empress.json",
    },
    DynastyEmpressPedestalDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/empress_datatables/javelindata_damagetable_pedestal.json",
    },
    DynastyEmpressSoloDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/empress_datatables/javelindata_damagetable_empress_solo.json",
    },
    DynastyEmpressWorldBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/worldboss_datatables/javelindata_damagetable_empress_worldboss.json",
    },
    DynastyHeavyDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/corruptionheavy_datatables/javelindata_damagetable_dynasty_heavy.json",
    },
    DynastyMaidenDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/empress_datatables/javelindata_damagetable_maiden.json",
    },
    DynastyMusketeerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dynasty_datatables/javelindata_damagetable_dynasty_musketeer.json",
    },
    DynastySpearmanDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dynasty_datatables/javelindata_damagetable_dynasty_spearman.json",
    },
    DynastySummonerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dynasty_datatables/javelindata_damagetable_dynasty_summoner.json",
    },
    DynastyWarriorDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dynasty_datatables/javelindata_damagetable_dynasty_warrior.json",
    },
    Elephant_H_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/hercyne_datatables/javelindata_damagetable_elephant_h.json",
    },
    EliteAffixDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/eliteaffix_datatables/javelindata_damagetable_elite_affix.json",
    },
    ElkCorruptedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/elk_datatables/javelindata_damagetable_elk_corrupted.json",
    },
    ElkDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_elk.json",
    },
    ElkMotherwellDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/elk_datatables/javelindata_damagetable_elk_motherwell.json",
    },
    ElkSpringStagDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/elk_datatables/javelindata_damagetable_elk_springstag.json",
    },
    EvilKnightBowIceVariantDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_evil_knight_bow_icevariant.json",
    },
    EvilKnightFlamekeeperDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_evil_knight_flamekeeper.json",
    },
    EvilKnightGruntmasterDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_evil_knight_gruntmaster.json",
    },
    EvilKnightMaceIceDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_maceice.json",
    },
    EvilKnightSpearIceDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_evil_knight_spear_icevariant.json",
    },
    EvilKnightSwordIceDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_evil_knight_swordice.json",
    },
    EvilKnightVoidGauntletDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_voidgauntlet.json",
    },
    ExplosiveSproutFireDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/explosivesprout_datatables/javelindata_damagetable_explosivesprout_fire.json",
    },
    EzraForgemaster: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/skeleton_datatables/javelindata_damagetable_ezraforgemaster.json",
    },
    FTUEDamageTableMiner: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_ftue_damagetable_undead_grenadier.json",
    },
    FeralArcherDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dryad_datatables/javelindata_damagetable_dryadarcher.json",
    },
    FeralGhoulDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/feralghoul_datatables/javelindata_damagetable_feralghoul.json",
    },
    FeralShamanDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/dryad_datatables/javelindata_damagetable_dryadshaman.json",
    },
    FireChampionDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_firechampion.json",
    },
    FireChampionWorldBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/worldboss_datatables/javelindata_damagetable_firechampion_worldboss.json",
    },
    FireNagaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/naga_datatables/javelindata_damagetable_naga_fire.json",
    },
    FlameGruntDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/grunt_datatables/javelindata_damagetable_flamegrunt.json",
    },
    FulgorisCatacombsDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/catacombsboss_datatables/javelindata_damagetable_catacombs_fulgoris.json",
    },
    FulgorisDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/brute_datatables/javelindata_damagetable_fulgoris.json",
    },
    GenericBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/boss_datatables/javelindata_damagetable_boss.json",
    },
    GhastlyHatchetDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghastly_datatables/javelindata_damagetable_ghastly_villager_hatchet.json",
    },
    GhastlySniper_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghastly_datatables/javelindata_damagetable_ghastly_villager_sniper.json",
    },
    GhastlyVillagerShovelDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghastly_datatables/javelindata_damagetable_ghastly_villager_shovel.json",
    },
    GhostCharredDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghost_datatables/javelindata_damagetable_ghost_charred.json",
    },
    GhostDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghost_datatables/javelindata_damagetable_ghost.json",
    },
    GhostFrozenDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghost_datatables/javelindata_damagetable_ghost_frozen.json",
    },
    GhostPlaguedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghost_datatables/javelindata_damagetable_ghost_plagued.json",
    },
    GhostShackledDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghost_datatables/javelindata_damagetable_ghost_shackled.json",
    },
    GhostShipwreckedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ghost_datatables/javelindata_damagetable_ghost_shipwrecked.json",
    },
    GoatDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_goat.json",
    },
    GoliathHorusBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/anubianguardian_datatables/javelindata_damagetable_goliathhorusboss.json",
    },
    Goliath_BruteBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/anubianguardian_datatables/javelindata_damagetable_goliathbruteboss.json",
    },
    GorillaBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/gorilla_datatables/javelindata_damagetable_gorillaboss.json",
    },
    GorillaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/gorilla_datatables/javelindata_damagetable_gorilla.json",
    },
    Gorilla_H_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/gorilla_datatables/javelindata_damagetable_gorilla_h.json",
    },
    GruntDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/grunt_datatables/javelindata_damagetable_grunt.json",
    },
    HercyneBoarDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/hercyne_datatables/javelindata_damagetable_hercyneboar.json",
    },
    HercyneBroodmotherDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/hercyne_datatables/javelindata_damagetable_hercynebroodmother.json",
    },
    HercyneCorvidDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/hercyne_datatables/javelindata_damagetable_hercynecorvid.json",
    },
    HercyneEchidnaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/hercyne_datatables/javelindata_damagetable_hercyneechidna.json",
    },
    HercyneReindeerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/hercyne_datatables/javelindata_damagetable_hercynereindeer.json",
    },
    HercyneTyphonDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/hercyne_datatables/javelindata_damagetable_hercynetyphon.json",
    },
    HercyneWolfDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/hercyne_datatables/javelindata_damagetable_hercynewolf.json",
    },
    HumanBlunderbussDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_blunderbuss.json",
    },
    HumanBowDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_bow.json",
    },
    HumanGreatAxeDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_greataxe.json",
    },
    HumanGreatAxeIceVariantDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_greataxe_icevariant.json",
    },
    HumanHeavyDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_heavy.json",
    },
    HumanLifeStaffDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_lifestaff.json",
    },
    HumanMaceDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_mace.json",
    },
    HumanRapierDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_rapier.json",
    },
    HumanSpearDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_spear.json",
    },
    HumanSpellcasterDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_spellcaster.json",
    },
    HumanSpellcasterIceVariantDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_caster_icevariant.json",
    },
    HumanSwordDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_sword.json",
    },
    HumanWarhammerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_warhammer.json",
    },
    HumanWarhammerIceDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/human_datatables/javelindata_damagetable_human_warhammer_icevariant.json",
    },
    IceDragonDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ice_dragon/javelindata_damagetable_icedragon.json",
    },
    IceDragonSoloDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ice_dragon/javelindata_damagetable_icedragon_solo.json",
    },
    IceDragon_EssenceFragment_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ice_dragon/javelindata_damagetable_icedragon_essencefragment.json",
    },
    IceDryadFrostfangDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/icedryad_datatables/javelindata_damagetable_icedryad_frostfang.json",
    },
    IceDryadFrostgripDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/icedryad_datatables/javelindata_damagetable_icedryad_frostgrip.json",
    },
    IceDryad_Fiend_Shivers_Damage: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/icedryad_datatables/javelindata_damagetable_icedryad_fiend_shivers.json",
    },
    IceGolem_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/brute_datatables/javelindata_damagetable_icegolem.json",
    },
    IceTorsoBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/torsoboss_datatables/javelindata_damagetable_ice_torso_boss.json",
    },
    ImhotepDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/questnpc_datatables/javelindata_damagetable_imhotep.json",
    },
    InvasionBomberDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/bomber_datatables/javelindata_damagetable_invasion_bomber.json",
    },
    Invasion_Priest_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/invasion_datatables/javelindata_damagetable_invasion_priest.json",
    },
    IsabellaDynastyShipyardDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/isabella_datatables/javelindata_damagetable_isabella_dynastyshipyard.json",
    },
    IsabellaLairPhase1DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/isabella_datatables/javelindata_damagetable_isabella_lair_phase1.json",
    },
    IsabellaLairPhase2DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/isabella_datatables/javelindata_damagetable_isabella_lair_phase2.json",
    },
    IsabellaMSQ2DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/isabella_datatables/javelindata_damagetable_isabella_solo_msq2.json",
    },
    IsabellaTigerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lion_datatables/javelindata_damagetable_isabella_tiger.json",
    },
    IsabellaWingedWorldBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/worldboss_datatables/javelindata_damagetable_isabella_winged_worldboss.json",
    },
    JesterAddBruteDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/isleofnight_datatables/javelindata_damagetable_jesteradd_brute.json",
    },
    KnightHoundDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_evil_knight_hound.json",
    },
    KnightWolfDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_knight_wolf.json",
    },
    LegionGeneralCrassusBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/legion_datatables/javelindata_damagetable_legion_general_crassus_boss.json",
    },
    LegionLegionnaireDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/legion_datatables/javelindata_damagetable_legion_legionnaire.json",
    },
    LegionSagittariiDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/legion_datatables/javelindata_damagetable_legion_sagittarii.json",
    },
    LegionSigniferDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/legion_datatables/javelindata_damagetable_legion_signifer.json",
    },
    LionDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lion_datatables/javelindata_damagetable_lion.json",
    },
    LostFencerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostknights_datatables/javelindata_damagetable_lost_fencer.json",
    },
    LostKnightBowDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostknights_datatables/javelindata_damagetable_lost_knight_bow.json",
    },
    LostKnightTankDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostknights_datatables/javelindata_damagetable_lost_knight_tank.json",
    },
    LostMonarchDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostknights_datatables/javelindata_damagetable_lost_monarch.json",
    },
    LostPikemanDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostknights_datatables/javelindata_damagetable_lost_pikeman.json",
    },
    LostSirenDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostsiren_datatables/javelindata_damagetable_lost_siren.json",
    },
    LostSirenV2DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostsiren_datatables/javelindata_damagetable_lost_siren_v2.json",
    },
    MalekDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/seasons_datatables/season_02/javelindata_damagetable_malek.json",
    },
    MammothBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/mammoth_datatables/javelindata_damagetable_mammoth_boss.json",
    },
    MammothDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/mammoth_datatables/javelindata_damagetable_mammoth.json",
    },
    MammothWorldBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/mammoth_datatables/javelindata_damagetable_mammoth_world_boss.json",
    },
    MedeaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostknights_datatables/javelindata_damagetable_medea.json",
    },
    MedusaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/medusa_datatables/javelindata_damagetable_medusa.json",
    },
    MegaTurkeyDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/turkey_datatables/javelindata_damagetable_turkey.json",
    },
    Mordred_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/mordred_datatables/javelindata_damagetable_mordred.json",
    },
    MutatorDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_mutators.json",
    },
    NagaAncientGuardianDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/naga_datatables/javelindata_damagetable_naga_ancientguardian.json",
    },
    NagaAngryEarthDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/naga_datatables/javelindata_damagetable_naga_angryearth.json",
    },
    NagaAngryEarthWorldBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/worldboss_datatables/javelindata_damagetable_naga_angryearth_worldboss.json",
    },
    NagaCorruptedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/naga_datatables/javelindata_damagetable_naga_corrupted.json",
    },
    NagaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/naga_datatables/javelindata_damagetable_naga.json",
    },
    NagaWitheredDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/naga_datatables/javelindata_damagetable_naga_withered.json",
    },
    OgreDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ogre_datatables/javelindata_damagetable_corrupted_ogre.json",
    },
    OgreMinionDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/ogre_datatables/javelindata_damagetable_corrupted_ogre_minion.json",
    },
    OvergrownBeetleDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/overgrownbeetle_datatables/javelindata_damagetable_overgrownbeetle.json",
    },
    OverseerZaneDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/damned_datatables/javelindata_damagetable_overseerzane.json",
    },
    PriestLesserDamnedHoundDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_priest_lesser_damned_hound.json",
    },
    RatHercyneRatDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/rat_datatables/javelindata_damagetable_rat_hercynerat.json",
    },
    RazorLotusDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/megaflora_datatables/javelindata_damagetable_megaflora_razorlotus.json",
    },
    RisenDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/risen_datatables/javelindata_damagetable_risen.json",
    },
    Risen_FtWDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/ftw/javelindata_damagetable_risen_ftw.json",
    },
    SandElementalHeavyDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sandelemental_datatables/javelindata_damagetable_sandelemental_heavy.json",
    },
    SandElementalHeavySandwormDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sandelemental_datatables/sandelemental_heavy_sandworm.json",
    },
    SandElementalQuestBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sandelemental_datatables/javelindata_damagetable_sandelemental_questboss.json",
    },
    SandElementalShamanDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sandelemental_datatables/javelindata_damagetable_sandelemental_shaman.json",
    },
    SandElementalSoldierDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sand_elemental_soldier/javelindata_damagetable_sand_elemental_soldier.json",
    },
    SandwormArenaEncounterDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sandworm_datatables/javelindata_damagetable_sandworm.json",
    },
    ScorpionDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/scorpion_datatables/javelindata_damagetable_scorpion.json",
    },
    ScorpionImpalerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/scorpion_datatables/javelindata_damagetable_scorpion_impaler.json",
    },
    ScorpionSingerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/scorpion_datatables/javelindata_damagetable_scorpion_slinger.json",
    },
    ScorpionSingerDamageTableSandworm: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/scorpion_datatables/javelindata_damagetable_scorpion_slinger_sandworm.json",
    },
    ScorpionSulfurDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/scorpion_datatables/javelindata_damagetable_scorpion_sulfur.json",
    },
    ShiversDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/icedryad_datatables/javelindata_damagetable_icedryad_fiend_shivers_2.json",
    },
    Skeleton1HSwordDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/skeleton_datatables/javelindata_damagetable_skeleton1hsword.json",
    },
    Skeleton2hSwordDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/skeleton_datatables/javelindata_damagetable_skeleton2hsword.json",
    },
    SkeletonArcherDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/skeleton_datatables/javelindata_damagetable_skeletonarcher.json",
    },
    SkeletonClubDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/skeleton_datatables/javelindata_damagetable_skeletonclub.json",
    },
    SkeletonCrawlerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/swarmer_datatables/javelindata_damagetable_skeletoncrawler.json",
    },
    SkeletonDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_skeleton.json",
    },
    SkeletonMageDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/skeleton_datatables/javelindata_damagetable_skeletonmage.json",
    },
    SkeletonSpearDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/skeleton_datatables/javelindata_damagetable_skeletonspear.json",
    },
    SoulharvesterDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/soulharvester_datatables/javelindata_damagetable_soulharvester.json",
    },
    SpellBotDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/spellbot_datatables/javelindata_damagetable_spellbot.json",
    },
    SpiderDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/spider_datatables/javelindata_damagetable_spider.json",
    },
    SpiritDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_spirit.json",
    },
    SprigganCorruptedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/spriggan_datatables/javelindata_damagetable_spriggan_corrupted.json",
    },
    SprigganDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/spriggan_datatables/javelindata_damagetable_spriggan.json",
    },
    SprigganInvasionDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/invasion_datatables/javelindata_damagetable_spriggan_invasion.json",
    },
    SulfurDragonDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sulfur_dragon/javelindata_damagetable_sulfurdragon.json",
    },
    SulfurElementalEntityDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sulfurelemental_damagetables/javelindata_damagetable_sulfurelementalentity.json",
    },
    SulfurLizardDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/sulfur_dragon/javelindata_damagetable_sulfurlizard.json",
    },
    SwampBeastAvariceDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/brute_datatables/javelindata_damagetable_swampbeast_openworld.json",
    },
    SwampBeastDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/brute_datatables/javelindata_damagetable_swampbeast.json",
    },
    SwampFiendDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/risen_datatables/javelindata_damagetable_swamp_fiend.json",
    },
    SwarmancerMedeaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lostknights_datatables/javelindata_damagetable_swarmancer_medea_minion.json",
    },
    TendrilCorruptedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_tendril_corrupted.json",
    },
    TendrilLeviathanDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/corruptedleviathan_datatables/javelindata_damagetable_tendril_leviathan.json",
    },
    TigerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/lion_datatables/javelindata_damagetable_tiger.json",
    },
    TorsoBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/torsoboss_datatables/javelindata_damagetable_torso_boss.json",
    },
    UndeadAdmiralBruteDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_admiral_brute.json",
    },
    UndeadAdmiralBruteWorldBossDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/worldboss_datatables/javelindata_damagetable_undead_admiral_brute_worldboss.json",
    },
    UndeadBerserkerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_berserker.json",
    },
    UndeadBruteDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_brute.json",
    },
    UndeadCryptkeeperDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_cryptkeeper.json",
    },
    UndeadDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/javelindata_damagetable_undead.json",
    },
    UndeadGravediggerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_gravedigger.json",
    },
    UndeadGrenadierDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_grenadier.json",
    },
    UndeadHunterDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_hunter.json",
    },
    UndeadJavelineerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_javelineer.json",
    },
    UndeadMummifiedCorpseDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_mummifiedcorpse.json",
    },
    UndeadMutatedNurseDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_mutatednurse.json",
    },
    UndeadNagaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undeadnaga_datatables/javelindata_damagetable_undeadnaga.json",
    },
    UndeadNavigatorDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_navigator.json",
    },
    UndeadOfficerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_officer.json",
    },
    UndeadPirateBruteDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_pirate_brute.json",
    },
    UndeadPistoleerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_pistoleer.json",
    },
    UndeadShamanDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_shaman.json",
    },
    Undead_Sailor_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/undead_datatables/javelindata_damagetable_undead_sailor.json",
    },
    WBFireNagaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/worldboss_datatables/javelindata_damagetable_wb_naga_fire.json",
    },
    WB_Mammoth_FL_Mahantaram_DamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/worldboss_datatables/javelindata_damagetable_wb_mammoth_fl_mahantaram.json",
    },
    WereravenDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/werebeast_datatables/javelindata_damagetable_wereraven.json",
    },
    WitheredBeetleDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/witheredbeetle_datatables/javelindata_damagetable_witheredbeetle.json",
    },
    WitheredFeculentDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/risen_datatables/javelindata_damagetable_withered_feculent.json",
    },
    WitheredSwarmancerDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/risen_datatables/javelindata_damagetable_withered_swarmancer.json",
    },
    WolfAlphaDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_wolf_alpha.json",
    },
    WolfBarkimedesDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/named/javelindata_damagetable_wolf_barkimedes.json",
    },
    WolfBrownDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_wolf_brown.json",
    },
    WolfDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_wolf.json",
    },
    WolfWhiteDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_wolf_white.json",
    },
    Wolf_WinterDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/wolf_datatables/javelindata_damagetable_wolf_winter.json",
    },
    YonasDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/questnpc_datatables/javelindata_damagetable_yonas_msq2_trial.json",
    },
    ZaneTendrilCorruptedDamageTable: <DataSheetUri<DamageData>>{
      uri: "datatables/charactertables/questnpc_datatables/javelindata_damagetable_zane_tendril.json",
    },
  },
  DamageTypeData: {
    DamageTypes: <DataSheetUri<DamageTypeData>>{
      uri: "datatables/javelindata_damagetypes.json",
    },
  },
  DarknessData: {
    DarknessDataTable: <DataSheetUri<DarknessData>>{
      uri: "datatables/javelindata_darkness.json",
    },
  },
  DarknessDifficultyData: {
    'Territory Advancement Level': <DataSheetUri<DarknessDifficultyData>>{
      uri: "datatables/javelindata_difficulty_darkness.json",
    },
  },
  DataPointData: {
    DataPointDataTable: <DataSheetUri<DataPointData>>{
      uri: "datatables/javelindata_datapoints.json",
    },
  },
  DifficultyScalingData: {
    DifficultyScaling_WorldEncounter_Participants: <DataSheetUri<DifficultyScalingData>>{
      uri: "datatables/javelindata_difficultyscaling_worldencounter_participants.json",
    },
  },
  DivertedLootData: {
    DivertedLootMaster: <DataSheetUri<DivertedLootData>>{
      uri: "datatables/javelindata_divertedloot.json",
    },
  },
  DuelBalanceData: {
    DuelPvpBalanceTable: <DataSheetUri<DuelBalanceData>>{
      uri: "datatables/pvpbalancetables/javelindata_pvpbalance_duels.json",
    },
  },
  DungeonClusterStaticData: {
    DungeonCluster: <DataSheetUri<DungeonClusterStaticData>>{
      uri: "datatables/dungeonproceduralgeneration/javelindata_dungeonclusters.json",
    },
  },
  DungeonGrammarStaticData: {
    DungeonGrammar: <DataSheetUri<DungeonGrammarStaticData>>{
      uri: "datatables/dungeonproceduralgeneration/javelindata_dungeongrammars.json",
    },
  },
  DungeonRoomStaticData: {
    DungeonRoom: <DataSheetUri<DungeonRoomStaticData>>{
      uri: "datatables/dungeonproceduralgeneration/javelindata_dungeonrooms.json",
    },
  },
  DungeonTileStaticData: {
    DungeonTile: <DataSheetUri<DungeonTileStaticData>>{
      uri: "datatables/dungeonproceduralgeneration/javelindata_dungeontiles.json",
    },
  },
  DyeColorData: {
    DyeColorDataTable: <DataSheetUri<DyeColorData>>{
      uri: "datatables/javelindata_dyecolors.json",
    },
  },
  DyeItemDefinitions: {
    DyeItemDefinitions: <DataSheetUri<DyeItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_dye.json",
    },
  },
  EconomyTrackerData: {
    EconomyTrackers: <DataSheetUri<EconomyTrackerData>>{
      uri: "datatables/javelindata_economytrackers.json",
    },
  },
  ElementalMutationStaticData: {
    ElementalMutation: <DataSheetUri<ElementalMutationStaticData>>{
      uri: "datatables/gamemodemutators/javelindata_elementalmutations.json",
    },
  },
  EmoteData: {
    EmoteDefinitions: <DataSheetUri<EmoteData>>{
      uri: "datatables/javelindata_emotedefinitions.json",
    },
  },
  EncumbranceData: {
    EncumbranceLimits: <DataSheetUri<EncumbranceData>>{
      uri: "datatables/javelindata_encumbrancelimits.json",
    },
  },
  EntitlementData: {
    EntitlementData: <DataSheetUri<EntitlementData>>{
      uri: "datatables/javelindata_entitlements.json",
    },
  },
  EquipmentSetData: {
    EquipmentSets: <DataSheetUri<EquipmentSetData>>{
      uri: "datatables/equipmentsetbonuses/javelindata_equipmentsets.json",
    },
  },
  ExpansionData: {
    Expansions: <DataSheetUri<ExpansionData>>{
      uri: "datatables/javelindata_expansions.json",
    },
  },
  ExperienceData: {
    XPLevels: <DataSheetUri<ExperienceData>>{
      uri: "datatables/javelindata_xpamountsbylevel.json",
    },
  },
  FFAZoneBalanceData: {
    FFAZonePvpBalanceTable: <DataSheetUri<FFAZoneBalanceData>>{
      uri: "datatables/pvpbalancetables/javelindata_pvpbalance_ffa.json",
    },
  },
  FactionControlBuffDefinitions: {
    FactionControl_Buffs: <DataSheetUri<FactionControlBuffDefinitions>>{
      uri: "datatables/javelindata_factioncontrol_buffs.json",
    },
  },
  FactionData: {
    Factions: <DataSheetUri<FactionData>>{
      uri: "datatables/javelindata_factiondata.json",
    },
  },
  FactionStatusEffectData: {
    FactionStatusEffect: <DataSheetUri<FactionStatusEffectData>>{
      uri: "datatables/javelindata_factionstatuseffects.json",
    },
  },
  FishData: {
    Fish: <DataSheetUri<FishData>>{
      uri: "datatables/javelindata_itemdefinitions_fish.json",
    },
  },
  FishingBaitData: {
    FishingBaitMastersheet: <DataSheetUri<FishingBaitData>>{
      uri: "datatables/fishing/javelindata_fishing_bait.json",
    },
  },
  FishingBehaviorsData: {
    FishingBehaviorsMastersheet: <DataSheetUri<FishingBehaviorsData>>{
      uri: "datatables/fishing/javelindata_fishing_behaviors.json",
    },
  },
  FishingCatchablesData: {
    FishingCatchablesMastersheet: <DataSheetUri<FishingCatchablesData>>{
      uri: "datatables/fishing/javelindata_fishing_catchables.json",
    },
  },
  FishingHotspotsData: {
    FishingHotspotsMastersheet: <DataSheetUri<FishingHotspotsData>>{
      uri: "datatables/fishing/javelindata_fishing_hotspots.json",
    },
  },
  FishingPolesData: {
    FishingPolesMastersheet: <DataSheetUri<FishingPolesData>>{
      uri: "datatables/fishing/javelindata_fishing_poles.json",
    },
  },
  FishingWaterData: {
    FishingWaterMastersheet: <DataSheetUri<FishingWaterData>>{
      uri: "datatables/fishing/javelindata_fishing_water.json",
    },
  },
  GameEventData: {
    '(Jump Top of Creatures)': <DataSheetUri<GameEventData>>{
      uri: "datatables/javelindata_gameevents.json",
    },
    GameEventsDunwood: <DataSheetUri<GameEventData>>{
      uri: "datatables/javelindata_gameevents_dunwood.json",
    },
    GameEvents_01: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_01_gameevents.json",
    },
    GameEvents_02: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_02_gameevents.json",
    },
    GameEvents_02A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_02a_gameevents.json",
    },
    GameEvents_03: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_03_gameevents.json",
    },
    GameEvents_04: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_04_gameevents.json",
    },
    GameEvents_04A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_04a_gameevents.json",
    },
    GameEvents_05: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_05_gameevents.json",
    },
    GameEvents_05A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_05a_gameevents.json",
    },
    GameEvents_06: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_06_gameevents.json",
    },
    GameEvents_06A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_06a_gameevents.json",
    },
    GameEvents_07: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_07_gameevents.json",
    },
    GameEvents_08: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_08_gameevents.json",
    },
    GameEvents_09: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_09_gameevents.json",
    },
    GameEvents_09A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_09a_gameevents.json",
    },
    GameEvents_10: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_10_gameevents.json",
    },
    GameEvents_10A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_10a_gameevents.json",
    },
    GameEvents_11: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_11_gameevents.json",
    },
    GameEvents_12: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_12_gameevents.json",
    },
    GameEvents_12A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_12a_gameevents.json",
    },
    GameEvents_13: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_13_gameevents.json",
    },
    GameEvents_13A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_13a_gameevents.json",
    },
    GameEvents_14: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_14_gameevents.json",
    },
    GameEvents_15: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_15_gameevents.json",
    },
    GameEvents_16: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_16_gameevents.json",
    },
    GameEvents_74: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_74_gameevents.json",
    },
    GameEvents_75: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_75_gameevents.json",
    },
    GameEvents_80: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_80_gameevents.json",
    },
    GameEvents_81: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_81_gameevents.json",
    },
    GameEvents_90: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_90_gameevents.json",
    },
    GameEvents_91: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_91_gameevents.json",
    },
    GameEvents_92: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_92_gameevents.json",
    },
    GameEvents_94: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_94_gameevents.json",
    },
    GameEvents_95: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_95_gameevents.json",
    },
    GameEvents_95A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_95a_gameevents.json",
    },
    GameEvents_95_s04: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_95_s04_gameevents.json",
    },
    GameEvents_98: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_98_gameevents.json",
    },
    GameEvents_99: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_99_gameevents.json",
    },
    GameEvents_99A: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_99a_gameevents.json",
    },
    GameEvents_99B: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_99b_gameevents.json",
    },
    GameEvents_99C: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_99c_gameevents.json",
    },
    GameEvents_99D: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_99d_gameevents.json",
    },
    GameEvents_99E: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_99e_gameevents.json",
    },
    GameEvents_99F: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_99f_gameevents.json",
    },
    GameEvents_99G: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_99g_gameevents.json",
    },
    GameEvents_VoicedLore: <DataSheetUri<GameEventData>>{
      uri: "datatables/questgameevents/javelindata_voicedlore_gameevents.json",
    },
  },
  GameModeData: {
    GameModes: <DataSheetUri<GameModeData>>{
      uri: "datatables/javelindata_gamemodes.json",
    },
  },
  GameModeMapData: {
    GameModeMap: <DataSheetUri<GameModeMapData>>{
      uri: "datatables/javelindata_gamemodemaps.json",
    },
  },
  GameModeSchedulerStaticData: {
    GameModeScheduler: <DataSheetUri<GameModeSchedulerStaticData>>{
      uri: "datatables/javelindata_gamemodescheduler.json",
    },
  },
  GatherableData: {
    Gatherables: <DataSheetUri<GatherableData>>{
      uri: "datatables/javelindata_gatherables.json",
    },
    GatherablesDunwood: <DataSheetUri<GatherableData>>{
      uri: "datatables/javelindata_gatherablesdunwood.json",
    },
    QuestGatherables: <DataSheetUri<GatherableData>>{
      uri: "datatables/javelindata_questgatherables.json",
    },
  },
  GeneratorRecipes: {
    GeneratorRecipes: <DataSheetUri<GeneratorRecipes>>{
      uri: "datatables/javelindata_generatorrecipes.json",
    },
  },
  GenericInviteData: {
    GenericInvites: <DataSheetUri<GenericInviteData>>{
      uri: "datatables/javelindata_genericinvites.json",
    },
  },
  HouseItems: {
    HouseItems: <DataSheetUri<HouseItems>>{
      uri: "datatables/javelindata_housingitems.json",
    },
    HouseItemsMTX: <DataSheetUri<HouseItems>>{
      uri: "datatables/mtx/javelindata_housingitems_mtx.json",
    },
  },
  HouseTypeData: {
    HouseTypes: <DataSheetUri<HouseTypeData>>{
      uri: "datatables/javelindata_housetypes.json",
    },
  },
  HousingSystemMessaging: {
    HousingSystemMessaging: <DataSheetUri<HousingSystemMessaging>>{
      uri: "datatables/javelindata_housingsystemmessaging.json",
    },
  },
  HunterSightData: {
    HunterSight: <DataSheetUri<HunterSightData>>{
      uri: "datatables/javelindata_huntersight.json",
    },
  },
  ImpactAudioTable: {
    ImpactAudioTable_Characters: <DataSheetUri<ImpactAudioTable>>{
      uri: "datatables/impactsystem/impactaudiotable_characters.json",
    },
    ImpactAudioTable_Environment: <DataSheetUri<ImpactAudioTable>>{
      uri: "datatables/impactsystem/impactaudiotable_environment.json",
    },
  },
  ImpactSurfaceAlignmentTable: {
    ImpactTable_SurfaceAlignment: <DataSheetUri<ImpactSurfaceAlignmentTable>>{
      uri: "datatables/impactsystem/impacttable_surfacealignment.json",
    },
  },
  ImpactTable: {
    ImpactTable_Characters: <DataSheetUri<ImpactTable>>{
      uri: "datatables/impactsystem/impacttable_characters.json",
    },
    ImpactTable_Environment: <DataSheetUri<ImpactTable>>{
      uri: "datatables/impactsystem/impacttable_environment.json",
    },
  },
  InfluenceTowerDefinitions: {
    FactionControl_Towers: <DataSheetUri<InfluenceTowerDefinitions>>{
      uri: "datatables/javelindata_factioncontrol_towerdefinitions.json",
    },
  },
  InputProfileData: {
    InputProfiles: <DataSheetUri<InputProfileData>>{
      uri: "datatables/javelindata_inputprofiles.json",
    },
  },
  InteractionAnimationData: {
    InteractionAnimations: <DataSheetUri<InteractionAnimationData>>{
      uri: "datatables/javelindata_interactionanimations.json",
    },
  },
  ItemCurrencyConversionData: {
    ItemCurrencyConversions: <DataSheetUri<ItemCurrencyConversionData>>{
      uri: "datatables/javelindata_itemcurrencyconversion.json",
    },
  },
  ItemPerkSwapData: {
    ItemPerkSwaps: <DataSheetUri<ItemPerkSwapData>>{
      uri: "datatables/javelindata_itemperkswaps.json",
    },
  },
  ItemSkinData: {
    ItemSkinDataTable: <DataSheetUri<ItemSkinData>>{
      uri: "datatables/javelindata_itemskins.json",
    },
  },
  ItemSoundEvents: {
    ItemSoundTable: <DataSheetUri<ItemSoundEvents>>{
      uri: "datatables/javelindata_itemdefinitions_sounds.json",
    },
  },
  ItemTooltipLayout: {
    ItemTooltipLayout: <DataSheetUri<ItemTooltipLayout>>{
      uri: "datatables/javelindata_itemdefinitions_tooltiplayout.json",
    },
  },
  ItemTransform: {
    DefaultItemTransforms: <DataSheetUri<ItemTransform>>{
      uri: "datatables/javelindata_itemtransformdata.json",
    },
  },
  JointAliasData: {
    JointAlias: <DataSheetUri<JointAliasData>>{
      uri: "datatables/javelindata_jointalias.json",
    },
  },
  LeaderboardData: {
    LeaderboardDataTable: <DataSheetUri<LeaderboardData>>{
      uri: "datatables/javelindata_leaderboard.json",
    },
  },
  LeaderboardRewardsData: {
    LeaderboardRewardsDataTable: <DataSheetUri<LeaderboardRewardsData>>{
      uri: "datatables/javelindata_leaderboardrewards.json",
    },
  },
  LeaderboardStatData: {
    LeaderboardStatDataTable: <DataSheetUri<LeaderboardStatData>>{
      uri: "datatables/javelindata_leaderboardstats.json",
    },
  },
  LevelDisparityData: {
    AILevelDisparity: <DataSheetUri<LevelDisparityData>>{
      uri: "datatables/javelindata_aileveldisparity.json",
    },
  },
  LootBucketData: {
    LootBuckets: <DataSheetUri<LootBucketData>>{
      uri: "datatables/javelindata_lootbuckets.json",
    },
    LootBucketsBattleRoyale: <DataSheetUri<LootBucketData>>{
      uri: "datatables/javelindata_lootbuckets_battleroyale.json",
    },
    LootBucketsFish: <DataSheetUri<LootBucketData>>{
      uri: "datatables/fishing/javelindata_lootbuckets_fishing.json",
    },
    LootBucketsPlaytest: <DataSheetUri<LootBucketData>>{
      uri: "datatables/javelindata_lootbuckets_playtest.json",
    },
    LootBucketsPvP: <DataSheetUri<LootBucketData>>{
      uri: "datatables/javelindata_lootbuckets_pvp.json",
    },
  },
  LootLimitData: {
    LootLimits: <DataSheetUri<LootLimitData>>{
      uri: "datatables/javelindata_lootlimits.json",
    },
  },
  LootTablesData: {
    LootTables: <DataSheetUri<LootTablesData>>{
      uri: "datatables/javelindata_loottables.json",
    },
    LootTables_Fishing: <DataSheetUri<LootTablesData>>{
      uri: "datatables/javelindata_loottables_fishing.json",
    },
    LootTables_MTX: <DataSheetUri<LootTablesData>>{
      uri: "datatables/mtx/javelindata_loottables_mtx.json",
    },
    LootTables_Omega: <DataSheetUri<LootTablesData>>{
      uri: "datatables/javelindata_loottables_omega.json",
    },
    LootTables_Playtest: <DataSheetUri<LootTablesData>>{
      uri: "datatables/javelindata_loottables_playtest.json",
    },
    LootTables_PvP: <DataSheetUri<LootTablesData>>{
      uri: "datatables/pvp_rewardstrack/javelindata_loottables_pvp_rewards_track.json",
    },
    LootTables_Salvage: <DataSheetUri<LootTablesData>>{
      uri: "datatables/javelindata_loottables_salvage.json",
    },
    LootTables_Seasons: <DataSheetUri<LootTablesData>>{
      uri: "datatables/javelindata_loottables_seasons.json",
    },
  },
  LootTagPresetData: {
    LootTagPresets: <DataSheetUri<LootTagPresetData>>{
      uri: "datatables/javelindata_loottagpresets.json",
    },
  },
  LoreData: {
    Lore: <DataSheetUri<LoreData>>{
      uri: "datatables/javelindata_loreitems.json",
    },
  },
  LoreItemDefinitions: {
    LoreItemDefinitions: <DataSheetUri<LoreItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_lore.json",
    },
  },
  ManaData: {
    ManaCosts_Player: <DataSheetUri<ManaData>>{
      uri: "datatables/javelindata_manacosts_player.json",
    },
  },
  MasterItemDefinitions: {
    MasterItemDefinitions_AI: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_ai.json",
    },
    MasterItemDefinitions_Artifacts: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_artifacts.json",
    },
    MasterItemDefinitions_Common: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_common.json",
    },
    MasterItemDefinitions_ConquerorsItems: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_conquerorsitems.json",
    },
    MasterItemDefinitions_Crafting: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_crafting.json",
    },
    MasterItemDefinitions_Faction: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_faction.json",
    },
    MasterItemDefinitions_Loot: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_loot.json",
    },
    MasterItemDefinitions_MTX_2023Apr: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-04.json",
    },
    MasterItemDefinitions_MTX_2023Aug: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-08.json",
    },
    MasterItemDefinitions_MTX_2023Dec: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-12.json",
    },
    MasterItemDefinitions_MTX_2023Feb: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-02.json",
    },
    MasterItemDefinitions_MTX_2023Jan: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-01.json",
    },
    MasterItemDefinitions_MTX_2023Jul: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-07.json",
    },
    MasterItemDefinitions_MTX_2023Jun: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-06.json",
    },
    MasterItemDefinitions_MTX_2023Mar: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-03.json",
    },
    MasterItemDefinitions_MTX_2023May: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-05.json",
    },
    MasterItemDefinitions_MTX_2023Nov: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-11.json",
    },
    MasterItemDefinitions_MTX_2023Oct: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-10.json",
    },
    MasterItemDefinitions_MTX_2023Sep: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2023-09.json",
    },
    MasterItemDefinitions_MTX_2024Apr: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2024-4.json",
    },
    MasterItemDefinitions_MTX_2024Feb: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2024-2.json",
    },
    MasterItemDefinitions_MTX_2024Mar: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2024-3.json",
    },
    MasterItemDefinitions_MTX_2024May: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2024-5.json",
    },
    MasterItemDefinitions_MTX_2024Season6: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2024-season6.json",
    },
    MasterItemDefinitions_MTX_2025Jan: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2025-01.json",
    },
    MasterItemDefinitions_MTX_Dec2024: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2024-12.json",
    },
    MasterItemDefinitions_MTX_Feb2025: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2025-02.json",
    },
    MasterItemDefinitions_MTX_Generic: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_generic.json",
    },
    MasterItemDefinitions_MTX_Mar2025: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/mtx/javelindata_itemdefinitions_mtx_2025-03.json",
    },
    MasterItemDefinitions_MakeGood: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_makegoods.json",
    },
    MasterItemDefinitions_Named: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_named.json",
    },
    MasterItemDefinitions_Named_Depricated: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_named_depricated.json",
    },
    MasterItemDefinitions_Omega: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_omega.json",
    },
    MasterItemDefinitions_PVP: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_pvp.json",
    },
    MasterItemDefinitions_Playtest: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_playtest.json",
    },
    MasterItemDefinitions_Quest: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_quest.json",
    },
    MasterItemDefinitions_SeasonalServer: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_seasonalserver.json",
    },
    MasterItemDefinitions_Seasons: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_seasons.json",
    },
    MasterItemDefinitions_Skins: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_skins.json",
    },
    MasterItemDefinitions_Store: <DataSheetUri<MasterItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_master_store.json",
    },
  },
  MetaAchievementData: {
    MetaAchievementDataTable: <DataSheetUri<MetaAchievementData>>{
      uri: "datatables/javelindata_metaachievements.json",
    },
  },
  MissionData: {
    Missions: <DataSheetUri<MissionData>>{
      uri: "datatables/javelindata_owg_mission.json",
    },
    TerritoryProgressionMissions: <DataSheetUri<MissionData>>{
      uri: "datatables/javelindata_territoryprogression_missions.json",
    },
  },
  MissionWeightsData: {
    MissionWeights: <DataSheetUri<MissionWeightsData>>{
      uri: "datatables/javelindata_owg_missionweights.json",
    },
  },
  Moonshot: {
    Moonshot: <DataSheetUri<Moonshot>>{
      uri: "datatables/javelindata_moonshot.json",
    },
  },
  MountData: {
    Mounts: <DataSheetUri<MountData>>{
      uri: "datatables/mounts/javelindata_mounts.json",
    },
  },
  MountDyeItemDefinitions: {
    MountDyeItemDefinitions: <DataSheetUri<MountDyeItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_mountdye.json",
    },
  },
  MountItemAppearanceDefinitions: {
    MountItemAppearanceDefinitions: <DataSheetUri<MountItemAppearanceDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_mountitemappearances.json",
    },
  },
  MountMovementData: {
    MountsMovement: <DataSheetUri<MountMovementData>>{
      uri: "datatables/mounts/javelindata_mount_movement.json",
    },
  },
  MountTypeData: {
    MountTypes: <DataSheetUri<MountTypeData>>{
      uri: "datatables/mounts/javelindata_mounttypes.json",
    },
  },
  MusicalInstrumentSlot: {
    MusicalInstrumentSlotTable: <DataSheetUri<MusicalInstrumentSlot>>{
      uri: "datatables/musicalactions/javelindata_instrumentslots.json",
    },
  },
  MusicalPerformanceRewards: {
    MusicalPerformanceRewardsTable: <DataSheetUri<MusicalPerformanceRewards>>{
      uri: "datatables/musicalactions/javelindata_musicalperformancerewards.json",
    },
  },
  MusicalRanking: {
    MusicalRankingTable: <DataSheetUri<MusicalRanking>>{
      uri: "datatables/musicalactions/javelindata_ranking.json",
    },
  },
  MusicalScoring: {
    MusicalScoringTable: <DataSheetUri<MusicalScoring>>{
      uri: "datatables/musicalactions/javelindata_inputscoring.json",
    },
  },
  MutationDifficultyStaticData: {
    MutationDifficulty: <DataSheetUri<MutationDifficultyStaticData>>{
      uri: "datatables/gamemodemutators/javelindata_mutationdifficulty.json",
    },
  },
  MutationPerksStaticData: {
    MutationPerks: <DataSheetUri<MutationPerksStaticData>>{
      uri: "datatables/gamemodemutators/javelindata_elementalmutationperks.json",
    },
  },
  NPAData: {
    NPADataTable: <DataSheetUri<NPAData>>{
      uri: "datatables/javelindata_achievements_nonpersisted.json",
    },
  },
  NPCData: {
    'NPC_03976.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_03976.json",
    },
    'NPC_04288.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04288.json",
    },
    'NPC_04289.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04289.json",
    },
    'NPC_04290.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04290.json",
    },
    'NPC_04291.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04291.json",
    },
    'NPC_04292.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04292.json",
    },
    'NPC_04293.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04293.json",
    },
    'NPC_04294.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04294.json",
    },
    'NPC_04295.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04295.json",
    },
    'NPC_04296.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04296.json",
    },
    'NPC_04297.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04297.json",
    },
    'NPC_04627.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04627.json",
    },
    'NPC_04628.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04628.json",
    },
    'NPC_04629.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04629.json",
    },
    'NPC_04630.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04630.json",
    },
    'NPC_04631.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04631.json",
    },
    'NPC_04632.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04632.json",
    },
    'NPC_04633.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04633.json",
    },
    'NPC_04634.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04634.json",
    },
    'NPC_04635.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04635.json",
    },
    'NPC_04636.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_04636.json",
    },
    'NPC_08012.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_08012.json",
    },
    'NPC_08013.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_08013.json",
    },
    'NPC_16003.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16003.json",
    },
    'NPC_16004.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16004.json",
    },
    'NPC_16005.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16005.json",
    },
    'NPC_16006.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16006.json",
    },
    'NPC_16007.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16007.json",
    },
    'NPC_16008.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16008.json",
    },
    'NPC_16009.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16009.json",
    },
    'NPC_16010.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16010.json",
    },
    'NPC_16011.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16011.json",
    },
    'NPC_16012.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16012.json",
    },
    'NPC_16013.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16013.json",
    },
    'NPC_16014.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16014.json",
    },
    'NPC_16015.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16015.json",
    },
    'NPC_16017.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16017.json",
    },
    'NPC_16018.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16018.json",
    },
    'NPC_16019.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16019.json",
    },
    'NPC_16020.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16020.json",
    },
    'NPC_16021.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16021.json",
    },
    'NPC_16022.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16022.json",
    },
    'NPC_16023.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16023.json",
    },
    'NPC_16024.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16024.json",
    },
    'NPC_16025.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16025.json",
    },
    'NPC_16026.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16026.json",
    },
    'NPC_16027.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16027.json",
    },
    'NPC_16028.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16028.json",
    },
    'NPC_16029.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16029.json",
    },
    'NPC_16030.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16030.json",
    },
    'NPC_16031.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16031.json",
    },
    'NPC_16032.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16032.json",
    },
    'NPC_16033.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16033.json",
    },
    'NPC_16034.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16034.json",
    },
    'NPC_16035.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16035.json",
    },
    'NPC_16036.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16036.json",
    },
    'NPC_16037.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16037.json",
    },
    'NPC_16038.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16038.json",
    },
    'NPC_16039.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16039.json",
    },
    'NPC_16040.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16040.json",
    },
    'NPC_16041.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16041.json",
    },
    'NPC_16042.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16042.json",
    },
    'NPC_16043.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16043.json",
    },
    'NPC_16044.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16044.json",
    },
    'NPC_16045.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16045.json",
    },
    'NPC_16046.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16046.json",
    },
    'NPC_16047.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16047.json",
    },
    'NPC_16048.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16048.json",
    },
    'NPC_16049.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16049.json",
    },
    'NPC_16050.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16050.json",
    },
    'NPC_16051.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16051.json",
    },
    'NPC_16052.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16052.json",
    },
    'NPC_16053.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16053.json",
    },
    'NPC_16054.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16054.json",
    },
    'NPC_16055.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16055.json",
    },
    'NPC_16058.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16058.json",
    },
    'NPC_16059.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16059.json",
    },
    'NPC_16060.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16060.json",
    },
    'NPC_16061.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16061.json",
    },
    'NPC_16062.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16062.json",
    },
    'NPC_16063.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16063.json",
    },
    'NPC_16064.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16064.json",
    },
    'NPC_16065.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16065.json",
    },
    'NPC_16066.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16066.json",
    },
    'NPC_16067.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16067.json",
    },
    'NPC_16068.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16068.json",
    },
    'NPC_16069.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16069.json",
    },
    'NPC_16070.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16070.json",
    },
    'NPC_16071.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16071.json",
    },
    'NPC_16072.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16072.json",
    },
    'NPC_16073.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16073.json",
    },
    'NPC_16074.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16074.json",
    },
    'NPC_16075.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16075.json",
    },
    'NPC_16076.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16076.json",
    },
    'NPC_16077.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16077.json",
    },
    'NPC_16078.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16078.json",
    },
    'NPC_16079.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16079.json",
    },
    'NPC_16080.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16080.json",
    },
    'NPC_16081.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16081.json",
    },
    'NPC_16082.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16082.json",
    },
    'NPC_16083.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16083.json",
    },
    'NPC_16084.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16084.json",
    },
    'NPC_16085.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16085.json",
    },
    'NPC_16086.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16086.json",
    },
    'NPC_16087.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16087.json",
    },
    'NPC_16088.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16088.json",
    },
    'NPC_16089.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16089.json",
    },
    'NPC_16090.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16090.json",
    },
    'NPC_16091.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16091.json",
    },
    'NPC_16092.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16092.json",
    },
    'NPC_16093.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16093.json",
    },
    'NPC_16094.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16094.json",
    },
    'NPC_16095.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16095.json",
    },
    'NPC_16096.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16096.json",
    },
    'NPC_16097.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16097.json",
    },
    'NPC_16098.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16098.json",
    },
    'NPC_16099.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16099.json",
    },
    'NPC_16129.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16129.json",
    },
    'NPC_16130.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16130.json",
    },
    'NPC_16131.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16131.json",
    },
    'NPC_16132.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16132.json",
    },
    'NPC_16133.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16133.json",
    },
    'NPC_16134.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16134.json",
    },
    'NPC_16135.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16135.json",
    },
    'NPC_16136.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16136.json",
    },
    'NPC_16137.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16137.json",
    },
    'NPC_16138.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16138.json",
    },
    'NPC_16139.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16139.json",
    },
    'NPC_16140.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16140.json",
    },
    'NPC_16141.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16141.json",
    },
    'NPC_16142.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16142.json",
    },
    'NPC_16143.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16143.json",
    },
    'NPC_16144.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16144.json",
    },
    'NPC_16145.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16145.json",
    },
    'NPC_16146.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16146.json",
    },
    'NPC_16147.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16147.json",
    },
    'NPC_16148.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16148.json",
    },
    'NPC_16149.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16149.json",
    },
    'NPC_16150.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16150.json",
    },
    'NPC_16151.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16151.json",
    },
    'NPC_16152.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16152.json",
    },
    'NPC_16153.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16153.json",
    },
    'NPC_16154.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16154.json",
    },
    'NPC_16155.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16155.json",
    },
    'NPC_16156.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16156.json",
    },
    'NPC_16157.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16157.json",
    },
    'NPC_16158.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16158.json",
    },
    'NPC_16159.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16159.json",
    },
    'NPC_16160.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16160.json",
    },
    'NPC_16161.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16161.json",
    },
    'NPC_16162.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16162.json",
    },
    'NPC_16163.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16163.json",
    },
    'NPC_16164.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16164.json",
    },
    'NPC_16165.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16165.json",
    },
    'NPC_16166.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16166.json",
    },
    'NPC_16167.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16167.json",
    },
    'NPC_16168.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16168.json",
    },
    'NPC_16169.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16169.json",
    },
    'NPC_16170.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16170.json",
    },
    'NPC_16171.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16171.json",
    },
    'NPC_16172.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16172.json",
    },
    'NPC_16173.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16173.json",
    },
    'NPC_16174.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16174.json",
    },
    'NPC_16176.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16176.json",
    },
    'NPC_16179.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16179.json",
    },
    'NPC_16180.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16180.json",
    },
    'NPC_16181.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16181.json",
    },
    'NPC_16182.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16182.json",
    },
    'NPC_16183.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16183.json",
    },
    'NPC_16184.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16184.json",
    },
    'NPC_16185.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16185.json",
    },
    'NPC_16186.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16186.json",
    },
    'NPC_16187.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16187.json",
    },
    'NPC_16188.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16188.json",
    },
    'NPC_16189.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16189.json",
    },
    'NPC_16190.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16190.json",
    },
    'NPC_16191.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16191.json",
    },
    'NPC_16192.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16192.json",
    },
    'NPC_16193.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16193.json",
    },
    'NPC_16194.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16194.json",
    },
    'NPC_16195.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16195.json",
    },
    'NPC_16196.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16196.json",
    },
    'NPC_16197.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16197.json",
    },
    'NPC_16198.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16198.json",
    },
    'NPC_16199.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16199.json",
    },
    'NPC_16200.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16200.json",
    },
    'NPC_16201.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16201.json",
    },
    'NPC_16202.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16202.json",
    },
    'NPC_16203.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16203.json",
    },
    'NPC_16204.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_16204.json",
    },
    'NPC_18000.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18000.json",
    },
    'NPC_18001.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18001.json",
    },
    'NPC_18002.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18002.json",
    },
    'NPC_18003.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18003.json",
    },
    'NPC_18004.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18004.json",
    },
    'NPC_18005.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18005.json",
    },
    'NPC_18006.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18006.json",
    },
    'NPC_18007.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18007.json",
    },
    'NPC_18008.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18008.json",
    },
    'NPC_18009.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18009.json",
    },
    'NPC_18010.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18010.json",
    },
    'NPC_18011.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18011.json",
    },
    'NPC_18012.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18012.json",
    },
    'NPC_18013.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18013.json",
    },
    'NPC_18014.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18014.json",
    },
    'NPC_18015.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18015.json",
    },
    'NPC_18016.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18016.json",
    },
    'NPC_18017.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18017.json",
    },
    'NPC_18018.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18018.json",
    },
    'NPC_18019.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18019.json",
    },
    'NPC_18020.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18020.json",
    },
    'NPC_18021.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18021.json",
    },
    'NPC_18022.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18022.json",
    },
    'NPC_18023.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18023.json",
    },
    'NPC_18024.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18024.json",
    },
    'NPC_18025.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18025.json",
    },
    'NPC_18026.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18026.json",
    },
    'NPC_18027.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18027.json",
    },
    'NPC_18028.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18028.json",
    },
    'NPC_18029.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18029.json",
    },
    'NPC_18030.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18030.json",
    },
    'NPC_18031.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18031.json",
    },
    'NPC_18032.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18032.json",
    },
    'NPC_18033.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18033.json",
    },
    'NPC_18034.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18034.json",
    },
    'NPC_18035.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18035.json",
    },
    'NPC_18036.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18036.json",
    },
    'NPC_18037.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18037.json",
    },
    'NPC_18038.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18038.json",
    },
    'NPC_18039.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18039.json",
    },
    'NPC_18040.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18040.json",
    },
    'NPC_18041.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18041.json",
    },
    'NPC_18042.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18042.json",
    },
    'NPC_18043.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18043.json",
    },
    'NPC_18044.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18044.json",
    },
    'NPC_18045.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18045.json",
    },
    'NPC_18046.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18046.json",
    },
    'NPC_18047.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18047.json",
    },
    'NPC_18048.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18048.json",
    },
    'NPC_18049.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18049.json",
    },
    'NPC_18050.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18050.json",
    },
    'NPC_18051.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18051.json",
    },
    'NPC_18052.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18052.json",
    },
    'NPC_18053.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18053.json",
    },
    'NPC_18054.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18054.json",
    },
    'NPC_18055.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18055.json",
    },
    'NPC_18056.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18056.json",
    },
    'NPC_18057.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18057.json",
    },
    'NPC_18059.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18059.json",
    },
    'NPC_18060.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18060.json",
    },
    'NPC_18061.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18061.json",
    },
    'NPC_18062.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_18062.json",
    },
    'NPC_22000.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_22000.json",
    },
    'NPC_22010.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_22010.json",
    },
    'NPC_22011.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_22011.json",
    },
    'NPC_28000.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28000.json",
    },
    'NPC_28001.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28001.json",
    },
    'NPC_28002.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28002.json",
    },
    'NPC_28003.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28003.json",
    },
    'NPC_28004.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28004.json",
    },
    'NPC_28006.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28006.json",
    },
    'NPC_28007.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28007.json",
    },
    'NPC_28008.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28008.json",
    },
    'NPC_28009.datasheet': <DataSheetUri<NPCData>>{
      uri: "datatables/questdata/npcdata_npc_28009.json",
    },
    NPCs: <DataSheetUri<NPCData>>{
      uri: "datatables/javelindata_npcs.json",
    },
    NPCs_02: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/02_brightwood/javelindata_02_npcs.json",
    },
    NPCs_06: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/06_windsward/javelindata_06_npcs.json",
    },
    NPCs_09: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/09_firstlight/javelindata_09_npcs.json",
    },
    NPCs_10: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/10_cutlasskeys/javelindata_10_npcs.json",
    },
    NPCs_12: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/12_monarchsbluffs/javelindata_12_npcs.json",
    },
    NPCs_13: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/13_weaversfen/javelindata_13_npcs.json",
    },
    NPCs_74: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/74_devworld_red/javelindata_74_npcs.json",
    },
    NPCs_75: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/75_devworld_blue/javelindata_75_npcs.json",
    },
    NPCs_92: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/92_weaponsandarmor/javelindata_92_npcs.json",
    },
    NPCs_C01: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c01_starterbeach/javelindata_c01_npcs.json",
    },
    NPCs_C02A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c02a_brightwood/javelindata_c02a_npcs.json",
    },
    NPCs_C03: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c03_greatcleave/javelindata_c03_npcs.json",
    },
    NPCs_C04A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c04a_everfall/javelindata_c04a_npcs.json",
    },
    NPCs_C05: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c05_reekwater/javelindata_c05_npcs.json",
    },
    NPCs_C06A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c06a_windsward/javelindata_c06a_npcs.json",
    },
    NPCs_C07: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c07_shatteredmoutain/javelindata_c07_npcs.json",
    },
    NPCs_C08: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c08_ebonscalereach/javelindata_c08_npcs.json",
    },
    NPCs_C09A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c09a_firstlight/javelindata_c09a_npcs.json",
    },
    NPCs_C10A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c10a_cutlasskeys/javelindata_c10a_npcs.json",
    },
    NPCs_C11: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c11_mourningdale/javelindata_c11_npcs.json",
    },
    NPCs_C12A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c12a_monarchsbluffs/javelindata_c12a_npcs.json",
    },
    NPCs_C13A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c13a_weaversfen/javelindata_c13a_npcs.json",
    },
    NPCs_C14: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c14_edengrove/javelindata_c14_npcs.json",
    },
    NPCs_C15: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c15_restlessshore/javelindata_c15_npcs.json",
    },
    NPCs_C16: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c16_brimstonesands/javelindata_c16_npcs.json",
    },
    NPCs_C80: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c80_holidays/javelindata_c80_npcs.json",
    },
    NPCs_C81: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c81_pushquests/javelindata_c81_npcs.json",
    },
    NPCs_C91: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c91_fishing/javelindata_c91_npcs.json",
    },
    NPCs_C94: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c94_mounts/javelindata_c94_npcs.json",
    },
    NPCs_C95: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c95_seasons/javelindata_c95_npcs.json",
    },
    NPCs_C95A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c95a_seasons_s02/javelindata_c95a_npcs.json",
    },
    NPCs_C95_S04: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c95_seasons_s04/javelindata_c95_s04_npcs.json",
    },
    NPCs_C98: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c98_factions/javelindata_c98_npcs.json",
    },
    NPCs_C99A: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c99a_msq/javelindata_c99a_npcs.json",
    },
    NPCs_C99B: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c99b_msq_brightwood/javelindata_c99b_npcs.json",
    },
    NPCs_C99C: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c99c_msq_weaversfen/javelindata_c99c_npcs.json",
    },
    NPCs_C99D: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c99d_msq_greatcleave/javelindata_c99d_npcs.json",
    },
    NPCs_C99E: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c99e_msq_edengrove/javelindata_c99e_npcs.json",
    },
    NPCs_C99F: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c99f_msq_ebonscale/javelindata_c99f_npcs.json",
    },
    NPCs_C99G: <DataSheetUri<NPCData>>{
      uri: "datatables/quests/console/c99g_msq_shattered/javelindata_c99g_npcs.json",
    },
  },
  NotificationData: {
    Notifications: <DataSheetUri<NotificationData>>{
      uri: "datatables/javelindata_notifications.json",
    },
  },
  ObjectiveTasks: {
    ObjectiveTasksDataManager: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/javelindata_objectivetasks.json",
    },
    ObjectiveTasksDataManager_74: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/74_devworld_red/javelindata_74_objectivetasks.json",
    },
    ObjectiveTasksDataManager_75: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/75_devworld_blue/javelindata_75_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C01: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c01_starterbeach/javelindata_c01_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C02A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c02a_brightwood/javelindata_c02a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C03: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c03_greatcleave/javelindata_c03_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C04A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c04a_everfall/javelindata_c04a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C05: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c05_reekwater/javelindata_c05_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C06A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c06a_windsward/javelindata_c06a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C07: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c07_shatteredmoutain/javelindata_c07_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C08: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c08_ebonscalereach/javelindata_c08_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C09A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c09a_firstlight/javelindata_c09a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C10A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c10a_cutlasskeys/javelindata_c10a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C11: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c11_mourningdale/javelindata_c11_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C12A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c12a_monarchsbluffs/javelindata_c12a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C13A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c13a_weaversfen/javelindata_c13a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C14: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c14_edengrove/javelindata_c14_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C15: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c15_restlessshore/javelindata_c15_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C16: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c16_brimstonesands/javelindata_c16_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C80: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c80_holidays/javelindata_c80_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C81: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c81_pushquests/javelindata_c81_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C91: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c91_fishing/javelindata_c91_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C94: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c94_mounts/javelindata_c94_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C95: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c95_seasons/javelindata_c95_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C95A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c95a_seasons_s02/javelindata_c95a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C95_S04: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c95_seasons_s04/javelindata_c95_s04_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C98: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c98_factions/javelindata_c98_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C99A: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c99a_msq/javelindata_c99a_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C99B: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c99b_msq_brightwood/javelindata_c99b_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C99C: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c99c_msq_weaversfen/javelindata_c99c_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C99D: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c99d_msq_greatcleave/javelindata_c99d_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C99E: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c99e_msq_edengrove/javelindata_c99e_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C99F: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c99f_msq_ebonscale/javelindata_c99f_objectivetasks.json",
    },
    ObjectiveTasksDataManager_C99G: <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/quests/console/c99g_msq_shattered/javelindata_c99g_objectivetasks.json",
    },
    'Quest_02789.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02789.json",
    },
    'Quest_02790.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02790.json",
    },
    'Quest_02791.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02791.json",
    },
    'Quest_02792.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02792.json",
    },
    'Quest_02793.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02793.json",
    },
    'Quest_02794.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02794.json",
    },
    'Quest_02795.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02795.json",
    },
    'Quest_02796.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02796.json",
    },
    'Quest_02797.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02797.json",
    },
    'Quest_02798.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02798.json",
    },
    'Quest_02799.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02799.json",
    },
    'Quest_02801.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02801.json",
    },
    'Quest_02802.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_02802.json",
    },
    'Quest_03189.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03189.json",
    },
    'Quest_03190.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03190.json",
    },
    'Quest_03192.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03192.json",
    },
    'Quest_03193.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03193.json",
    },
    'Quest_03194.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03194.json",
    },
    'Quest_03195.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03195.json",
    },
    'Quest_03196.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03196.json",
    },
    'Quest_03197.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03197.json",
    },
    'Quest_03198.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03198.json",
    },
    'Quest_03199.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03199.json",
    },
    'Quest_03200.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_03200.json",
    },
    'Quest_08015.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_08015.json",
    },
    'Quest_08016.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_08016.json",
    },
    'Quest_16003.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16003.json",
    },
    'Quest_16004.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16004.json",
    },
    'Quest_16005.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16005.json",
    },
    'Quest_16006.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16006.json",
    },
    'Quest_16007.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16007.json",
    },
    'Quest_16008.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16008.json",
    },
    'Quest_16009.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16009.json",
    },
    'Quest_16010.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16010.json",
    },
    'Quest_16011.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16011.json",
    },
    'Quest_16012.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16012.json",
    },
    'Quest_16013.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16013.json",
    },
    'Quest_16014.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16014.json",
    },
    'Quest_16015.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16015.json",
    },
    'Quest_16016.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16016.json",
    },
    'Quest_16017.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16017.json",
    },
    'Quest_16018.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16018.json",
    },
    'Quest_16019.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16019.json",
    },
    'Quest_16020.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16020.json",
    },
    'Quest_16021.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16021.json",
    },
    'Quest_16022.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16022.json",
    },
    'Quest_16023.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16023.json",
    },
    'Quest_16024.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16024.json",
    },
    'Quest_16025.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16025.json",
    },
    'Quest_16026.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16026.json",
    },
    'Quest_16027.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16027.json",
    },
    'Quest_16028.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16028.json",
    },
    'Quest_16029.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16029.json",
    },
    'Quest_16030.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16030.json",
    },
    'Quest_16031.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16031.json",
    },
    'Quest_16032.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_16032.json",
    },
    'Quest_18000.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18000.json",
    },
    'Quest_18001.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18001.json",
    },
    'Quest_18002.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18002.json",
    },
    'Quest_18003.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18003.json",
    },
    'Quest_18004.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18004.json",
    },
    'Quest_18005.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18005.json",
    },
    'Quest_18006.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18006.json",
    },
    'Quest_18007.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18007.json",
    },
    'Quest_18008.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18008.json",
    },
    'Quest_18009.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18009.json",
    },
    'Quest_18010.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18010.json",
    },
    'Quest_18011.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18011.json",
    },
    'Quest_18012.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18012.json",
    },
    'Quest_18013.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18013.json",
    },
    'Quest_18014.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18014.json",
    },
    'Quest_18015.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18015.json",
    },
    'Quest_18016.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18016.json",
    },
    'Quest_18017.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18017.json",
    },
    'Quest_18018.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18018.json",
    },
    'Quest_18019.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18019.json",
    },
    'Quest_18020.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18020.json",
    },
    'Quest_18021.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18021.json",
    },
    'Quest_18022.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18022.json",
    },
    'Quest_18023.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18023.json",
    },
    'Quest_18024.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18024.json",
    },
    'Quest_18025.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18025.json",
    },
    'Quest_18026.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18026.json",
    },
    'Quest_18028.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18028.json",
    },
    'Quest_18029.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18029.json",
    },
    'Quest_18030.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18030.json",
    },
    'Quest_18031.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_18031.json",
    },
    'Quest_22000.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_22000.json",
    },
    'Quest_22001.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_22001.json",
    },
    'Quest_22002.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_22002.json",
    },
    'Quest_22008.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_22008.json",
    },
    'Quest_28001.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_28001.json",
    },
    'Quest_28002.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_28002.json",
    },
    'Quest_28003.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_28003.json",
    },
    'Quest_28004.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_28004.json",
    },
    'Quest_28005.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_28005.json",
    },
    'Quest_28006.datasheet': <DataSheetUri<ObjectiveTasks>>{
      uri: "datatables/questdata/objectivetasks_quest_28006.json",
    },
  },
  Objectives: {
    ObjectivesDataManager: <DataSheetUri<Objectives>>{
      uri: "datatables/javelindata_objectives.json",
    },
    ObjectivesDataManager_74: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/74_devworld_red/javelindata_74_objectives.json",
    },
    ObjectivesDataManager_75: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/75_devworld_blue/javelindata_75_objectives.json",
    },
    ObjectivesDataManager_C01: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c01_starterbeach/javelindata_c01_objectives.json",
    },
    ObjectivesDataManager_C02A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c02a_brightwood/javelindata_c02a_objectives.json",
    },
    ObjectivesDataManager_C03: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c03_greatcleave/javelindata_c03_objectives.json",
    },
    ObjectivesDataManager_C04A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c04a_everfall/javelindata_c04a_objectives.json",
    },
    ObjectivesDataManager_C05: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c05_reekwater/javelindata_c05_objectives.json",
    },
    ObjectivesDataManager_C06A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c06a_windsward/javelindata_c06a_objectives.json",
    },
    ObjectivesDataManager_C07: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c07_shatteredmoutain/javelindata_c07_objectives.json",
    },
    ObjectivesDataManager_C08: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c08_ebonscalereach/javelindata_c08_objectives.json",
    },
    ObjectivesDataManager_C09A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c09a_firstlight/javelindata_c09a_objectives.json",
    },
    ObjectivesDataManager_C10A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c10a_cutlasskeys/javelindata_c10a_objectives.json",
    },
    ObjectivesDataManager_C11: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c11_mourningdale/javelindata_c11_objectives.json",
    },
    ObjectivesDataManager_C12A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c12a_monarchsbluffs/javelindata_c12a_objectives.json",
    },
    ObjectivesDataManager_C13A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c13a_weaversfen/javelindata_c13a_objectives.json",
    },
    ObjectivesDataManager_C14: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c14_edengrove/javelindata_c14_objectives.json",
    },
    ObjectivesDataManager_C15: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c15_restlessshore/javelindata_c15_objectives.json",
    },
    ObjectivesDataManager_C16: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c16_brimstonesands/javelindata_c16_objectives.json",
    },
    ObjectivesDataManager_C80: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c80_holidays/javelindata_c80_objectives.json",
    },
    ObjectivesDataManager_C81: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c81_pushquests/javelindata_c81_objectives.json",
    },
    ObjectivesDataManager_C91: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c91_fishing/javelindata_c91_objectives.json",
    },
    ObjectivesDataManager_C94: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c94_mounts/javelindata_c94_objectives.json",
    },
    ObjectivesDataManager_C95: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c95_seasons/javelindata_c95_objectives.json",
    },
    ObjectivesDataManager_C95A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c95a_seasons_s02/javelindata_c95a_objectives.json",
    },
    ObjectivesDataManager_C95_S04: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c95_seasons_s04/javelindata_c95_s04_objectives.json",
    },
    ObjectivesDataManager_C98: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c98_factions/javelindata_c98_objectives.json",
    },
    ObjectivesDataManager_C99A: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c99a_msq/javelindata_c99a_objectives.json",
    },
    ObjectivesDataManager_C99B: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c99b_msq_brightwood/javelindata_c99b_objectives.json",
    },
    ObjectivesDataManager_C99C: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c99c_msq_weaversfen/javelindata_c99c_objectives.json",
    },
    ObjectivesDataManager_C99D: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c99d_msq_greatcleave/javelindata_c99d_objectives.json",
    },
    ObjectivesDataManager_C99E: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c99e_msq_edengrove/javelindata_c99e_objectives.json",
    },
    ObjectivesDataManager_C99F: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c99f_msq_ebonscale/javelindata_c99f_objectives.json",
    },
    ObjectivesDataManager_C99G: <DataSheetUri<Objectives>>{
      uri: "datatables/quests/console/c99g_msq_shattered/javelindata_c99g_objectives.json",
    },
    'Quest_02789.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02789.json",
    },
    'Quest_02790.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02790.json",
    },
    'Quest_02791.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02791.json",
    },
    'Quest_02792.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02792.json",
    },
    'Quest_02793.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02793.json",
    },
    'Quest_02794.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02794.json",
    },
    'Quest_02795.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02795.json",
    },
    'Quest_02796.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02796.json",
    },
    'Quest_02797.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02797.json",
    },
    'Quest_02798.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02798.json",
    },
    'Quest_02799.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02799.json",
    },
    'Quest_02801.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02801.json",
    },
    'Quest_02802.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_02802.json",
    },
    'Quest_03189.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03189.json",
    },
    'Quest_03190.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03190.json",
    },
    'Quest_03192.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03192.json",
    },
    'Quest_03193.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03193.json",
    },
    'Quest_03194.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03194.json",
    },
    'Quest_03195.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03195.json",
    },
    'Quest_03196.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03196.json",
    },
    'Quest_03197.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03197.json",
    },
    'Quest_03198.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03198.json",
    },
    'Quest_03199.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03199.json",
    },
    'Quest_03200.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_03200.json",
    },
    'Quest_08015.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_08015.json",
    },
    'Quest_08016.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_08016.json",
    },
    'Quest_16003.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16003.json",
    },
    'Quest_16004.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16004.json",
    },
    'Quest_16005.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16005.json",
    },
    'Quest_16006.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16006.json",
    },
    'Quest_16007.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16007.json",
    },
    'Quest_16008.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16008.json",
    },
    'Quest_16009.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16009.json",
    },
    'Quest_16010.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16010.json",
    },
    'Quest_16011.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16011.json",
    },
    'Quest_16012.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16012.json",
    },
    'Quest_16013.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16013.json",
    },
    'Quest_16014.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16014.json",
    },
    'Quest_16015.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16015.json",
    },
    'Quest_16016.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16016.json",
    },
    'Quest_16017.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16017.json",
    },
    'Quest_16018.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16018.json",
    },
    'Quest_16019.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16019.json",
    },
    'Quest_16020.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16020.json",
    },
    'Quest_16021.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16021.json",
    },
    'Quest_16022.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16022.json",
    },
    'Quest_16023.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16023.json",
    },
    'Quest_16024.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16024.json",
    },
    'Quest_16025.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16025.json",
    },
    'Quest_16026.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16026.json",
    },
    'Quest_16027.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16027.json",
    },
    'Quest_16028.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16028.json",
    },
    'Quest_16029.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16029.json",
    },
    'Quest_16030.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16030.json",
    },
    'Quest_16031.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16031.json",
    },
    'Quest_16032.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_16032.json",
    },
    'Quest_18000.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18000.json",
    },
    'Quest_18001.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18001.json",
    },
    'Quest_18002.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18002.json",
    },
    'Quest_18003.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18003.json",
    },
    'Quest_18004.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18004.json",
    },
    'Quest_18005.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18005.json",
    },
    'Quest_18006.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18006.json",
    },
    'Quest_18007.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18007.json",
    },
    'Quest_18008.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18008.json",
    },
    'Quest_18009.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18009.json",
    },
    'Quest_18010.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18010.json",
    },
    'Quest_18011.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18011.json",
    },
    'Quest_18012.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18012.json",
    },
    'Quest_18013.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18013.json",
    },
    'Quest_18014.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18014.json",
    },
    'Quest_18015.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18015.json",
    },
    'Quest_18016.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18016.json",
    },
    'Quest_18017.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18017.json",
    },
    'Quest_18018.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18018.json",
    },
    'Quest_18019.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18019.json",
    },
    'Quest_18020.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18020.json",
    },
    'Quest_18021.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18021.json",
    },
    'Quest_18022.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18022.json",
    },
    'Quest_18023.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18023.json",
    },
    'Quest_18024.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18024.json",
    },
    'Quest_18025.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18025.json",
    },
    'Quest_18026.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18026.json",
    },
    'Quest_18028.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18028.json",
    },
    'Quest_18029.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18029.json",
    },
    'Quest_18030.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18030.json",
    },
    'Quest_18031.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_18031.json",
    },
    'Quest_22000.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_22000.json",
    },
    'Quest_22001.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_22001.json",
    },
    'Quest_22002.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_22002.json",
    },
    'Quest_22008.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_22008.json",
    },
    'Quest_28001.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_28001.json",
    },
    'Quest_28002.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_28002.json",
    },
    'Quest_28003.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_28003.json",
    },
    'Quest_28004.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_28004.json",
    },
    'Quest_28005.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_28005.json",
    },
    'Quest_28006.datasheet': <DataSheetUri<Objectives>>{
      uri: "datatables/questdata/objectives_quest_28006.json",
    },
  },
  ObjectivesGlobalReleaseData: {
    ObjectivesGlobalRelease: <DataSheetUri<ObjectivesGlobalReleaseData>>{
      uri: "datatables/javelindata_objectivesglobalreleasedata.json",
    },
  },
  OpenWorldBalanceData: {
    OpenWorldPvpBalanceTable: <DataSheetUri<OpenWorldBalanceData>>{
      uri: "datatables/pvpbalancetables/javelindata_pvpbalance_openworld.json",
    },
  },
  OutpostRushBalanceData: {
    OutpostRushPvpBalanceTable: <DataSheetUri<OutpostRushBalanceData>>{
      uri: "datatables/pvpbalancetables/javelindata_pvpbalance_outpostrush.json",
    },
  },
  OutpostRush_NoPerksBalanceData: {
    OutpostRush_NoPerksPvpBalanceTable: <DataSheetUri<OutpostRush_NoPerksBalanceData>>{
      uri: "datatables/pvpbalancetables/javelindata_pvpbalance_outpostrush_noperks.json",
    },
  },
  PUGActivityInfo: {
    PUGActivityInfo: <DataSheetUri<PUGActivityInfo>>{
      uri: "datatables/javelindata_pugactivityinfo.json",
    },
  },
  PUGRewardData: {
    PUGRewards: <DataSheetUri<PUGRewardData>>{
      uri: "datatables/javelindata_pugrewards.json",
    },
  },
  ParticleContextualPriorityOverrideData: {
    ParticleContextualPriorityOverrides: <DataSheetUri<ParticleContextualPriorityOverrideData>>{
      uri: "datatables/javelindata_particlepriorityoverrides.json",
    },
  },
  ParticleData: {
    ParticleDataTable: <DataSheetUri<ParticleData>>{
      uri: "datatables/javelindata_particledata.json",
    },
  },
  PerkBucketData: {
    PerkBuckets: <DataSheetUri<PerkBucketData>>{
      uri: "datatables/javelindata_perkbuckets.json",
    },
  },
  PerkData: {
    ItemPerks: <DataSheetUri<PerkData>>{
      uri: "datatables/javelindata_perks.json",
    },
    ItemPerks_Deprecated: <DataSheetUri<PerkData>>{
      uri: "datatables/javelindata_perks_deprecated.json",
    },
    ItemPerks_EquipmentSetBonuses: <DataSheetUri<PerkData>>{
      uri: "datatables/equipmentsetbonuses/javelindata_perks_equipmentsetbonusesinfix.json",
    },
  },
  PerkExclusiveLabelData: {
    PerkExclusiveLabels: <DataSheetUri<PerkExclusiveLabelData>>{
      uri: "datatables/javelindata_perkexclusivelabels.json",
    },
  },
  PlayerMilestoneModalStaticData: {
    PlayerMilestoneModals: <DataSheetUri<PlayerMilestoneModalStaticData>>{
      uri: "datatables/javelindata_playermilestonemodals.json",
    },
  },
  PlayerTitleData: {
    PlayerTitleDataTable: <DataSheetUri<PlayerTitleData>>{
      uri: "datatables/javelindata_playertitles.json",
    },
  },
  ProgressionPointData: {
    ProgressionPoints: <DataSheetUri<ProgressionPointData>>{
      uri: "datatables/javelindata_progressionpointdata.json",
    },
  },
  ProgressionPoolData: {
    ProgressionPools: <DataSheetUri<ProgressionPoolData>>{
      uri: "datatables/javelindata_progressionpools.json",
    },
  },
  PromotionMutationStaticData: {
    PromotionMutation: <DataSheetUri<PromotionMutationStaticData>>{
      uri: "datatables/gamemodemutators/javelindata_promotionmutations.json",
    },
  },
  PvPRankData: {
    PvPXP: <DataSheetUri<PvPRankData>>{
      uri: "datatables/javelindata_pvp_rank.json",
    },
  },
  PvPStoreData: {
    PvPStore: <DataSheetUri<PvPStoreData>>{
      uri: "datatables/pvp_rewardstrack/javelindata_pvp_store_v2.json",
    },
  },
  QuickCourseData: {
    QuickCourse_Master: <DataSheetUri<QuickCourseData>>{
      uri: "datatables/javelindata_quickcourses.json",
    },
  },
  QuickCourseNodeTypeData: {
    QuickCourse_NodeTypes: <DataSheetUri<QuickCourseNodeTypeData>>{
      uri: "datatables/javelindata_quickcoursenodetypes.json",
    },
  },
  RandomEncounterDefinitions: {
    RandomEncounterDefinitions: <DataSheetUri<RandomEncounterDefinitions>>{
      uri: "datatables/javelindata_randomencounters.json",
    },
  },
  RefiningRecipes: {
    RefiningRecipes: <DataSheetUri<RefiningRecipes>>{
      uri: "datatables/javelindata_refiningrecipes.json",
    },
  },
  ResourceItemDefinitions: {
    ResourceItemDefinitions: <DataSheetUri<ResourceItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_resources.json",
    },
  },
  RewardData: {
    Rewards: <DataSheetUri<RewardData>>{
      uri: "datatables/javelindata_rewards.json",
    },
  },
  RewardMilestoneData: {
    RewardMilestones: <DataSheetUri<RewardMilestoneData>>{
      uri: "datatables/javelindata_milestonerewards.json",
    },
  },
  RewardModifierData: {
    RewardModifiers: <DataSheetUri<RewardModifierData>>{
      uri: "datatables/javelindata_rewardmodifiers.json",
    },
  },
  RewardTrackItemData: {
    RewardTrackItems: <DataSheetUri<RewardTrackItemData>>{
      uri: "datatables/pvp_rewardstrack/javelindata_pvp_rewards_v2.json",
    },
  },
  RotationalQueueData: {
    RotationalQueue: <DataSheetUri<RotationalQueueData>>{
      uri: "datatables/javelindata_rotationalqueues.json",
    },
  },
  ScheduleData: {
    Schedules: <DataSheetUri<ScheduleData>>{
      uri: "datatables/javelindata_schedules.json",
    },
  },
  SeasonPassRankData: {
    SeasonPass_Season1: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season1/javelindata_seasonpassdata_season1.json",
    },
    SeasonPass_Season2: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season2/javelindata_seasonpassdata_season2.json",
    },
    SeasonPass_Season3: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season3/javelindata_seasonpassdata_season3.json",
    },
    SeasonPass_Season4: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season4/javelindata_seasonpassdata_season4.json",
    },
    SeasonPass_Season5: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season5/javelindata_seasonpassdata_season5.json",
    },
    SeasonPass_Season6: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season6/javelindata_seasonpassdata_season6.json",
    },
    SeasonPass_Season7: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season7/javelindata_seasonpassdata_season7.json",
    },
    SeasonPass_Season8: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season8/javelindata_seasonpassdata_season8.json",
    },
    SeasonPass_Season9: <DataSheetUri<SeasonPassRankData>>{
      uri: "datatables/seasonsrewards/season9/javelindata_seasonpassdata_season9.json",
    },
  },
  SeasonsRewardData: {
    SeasonsRewardData_Season1: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season1/javelindata_rewarddata_season1.json",
    },
    SeasonsRewardData_Season2: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season2/javelindata_rewarddata_season2.json",
    },
    SeasonsRewardData_Season3: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season3/javelindata_rewarddata_season3.json",
    },
    SeasonsRewardData_Season4: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season4/javelindata_rewarddata_season4.json",
    },
    SeasonsRewardData_Season5: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season5/javelindata_rewarddata_season5.json",
    },
    SeasonsRewardData_Season6: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season6/javelindata_rewarddata_season6.json",
    },
    SeasonsRewardData_Season7: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season7/javelindata_rewarddata_season7.json",
    },
    SeasonsRewardData_Season8: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season8/javelindata_rewarddata_season8.json",
    },
    SeasonsRewardData_Season9: <DataSheetUri<SeasonsRewardData>>{
      uri: "datatables/seasonsrewards/season9/javelindata_rewarddata_season9.json",
    },
  },
  SeasonsRewardsActivitiesConfig: {
    SeasonsRewardsActivitiesConfig_Season1: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season1/javelindata_seasonsrewardsactivitiesconfig_s1.json",
    },
    SeasonsRewardsActivitiesConfig_Season2: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season2/javelindata_seasonsrewardsactivitiesconfig_s2.json",
    },
    SeasonsRewardsActivitiesConfig_Season3: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season3/javelindata_seasonsrewardsactivitiesconfig_s3.json",
    },
    SeasonsRewardsActivitiesConfig_Season4: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season4/javelindata_seasonsrewardsactivitiesconfig_s4.json",
    },
    SeasonsRewardsActivitiesConfig_Season5: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season5/javelindata_seasonsrewardsactivitiesconfig_s5.json",
    },
    SeasonsRewardsActivitiesConfig_Season6: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season6/javelindata_seasonsrewardsactivitiesconfig_s6.json",
    },
    SeasonsRewardsActivitiesConfig_Season7: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season7/javelindata_seasonsrewardsactivitiesconfig_s7.json",
    },
    SeasonsRewardsActivitiesConfig_Season8: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season8/javelindata_seasonsrewardsactivitiesconfig_s8.json",
    },
    SeasonsRewardsActivitiesConfig_Season9: <DataSheetUri<SeasonsRewardsActivitiesConfig>>{
      uri: "datatables/seasonsrewards/season9/javelindata_seasonsrewardsactivitiesconfig_s9.json",
    },
  },
  SeasonsRewardsActivitiesTasksData: {
    SeasonsRewardsActivitiesTasksData_Season4: <DataSheetUri<SeasonsRewardsActivitiesTasksData>>{
      uri: "datatables/seasonsrewards/season4/javelindata_seasonsrewardsactivitiestasks_s4.json",
    },
    SeasonsRewardsActivitiesTasksData_Season5: <DataSheetUri<SeasonsRewardsActivitiesTasksData>>{
      uri: "datatables/seasonsrewards/season5/javelindata_seasonsrewardsactivitiestasks_s5.json",
    },
    SeasonsRewardsActivitiesTasksData_Season6: <DataSheetUri<SeasonsRewardsActivitiesTasksData>>{
      uri: "datatables/seasonsrewards/season6/javelindata_seasonsrewardsactivitiestasks_s6.json",
    },
    SeasonsRewardsActivitiesTasksData_Season7: <DataSheetUri<SeasonsRewardsActivitiesTasksData>>{
      uri: "datatables/seasonsrewards/season7/javelindata_seasonsrewardsactivitiestasks_s7.json",
    },
    SeasonsRewardsActivitiesTasksData_Season8: <DataSheetUri<SeasonsRewardsActivitiesTasksData>>{
      uri: "datatables/seasonsrewards/season8/javelindata_seasonsrewardsactivitiestasks_s8.json",
    },
    SeasonsRewardsActivitiesTasksData_Season9: <DataSheetUri<SeasonsRewardsActivitiesTasksData>>{
      uri: "datatables/seasonsrewards/season9/javelindata_seasonsrewardsactivitiestasks_s9.json",
    },
  },
  SeasonsRewardsCardData: {
    SeasonsRewardsCardData_Season1: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season1/javelindata_seasonsrewardscarddata_s1.json",
    },
    SeasonsRewardsCardData_Season2: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season2/javelindata_seasonsrewardscarddata_s2.json",
    },
    SeasonsRewardsCardData_Season3: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season3/javelindata_seasonsrewardscarddata_s3.json",
    },
    SeasonsRewardsCardData_Season4: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season4/javelindata_seasonsrewardscarddata_s4.json",
    },
    SeasonsRewardsCardData_Season5: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season5/javelindata_seasonsrewardscarddata_s5.json",
    },
    SeasonsRewardsCardData_Season6: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season6/javelindata_seasonsrewardscarddata_s6.json",
    },
    SeasonsRewardsCardData_Season7: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season7/javelindata_seasonsrewardscarddata_s7.json",
    },
    SeasonsRewardsCardData_Season8: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season8/javelindata_seasonsrewardscarddata_s8.json",
    },
    SeasonsRewardsCardData_Season9: <DataSheetUri<SeasonsRewardsCardData>>{
      uri: "datatables/seasonsrewards/season9/javelindata_seasonsrewardscarddata_s9.json",
    },
  },
  SeasonsRewardsCardTemplates: {
    SeasonsRewardsCardTemplates_Season1: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season1/javelindata_seasonsrewardscardtemplates_s1.json",
    },
    SeasonsRewardsCardTemplates_Season2: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season2/javelindata_seasonsrewardscardtemplates_s2.json",
    },
    SeasonsRewardsCardTemplates_Season3: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season3/javelindata_seasonsrewardscardtemplates_s3.json",
    },
    SeasonsRewardsCardTemplates_Season4: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season4/javelindata_seasonsrewardscardtemplates_s4.json",
    },
    SeasonsRewardsCardTemplates_Season5: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season5/javelindata_seasonsrewardscardtemplates_s5.json",
    },
    SeasonsRewardsCardTemplates_Season6: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season6/javelindata_seasonsrewardscardtemplates_s6.json",
    },
    SeasonsRewardsCardTemplates_Season7: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season7/javelindata_seasonsrewardscardtemplates_s7.json",
    },
    SeasonsRewardsCardTemplates_Season8: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season8/javelindata_seasonsrewardscardtemplates_s8.json",
    },
    SeasonsRewardsCardTemplates_Season9: <DataSheetUri<SeasonsRewardsCardTemplates>>{
      uri: "datatables/seasonsrewards/season9/javelindata_seasonsrewardscardtemplates_s9.json",
    },
  },
  SeasonsRewardsChapterData: {
    SeasonsRewardsChapterData_Season1: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season1/javelindata_chapterdata_season1.json",
    },
    SeasonsRewardsChapterData_Season2: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season2/javelindata_chapterdata_season2.json",
    },
    SeasonsRewardsChapterData_Season3: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season3/javelindata_chapterdata_season3.json",
    },
    SeasonsRewardsChapterData_Season4: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season4/javelindata_chapterdata_season4.json",
    },
    SeasonsRewardsChapterData_Season5: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season5/javelindata_chapterdata_season5.json",
    },
    SeasonsRewardsChapterData_Season6: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season6/javelindata_chapterdata_season6.json",
    },
    SeasonsRewardsChapterData_Season7: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season7/javelindata_chapterdata_season7.json",
    },
    SeasonsRewardsChapterData_Season8: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season8/javelindata_chapterdata_season8.json",
    },
    SeasonsRewardsChapterData_Season9: <DataSheetUri<SeasonsRewardsChapterData>>{
      uri: "datatables/seasonsrewards/season9/javelindata_chapterdata_season9.json",
    },
  },
  SeasonsRewardsJourneyData: {
    SeasonsRewardsJourneyData_Season1: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season1/javelindata_seasonsrewardsjourney_season1.json",
    },
    SeasonsRewardsJourneyData_Season2: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season2/javelindata_seasonsrewardsjourney_season2.json",
    },
    SeasonsRewardsJourneyData_Season3: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season3/javelindata_seasonsrewardsjourney_season3.json",
    },
    SeasonsRewardsJourneyData_Season4: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season4/javelindata_seasonsrewardsjourney_season4.json",
    },
    SeasonsRewardsJourneyData_Season5: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season5/javelindata_seasonsrewardsjourney_season5.json",
    },
    SeasonsRewardsJourneyData_Season6: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season6/javelindata_seasonsrewardsjourney_season6.json",
    },
    SeasonsRewardsJourneyData_Season7: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season7/javelindata_seasonsrewardsjourney_season7.json",
    },
    SeasonsRewardsJourneyData_Season8: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season8/javelindata_seasonsrewardsjourney_season8.json",
    },
    SeasonsRewardsJourneyData_Season9: <DataSheetUri<SeasonsRewardsJourneyData>>{
      uri: "datatables/seasonsrewards/season9/javelindata_seasonsrewardsjourney_season9.json",
    },
  },
  SeasonsRewardsSeasonData: {
    SeasonsRewardsSeasonDataTable: <DataSheetUri<SeasonsRewardsSeasonData>>{
      uri: "datatables/seasonsrewards/javelindata_seasondata.json",
    },
  },
  SeasonsRewardsStats: {
    SeasonsRewardsStats: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats.json",
    },
    SeasonsRewardsStats_Achievements: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_achievements.json",
    },
    SeasonsRewardsStats_ActivityCard: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_activitycard.json",
    },
    SeasonsRewardsStats_Arena: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_arena.json",
    },
    SeasonsRewardsStats_CategoricalProgression: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_categoricalprogression.json",
    },
    SeasonsRewardsStats_Combat: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_combat.json",
    },
    SeasonsRewardsStats_CommitResource: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_commitresource.json",
    },
    SeasonsRewardsStats_Consume: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_consume.json",
    },
    SeasonsRewardsStats_Craft: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_craft.json",
    },
    SeasonsRewardsStats_Duel: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_duel.json",
    },
    SeasonsRewardsStats_EquipItem: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_equipitem.json",
    },
    SeasonsRewardsStats_Expedition: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_expedition.json",
    },
    SeasonsRewardsStats_FactionControl: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_factioncontrol.json",
    },
    SeasonsRewardsStats_Fishing: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_fishing.json",
    },
    SeasonsRewardsStats_GameEvent: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_gameevent.json",
    },
    SeasonsRewardsStats_Gather: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_gather.json",
    },
    SeasonsRewardsStats_JourneyTask: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_journeytask.json",
    },
    SeasonsRewardsStats_Kill: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_kill.json",
    },
    SeasonsRewardsStats_Level: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_level.json",
    },
    SeasonsRewardsStats_OutpostRush: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_outpostrush.json",
    },
    SeasonsRewardsStats_Quest: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_quest.json",
    },
    SeasonsRewardsStats_Salvage: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_salvage.json",
    },
    SeasonsRewardsStats_Song: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_song.json",
    },
    SeasonsRewardsStats_War: <DataSheetUri<SeasonsRewardsStats>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardsstats_war.json",
    },
  },
  SeasonsRewardsTasks: {
    SeasonsRewardsTasks: <DataSheetUri<SeasonsRewardsTasks>>{
      uri: "datatables/seasonsrewards/javelindata_seasonsrewardstasks.json",
    },
  },
  ShopData: {
    ShopData: <DataSheetUri<ShopData>>{
      uri: "datatables/javelindata_shopdata.json",
    },
  },
  SimpleTreeCategoryData: {
    MetaAchievementCategoryDataTable: <DataSheetUri<SimpleTreeCategoryData>>{
      uri: "datatables/javelindata_metaachievements_categories.json",
    },
    PlayerTitleCategoryDataTable: <DataSheetUri<SimpleTreeCategoryData>>{
      uri: "datatables/javelindata_playertitles_categories.json",
    },
  },
  SkillData: {
    SkillDataTable: <DataSheetUri<SkillData>>{
      uri: "datatables/javelindata_skills.json",
    },
  },
  SkillExperienceData: {
    SkillExperienceDataTable: <DataSheetUri<SkillExperienceData>>{
      uri: "datatables/javelindata_skillexperience.json",
    },
  },
  Socketables: {
    Socketables: <DataSheetUri<Socketables>>{
      uri: "datatables/javelindata_socketables.json",
    },
  },
  SongBookData: {
    SongBookData: <DataSheetUri<SongBookData>>{
      uri: "datatables/musicalactions/javelindata_songbook.json",
    },
  },
  SongBookSheets: {
    SongBookSheets: <DataSheetUri<SongBookSheets>>{
      uri: "datatables/musicalactions/javelindata_songbooksheets.json",
    },
  },
  SpecializationDefinitions: {
    Specialization: <DataSheetUri<SpecializationDefinitions>>{
      uri: "datatables/javelindata_specializationlevels.json",
    },
  },
  SpellData: {
    SpellDataTable: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable.json",
    },
    SpellDataTable_AI: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_ai.json",
    },
    SpellDataTable_Blunderbuss: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_blunderbuss.json",
    },
    SpellDataTable_Bow: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_bow.json",
    },
    SpellDataTable_CTF: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_ctf.json",
    },
    SpellDataTable_CarryMe: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_carryme.json",
    },
    SpellDataTable_Conqueror: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_conquerorsitems.json",
    },
    SpellDataTable_FireMagic: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_firemagic.json",
    },
    SpellDataTable_Flail: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_flail.json",
    },
    SpellDataTable_Global: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_global.json",
    },
    SpellDataTable_GreatAxe: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_greataxe.json",
    },
    SpellDataTable_Greatsword: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_greatsword.json",
    },
    SpellDataTable_Hatchet: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_hatchet.json",
    },
    SpellDataTable_IceMagic: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_icemagic.json",
    },
    SpellDataTable_LifeMagic: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_lifemagic.json",
    },
    SpellDataTable_Musket: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_musket.json",
    },
    SpellDataTable_Rapier: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_rapier.json",
    },
    SpellDataTable_Runes: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_runes.json",
    },
    SpellDataTable_Spear: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_spear.json",
    },
    SpellDataTable_Sword: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_sword.json",
    },
    SpellDataTable_Throwables: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_throwables.json",
    },
    SpellDataTable_VoidGauntlet: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_voidgauntlet.json",
    },
    SpellDataTable_WarHammer: <DataSheetUri<SpellData>>{
      uri: "datatables/javelindata_spelltable_warhammer.json",
    },
  },
  StaminaData: {
    StaminaCosts_Damned: <DataSheetUri<StaminaData>>{
      uri: "datatables/javelindata_staminacosts_damned.json",
    },
    StaminaCosts_Player: <DataSheetUri<StaminaData>>{
      uri: "datatables/javelindata_staminacosts_player.json",
    },
  },
  StatMultiplierData: {
    StatMultiplierTable: <DataSheetUri<StatMultiplierData>>{
      uri: "datatables/javelindata_statmultipliers.json",
    },
  },
  StatusEffectCategoryData: {
    StatusEffectCategories: <DataSheetUri<StatusEffectCategoryData>>{
      uri: "datatables/javelindata_statuseffectcategories.json",
    },
  },
  StatusEffectData: {
    StatusEffects: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects.json",
    },
    StatusEffects_AI: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_ai.json",
    },
    StatusEffects_Blunderbuss: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_blunderbuss.json",
    },
    StatusEffects_Bow: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_bow.json",
    },
    StatusEffects_CTF: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_ctf.json",
    },
    StatusEffects_CarryMe: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_carryme.json",
    },
    StatusEffects_Common: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_common.json",
    },
    StatusEffects_ConquerorsItems: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_conquerersitems.json",
    },
    StatusEffects_DifficultyScaling: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_difficultyscaling.json",
    },
    StatusEffects_Firestaff: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_firestaff.json",
    },
    StatusEffects_Flail: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_flail.json",
    },
    StatusEffects_Greataxe: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_greataxe.json",
    },
    StatusEffects_Greatsword: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_greatsword.json",
    },
    StatusEffects_Hatchet: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_hatchet.json",
    },
    StatusEffects_IceMagic: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_icemagic.json",
    },
    StatusEffects_Items: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_item.json",
    },
    StatusEffects_JumpPad: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_jumppad.json",
    },
    StatusEffects_Lifestaff: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_lifestaff.json",
    },
    StatusEffects_Musket: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_musket.json",
    },
    StatusEffects_Perks: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_perks.json",
    },
    StatusEffects_Rapier: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_rapier.json",
    },
    StatusEffects_Runes: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_runes.json",
    },
    StatusEffects_SetBonusesInfix: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/equipmentsetbonuses/javelindata_statuseffects_equipmentsetbonusesinfix.json",
    },
    StatusEffects_Spear: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_spear.json",
    },
    StatusEffects_Sword: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_sword.json",
    },
    StatusEffects_VoidGauntlet: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_voidgauntlet.json",
    },
    StatusEffects_Warhammer: <DataSheetUri<StatusEffectData>>{
      uri: "datatables/javelindata_statuseffects_warhammer.json",
    },
  },
  StoreCategoryProperties: {
    StoreCategoryPropertiesTable: <DataSheetUri<StoreCategoryProperties>>{
      uri: "datatables/javelindata_storecategories.json",
    },
  },
  StoreProductData: {
    StoreProductData: <DataSheetUri<StoreProductData>>{
      uri: "datatables/javelindata_storeproducts.json",
    },
  },
  StoryProgressData: {
    StoryProgress: <DataSheetUri<StoryProgressData>>{
      uri: "datatables/javelindata_storyprogress.json",
    },
  },
  StructureFootprintData: {
    WallFootprint: <DataSheetUri<StructureFootprintData>>{
      uri: "datatables/structuredata/javelindata_wallfootprint.json",
    },
  },
  StructurePieceData: {
    T0_Wall_Pieces: <DataSheetUri<StructurePieceData>>{
      uri: "datatables/structuredata/javelindata_t0_wall_pieces.json",
    },
  },
  TerritoryDefinition: {
    AreaDefinitions: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/javelindata_areadefinitions.json",
    },
    ArenaDefinitions: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/arenas/javelindata_arenadefinitions.json",
    },
    DarknessDefinitions: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/javelindata_darknessdefinitions.json",
    },
    DefendObjectDefinitions: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/javelindata_defendobjectdefinitions.json",
    },
    InvasionDefinitions: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/invasion/javelindata_invasiondefinitions.json",
    },
    POITriggerVolumes: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/javelindata_triggervolumepois.json",
    },
    PointsOfInterest_01_02: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_01_02.json",
    },
    PointsOfInterest_01_03: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_01_03.json",
    },
    PointsOfInterest_02_00: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_02_00.json",
    },
    PointsOfInterest_02_02: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_02_02.json",
    },
    PointsOfInterest_02_03: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_02_03.json",
    },
    PointsOfInterest_02_04: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_02_04.json",
    },
    PointsOfInterest_03_00: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_03_00.json",
    },
    PointsOfInterest_03_01: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_03_01.json",
    },
    PointsOfInterest_03_02: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_03_02.json",
    },
    PointsOfInterest_03_03: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_03_03.json",
    },
    PointsOfInterest_03_04: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_03_04.json",
    },
    PointsOfInterest_04_00: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_04_00.json",
    },
    PointsOfInterest_04_01: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_04_01.json",
    },
    PointsOfInterest_04_02: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_04_02.json",
    },
    PointsOfInterest_04_03: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_04_03.json",
    },
    PointsOfInterest_04_04: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_04_04.json",
    },
    PointsOfInterest_05_01: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_05_01.json",
    },
    PointsOfInterest_05_02: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_05_02.json",
    },
    PointsOfInterest_05_03: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_05_03.json",
    },
    PointsOfInterest_05_04: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_05_04.json",
    },
    PointsOfInterest_06_02: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_06_02.json",
    },
    PointsOfInterest_06_03: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_06_03.json",
    },
    PointsOfInterest_06_04: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_06_04.json",
    },
    PointsOfInterest_DevWorld: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/pointofinterestdefinitions/javelindata_poidefinitions_devworld.json",
    },
    Territories: <DataSheetUri<TerritoryDefinition>>{
      uri: "datatables/javelindata_territorydefinitions.json",
    },
  },
  TerritoryProgressionData: {
    TerritoryProgression: <DataSheetUri<TerritoryProgressionData>>{
      uri: "datatables/javelindata_territoryprogression.json",
    },
  },
  TerritoryUpkeepDefinition: {
    TerritoryUpkeep: <DataSheetUri<TerritoryUpkeepDefinition>>{
      uri: "datatables/javelindata_territorygovernance.json",
    },
  },
  ThrowableItemDefinitions: {
    ThrowableItemDefinitions: <DataSheetUri<ThrowableItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_throwables.json",
    },
  },
  TimelineRegistryEntryData: {
    GenericTimelineRegistryEntry: <DataSheetUri<TimelineRegistryEntryData>>{
      uri: "datatables/timelines/javelindata_generictimelines.json",
    },
    TimelineRegistryEntry: <DataSheetUri<TimelineRegistryEntryData>>{
      uri: "datatables/timelines/javelindata_npc_votimelines.json",
    },
    WhisperTimelineRegistryEntry: <DataSheetUri<TimelineRegistryEntryData>>{
      uri: "datatables/timelines/javelindata_whispertimelines.json",
    },
  },
  TradeSkillPostCapData: {
    TradeSkillPostCap: <DataSheetUri<TradeSkillPostCapData>>{
      uri: "datatables/javelindata_tradeskillpostcap.json",
    },
  },
  TradeskillRankData: {
    Arcana: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillarcana.json",
    },
    Armoring: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillarmoring.json",
    },
    AzothStaff: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillazothstaff.json",
    },
    Cooking: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillcooking.json",
    },
    Engineering: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillengineering.json",
    },
    Fishing: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillfishing.json",
    },
    Furnishing: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillfurnishing.json",
    },
    Harvesting: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillharvesting.json",
    },
    Jewelcrafting: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskilljewelcrafting.json",
    },
    Leatherworking: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillleatherworking.json",
    },
    Logging: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskilllogging.json",
    },
    Mining: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillmining.json",
    },
    Musician: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillmusician.json",
    },
    Riding: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillriding.json",
    },
    Skinning: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillskinning.json",
    },
    Smelting: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillsmelting.json",
    },
    Stonecutting: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillstonecutting.json",
    },
    Weaponsmithing: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillweaponsmithing.json",
    },
    Weaving: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillweaving.json",
    },
    Woodworking: <DataSheetUri<TradeskillRankData>>{
      uri: "datatables/javelindata_tradeskillwoodworking.json",
    },
  },
  TutorialConditionData: {
    TutorialConditionData: <DataSheetUri<TutorialConditionData>>{
      uri: "datatables/playertutorials/javelindata_tutorialtriggerconditionsdata.json",
    },
  },
  TutorialContentData: {
    TutorialContentData: <DataSheetUri<TutorialContentData>>{
      uri: "datatables/playertutorials/javelindata_tutorialcontentdata.json",
    },
  },
  TutorialData: {
    TutorialData: <DataSheetUri<TutorialData>>{
      uri: "datatables/playertutorials/javelindata_tutorialdata.json",
    },
  },
  TwitchDropsStatDefinitions: {
    TwitchDropsStatDefinitions: <DataSheetUri<TwitchDropsStatDefinitions>>{
      uri: "datatables/javelindata_twitchdrops.json",
    },
  },
  TwitchTagsStatDefinitions: {
    TwitchTagsStatDefinitions: <DataSheetUri<TwitchTagsStatDefinitions>>{
      uri: "datatables/javelindata_twitchtags.json",
    },
  },
  VariationData: {
    AI: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_ai.json",
    },
    CutTrunks: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_cuttrunks.json",
    },
    Destructible_Walls: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_destructiblewalls.json",
    },
    Gatherables_NPCRescue_01: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_gatherables_npcrescue.json",
    },
    LockedInteractGatherables: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_locked_interact_gatherables.json",
    },
    LootContainers: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_lootcontainers.json",
    },
    NPC: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_npcs.json",
    },
    NPC_ClientPathing_Walkaway: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_npcs_clientpathing_walkaway.json",
    },
    NPC_Walkaway: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_npcs_walkaway.json",
    },
    RandomEncounter_Vitals: <DataSheetUri<VariationData>>{
      uri: "datatables/javelindata_variations_randomencounters.json",
    },
  },
  VariationDataGatherable: {
    Gatherable_Alchemy: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_alchemy.json",
    },
    Gatherable_Bushes: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_bushes.json",
    },
    Gatherable_CarryMe: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_carryme.json",
    },
    Gatherable_Cinematic: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_cinematic.json",
    },
    Gatherable_Collectibles: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_collectibles.json",
    },
    Gatherable_Cyclic: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_cyclic.json",
    },
    Gatherable_Darkness: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_darkness.json",
    },
    Gatherable_Essences: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_essences.json",
    },
    Gatherable_Holiday: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_holiday.json",
    },
    Gatherable_Holiday_Proximity: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_holiday_proximity.json",
    },
    Gatherable_Items: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_items.json",
    },
    Gatherable_LockedGates: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_lockedgates.json",
    },
    Gatherable_Logs: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_logs.json",
    },
    Gatherable_LootContainers: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_lootcontainers.json",
    },
    Gatherable_Minerals: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_minerals.json",
    },
    Gatherable_POIObjects: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_poiobjects.json",
    },
    Gatherable_Plants: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_plants.json",
    },
    Gatherable_Quest: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_quest.json",
    },
    Gatherable_Quest_AncientGlyph: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_quest_ancientglyph.json",
    },
    Gatherable_Quest_Damageable: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_quest_damageable.json",
    },
    Gatherable_Quest_Proximity: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_quest_proximity.json",
    },
    Gatherable_Stones: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_stones.json",
    },
    Gatherable_Trees: <DataSheetUri<VariationDataGatherable>>{
      uri: "datatables/javelindata_variations_gatherables_trees.json",
    },
  },
  VitalsBaseData: {
    BaseVitals_Common: <DataSheetUri<VitalsBaseData>>{
      uri: "datatables/vitalstables/javelindata_basevitals_common.json",
    },
    BaseVitals_CutlassKeys: <DataSheetUri<VitalsBaseData>>{
      uri: "datatables/vitalstables/javelindata_basevitals_cutlasskeys.json",
    },
    BaseVitals_FirstLight: <DataSheetUri<VitalsBaseData>>{
      uri: "datatables/vitalstables/javelindata_basevitals_firstlight.json",
    },
    BaseVitals_Player: <DataSheetUri<VitalsBaseData>>{
      uri: "datatables/vitalstables/javelindata_basevitals_player.json",
    },
    BaseVitals_Raid_CutlassKeys: <DataSheetUri<VitalsBaseData>>{
      uri: "datatables/vitalstables/raids/javelindata_basevitals_raid_cutlasskeys.json",
    },
    BaseVitals_WorldBoss: <DataSheetUri<VitalsBaseData>>{
      uri: "datatables/vitalstables/javelindata_basevitals_worldboss.json",
    },
  },
  VitalsCategoryData: {
    VitalsCategories: <DataSheetUri<VitalsCategoryData>>{
      uri: "datatables/javelindata_vitalscategories.json",
    },
  },
  VitalsData: {
    Vitals_FtW: <DataSheetUri<VitalsData>>{
      uri: "datatables/ftw/javelindata_vitals_ftw.json",
    },
  },
  VitalsLevelData: {
    VitalsLevels: <DataSheetUri<VitalsLevelData>>{
      uri: "datatables/javelindata_vitalsleveldata.json",
    },
  },
  VitalsLevelVariantData: {
    LevelVariantVitals_Common: <DataSheetUri<VitalsLevelVariantData>>{
      uri: "datatables/vitalstables/javelindata_levelvariantvitals_common.json",
    },
    LevelVariantVitals_CutlassKeys: <DataSheetUri<VitalsLevelVariantData>>{
      uri: "datatables/vitalstables/javelindata_levelvariantvitals_cutlasskeys.json",
    },
    LevelVariantVitals_FirstLight: <DataSheetUri<VitalsLevelVariantData>>{
      uri: "datatables/vitalstables/javelindata_levelvariantvitals_firstlight.json",
    },
    LevelVariantVitals_Player: <DataSheetUri<VitalsLevelVariantData>>{
      uri: "datatables/vitalstables/javelindata_levelvariantvitals_player.json",
    },
    LevelVariantVitals_WorldBoss: <DataSheetUri<VitalsLevelVariantData>>{
      uri: "datatables/vitalstables/javelindata_levelvariantvitals_worldboss.json",
    },
    Vitals_Raid_CutlassKeys: <DataSheetUri<VitalsLevelVariantData>>{
      uri: "datatables/vitalstables/raids/javelindata_levelvariantvitals_raid_cutlasskeys.json",
    },
  },
  VitalsModifierData: {
    VitalsModifiers: <DataSheetUri<VitalsModifierData>>{
      uri: "datatables/javelindata_vitalsmodifierdata.json",
    },
  },
  WarBalanceData: {
    WarPvpBalanceTable: <DataSheetUri<WarBalanceData>>{
      uri: "datatables/pvpbalancetables/javelindata_pvpbalance_war.json",
    },
  },
  WarboardStatDefinitions: {
    CTFWarboardStatDefinitions: <DataSheetUri<WarboardStatDefinitions>>{
      uri: "datatables/javelindata_ctfwarboardaggregates.json",
    },
    ORWarboardStatDefinitions: <DataSheetUri<WarboardStatDefinitions>>{
      uri: "datatables/javelindata_orwarboardaggregates.json",
    },
    PvPArenaWarboardStatDefinitions: <DataSheetUri<WarboardStatDefinitions>>{
      uri: "datatables/javelindata_pvparenawarboardaggregates.json",
    },
    WarboardStatDefinitions: <DataSheetUri<WarboardStatDefinitions>>{
      uri: "datatables/javelindata_warboardaggregates.json",
    },
  },
  WeaponAccessoryDefinitions: {
    WeaponAccessoryDefinitions: <DataSheetUri<WeaponAccessoryDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_weaponaccessories.json",
    },
  },
  WeaponAppearanceDefinitions: {
    InstrumentsAppearanceDefinitions: <DataSheetUri<WeaponAppearanceDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_instrumentsappearances.json",
    },
    WeaponAppearanceDefinitions: <DataSheetUri<WeaponAppearanceDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_weaponappearances.json",
    },
    WeaponAppearanceDefinitions_MountAttachments: <DataSheetUri<WeaponAppearanceDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_weaponappearances_mountattachments.json",
    },
  },
  WeaponEffectData: {
    WeaponEffects: <DataSheetUri<WeaponEffectData>>{
      uri: "datatables/javelindata_weaponeffects.json",
    },
  },
  WeaponItemDefinitions: {
    RuneItemDefinitions: <DataSheetUri<WeaponItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_runes.json",
    },
    WeaponItemDefinitions: <DataSheetUri<WeaponItemDefinitions>>{
      uri: "datatables/javelindata_itemdefinitions_weapons.json",
    },
  },
  WhisperData: {
    WhisperDataManager: <DataSheetUri<WhisperData>>{
      uri: "datatables/javelindata_whisperdata.json",
    },
  },
  WhisperVfxData: {
    WhisperVFXData: <DataSheetUri<WhisperVfxData>>{
      uri: "datatables/javelindata_whispervfxdata.json",
    },
  },
  WorldEventCategoryData: {
    WorldEventCategories: <DataSheetUri<WorldEventCategoryData>>{
      uri: "datatables/javelindata_worldeventcategories.json",
    },
  },
  WorldEventRuleData: {
    WorldEventRules: <DataSheetUri<WorldEventRuleData>>{
      uri: "datatables/javelindata_worldeventrules.json",
    },
  },
}
