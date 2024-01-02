export interface AZ__Entity {
  __type: string
  id: EntityId
  name: string
  isdependencyready: boolean
  isruntimeactive: boolean
  components: Array<
    | $$1937fe82_e3fc_4f21_9788_8bdfec29a43b
    | $$362911e7_76a9_4d90_afdd_166b0dbd5f13
    | $$5a67f793_0d02_4fac_876d_131a40642505
    | $$6b28df87_d282_4e5b_a817_0b115c72280b
    | $$9d2f173a_ae75_4a1e_8f6f_d476c587f313
    | AbilityComponent
    | AbilityInstanceComponent
    | AbilityInstanceTrackingComponent
    | AchievementComponent
    | ActionConditionCacheComponent
    | ActionListComponent
    | ActivateVirtualInputComponent
    | ad73f519_a850_4ff0_8733_e7ac9d228c8b
    | AggregateContractCountComponent
    | AIConstraintComponent
    | AIManagerComponent
    | AIObjectiveManagerComponent
    | AIPathComponent
    | AIPatrolComponent
    | AISpawnPositionTrackingComponent
    | AITargetableComponent
    | AITargetCollectorComponent
    | AITargetSelectorComponent
    | AIVariantProviderComponent
    | AIWaypointComponent
    | AlignToTerrainComponent
    | AmbientTypeComponent
    | AoiComponent
    | AoiExceptionComponent
    | AreaSpawnerComponent
    | AreaStatusEffectComponent
    | AreaTemporaryAffiliationComponent
    | ArenaComponent
    | AssemblyComponent
    | AsyncRenderTransformComponent
    | AttachmentComponent
    | AttackHeightRetargetComponent
    | AttributeComponent
    | AudioAreaEnvironmentComponent
    | AudioDataFollowerComponent
    | AudioEnvironmentComponent
    | AudioListenerComponent
    | AudioPreloadComponent
    | AudioProxyComponent
    | AudioRtpcComponent
    | AudioSetTriggerOverrideComponent
    | AudioShapeComponent
    | AudioSplineComponent
    | AudioSwitchComponent
    | AudioTriggerComponent
    | AutoRepairComponent
    | AutoSpellComponent
    | AzFramework__ScriptComponent
    | BaseSpectatorCameraComponent
    | BeamAttackComponent
    | BehaviorTreeComponent
    | BlackboardComponent
    | BlendValueComponent
    | BossPhaseComponent
    | BotComponent
    | BotPoiSpawnerComponent
    | BoxShapeComponent
    | BuffBucketsProviderComponent
    | BuildableController
    | BuildableGridComponent
    | BuildableStateComponent
    | BuilderComponent
    | CameraComponent
    | CameraEffectsComponent
    | CameraLockComponent
    | CameraLockTargetComponent
    | CameraStateComponent
    | CampingComponent
    | CapsuleShapeComponent
    | CapturePointComponent
    | CategoricalProgressionComponent
    | CharacterComponent
    | CharacterPhysicsComponent
    | ChargeComponent
    | ChatComponent
    | ClearContainerOnSiegeWarfareComponent
    | ClearEncounterZonesComponent
    | CombatStatusComponent
    | CombatTextComponent
    | CompoundShapeComponent
    | ContainerComponent
    | ContainerTransferComponent
    | ContractsComponent
    | ContributionComponent
    | ContributionTrackerComponent
    | ConversationComponent
    | CooldownTimersComponent
    | CraftingComponent
    | CriticalHitsComponent
    | CurrencyComponent
    | CurrencyConversionComponent
    | CustomizableCharacterComponent
    | CustomizableMeshComponent
    | CylinderShapeComponent
    | DamageReceiverComponent
    | DarknessConstraintComponent
    | DarknessControllerComponent
    | DebugComponent
    | DebugVisualizationComponent
    | DecalComponent
    | DefenseCollisionComponent
    | DefensiveStructureInteractionComponent
    | DelayedEventComponent
    | DestroyGDEComponent
    | DestroyOnSiegeWarfareComponent
    | DetectableComponent
    | DetectableObjectComponent
    | DetectionVolumeComponent
    | DetectionVolumeConstraintComponent
    | DetectionVolumeEventComponent
    | DetectionVolumeTeleportComponent
    | DeteriorationComponent
    | DetonateTriggerComponent
    | DiegeticObjectivePinsComponent
    | DoorComponent
    | DungeonEntranceComponent
    | DungeonExitComponent
    | DynamicScaleCancellingComponent
    | e0c0b127_8a14_4830_b6a4_c3b4cada2fe9
    | EconomyTrackerComponent
    | EmoteControllerComponent
    | EncounterComponent
    | EncounterManagerComponent
    | EncounterRewardsComponent
    | EntitlementComponent
    | EventNotificationComponent
    | EventRerouterComponent
    | EventTimelineComponent
    | ExcludeAOIComponent
    | FactionComponent
    | FactionControlComponent
    | FactionControlInteractComponent
    | FactionControlOwnerComponent
    | FastNoiseGradientComponent
    | FishCaughtComponent
    | FishingBobberPhysicsHack
    | FishingComponent
    | FishingHotspotComponent
    | FogVolumeComponent
    | FootstepComponent
    | FortMajorStructureComponent
    | FortSpawnDataProviderComponent
    | FtueDetectionVolumeComponent
    | FtueIslandComponent
    | FtueIslandSpawnerComponent
    | FtueMetricComponent
    | FtuePlayerHealthMonitorComponent
    | FxScriptComponent
    | GameEventComponent
    | GameMasterComponent
    | GameModeComponent
    | GameModeMutationSchedulerComponent
    | GameModeParticipantComponent
    | GameRigidBodyComponent
    | GameTransformComponent
    | GatherableControllerComponent
    | GatherableStateComponent
    | GatheringComponent
    | GenericInviteComponent
    | GlobalMapDataComponent
    | GlobalMapDataManagerComponent
    | GlobalStorageComponent
    | GritComponent
    | GroupDataComponent
    | GroupFinderGroupDataComponent
    | GroupsComponent
    | GuildsComponent
    | HitVolumeComponent
    | HomeComponent
    | HomingComponent
    | HomingTargetComponent
    | HouseDataComponent
    | HousingDecorationComponent
    | HousingItemComponent
    | HousingPlotComponent
    | HubLocalCacheComponent
    | HUDComponent
    | HunterSightComponent
    | ImpactComponent
    | ImpulseComponent
    | IncapacitatedCharacterComponent
    | InputConfigurationComponent
    | InstancedLootComponent
    | Interact
    | InteractionAnimationComponent
    | InteractionConditionComponent
    | InteractorComponent
    | InteractorUIComponent
    | InteractTeleportComponent
    | InteractWithItemCostComponent
    | InvasionAgentComponent
    | InvasionComponent
    | InvasionLaneProviderComponent
    | InvasionObjectiveComponent
    | ItemDropComponent
    | ItemGenerationComponent
    | ItemManagementComponent
    | ItemRepairComponent
    | ItemSkinningComponent
    | JavCameraControllerComponent
    | JavSpectatorCameraComponent
    | LandClaimComponent
    | LandClaimManagerComponent
    | LeaderboardComponent
    | LensFlareComponent
    | LightComponent
    | LightweightCharacterComponent
    | LimbIKComponent
    | LocalPlayerDebugComponent
    | LocalPlayerProjectileTrackerComponent
    | LocalPlayerSaveDataComponent
    | LookAtTargetComponent
    | LookTargetingComponent
    | LootDropComponent
    | LootTableComponent
    | LootTrackerComponent
    | LoreReaderComponent
    | LuckConstraintComponent
    | MagicComponent
    | ManaComponent
    | MarkerComponent
    | MaterialEffectComponent
    | MaterialOverrideComponent
    | MaterialOverrideTriggerComponent
    | MeshColliderComponent
    | MeshComponent
    | MetaAchievementComponent
    | MinionVitalsProviderComponent
    | MomentaryOffenseComponent
    | MotionParameterSmoothingComponent
    | MountComponent
    | MusicalPerformanceIndicatorComponent
    | MusicalPerformanceZoneComponent
    | NameComponent
    | NavigationObstacleMeshComponent
    | NavMeshConstraintComponent
    | NavMeshDebugComponent
    | NotificationServiceComponent
    | NpcComponent
    | NWTagComponent
    | ObjectiveDetectionVolumeComponent
    | ObjectiveInteractorComponent
    | ObjectiveProviderComponent
    | ObjectivesComponent
    | OffenseCollisionComponent
    | OpenMapComponent
    | OutpostRushSummoningInteractionComponent
    | OwnershipComponent
    | OwnershipDataComponent
    | OwnershipMessageComponent
    | OwnershipParameterProviderComponent
    | P2PTradeComponent
    | PaperdollComponent
    | ParticipantTrackerComponent
    | ParticleComponent
    | PathingComponent
    | PathLocationComponent
    | PerceptionComponent
    | PerkConditionComponent
    | PlacementObstructionComponent
    | PlayCinematicVideoComponent
    | PlayerAOIComponent
    | PlayerAppearanceComponent
    | PlayerArenaComponent
    | PlayerAudioProxyComponent
    | PlayerComponent
    | PlayerCutsceneComponent
    | PlayerDataBroadcastComponent
    | PlayerGenericInviteComponent
    | PlayerHomeComponent
    | PlayerHousingComponent
    | PlayerInputFiltersComponent
    | PlayerNameTagComponent
    | PlayerPositionTrackingComponent
    | PlayerSettingsComponent
    | PlayerTimeComponent
    | PlayerTradeComponent
    | PlayerTurretComponent
    | PlaytestUIComponent
    | POIManagerComponent
    | PointLocationComponent
    | PointSpawnerComponent
    | PolygonPrismShapeComponent
    | PositionalTicketingComponent
    | PositionInTheWorldComponent
    | PrefabReferencerComponent
    | PrefabSpawnerComponent
    | PrefabSpawnRandomizer
    | PrimitiveColliderComponent
    | ProgressionComponent
    | ProgressionPointComponent
    | ProjectileComponent
    | ProjectileSpawnerComponent
    | RadialMeshComponent
    | RaidDataComponent
    | RaidSetupComponent
    | RainComponent
    | ReactionTrackingComponent
    | ReactivateFtueEntityComponent
    | ReadingInteractionComponent
    | RenderGuildFlagComponent
    | RenderQualityComponent
    | ResetFtueSpawnersComponent
    | RewardTrackComponent
    | RigidBodyComponent
    | RigidPhysicsComponent
    | RiverComponent
    | RoadComponent
    | RotationComponent
    | ScheduleConstraintComponent
    | SeasonsRewardsTrackedStatComponent
    | SequenceAgentComponent
    | SequenceComponent
    | ServerTransferComponent
    | SessionTrackingComponent
    | SettlementComponent
    | ShakeComponent
    | ShapeLocationComponent
    | ShowOnMapUIComponent
    | SiegeWarfareComponent
    | SiegeWarfareDataComponent
    | SiegeWarfareListenerComponent
    | SiegeWarfareVulnerableComponent
    | SiegeWeaponComponent
    | SimpleAnimationComponent
    | SkinnedMeshAttachmentVisibilityComponent
    | SkinnedMeshComponent
    | SlayerScriptComponent
    | SlayerScriptForwarderComponent
    | SliceComponent
    | SnapToTerrainComponent
    | SnowComponent
    | SocialComponent
    | SpawnCapConstraintComponent
    | SpawnerComponent
    | SpawnerLifetimeManagerComponent
    | SpawnerMetricsComponent
    | SpectatedPlayerComponent
    | SpectatorModeComponent
    | SpellAlignmentComponent
    | SpellComponent
    | SpellTargetIndicatorManagerComponent
    | SphereShapeComponent
    | SplineComponent
    | StaminaComponent
    | StaticPhysicsComponent
    | StatMultiplierTableComponent
    | StatusEffectsComponent
    | StimulusComponent
    | StorageComponent
    | SurfaceAlignmentComponent
    | TagComponent
    | TargetingComponent
    | TemporaryAffiliationComponent
    | TerrainConstraintComponent
    | TerritoryComponent
    | TerritoryDataProviderComponent
    | TerritoryDetectorComponent
    | TerritoryGovernanceComponent
    | TerritoryInteractorComponent
    | TerritoryInterfaceComponent
    | TerritoryProgressionComponent
    | TimeComponent
    | TimelineComponent
    | TimelineControllerComponent
    | TimeOfDayConstraintComponent
    | TimeOfDayPOIComponent
    | TippingPoolComponent
    | TrackableComponent
    | TradingPostComponent
    | TransactionComponent
    | TransformComponent
    | TranslationComponent
    | TraversalComponent
    | TriggerAreaComponent
    | TriggerAreaDetectable
    | TriggerAreaEntityComponent
    | TriggerAreaPlayerCutsceneComponent
    | TriggerEntityComponent
    | TurretComponent
    | TutorialAIComponent
    | TutorialComponent
    | TwitchComponent
    | UIActionManagerComponent
    | UiButtonComponent
    | UiCheckboxComponent
    | UiDesaturatorComponent
    | UiDraggableComponent
    | UiDropdownComponent
    | UiDropdownOptionComponent
    | UiDropTargetComponent
    | UiDynamicLayoutComponent
    | UiDynamicScrollBoxComponent
    | UiElementComponent
    | UiExitHoverEventComponent
    | UiFaderComponent
    | UiFlipbookAnimationComponent
    | UiImageComponent
    | UiImageSequenceComponent
    | UiLayoutCellComponent
    | UiLayoutColumnComponent
    | UiLayoutFitterComponent
    | UiLayoutGridComponent
    | UiLayoutRowComponent
    | UiLayoutRowFixedComponent
    | UiMaskComponent
    | UiProgressBarComponent
    | UiRadioButtonComponent
    | UiRadioButtonGroupComponent
    | UiScrollBarComponent
    | UiScrollBarMouseWheelComponent
    | UiScrollBoxComponent
    | UiSliderComponent
    | UiSpawnerComponent
    | UiTextComponent
    | UiTransform2dComponent
    | UiTriggerAreaEventComponent
    | UITriggerEventComponent
    | UnifiedInteractOptionComponent
    | UnstuckComponent
    | ValidateTerrainComponent
    | VariationDataComponent
    | VegetationAreaBlenderComponent
    | VegetationAreaComponent
    | VegetationAudioComponent
    | VegetationBendingComponent
    | VegetationBlockerComponent
    | VegetationDescriptorListComponent
    | VegetationDescriptorWeightSelectorComponent
    | VegetationDistributionFilterComponent
    | VegetationGradientTransformComponent
    | VegetationInvertGradientComponent
    | VegetationLevelsGradientComponent
    | VegetationMixedGradientComponent
    | VegetationPerlinGradientComponent
    | VegetationPositionModifierComponent
    | VegetationRandomGradientComponent
    | VegetationReferenceShapeComponent
    | VegetationRotationModifierComponent
    | VegetationScaleModifierComponent
    | VegetationSlopeAlignmentModifierComponent
    | VegetationSpawnerComponent
    | VegetationSurfaceAltitudeFilterComponent
    | VegetationSurfaceMaskFilterComponent
    | VegetationSurfaceSlopeFilterComponent
    | VegetationWaterDepthFilterComponent
    | VitalsComponent
    | VoiceChatComponent
    | VoidDestroyerComponent
    | VoidDestroyerEyeComponent
    | WarboardComponent
    | WarCampComponent
    | WarDataComponent
    | WaterLevelComponent
    | WaterVolumeComponent
    | WaypointsComponent
    | WeaponAccuracyComponent
    | WeatherComponent
    | WhisperPlayerComponent
    | WorldBoundTrackerComponent
  >
}
export function isAZ__Entity(obj: any): obj is AZ__Entity {
  return obj?.['__type'] === 'AZ::Entity'
}

export interface EntityId {
  __type: string
  id: number
}
export function isEntityId(obj: any): obj is EntityId {
  return obj?.['__type'] === 'EntityId'
}

export interface SliceComponent {
  __type: string
  baseclass1: AZ__Component
  entities: Array<AZ__Entity>
  prefabs: []
  isdynamic: boolean
  dependencyreloadmode: number
  dataflagsfornewentities: DataFlagsPerEntity
}
export function isSliceComponent(obj: any): obj is SliceComponent {
  return obj?.['__type'] === 'SliceComponent'
}

export interface AZ__Component {
  __type: string
  id: number
}
export function isAZ__Component(obj: any): obj is AZ__Component {
  return obj?.['__type'] === 'AZ::Component'
}

export interface GameTransformComponent {
  __type: string
  baseclass1: FacetedComponent
  m_worldtm: Transform
  m_parentid: EntityId
  m_localtm: Transform
  m_onnewparentkeepworldtm: boolean
  m_isstatic: boolean
}
export function isGameTransformComponent(obj: any): obj is GameTransformComponent {
  return obj?.['__type'] === 'GameTransformComponent'
}

export interface FacetedComponent {
  __type: string
  baseclass1: AZ__Component
  baseclass2: EditorListener
  m_clientfacetptr:
    | $$3d595d6a_a89b_464c_a1ff_f3b242423065
    | $$3d80df0c_7d0e_4400_a0f1_67c633084755
    | $$6e3c132e_efd7_440d_8e07_578529cae867
    | AbilityComponentClientFacet
    | AbilityInstanceComponentClientFacet
    | AbilityInstanceTrackingComponentClientFacet
    | AchievementComponentClientFacet
    | ActionConditionCacheComponentClientFacet
    | ActionListComponentClientFacet
    | ActivateVirtualInputComponentClientFacet
    | AggregateContractCountComponentClientFacet
    | AIConstraintComponentClientFacet
    | AIManagerComponentClientFacet
    | AIObjectiveManagerComponentClientFacet
    | AIPathComponentClientFacet
    | AIPatrolComponentClientFacet
    | AISpawnPositionTrackingComponentClientFacet
    | AITargetableComponentClientFacet
    | AITargetCollectorComponentClientFacet
    | AITargetSelectorComponentClientFacet
    | AIVariantProviderComponentClientFacet
    | AIWaypointComponentClientFacet
    | AlignToTerrainComponentClientFacet
    | AmbientTypeComponentClientFacet
    | AoiComponentClientFacet
    | AoiExceptionComponentClientFacet
    | AreaSpawnerComponentClientFacet
    | AreaStatusEffectComponentClientFacet
    | AreaTemporaryAffiliationComponentClientFacet
    | ArenaComponentClientFacet
    | AssemblyComponentClientFacet
    | AsyncRenderTransformComponentClientFacet
    | AttackHeightRetargetComponentClientFacet
    | AttributeComponentClientFacet
    | AudioProxyComponentClientFacet
    | AudioSetTriggerOverrideComponentClientFacet
    | AutoRepairComponentClientFacet
    | AutoSpellComponentClientFacet
    | BeamAttackComponentClientFacet
    | BehaviorTreeComponentClientFacet
    | BlackboardComponentClientFacet
    | BlendValueComponentClientFacet
    | BossPhaseComponentClientFacet
    | BotComponentClientFacet
    | BotPoiSpawnerComponentClientFacet
    | BuffBucketsProviderComponentClientFacet
    | BuildableControllerClientFacet
    | BuildableGridComponentClientFacet
    | BuildableStateComponentClientFacet
    | BuilderComponentClientFacet
    | CameraLockComponentClientFacet
    | CameraLockTargetComponentClientFacet
    | CameraStateComponentClientFacet
    | CampingComponentClientFacet
    | CapturePointComponentClientFacet
    | CategoricalProgressionComponentClientFacet
    | CharacterComponentClientFacet
    | ChargeComponentClientFacet
    | ChatComponentClientFacet
    | ClearContainerOnSiegeWarfareComponentClientFacet
    | ClearEncounterZonesComponentClientFacet
    | CombatStatusComponentClientFacet
    | CombatTextComponentClientFacet
    | ContainerComponentClientFacet
    | ContainerTransferComponentClientFacet
    | ContractsComponentClientFacet
    | ContributionComponentClientFacet
    | ContributionTrackerComponentClientFacet
    | ConversationComponentClientFacet
    | CooldownTimersComponentClientFacet
    | CraftingComponentClientFacet
    | CriticalHitsComponentClientFacet
    | CurrencyComponentClientFacet
    | CurrencyConversionComponentClientFacet
    | DamageReceiverComponentClientFacet
    | DarknessConstraintComponentClientFacet
    | DarknessControllerComponentClientFacet
    | DebugComponentClientFacet
    | DebugVisualizationComponentClientFacet
    | DefenseCollisionComponentClientFacet
    | DefensiveStructureInteractionComponentClientFacet
    | DelayedEventComponentClientFacet
    | DestroyGDEComponentClientFacet
    | DestroyOnSiegeWarfareComponentClientFacet
    | DetectableComponentClientFacet
    | DetectableObjectComponentClientFacet
    | DetectionVolumeComponentClientFacet
    | DetectionVolumeConstraintComponentClientFacet
    | DetectionVolumeEventComponentClientFacet
    | DetectionVolumeTeleportComponentClientFacet
    | DeteriorationComponentClientFacet
    | DetonateTriggerComponentClientFacet
    | DiegeticObjectivePinsComponentClientFacet
    | DoorComponentClientFacet
    | DungeonEntranceClientFacet
    | DungeonExitClientFacet
    | DynamicScaleCancellingComponentClientFacet
    | EconomyTrackerComponentClientFacet
    | EmoteControllerComponentClientFacet
    | EncounterComponentClientFacet
    | EncounterManagerComponentClientFacet
    | EncounterRewardsComponentClientFacet
    | EntitlementComponentClientFacet
    | EventNotificationComponentClientFacet
    | EventRerouterComponentClientFacet
    | EventTimelineComponentClientFacet
    | ExcludeAOIComponentClientFacet
    | FactionComponentClientFacet
    | FactionControlComponentClientFacet
    | FactionControlInteractComponentClientFacet
    | FactionControlOwnerComponentClientFacet
    | FishCaughtComponentClientFacet
    | FishingBobberPhysicsHackClientFacet
    | FishingComponentClientFacet
    | FishingHotspotComponentClientFacet
    | FortMajorStructureComponentClientFacet
    | FortSpawnDataProviderComponentClientFacet
    | FtueDetectionVolumeComponentClientFacet
    | FtueIslandComponentClientFacet
    | FtueIslandSpawnerComponentClientFacet
    | FtueMetricComponentClientFacet
    | FtuePlayerHealthMonitorComponentClientFacet
    | FxScriptComponentClientFacet
    | GameEventComponentClientFacet
    | GameMasterComponentClientFacet
    | GameModeComponentClientFacet
    | GameModeMutationSchedulerComponentClientFacet
    | GameModeParticipantComponentClientFacet
    | GameRigidBodyComponentClientFacet
    | GatherableControllerComponentClientFacet
    | GatherableStateComponentClientFacet
    | GatheringComponentClientFacet
    | GenericInviteComponentClientFacet
    | GlobalMapDataComponentClientFacet
    | GlobalMapDataManagerComponentClientFacet
    | GlobalStorageComponentClientFacet
    | GritComponentClientFacet
    | GroupDataComponentClientFacet
    | GroupFinderGroupDataComponentClientFacet
    | GroupsComponentClientFacet
    | GuildsComponentClientFacet
    | HitVolumeComponentClientFacet
    | HomeComponentClientFacet
    | HomingComponentClientFacet
    | HomingTargetComponentClientFacet
    | HouseDataComponentClientFacet
    | HousingPlotComponentClientFacet
    | HubLocalCacheComponentClientFacet
    | HUDComponentClientFacet
    | HunterSightComponentClientFacet
    | ImpulseComponentClientFacet
    | IncapacitatedCharacterComponentClientFacet
    | InstancedLootComponentClientFacet
    | InteractClientFacet
    | InteractionConditionComponentClientFacet
    | InteractorComponentClientFacet
    | InteractorUIComponentClientFacet
    | InteractTeleportComponentClientFacet
    | InteractWithItemCostComponentClientFacet
    | InvasionAgentComponentClientFacet
    | InvasionComponentClientFacet
    | InvasionLaneProviderComponentClientFacet
    | InvasionObjectiveComponentClientFacet
    | ItemDropComponentClientFacet
    | ItemGenerationComponentClientFacet
    | ItemManagementComponentClientFacet
    | ItemRepairComponentClientFacet
    | ItemSkinningComponentClientFacet
    | JavCameraControllerComponentClientFacet
    | JavSpectatorCameraComponentClientFacet
    | LandClaimComponentClientFacet
    | LandClaimManagerComponentClientFacet
    | LeaderboardComponentClientFacet
    | LightweightCharacterComponentClientFacet
    | LocalPlayerDebugComponentClientFacet
    | LookAtTargetComponentClientFacet
    | LookTargetingComponentClientFacet
    | LootDropComponentClientFacet
    | LootTableComponentClientFacet
    | LootTrackerComponentClientFacet
    | LoreReaderComponentClientFacet
    | LuckConstraintComponentClientFacet
    | MagicComponentClientFacet
    | ManaComponentClientFacet
    | MarkerComponentClientFacet
    | MaterialEffectComponentClientFacet
    | MaterialOverrideComponentClientFacet
    | MaterialOverrideTriggerComponentClientFacet
    | MetaAchievementComponentClientFacet
    | MinionVitalsProviderComponentClientFacet
    | MomentaryOffenseComponentClientFacet
    | MountComponentClientFacet
    | MusicalPerformanceComponentClientFacet
    | MusicalPerformanceIndicatorComponentClientFacet
    | MusicalPerformancePlayerComponentClientFacet
    | MusicalPerformanceZoneComponentClientFacet
    | NameComponentClientFacet
    | NavigationObstacleMeshComponentClientFacet
    | NavMeshConstraintComponentClientFacet
    | NavMeshDebugComponentClientFacet
    | NotificationServiceComponentClientFacet
    | NpcComponentClientFacet
    | NWTagComponentClientFacet
    | ObjectiveDetectionVolumeComponentClientFacet
    | ObjectiveInteractorComponentClientFacet
    | ObjectiveProviderComponentClientFacet
    | ObjectivesComponentClientFacet
    | OffenseCollisionComponentClientFacet
    | OpenMapClientFacet
    | OutpostRushSummoningInteractionComponentClientFacet
    | OwnershipComponentClientFacet
    | OwnershipDataComponentClientFacet
    | OwnershipMessageComponentClientFacet
    | OwnershipParameterProviderComponentClientFacet
    | P2PTradeComponentClientFacet
    | PaperdollComponentClientFacet
    | ParticipantTrackerComponentClientFacet
    | PathingComponentClientFacet
    | PathLocationComponentClientFacet
    | PerceptionComponentClientFacet
    | PerkConditionComponentClientFacet
    | PlacementObstructionComponentClientFacet
    | PlayCinematicVideoClientFacet
    | PlayerAOIComponentClientFacet
    | PlayerAppearanceComponentClientFacet
    | PlayerArenaComponentClientFacet
    | PlayerAudioProxyComponentClientFacet
    | PlayerComponentClientFacet
    | PlayerCutsceneComponentClientFacet
    | PlayerDataBroadcastComponentClientFacet
    | PlayerGenericInviteComponentClientFacet
    | PlayerHomeComponentClientFacet
    | PlayerHousingComponentClientFacet
    | PlayerInputFiltersComponentClientFacet
    | PlayerNameTagComponentClientFacet
    | PlayerPositionTrackingComponentClientFacet
    | PlayerSettingsComponentClientFacet
    | PlayerTimeComponentClientFacet
    | PlayerTradeComponentClientFacet
    | PlayerTurretComponentClientFacet
    | PlaytestUIComponentClientFacet
    | POIManagerComponentClientFacet
    | PointLocationComponentClientFacet
    | PointSpawnerComponentClientFacet
    | PositionalTicketingComponentClientFacet
    | PositionInTheWorldComponentClientFacet
    | PrefabSpawnerComponentClientFacet
    | PrefabSpawnRandomizerClientFacet
    | ProgressionComponentClientFacet
    | ProgressionPointComponentClientFacet
    | ProjectileComponentClientFacet
    | ProjectileSpawnerComponentClientFacet
    | RadialMeshComponentClientFacet
    | RaidDataComponentClientFacet
    | RaidSetupComponentClientFacet
    | ReactionTrackingComponentClientFacet
    | ReactivateFtueEntityComponentClientFacet
    | ReadingInteractionComponentClientFacet
    | RenderGuildFlagComponentClientFacet
    | ResetFtueSpawnersComponentClientFacet
    | RewardTrackComponentClientFacet
    | RotationComponentClientFacet
    | ScheduleConstraintComponentClientFacet
    | SeasonsRewardsComponentClientFacet
    | SeasonsRewardsTrackedStatComponentClientFacet
    | ServerTransferComponentClientFacet
    | SessionTrackingComponentClientFacet
    | SettlementComponentClientFacet
    | ShakeComponentClientFacet
    | ShapeLocationComponentClientFacet
    | SiegeWarfareComponentClientFacet
    | SiegeWarfareDataComponentClientFacet
    | SiegeWarfareListenerComponentClientFacet
    | SiegeWarfareVulnerableComponentClientFacet
    | SiegeWeaponComponentClientFacet
    | SkinnedMeshAttachmentVisibilityComponentClientFacet
    | SlayerScriptClientFacet
    | SlayerScriptForwarderClientFacet
    | SnapToTerrainComponentClientFacet
    | SocialComponentClientFacet
    | SpawnCapConstraintComponentClientFacet
    | SpawnerComponentClientFacet
    | SpawnerLifetimeManagerComponentClientFacet
    | SpawnerMetricsComponentClientFacet
    | SpectatedPlayerComponentClientFacet
    | SpectatorModeComponentClientFacet
    | SpellComponentClientFacet
    | SpellTargetIndicatorManagerComponentClientFacet
    | StaminaComponentClientFacet
    | StatMultiplierTableComponentClientFacet
    | StatusEffectsComponentClientFacet
    | StimulusComponentClientFacet
    | StorageComponentClientFacet
    | SurfaceAlignmentComponentClientFacet
    | TargetingComponentClientFacet
    | TemporaryAffiliationComponentClientFacet
    | TerrainConstraintComponentClientFacet
    | TerritoryComponentClientFacet
    | TerritoryDetectorComponentClientFacet
    | TerritoryGovernanceComponentClientFacet
    | TerritoryInteractorComponentClientFacet
    | TerritoryInterfaceComponentClientFacet
    | TerritoryProgressionComponentClientFacet
    | TimeComponentClientFacet
    | TimelineComponentClientFacet
    | TimelineControllerComponentClientFacet
    | TimeOfDayConstraintComponentClientFacet
    | TippingPoolComponentClientFacet
    | TrackableComponentClientFacet
    | TradingPostComponentClientFacet
    | TransactionComponentClientFacet
    | TranslationComponentClientFacet
    | TraversalComponentClientFacet
    | TriggerAreaEntityComponentClientFacet
    | TriggerAreaPlayerCutsceneComponentClientFacet
    | TriggerEntityComponentClientFacet
    | TurretComponentClientFacet
    | TutorialAIComponentClientFacet
    | TutorialComponentClientFacet
    | TwitchComponentClientFacet
    | UIActionManagerComponentClientFacet
    | UITriggerEventComponentClientFacet
    | UnstuckComponentClientFacet
    | ValidateTerrainComponentClientFacet
    | VariationDataComponentClientFacet
    | VitalsComponentClientFacet
    | VoiceChatComponentClientFacet
    | VoidDestroyerComponentClientFacet
    | VoidDestroyerEyeComponentClientFacet
    | WarboardComponentClientFacet
    | WarCampComponentClientFacet
    | WarDataComponentClientFacet
    | WaterLevelComponentClientFacet
    | WaypointsComponentClientFacet
    | WeaponAccuracyComponentClientFacet
    | WhisperPlayerComponentClientFacet
    | WorldBoundTrackerComponentClientFacet
  m_serverfacetptr:
    | $$4f7e6c60_63c6_42f4_97a6_1d4ef47b8d7d
    | $$527d161a_cb9a_486e_a0b9_499fd528ab00
    | AbilityComponentServerFacet
    | AbilityInstanceComponentServerFacet
    | AbilityInstanceTrackingComponentServerFacet
    | AchievementComponentServerFacet
    | ActionConditionCacheComponentServerFacet
    | ActionListComponentServerFacet
    | ActivateVirtualInputComponentServerFacet
    | ade49f45_eb0a_481c_bfa5_afb78de0c3ef
    | AggregateContractCountComponentServerFacet
    | AIConstraintComponentServerFacet
    | AIManagerComponentServerFacet
    | AIObjectiveManagerComponentServerFacet
    | AIPathComponentServerFacet
    | AIPatrolComponentServerFacet
    | AISpawnPositionTrackingComponentServerFacet
    | AITargetableComponentServerFacet
    | AITargetCollectorComponentServerFacet
    | AITargetSelectorComponentServerFacet
    | AIVariantProviderComponentServerFacet
    | AIWaypointComponentServerFacet
    | AlignToTerrainComponentServerFacet
    | AmbientTypeComponentServerFacet
    | AoiComponentServerFacet
    | AoiExceptionComponentServerFacet
    | AreaSpawnerComponentServerFacet
    | AreaStatusEffectComponentServerFacet
    | AreaTemporaryAffiliationComponentServerFacet
    | ArenaComponentServerFacet
    | AssemblyComponentServerFacet
    | AsyncRenderTransformComponentServerFacet
    | AttackHeightRetargetComponentServerFacet
    | AttributeComponentServerFacet
    | AudioProxyComponentServerFacet
    | AudioSetTriggerOverrideComponentServerFacet
    | AutoRepairComponentServerFacet
    | AutoSpellComponentServerFacet
    | BeamAttackComponentServerFacet
    | BehaviorTreeComponentServerFacet
    | BlackboardComponentServerFacet
    | BlendValueComponentServerFacet
    | BossPhaseComponentServerFacet
    | BotComponentServerFacet
    | BotPoiSpawnerComponentServerFacet
    | BuffBucketsProviderComponentServerFacet
    | BuildableControllerServerFacet
    | BuildableGridComponentServerFacet
    | BuildableStateComponentServerFacet
    | BuilderComponentServerFacet
    | CameraLockComponentServerFacet
    | CameraLockTargetComponentServerFacet
    | CameraStateComponentServerFacet
    | CampingComponentServerFacet
    | CapturePointComponentServerFacet
    | CategoricalProgressionComponentServerFacet
    | CharacterComponentServerFacet
    | ChargeComponentServerFacet
    | ChatComponentServerFacet
    | ClearContainerOnSiegeWarfareComponentServerFacet
    | ClearEncounterZonesComponentServerFacet
    | CombatStatusComponentServerFacet
    | CombatTextComponentServerFacet
    | ContainerComponentServerFacet
    | ContainerTransferComponentServerFacet
    | ContractsComponentServerFacet
    | ContributionComponentServerFacet
    | ContributionTrackerComponentServerFacet
    | ConversationComponentServerFacet
    | CooldownTimersComponentServerFacet
    | CraftingComponentServerFacet
    | CriticalHitsComponentServerFacet
    | CurrencyComponentServerFacet
    | CurrencyConversionComponentServerFacet
    | DamageReceiverComponentServerFacet
    | DarknessConstraintComponentServerFacet
    | DarknessControllerComponentServerFacet
    | DebugComponentServerFacet
    | DebugVisualizationComponentServerFacet
    | DefenseCollisionComponentServerFacet
    | DefensiveStructureInteractionComponentServerFacet
    | DelayedEventComponentServerFacet
    | DestroyGDEComponentServerFacet
    | DestroyOnSiegeWarfareComponentServerFacet
    | DetectableComponentServerFacet
    | DetectableObjectComponentServerFacet
    | DetectionVolumeComponentServerFacet
    | DetectionVolumeConstraintComponentServerFacet
    | DetectionVolumeEventComponentServerFacet
    | DetectionVolumeTeleportComponentServerFacet
    | DeteriorationComponentServerFacet
    | DetonateTriggerComponentServerFacet
    | DiegeticObjectivePinsComponentServerFacet
    | DoorComponentServerFacet
    | DungeonEntranceServerFacet
    | DungeonExitServerFacet
    | DynamicScaleCancellingComponentServerFacet
    | EconomyTrackerComponentServerFacet
    | EmoteControllerComponentServerFacet
    | EncounterComponentServerFacet
    | EncounterManagerComponentServerFacet
    | EncounterRewardsComponentServerFacet
    | EntitlementComponentServerFacet
    | EventNotificationComponentServerFacet
    | EventRerouterComponentServerFacet
    | EventTimelineComponentServerFacet
    | ExcludeAOIComponentServerFacet
    | FactionComponentServerFacet
    | FactionControlComponentServerFacet
    | FactionControlInteractComponentServerFacet
    | FactionControlOwnerComponentServerFacet
    | FishCaughtComponentServerFacet
    | FishingBobberPhysicsHackServerFacet
    | FishingComponentServerFacet
    | FishingHotspotComponentServerFacet
    | FortMajorStructureComponentServerFacet
    | FortSpawnDataProviderComponentServerFacet
    | FtueDetectionVolumeComponentServerFacet
    | FtueIslandComponentServerFacet
    | FtueIslandSpawnerComponentServerFacet
    | FtueMetricComponentServerFacet
    | FtuePlayerHealthMonitorComponentServerFacet
    | FxScriptComponentServerFacet
    | GameEventComponentServerFacet
    | GameMasterComponentServerFacet
    | GameModeComponentServerFacet
    | GameModeMutationSchedulerComponentServerFacet
    | GameModeParticipantComponentServerFacet
    | GameRigidBodyComponentServerFacet
    | GatherableControllerComponentServerFacet
    | GatherableStateComponentServerFacet
    | GatheringComponentServerFacet
    | GenericInviteComponentServerFacet
    | GlobalMapDataComponentServerFacet
    | GlobalMapDataManagerComponentServerFacet
    | GlobalStorageComponentServerFacet
    | GritComponentServerFacet
    | GroupDataComponentServerFacet
    | GroupFinderGroupDataComponentServerFacet
    | GroupsComponentServerFacet
    | GuildsComponentServerFacet
    | HitVolumeComponentServerFacet
    | HomeComponentServerFacet
    | HomingComponentServerFacet
    | HomingTargetComponentServerFacet
    | HouseDataComponentServerFacet
    | HousingPlotComponentServerFacet
    | HubLocalCacheComponentServerFacet
    | HUDComponentServerFacet
    | HunterSightComponentServerFacet
    | ImpulseComponentServerFacet
    | IncapacitatedCharacterComponentServerFacet
    | InstancedLootComponentServerFacet
    | InteractionConditionComponentServerFacet
    | InteractorComponentServerFacet
    | InteractorUIComponentServerFacet
    | InteractServerFacet
    | InteractTeleportComponentServerFacet
    | InteractWithItemCostComponentServerFacet
    | InvasionAgentComponentServerFacet
    | InvasionComponentServerFacet
    | InvasionLaneProviderComponentServerFacet
    | InvasionObjectiveComponentServerFacet
    | ItemDropComponentServerFacet
    | ItemGenerationComponentServerFacet
    | ItemManagementComponentServerFacet
    | ItemRepairComponentServerFacet
    | ItemSkinningComponentServerFacet
    | JavCameraControllerComponentServerFacet
    | JavSpectatorCameraComponentServerFacet
    | LandClaimComponentServerFacet
    | LandClaimManagerComponentServerFacet
    | LeaderboardComponentServerFacet
    | LightweightCharacterComponentServerFacet
    | LocalPlayerDebugComponentServerFacet
    | LookAtTargetComponentServerFacet
    | LookTargetingComponentServerFacet
    | LootDropComponentServerFacet
    | LootTableComponentServerFacet
    | LootTrackerComponentServerFacet
    | LoreReaderComponentServerFacet
    | LuckConstraintComponentServerFacet
    | MagicComponentServerFacet
    | ManaComponentServerFacet
    | MarkerComponentServerFacet
    | MaterialEffectComponentServerFacet
    | MaterialOverrideComponentServerFacet
    | MaterialOverrideTriggerComponentServerFacet
    | MetaAchievementComponentServerFacet
    | MinionVitalsProviderComponentServerFacet
    | MomentaryOffenseComponentServerFacet
    | MountComponentServerFacet
    | MusicalPerformanceComponentServerFacet
    | MusicalPerformanceIndicatorComponentServerFacet
    | MusicalPerformancePlayerComponentServerFacet
    | MusicalPerformanceZoneComponentServerFacet
    | NameComponentServerFacet
    | NavigationObstacleMeshComponentServerFacet
    | NavMeshConstraintComponentServerFacet
    | NavMeshDebugComponentServerFacet
    | NotificationServiceComponentServerFacet
    | NpcComponentServerFacet
    | NWTagComponentServerFacet
    | ObjectiveDetectionVolumeComponentServerFacet
    | ObjectiveInteractorComponentServerFacet
    | ObjectiveProviderComponentServerFacet
    | ObjectivesComponentServerFacet
    | OffenseCollisionComponentServerFacet
    | OpenMapServerFacet
    | OutpostRushSummoningInteractionComponentServerFacet
    | OwnershipComponentServerFacet
    | OwnershipDataComponentServerFacet
    | OwnershipMessageComponentServerFacet
    | OwnershipParameterProviderComponentServerFacet
    | PaperdollComponentServerFacet
    | ParticipantTrackerComponentServerFacet
    | PathingComponentServerFacet
    | PathLocationComponentServerFacet
    | PerceptionComponentServerFacet
    | PerkConditionComponentServerFacet
    | PlacementObstructionComponentServerFacet
    | PlayCinematicVideoServerFacet
    | PlayerAOIComponentServerFacet
    | PlayerAppearanceComponentServerFacet
    | PlayerArenaComponentServerFacet
    | PlayerAudioProxyComponentServerFacet
    | PlayerComponentServerFacet
    | PlayerCutsceneComponentServerFacet
    | PlayerDataBroadcastComponentServerFacet
    | PlayerHomeComponentServerFacet
    | PlayerHousingComponentServerFacet
    | PlayerInputFiltersComponentServerFacet
    | PlayerNameTagComponentServerFacet
    | PlayerPositionTrackingComponentServerFacet
    | PlayerSettingsComponentServerFacet
    | PlayerTimeComponentServerFacet
    | PlayerTradeComponentServerFacet
    | PlayerTurretComponentServerFacet
    | PlaytestUIComponentServerFacet
    | POIManagerComponentServerFacet
    | PointLocationComponentServerFacet
    | PointSpawnerComponentServerFacet
    | PositionalTicketingComponentServerFacet
    | PositionInTheWorldComponentServerFacet
    | PrefabSpawnerComponentServerFacet
    | PrefabSpawnRandomizerServerFacet
    | ProgressionComponentServerFacet
    | ProgressionPointComponentServerFacet
    | ProjectileComponentServerFacet
    | ProjectileSpawnerComponentServerFacet
    | RadialMeshComponentServerFacet
    | RaidDataComponentServerFacet
    | RaidSetupComponentServerFacet
    | ReactionTrackingComponentServerFacet
    | ReactivateFtueEntityComponentServerFacet
    | ReadingInteractionComponentServerFacet
    | RenderGuildFlagComponentServerFacet
    | ResetFtueSpawnersComponentServerFacet
    | RewardTrackComponentServerFacet
    | RotationComponentServerFacet
    | ScheduleConstraintComponentServerFacet
    | SeasonsRewardsComponentServerFacet
    | SeasonsRewardsTrackedStatComponentServerFacet
    | ServerTransferComponentServerFacet
    | SessionTrackingComponentServerFacet
    | SettlementComponentServerFacet
    | ShakeComponentServerFacet
    | ShapeLocationComponentServerFacet
    | SiegeWarfareComponentServerFacet
    | SiegeWarfareDataComponentServerFacet
    | SiegeWarfareListenerComponentServerFacet
    | SiegeWarfareVulnerableComponentServerFacet
    | SiegeWeaponComponentServerFacet
    | SkinnedMeshAttachmentVisibilityComponentServerFacet
    | SlayerScriptForwarderServerFacet
    | SlayerScriptServerFacet
    | SnapToTerrainComponentServerFacet
    | SocialComponentServerFacet
    | SpawnCapConstraintComponentServerFacet
    | SpawnerComponentServerFacet
    | SpawnerLifetimeManagerComponentServerFacet
    | SpawnerMetricsComponentServerFacet
    | SpectatedPlayerComponentServerFacet
    | SpectatorModeComponentServerFacet
    | SpellComponentServerFacet
    | SpellTargetIndicatorManagerComponentServerFacet
    | StaminaComponentServerFacet
    | StatMultiplierTableComponentServerFacet
    | StatusEffectsComponentServerFacet
    | StimulusComponentServerFacet
    | StorageComponentServerFacet
    | SurfaceAlignmentComponentServerFacet
    | TargetingComponentServerFacet
    | TemporaryAffiliationComponentServerFacet
    | TerrainConstraintComponentServerFacet
    | TerritoryComponentServerFacet
    | TerritoryDetectorComponentServerFacet
    | TerritoryGovernanceComponentServerFacet
    | TerritoryInteractorComponentServerFacet
    | TerritoryInterfaceComponentServerFacet
    | TerritoryProgressionComponentServerFacet
    | TimeComponentServerFacet
    | TimelineComponentServerFacet
    | TimelineControllerComponentServerFacet
    | TimeOfDayConstraintComponentServerFacet
    | TippingPoolComponentServerFacet
    | TrackableComponentServerFacet
    | TradingPostComponentServerFacet
    | TransactionComponentServerFacet
    | TranslationComponentServerFacet
    | TraversalComponentServerFacet
    | TriggerAreaEntityComponentServerFacet
    | TriggerAreaPlayerCutsceneComponentServerFacet
    | TriggerEntityComponentServerFacet
    | TurretComponentServerFacet
    | TutorialAIComponentServerFacet
    | TutorialComponentServerFacet
    | TwitchComponentServerFacet
    | UIActionManagerComponentServerFacet
    | UITriggerEventComponentServerFacet
    | UnstuckComponentServerFacet
    | ValidateTerrainComponentServerFacet
    | VariationDataComponentServerFacet
    | VitalsComponentServerFacet
    | VoiceChatComponentServerFacet
    | VoidDestroyerComponentServerFacet
    | VoidDestroyerEyeComponentServerFacet
    | WarboardComponentServerFacet
    | WarCampComponentServerFacet
    | WarDataComponentServerFacet
    | WaterLevelComponentServerFacet
    | WaypointsComponentServerFacet
    | WeaponAccuracyComponentServerFacet
    | WhisperPlayerComponentServerFacet
    | WorldBoundTrackerComponentServerFacet
}
export function isFacetedComponent(obj: any): obj is FacetedComponent {
  return obj?.['__type'] === 'FacetedComponent'
}

export interface EditorListener {
  __type: string
}
export function isEditorListener(obj: any): obj is EditorListener {
  return obj?.['__type'] === 'EditorListener'
}

export interface Transform {
  __type: string
  __value: unknown
}
export function isTransform(obj: any): obj is Transform {
  return obj?.['__type'] === 'Transform'
}

export interface $undefined {
  'rotation/scale': Array<number>
  translation: Array<number>
}
export function is$undefined(obj: any): obj is $undefined {
  return obj?.['__type'] === 'undefined'
}

export interface NavigationObstacleMeshComponent {
  __type: string
  baseclass1: FacetedComponent
  m_meshsource: number
  m_useconvexhull: boolean
  m_navarea: number
  m_shapeentities: Array<LocalEntityRef>
  m_rnrshapeasset: Asset
  m_registerwithnavmesh: boolean
}
export function isNavigationObstacleMeshComponent(obj: any): obj is NavigationObstacleMeshComponent {
  return obj?.['__type'] === 'NavigationObstacleMeshComponent'
}

export interface NavigationObstacleMeshComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isNavigationObstacleMeshComponentClientFacet(
  obj: any
): obj is NavigationObstacleMeshComponentClientFacet {
  return obj?.['__type'] === 'NavigationObstacleMeshComponentClientFacet'
}

export interface ClientFacet {
  __type: string
  baseclass1: Facet
}
export function isClientFacet(obj: any): obj is ClientFacet {
  return obj?.['__type'] === 'ClientFacet'
}

export interface Facet {
  __type: string
  baseclass1: EditorListener
}
export function isFacet(obj: any): obj is Facet {
  return obj?.['__type'] === 'Facet'
}

export interface NavigationObstacleMeshComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_navlinks: e876f68c_57d8_54f0_826c_9adc5d082850
}
export function isNavigationObstacleMeshComponentServerFacet(
  obj: any
): obj is NavigationObstacleMeshComponentServerFacet {
  return obj?.['__type'] === 'NavigationObstacleMeshComponentServerFacet'
}

export interface ServerFacet {
  __type: string
  baseclass1: Facet
}
export function isServerFacet(obj: any): obj is ServerFacet {
  return obj?.['__type'] === 'ServerFacet'
}

export interface e876f68c_57d8_54f0_826c_9adc5d082850 {
  __type: string
  element: NavigationLink
}
export function ise876f68c_57d8_54f0_826c_9adc5d082850(obj: any): obj is e876f68c_57d8_54f0_826c_9adc5d082850 {
  return obj?.['__type'] === 'e876f68c-57d8-54f0-826c-9adc5d082850'
}

export interface Asset {
  __type: string
  guid: string
  subId: string
  type: string
  hint: string
}
export function isAsset(obj: any): obj is Asset {
  return obj?.['__type'] === 'Asset'
}

export interface PositionInTheWorldComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPositionInTheWorldComponent(obj: any): obj is PositionInTheWorldComponent {
  return obj?.['__type'] === 'PositionInTheWorldComponent'
}

export interface PositionInTheWorldComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPositionInTheWorldComponentClientFacet(obj: any): obj is PositionInTheWorldComponentClientFacet {
  return obj?.['__type'] === 'PositionInTheWorldComponentClientFacet'
}

export interface PositionInTheWorldComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPositionInTheWorldComponentServerFacet(obj: any): obj is PositionInTheWorldComponentServerFacet {
  return obj?.['__type'] === 'PositionInTheWorldComponentServerFacet'
}

export interface AoiComponent {
  __type: string
  baseclass1: FacetedComponent
  m_aoigridcategory: number
  '0x6e9b5629': number
  m_slicephysicalradius: number
  m_additionalslicephysicalminradius: number
  m_isstaticslice: boolean
  m_slicetags: number
  m_slicespawnradius: number
  m_useuserdefinedspawnradius: boolean
  m_editorsliceviewradius: number
  m_editorslicephysicalradius: number
  m_editorslicespawnradius: number
  m_editoraoiradius: number
  m_editorisstaticslice: boolean
  'm_editorwillimpostor ': boolean
  m_editorisrequiredonserver: boolean
  m_editorrefreshbutton: boolean
}
export function isAoiComponent(obj: any): obj is AoiComponent {
  return obj?.['__type'] === 'AoiComponent'
}

export interface DataFlagsPerEntity {
  __type: string
  entitytodataflags: []
}
export function isDataFlagsPerEntity(obj: any): obj is DataFlagsPerEntity {
  return obj?.['__type'] === 'DataFlagsPerEntity'
}

export interface VitalsComponent {
  __type: string
  baseclass1: FacetedComponent
  m_rowreference: string
  m_ondeathevent: EventData
  m_ondeathsdoorevent: EventData
  m_statmultiplierentity: LocalEntityRef
  m_paperdollentity: LocalEntityRef
  m_characterattributeentity: LocalEntityRef
  m_placementblockerobjectentity: LocalEntityRef
  m_collisionfilterobjectentity: LocalEntityRef
  m_playerentity: LocalEntityRef
  m_staminaentity: LocalEntityRef
  m_gritentity: LocalEntityRef
  m_statuseffectentity: LocalEntityRef
  m_timeentity: LocalEntityRef
  m_debugapplyvitalsscale: boolean
}
export function isVitalsComponent(obj: any): obj is VitalsComponent {
  return obj?.['__type'] === 'VitalsComponent'
}

export interface VitalsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isVitalsComponentClientFacet(obj: any): obj is VitalsComponentClientFacet {
  return obj?.['__type'] === 'VitalsComponentClientFacet'
}

export interface VitalsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_dotdirection: boolean
  m_dottime: number
  m_suicidecooldown: number
}
export function isVitalsComponentServerFacet(obj: any): obj is VitalsComponentServerFacet {
  return obj?.['__type'] === 'VitalsComponentServerFacet'
}

export interface EventData {
  __type: string
  m_entityref: LocalEntityRef
  m_type: number
  m_applyrecursively: boolean
  m_localplayeronly: boolean
}
export function isEventData(obj: any): obj is EventData {
  return obj?.['__type'] === 'EventData'
}

export interface LocalEntityRef {
  __type: string
  entityid: EntityId
}
export function isLocalEntityRef(obj: any): obj is LocalEntityRef {
  return obj?.['__type'] === 'LocalEntityRef'
}

export interface DamageReceiverComponent {
  __type: string
  baseclass1: FacetedComponent
  m_ishitfrombehindminangle: number
  m_ishitbycritfrombehindminangle: number
  m_allowblock: boolean
  m_overrideobstructionchecktargetheightoffset: number
  m_impactdistancescale: number
  m_vitalscomponententity: LocalEntityRef
  m_socialcomponententity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
  m_buildableentity: LocalEntityRef
  m_playerentity: LocalEntityRef
  m_staminaentity: LocalEntityRef
  m_landclaimentity: LocalEntityRef
  m_territorydetectorentity: LocalEntityRef
  m_paperdollentity: LocalEntityRef
  m_nameentity: LocalEntityRef
  m_cameralockentity: LocalEntityRef
  m_playerhousingentity: LocalEntityRef
  m_ondamageevents: Array<EventData>
  m_ondamageeventscooldownseconds: number
  m_blockstabilitymin: number
  m_handlemeleehitdelayms: number
  m_isblockactive: boolean
  m_blockweaponslotalias: number
  m_entityname: string
  m_onlydamagablebyplayer: boolean
}
export function isDamageReceiverComponent(obj: any): obj is DamageReceiverComponent {
  return obj?.['__type'] === 'DamageReceiverComponent'
}

export interface DamageReceiverComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDamageReceiverComponentClientFacet(obj: any): obj is DamageReceiverComponentClientFacet {
  return obj?.['__type'] === 'DamageReceiverComponentClientFacet'
}

export interface DamageReceiverComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDamageReceiverComponentServerFacet(obj: any): obj is DamageReceiverComponentServerFacet {
  return obj?.['__type'] === 'DamageReceiverComponentServerFacet'
}

export interface BuildableController {
  __type: string
  baseclass1: FacetedComponent
  m_initialstate: number
  m_canbepickedup: boolean
  m_ignoreterritoryrestriction: boolean
  m_placementruleterritorymatchesguild: boolean
  m_placementruleprotectionmatchesguild: boolean
  m_placementrulecanplaceinprotectedarea: boolean
  m_emptycontaineruponunclaimed: boolean
  m_destroyupgradeonruin: boolean
  m_resetonallresourcesapplied: boolean
  m_triggerbuildergameeventonallresourcesapplied: boolean
  m_requiresgamemodeplacementvalidation: boolean
  m_buildergameeventonallresourcesapplied: string
  m_placementobstructionentity: LocalEntityRef
  m_playerteleportentity: LocalEntityRef
  m_ruinhealth: number
  m_containerentities: Array<LocalEntityRef>
  m_ghostparententity: LocalEntityRef
  m_ghostmaterialentities: Array<LocalEntityRef>
  m_spawnobjectprefabreference: Asset
  m_destroyedprefabreference: Asset
  m_upgradeblueprintid: string
  m_unclaimedstates: Array<EventData>
  m_onunclaimedstateentertransitionevents: Array<BuildableStateTransitionEvents>
  m_placingstates: Array<EventData>
  m_foundationstates: Array<FoundationState>
  m_completionstates: Array<EventData>
  m_oncompletionstateentertransitionevents: Array<BuildableStateTransitionEvents>
  m_damagestates: Array<DamageState>
  m_ruinstates: Array<RuinState>
  m_upgradestates: Array<EventData>
  m_upgradecompletestates: []
  m_structurename: string
  m_traversaloverridebound: EntityId
  m_isdeployable: boolean
  m_issiegeweapon: boolean
  m_keepownershipwhenunclaimed: boolean
}
export function isBuildableController(obj: any): obj is BuildableController {
  return obj?.['__type'] === 'BuildableController'
}

export interface BuildableControllerClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_removaltriggerarea: LocalEntityRef
  m_upgradetimesetevents: Array<EventData>
  m_obstructionwarningdistance: number
}
export function isBuildableControllerClientFacet(obj: any): obj is BuildableControllerClientFacet {
  return obj?.['__type'] === 'BuildableControllerClientFacet'
}

export interface BuildableControllerServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_ownershipentity: LocalEntityRef
  m_lootdroppositionentity: LocalEntityRef
  m_allowrepairfromruin: boolean
  m_repairfromruincompletepercentage: number
  m_upgradeevents: Array<EventData>
  m_downgradeevents: []
}
export function isBuildableControllerServerFacet(obj: any): obj is BuildableControllerServerFacet {
  return obj?.['__type'] === 'BuildableControllerServerFacet'
}

export interface DeteriorationComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDeteriorationComponent(obj: any): obj is DeteriorationComponent {
  return obj?.['__type'] === 'DeteriorationComponent'
}

export interface DeteriorationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDeteriorationComponentClientFacet(obj: any): obj is DeteriorationComponentClientFacet {
  return obj?.['__type'] === 'DeteriorationComponentClientFacet'
}

export interface DeteriorationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_ticktime: number
  m_healthpertick: number
}
export function isDeteriorationComponentServerFacet(obj: any): obj is DeteriorationComponentServerFacet {
  return obj?.['__type'] === 'DeteriorationComponentServerFacet'
}

export interface ContainerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_rowreference: string
  m_initialcontainersize: number
  m_container: []
  m_itemclass: SBItemClass
  m_oncontaineremptied: Array<EventData>
  m_lockuponemptied: boolean
  m_candropfromcontainer: boolean
  m_canreceivebonusencumbrance: boolean
  m_cannotreceiveitems: boolean
  m_clearcontainerondeactivate: boolean
  m_checkpaperdoll: boolean
  m_currentencumbrance: number
  m_emptyitem: null
  m_ownershipentity: LocalEntityRef
  m_playertradeentity: LocalEntityRef
}
export function isContainerComponent(obj: any): obj is ContainerComponent {
  return obj?.['__type'] === 'ContainerComponent'
}

export interface ContainerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isContainerComponentClientFacet(obj: any): obj is ContainerComponentClientFacet {
  return obj?.['__type'] === 'ContainerComponentClientFacet'
}

export interface ContainerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_onlyupdateself: boolean
  m_tradedistancesquared: number
  m_detectionvolume: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DetectionVolumeComponent__void__
  m_containerchanges: []
  m_updateeverything: boolean
}
export function isContainerComponentServerFacet(obj: any): obj is ContainerComponentServerFacet {
  return obj?.['__type'] === 'ContainerComponentServerFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DetectionVolumeComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DetectionVolumeComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DetectionVolumeComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::DetectionVolumeComponent>(void)>'
  )
}

export interface LocalComponentRefBase {
  __type: string
  entityid: EntityId
  interfacetype: string
}
export function isLocalComponentRefBase(obj: any): obj is LocalComponentRefBase {
  return obj?.['__type'] === 'LocalComponentRefBase'
}

export interface SBItemClass {
  __type: string
  m_itemclasses: Array<number>
  '0x0cd3b39f': fef7e31b_4c08_58d0_aa01_3925bf34191b | $$6111a352_6737_5b38_a7cb_e6f30854b36a
}
export function isSBItemClass(obj: any): obj is SBItemClass {
  return obj?.['__type'] === 'SBItemClass'
}

export interface fef7e31b_4c08_58d0_aa01_3925bf34191b {
  __type: string
  __value: string
}
export function isfef7e31b_4c08_58d0_aa01_3925bf34191b(obj: any): obj is fef7e31b_4c08_58d0_aa01_3925bf34191b {
  return obj?.['__type'] === 'fef7e31b-4c08-58d0-aa01-3925bf34191b'
}

export interface TerritoryDetectorComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTerritoryDetectorComponent(obj: any): obj is TerritoryDetectorComponent {
  return obj?.['__type'] === 'TerritoryDetectorComponent'
}

export interface TerritoryDetectorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTerritoryDetectorComponentClientFacet(obj: any): obj is TerritoryDetectorComponentClientFacet {
  return obj?.['__type'] === 'TerritoryDetectorComponentClientFacet'
}

export interface TerritoryDetectorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_ownershipentities: Array<LocalEntityRef>
  m_ignoreguildupdates: boolean
}
export function isTerritoryDetectorComponentServerFacet(obj: any): obj is TerritoryDetectorComponentServerFacet {
  return obj?.['__type'] === 'TerritoryDetectorComponentServerFacet'
}

export interface ParticleComponent {
  __type: string
  baseclass1: AZ__Component
  particle: ParticleEmitterSettings
  '0x5ad890e0': AssetId
  meshparticle: Array<ParticleEmitBoneLayer>
  'load emitter on activate': boolean
}
export function isParticleComponent(obj: any): obj is ParticleComponent {
  return obj?.['__type'] === 'ParticleComponent'
}

export interface ParticleEmitterSettings {
  __type: string
  visible: boolean
  enable: boolean
  attachtomesh: boolean
  attachtodissolvingedge: boolean
  selectedemitter: string
  color: Color
  'alpha scale': number
  'pre-roll': boolean
  'particle count scale': number
  'time scale': number
  'pulse period': number
  globalsizescale: number
  particlesizex: number
  particlesizey: number
  particlesizez: number
  particlesizerandom: number
  'speed scale': number
  strength: number
  'ignore rotation': boolean
  'not attached': boolean
  'register by bounding box': boolean
  'use lod': boolean
  'target entity': EntityId
  'gpu edge dissolve target entity': EntityId
  'enable audio': boolean
  'audio rtpc': string
  'view distance multiplier': number
  'use visarea': boolean
  'accept decals': boolean
  'accept snow': boolean
  'accept silhouette': boolean
  'render always': boolean
  'kill on deactivate': boolean
}
export function isParticleEmitterSettings(obj: any): obj is ParticleEmitterSettings {
  return obj?.['__type'] === 'ParticleEmitterSettings'
}

export interface Color {
  __type: string
  __value: Array<number>
}
export function isColor(obj: any): obj is Color {
  return obj?.['__type'] === 'Color'
}

export interface AssetId {
  __type: string
  guid: string
  subid: number
}
export function isAssetId(obj: any): obj is AssetId {
  return obj?.['__type'] === 'AssetId'
}

export interface PrefabSpawnerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_sliceasset: Asset
  m_slicevariant: string
  m_aliasasset: Asset
  m_editprefab: boolean
  m_showprefab: boolean
  m_editprefabbutton: boolean
  m_isclientauthoratative: boolean
  m_persistprefab: boolean
  m_spawnoninitialize: boolean
  m_spawnontrigger: boolean
  m_spawnonlyonce: boolean
  m_removewhenspawnerdestroyed: boolean
  m_respawnafterdeath: boolean
  m_respawnafterreload: boolean
  m_cooldownafterdespawn: boolean
  m_cooldownafterconstraintfail: boolean
  m_minrespawncooldown: number
  m_maxrespawncooldown: number
  m_ignorecooldownoverride: boolean
  m_fireeventsifalldestroyed: boolean
  m_ishouseinstanceloot: boolean
  m_slicedestroyedevents: Array<EventData>
  m_slicespawnevents: Array<EventData>
  m_isvegetationsliceasset: boolean
  m_inheritraididduringsiegeonly: boolean
  m_spawnsinheritparentscale: boolean
  m_iswatersliceasset: boolean
  m_prefabpersistencegdeid: GDEID
  m_prefabvisualrootentityid: EntityId
}
export function isPrefabSpawnerComponent(obj: any): obj is PrefabSpawnerComponent {
  return obj?.['__type'] === 'PrefabSpawnerComponent'
}

export interface PrefabSpawnerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPrefabSpawnerComponentClientFacet(obj: any): obj is PrefabSpawnerComponentClientFacet {
  return obj?.['__type'] === 'PrefabSpawnerComponentClientFacet'
}

export interface PrefabSpawnerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_ownershipentity: LocalEntityRef
  m_maxtrackedrefs: number
  '0x63a3a5cb': boolean
  m_checkforlastdamagebyactor: boolean
  '0x10ec3413': boolean
}
export function isPrefabSpawnerComponentServerFacet(obj: any): obj is PrefabSpawnerComponentServerFacet {
  return obj?.['__type'] === 'PrefabSpawnerComponentServerFacet'
}

export interface GDEID {
  __type: string
  id: number
}
export function isGDEID(obj: any): obj is GDEID {
  return obj?.['__type'] === 'GDEID'
}

export interface TriggerEntityComponent {
  __type: string
  baseclass1: FacetedComponent
  m_entitiestotrigger: Array<EventData>
  m_triggername: string
}
export function isTriggerEntityComponent(obj: any): obj is TriggerEntityComponent {
  return obj?.['__type'] === 'TriggerEntityComponent'
}

export interface TriggerEntityComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTriggerEntityComponentClientFacet(obj: any): obj is TriggerEntityComponentClientFacet {
  return obj?.['__type'] === 'TriggerEntityComponentClientFacet'
}

export interface TriggerEntityComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTriggerEntityComponentServerFacet(obj: any): obj is TriggerEntityComponentServerFacet {
  return obj?.['__type'] === 'TriggerEntityComponentServerFacet'
}

export interface BuildableStateComponent {
  __type: string
  baseclass1: FacetedComponent
  m_onstateenter: EventData
  m_onstateexit: EventData
}
export function isBuildableStateComponent(obj: any): obj is BuildableStateComponent {
  return obj?.['__type'] === 'BuildableStateComponent'
}

export interface BuildableStateComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBuildableStateComponentClientFacet(obj: any): obj is BuildableStateComponentClientFacet {
  return obj?.['__type'] === 'BuildableStateComponentClientFacet'
}

export interface BuildableStateComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBuildableStateComponentServerFacet(obj: any): obj is BuildableStateComponentServerFacet {
  return obj?.['__type'] === 'BuildableStateComponentServerFacet'
}

export interface DetectableObjectComponent {
  __type: string
  baseclass1: FacetedComponent
  m_center: Array<number>
  m_shape: QueryShapeBox | QueryShapeCapsule | QueryShapeSphere | QueryShapeCylinder
  m_strfilter: string
}
export function isDetectableObjectComponent(obj: any): obj is DetectableObjectComponent {
  return obj?.['__type'] === 'DetectableObjectComponent'
}

export interface DetectableObjectComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDetectableObjectComponentClientFacet(obj: any): obj is DetectableObjectComponentClientFacet {
  return obj?.['__type'] === 'DetectableObjectComponentClientFacet'
}

export interface DetectableObjectComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDetectableObjectComponentServerFacet(obj: any): obj is DetectableObjectComponentServerFacet {
  return obj?.['__type'] === 'DetectableObjectComponentServerFacet'
}

export interface QueryShapeBox {
  __type: string
  baseclass1: QueryShapeBase
  m_box: Array<number>
}
export function isQueryShapeBox(obj: any): obj is QueryShapeBox {
  return obj?.['__type'] === 'QueryShapeBox'
}

export interface QueryShapeBase {
  __type: string
}
export function isQueryShapeBase(obj: any): obj is QueryShapeBase {
  return obj?.['__type'] === 'QueryShapeBase'
}

export interface OwnershipComponent {
  __type: string
  baseclass1: FacetedComponent
  m_canbepublic: boolean
  m_canbeprivate: boolean
  m_canbeguildrestricted: boolean
  m_canberaidrestricted: boolean
  m_initialstructurename: string
  m_initialpermissionrule: number
  m_territoryentityref: LocalEntityRef
  m_ownershippermissiontypetest: OwnershipPermissionTypeData
  m_defaultsecuritylevel: number
}
export function isOwnershipComponent(obj: any): obj is OwnershipComponent {
  return obj?.['__type'] === 'OwnershipComponent'
}

export interface OwnershipComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_isownershown: boolean
  m_showterritoryowner: boolean
}
export function isOwnershipComponentClientFacet(obj: any): obj is OwnershipComponentClientFacet {
  return obj?.['__type'] === 'OwnershipComponentClientFacet'
}

export interface OwnershipComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_shouldsyncownerfactiondata: boolean
  m_needsteamalignmentinfoonclient: boolean
  m_needsfullguildinfoonclient: boolean
  m_needsfullplayerinfoonclient: boolean
}
export function isOwnershipComponentServerFacet(obj: any): obj is OwnershipComponentServerFacet {
  return obj?.['__type'] === 'OwnershipComponentServerFacet'
}

export interface OwnershipPermissionTypeData {
  __type: string
  m_hack: boolean
}
export function isOwnershipPermissionTypeData(obj: any): obj is OwnershipPermissionTypeData {
  return obj?.['__type'] === 'OwnershipPermissionTypeData'
}

export interface AssemblyComponent {
  __type: string
  baseclass1: FacetedComponent
  m_craftingstationreference: CraftingStationPropertiesReference
  m_chargecraftingfee: boolean
}
export function isAssemblyComponent(obj: any): obj is AssemblyComponent {
  return obj?.['__type'] === 'AssemblyComponent'
}

export interface AssemblyComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_buildableentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
}
export function isAssemblyComponentClientFacet(obj: any): obj is AssemblyComponentClientFacet {
  return obj?.['__type'] === 'AssemblyComponentClientFacet'
}

export interface AssemblyComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAssemblyComponentServerFacet(obj: any): obj is AssemblyComponentServerFacet {
  return obj?.['__type'] === 'AssemblyComponentServerFacet'
}

export interface CraftingStationPropertiesReference {
  __type: string
  m_craftingstationasset: Asset
  m_craftingstationentry: string
}
export function isCraftingStationPropertiesReference(obj: any): obj is CraftingStationPropertiesReference {
  return obj?.['__type'] === 'CraftingStationPropertiesReference'
}

export interface BoxShapeComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: BoxShapeConfig
}
export function isBoxShapeComponent(obj: any): obj is BoxShapeComponent {
  return obj?.['__type'] === 'BoxShapeComponent'
}

export interface BoxShapeConfig {
  __type: string
  dimensions: Array<number>
}
export function isBoxShapeConfig(obj: any): obj is BoxShapeConfig {
  return obj?.['__type'] === 'BoxShapeConfig'
}

export interface Interact {
  __type: string
  baseclass1: FacetedComponent
  m_condition: null | GatherableCondition | DefaultCondition
  m_interactnameentity: LocalEntityRef
  m_buildablecontrollerentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
  m_territoryentity: LocalEntityRef
  m_cameraentity: LocalEntityRef
  m_homepointentity: LocalEntityRef
  m_allowrootsearchforhomepoint: boolean
  m_interactoptionentities: Array<InteractOptionEntityRef>
  m_numberofinteractorsallowed: number
  m_onstartinteractionevents: Array<EventData>
  m_onendinteractionevents: Array<EventData>
  m_interactrangesq: number
  m_requireslineofsight: boolean
  m_interacttagstring: string
  m_interactonlyonquest: boolean
  m_requiredinteractarc: boolean
  m_interactarc: number
  m_logfailedinteractions: boolean
  m_requiredachievementoverride: string
}
export function isInteract(obj: any): obj is Interact {
  return obj?.['__type'] === 'Interact'
}

export interface InteractClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_usemarkerinteract: boolean
  m_passinteractortoentity: LocalEntityRef
  m_passinteractortoentitynoexecute: LocalEntityRef
}
export function isInteractClientFacet(obj: any): obj is InteractClientFacet {
  return obj?.['__type'] === 'InteractClientFacet'
}

export interface InteractServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isInteractServerFacet(obj: any): obj is InteractServerFacet {
  return obj?.['__type'] === 'InteractServerFacet'
}

export interface InteractOptionEntityRef {
  __type: string
  m_interactentityref: LocalEntityRef
  m_interactoptions: Array<LocalInteractOptionRef>
}
export function isInteractOptionEntityRef(obj: any): obj is InteractOptionEntityRef {
  return obj?.['__type'] === 'InteractOptionEntityRef'
}

export interface LocalInteractOptionRef {
  __type: string
  m_interactoption: string
  m_showonunifiedinteractui: boolean
}
export function isLocalInteractOptionRef(obj: any): obj is LocalInteractOptionRef {
  return obj?.['__type'] === 'LocalInteractOptionRef'
}

export interface TriggerAreaComponent {
  __type: string
  baseclass1: AZ__Component
  baseclass2: NetBindable
  triggeronce: boolean
  activatedby: number
  specificinteractentities: Array<EntityId>
  staticposition: boolean
  onlyactiveforlocalplayer: boolean
  relevanceradius: number
  requiredtags: Array<Crc32>
  excludedtags: []
}
export function isTriggerAreaComponent(obj: any): obj is TriggerAreaComponent {
  return obj?.['__type'] === 'TriggerAreaComponent'
}

export interface NetBindable {
  __type: string
  m_isnetsyncenabled: boolean
}
export function isNetBindable(obj: any): obj is NetBindable {
  return obj?.['__type'] === 'NetBindable'
}

export interface MeshComponent {
  __type: string
  baseclass1: AZ__Component
  'static mesh render node': MeshComponentRenderNode
  'load mesh on activate': boolean
}
export function isMeshComponent(obj: any): obj is MeshComponent {
  return obj?.['__type'] === 'MeshComponent'
}

export interface MeshComponentRenderNode {
  __type: string
  visible: boolean
  'static mesh': Asset
  'material override': AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  'material overcoat': AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  'material override asset': Asset
  'material overcoat asset': Asset
  'render options': MeshRenderOptions
}
export function isMeshComponentRenderNode(obj: any): obj is MeshComponentRenderNode {
  return obj?.['__type'] === 'MeshComponentRenderNode'
}

export interface AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<LmbrCentral::MaterialAsset>'
}

export interface SimpleAssetReferenceBase {
  __type: string
  assetpath: string
}
export function isSimpleAssetReferenceBase(obj: any): obj is SimpleAssetReferenceBase {
  return obj?.['__type'] === 'SimpleAssetReferenceBase'
}

export interface MeshRenderOptions {
  __type: string
  opacity: number
  crossfadetime: number
  maxviewdistance: number
  editorcomputedviewdistance: number | string
  viewdistancemultiplier: number
  lodratio: number
  castshadows: boolean
  usevisareas: boolean
  rainoccluder: boolean
  affectdynamicwater: boolean
  receivewindbasedonmaterial: boolean
  receivewind: boolean
  windbendscale: number
  acceptdecals: boolean
  acceptsnow: boolean
  acceptsand: boolean
  acceptsilhouette: boolean
  affectnavmesh: boolean
  visibilityoccluder: boolean
  dynamicmesh: boolean
  alwaysrender: boolean
  lod_minscreenpct: Array<number>
  sorttype: number
  shouldmerge: boolean
  forcemerge: boolean
  fadeenabled: boolean
  primaryinhierarchy: boolean
  usemanualviewdistance: boolean
}
export function isMeshRenderOptions(obj: any): obj is MeshRenderOptions {
  return obj?.['__type'] === 'MeshRenderOptions'
}

export interface MeshColliderComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isMeshColliderComponent(obj: any): obj is MeshColliderComponent {
  return obj?.['__type'] === 'MeshColliderComponent'
}

export interface StaticPhysicsComponent {
  __type: string
  baseclass1: PhysicsComponent
  configuration: StaticPhysicsConfig
  collisionfilter: string
}
export function isStaticPhysicsComponent(obj: any): obj is StaticPhysicsComponent {
  return obj?.['__type'] === 'StaticPhysicsComponent'
}

export interface PhysicsComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isPhysicsComponent(obj: any): obj is PhysicsComponent {
  return obj?.['__type'] === 'PhysicsComponent'
}

export interface StaticPhysicsConfig {
  __type: string
  enabledinitially: boolean
  interactswithtriggers: boolean
}
export function isStaticPhysicsConfig(obj: any): obj is StaticPhysicsConfig {
  return obj?.['__type'] === 'StaticPhysicsConfig'
}

export interface DetectionVolumeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_center: Array<number>
  m_shape:
    | QueryShapeBox
    | QueryShapeSphere
    | null
    | QueryShapeCylinder
    | QueryShapeAabb
    | QueryShapeCapsule
    | $$44b34b6c_63b0_443c_beee_272ea4106edc
  m_shapeentityid: EntityId
  m_strfilter: string
  m_ghostallquery: boolean
  m_enablelyshapedetection: boolean
  m_collisionfilteroverride: d71fb08f_8229_5a55_a084_15787bdb9764
  m_ignoreheight: boolean
  '0x453b3f9b': boolean
}
export function isDetectionVolumeComponent(obj: any): obj is DetectionVolumeComponent {
  return obj?.['__type'] === 'DetectionVolumeComponent'
}

export interface DetectionVolumeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDetectionVolumeComponentClientFacet(obj: any): obj is DetectionVolumeComponentClientFacet {
  return obj?.['__type'] === 'DetectionVolumeComponentClientFacet'
}

export interface DetectionVolumeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_isrnrghost: boolean
  m_updateintervalwhenscaling: number
  '0x0f4784c9': boolean
}
export function isDetectionVolumeComponentServerFacet(obj: any): obj is DetectionVolumeComponentServerFacet {
  return obj?.['__type'] === 'DetectionVolumeComponentServerFacet'
}

export interface d71fb08f_8229_5a55_a084_15787bdb9764 {
  __type: string
  __value: string
}
export function isd71fb08f_8229_5a55_a084_15787bdb9764(obj: any): obj is d71fb08f_8229_5a55_a084_15787bdb9764 {
  return obj?.['__type'] === 'd71fb08f-8229-5a55-a084-15787bdb9764'
}

export interface ValidateTerrainComponent {
  __type: string
  baseclass1: FacetedComponent
  m_useplacementoverride: boolean
  m_placingsettings: TerrainValidationData
  m_usesnappedtooverride: boolean
  m_snappedtosettings: TerrainValidationData
}
export function isValidateTerrainComponent(obj: any): obj is ValidateTerrainComponent {
  return obj?.['__type'] === 'ValidateTerrainComponent'
}

export interface ValidateTerrainComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isValidateTerrainComponentClientFacet(obj: any): obj is ValidateTerrainComponentClientFacet {
  return obj?.['__type'] === 'ValidateTerrainComponentClientFacet'
}

export interface ValidateTerrainComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isValidateTerrainComponentServerFacet(obj: any): obj is ValidateTerrainComponentServerFacet {
  return obj?.['__type'] === 'ValidateTerrainComponentServerFacet'
}

export interface TerrainValidationData {
  __type: string
  m_aboveminpointvalidthreshold: number
  m_belowminpointvalidthreshold: number
}
export function isTerrainValidationData(obj: any): obj is TerrainValidationData {
  return obj?.['__type'] === 'TerrainValidationData'
}

export interface PlacementObstructionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_detectionentities: Array<LocalEntityRef>
  m_spawnpointentity: LocalEntityRef
  m_removegatherables: boolean
  m_depletegatherables: boolean
  m_unallowtype: number
  m_tagtoallow: Array<string>
  m_tagstodisallow: []
  m_hlcdetectorname: string
  m_maxverticaldeltatoplacingentity: number
  m_maxverticalangletoplacingentity: number
}
export function isPlacementObstructionComponent(obj: any): obj is PlacementObstructionComponent {
  return obj?.['__type'] === 'PlacementObstructionComponent'
}

export interface PlacementObstructionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlacementObstructionComponentClientFacet(obj: any): obj is PlacementObstructionComponentClientFacet {
  return obj?.['__type'] === 'PlacementObstructionComponentClientFacet'
}

export interface PlacementObstructionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlacementObstructionComponentServerFacet(obj: any): obj is PlacementObstructionComponentServerFacet {
  return obj?.['__type'] === 'PlacementObstructionComponentServerFacet'
}

export interface DefenseCollisionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_extentx: number
  m_extenty: number
  m_extentz: number
}
export function isDefenseCollisionComponent(obj: any): obj is DefenseCollisionComponent {
  return obj?.['__type'] === 'DefenseCollisionComponent'
}

export interface DefenseCollisionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_renderenabled: boolean
}
export function isDefenseCollisionComponentClientFacet(obj: any): obj is DefenseCollisionComponentClientFacet {
  return obj?.['__type'] === 'DefenseCollisionComponentClientFacet'
}

export interface DefenseCollisionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDefenseCollisionComponentServerFacet(obj: any): obj is DefenseCollisionComponentServerFacet {
  return obj?.['__type'] === 'DefenseCollisionComponentServerFacet'
}

export interface AreaStatusEffectComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAreaStatusEffectComponent(obj: any): obj is AreaStatusEffectComponent {
  return obj?.['__type'] === 'AreaStatusEffectComponent'
}

export interface AreaStatusEffectComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAreaStatusEffectComponentClientFacet(obj: any): obj is AreaStatusEffectComponentClientFacet {
  return obj?.['__type'] === 'AreaStatusEffectComponentClientFacet'
}

export interface AreaStatusEffectComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_detectionentity: LocalEntityRef
  m_addstatuseffects: Array<EffectData>
  m_removestatuseffects: Array<EffectData>
  m_removeonexit: boolean
  m_initialdelayseconds: number
  m_reapplicationdelayseconds: number
  m_inheritstatuseffects: boolean
  m_detectedtargettype: number
}
export function isAreaStatusEffectComponentServerFacet(obj: any): obj is AreaStatusEffectComponentServerFacet {
  return obj?.['__type'] === 'AreaStatusEffectComponentServerFacet'
}

export interface EffectData {
  __type: string
  m_effectid: string
}
export function isEffectData(obj: any): obj is EffectData {
  return obj?.['__type'] === 'EffectData'
}

export interface QueryShapeSphere {
  __type: string
  baseclass1: QueryShapeBase
  m_radius: number
}
export function isQueryShapeSphere(obj: any): obj is QueryShapeSphere {
  return obj?.['__type'] === 'QueryShapeSphere'
}

export interface AlignToTerrainComponent {
  __type: string
  baseclass1: FacetedComponent
  m_skinnedmeshentityid: EntityId
  m_maxangledegsforward: number
  m_maxangledegslateral: number
  m_alignmentmode: number
}
export function isAlignToTerrainComponent(obj: any): obj is AlignToTerrainComponent {
  return obj?.['__type'] === 'AlignToTerrainComponent'
}

export interface AlignToTerrainComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAlignToTerrainComponentClientFacet(obj: any): obj is AlignToTerrainComponentClientFacet {
  return obj?.['__type'] === 'AlignToTerrainComponentClientFacet'
}

export interface AlignToTerrainComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAlignToTerrainComponentServerFacet(obj: any): obj is AlignToTerrainComponentServerFacet {
  return obj?.['__type'] === 'AlignToTerrainComponentServerFacet'
}

export interface DelayedEventComponent {
  __type: string
  baseclass1: FacetedComponent
  m_eventdata: EventData
  m_timedelayseconds: number
  m_startdelayoninit: boolean
  m_startdelayontrigger: boolean
  m_executeeventonreplicate: boolean
}
export function isDelayedEventComponent(obj: any): obj is DelayedEventComponent {
  return obj?.['__type'] === 'DelayedEventComponent'
}

export interface DelayedEventComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDelayedEventComponentClientFacet(obj: any): obj is DelayedEventComponentClientFacet {
  return obj?.['__type'] === 'DelayedEventComponentClientFacet'
}

export interface DelayedEventComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDelayedEventComponentServerFacet(obj: any): obj is DelayedEventComponentServerFacet {
  return obj?.['__type'] === 'DelayedEventComponentServerFacet'
}

export interface TemporaryAffiliationComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTemporaryAffiliationComponent(obj: any): obj is TemporaryAffiliationComponent {
  return obj?.['__type'] === 'TemporaryAffiliationComponent'
}

export interface AudioProxyComponent {
  __type: string
  baseclass1: AZ__Component | FacetedComponent
  'transform tolerance': number
  'occlusion ignore radius': number
  'occlusion ignore entity': boolean
  'occlusion ignore entireentity': boolean
  '0x7601f569': boolean
  m_skinnedmeshentity: LocalEntityRef
}
export function isAudioProxyComponent(obj: any): obj is AudioProxyComponent {
  return obj?.['__type'] === 'AudioProxyComponent'
}

export interface AudioPreloadComponent {
  __type: string
  baseclass1: AZ__Component
  'preload name': string
  'load type': number
}
export function isAudioPreloadComponent(obj: any): obj is AudioPreloadComponent {
  return obj?.['__type'] === 'AudioPreloadComponent'
}

export interface AudioSwitchComponent {
  __type: string
  baseclass1: AZ__Component
  'switch name': string
  'state name': string
}
export function isAudioSwitchComponent(obj: any): obj is AudioSwitchComponent {
  return obj?.['__type'] === 'AudioSwitchComponent'
}

export interface AudioTriggerComponent {
  __type: string
  baseclass1: AZ__Component
  'play trigger': string
  'stop trigger': string
  'obstruction type': number
  'plays immediately': boolean
  'send finished event': boolean
  'variationcomponent linked': boolean
  'audio plays out on deactivate': boolean
  'unload preload on completion': boolean
}
export function isAudioTriggerComponent(obj: any): obj is AudioTriggerComponent {
  return obj?.['__type'] === 'AudioTriggerComponent'
}

export interface AudioRtpcComponent {
  __type: string
  baseclass1: AZ__Component
  'rtpc name': string
}
export function isAudioRtpcComponent(obj: any): obj is AudioRtpcComponent {
  return obj?.['__type'] === 'AudioRtpcComponent'
}

export interface AudioEnvironmentComponent {
  __type: string
  baseclass1: AZ__Component
  'environment name': string
}
export function isAudioEnvironmentComponent(obj: any): obj is AudioEnvironmentComponent {
  return obj?.['__type'] === 'AudioEnvironmentComponent'
}

export interface AzFramework__ScriptComponent {
  __type: string
  baseclass1: AZ__Component
  baseclass2: NetBindable
  contextid: number
  properties: ScriptPropertyGroup
  name: string
  id: string
  script: Asset
  isrunonserver: boolean
  isrunonclient: boolean
}
export function isAzFramework__ScriptComponent(obj: any): obj is AzFramework__ScriptComponent {
  return obj?.['__type'] === 'AzFramework::ScriptComponent'
}

export interface ScriptPropertyGroup {
  __type: string
  name: string
  properties: Array<
    | AzFramework__ScriptPropertyString
    | AzFramework__ScriptPropertyNumber
    | AzFramework__ScriptPropertyBoolean
    | AzFramework__ScriptPropertyGenericClass
    | AZ__ScriptPropertyGenericClassArray
    | AzFramework__ScriptPropertyStringArray
  >
  groups: Array<ScriptPropertyGroup>
}
export function isScriptPropertyGroup(obj: any): obj is ScriptPropertyGroup {
  return obj?.['__type'] === 'ScriptPropertyGroup'
}

export interface AzFramework__ScriptPropertyString {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  value: string
}
export function isAzFramework__ScriptPropertyString(obj: any): obj is AzFramework__ScriptPropertyString {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyString'
}

export interface AzFramework__ScriptProperty {
  __type: string
  id: number
  name: string
}
export function isAzFramework__ScriptProperty(obj: any): obj is AzFramework__ScriptProperty {
  return obj?.['__type'] === 'AzFramework::ScriptProperty'
}

export interface AzFramework__ScriptPropertyNumber {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  value: number
}
export function isAzFramework__ScriptPropertyNumber(obj: any): obj is AzFramework__ScriptPropertyNumber {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyNumber'
}

export interface AzFramework__ScriptPropertyBoolean {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  value: boolean
}
export function isAzFramework__ScriptPropertyBoolean(obj: any): obj is AzFramework__ScriptPropertyBoolean {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyBoolean'
}

export interface DestroyGDEComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDestroyGDEComponent(obj: any): obj is DestroyGDEComponent {
  return obj?.['__type'] === 'DestroyGDEComponent'
}

export interface DestroyGDEComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDestroyGDEComponentClientFacet(obj: any): obj is DestroyGDEComponentClientFacet {
  return obj?.['__type'] === 'DestroyGDEComponentClientFacet'
}

export interface DestroyGDEComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDestroyGDEComponentServerFacet(obj: any): obj is DestroyGDEComponentServerFacet {
  return obj?.['__type'] === 'DestroyGDEComponentServerFacet'
}

export interface GlobalMapDataManagerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGlobalMapDataManagerComponent(obj: any): obj is GlobalMapDataManagerComponent {
  return obj?.['__type'] === 'GlobalMapDataManagerComponent'
}

export interface GlobalMapDataManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGlobalMapDataManagerComponentClientFacet(obj: any): obj is GlobalMapDataManagerComponentClientFacet {
  return obj?.['__type'] === 'GlobalMapDataManagerComponentClientFacet'
}

export interface GlobalMapDataManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGlobalMapDataManagerComponentServerFacet(obj: any): obj is GlobalMapDataManagerComponentServerFacet {
  return obj?.['__type'] === 'GlobalMapDataManagerComponentServerFacet'
}

export interface LandClaimManagerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isLandClaimManagerComponent(obj: any): obj is LandClaimManagerComponent {
  return obj?.['__type'] === 'LandClaimManagerComponent'
}

export interface LandClaimManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isLandClaimManagerComponentClientFacet(obj: any): obj is LandClaimManagerComponentClientFacet {
  return obj?.['__type'] === 'LandClaimManagerComponentClientFacet'
}

export interface LandClaimManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isLandClaimManagerComponentServerFacet(obj: any): obj is LandClaimManagerComponentServerFacet {
  return obj?.['__type'] === 'LandClaimManagerComponentServerFacet'
}

export interface AoiComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAoiComponentClientFacet(obj: any): obj is AoiComponentClientFacet {
  return obj?.['__type'] === 'AoiComponentClientFacet'
}

export interface AoiComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_ignoresgridfilter: boolean
}
export function isAoiComponentServerFacet(obj: any): obj is AoiComponentServerFacet {
  return obj?.['__type'] === 'AoiComponentServerFacet'
}

export interface AggregateContractCountComponent {
  __type: string
  baseclass1: FacetedComponent
  m_outpostactoridmap: []
}
export function isAggregateContractCountComponent(obj: any): obj is AggregateContractCountComponent {
  return obj?.['__type'] === 'AggregateContractCountComponent'
}

export interface AggregateContractCountComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_outpostcontractcountsmap: []
}
export function isAggregateContractCountComponentClientFacet(
  obj: any
): obj is AggregateContractCountComponentClientFacet {
  return obj?.['__type'] === 'AggregateContractCountComponentClientFacet'
}

export interface AggregateContractCountComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAggregateContractCountComponentServerFacet(
  obj: any
): obj is AggregateContractCountComponentServerFacet {
  return obj?.['__type'] === 'AggregateContractCountComponentServerFacet'
}

export interface WarDataComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isWarDataComponent(obj: any): obj is WarDataComponent {
  return obj?.['__type'] === 'WarDataComponent'
}

export interface WarDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isWarDataComponentClientFacet(obj: any): obj is WarDataComponentClientFacet {
  return obj?.['__type'] === 'WarDataComponentClientFacet'
}

export interface WarDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isWarDataComponentServerFacet(obj: any): obj is WarDataComponentServerFacet {
  return obj?.['__type'] === 'WarDataComponentServerFacet'
}

export interface GameModeMutationSchedulerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGameModeMutationSchedulerComponent(obj: any): obj is GameModeMutationSchedulerComponent {
  return obj?.['__type'] === 'GameModeMutationSchedulerComponent'
}

export interface GameModeMutationSchedulerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGameModeMutationSchedulerComponentClientFacet(
  obj: any
): obj is GameModeMutationSchedulerComponentClientFacet {
  return obj?.['__type'] === 'GameModeMutationSchedulerComponentClientFacet'
}

export interface GameModeMutationSchedulerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGameModeMutationSchedulerComponentServerFacet(
  obj: any
): obj is GameModeMutationSchedulerComponentServerFacet {
  return obj?.['__type'] === 'GameModeMutationSchedulerComponentServerFacet'
}

export interface DebugVisualizationComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDebugVisualizationComponent(obj: any): obj is DebugVisualizationComponent {
  return obj?.['__type'] === 'DebugVisualizationComponent'
}

export interface DebugVisualizationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDebugVisualizationComponentClientFacet(obj: any): obj is DebugVisualizationComponentClientFacet {
  return obj?.['__type'] === 'DebugVisualizationComponentClientFacet'
}

export interface DebugVisualizationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDebugVisualizationComponentServerFacet(obj: any): obj is DebugVisualizationComponentServerFacet {
  return obj?.['__type'] === 'DebugVisualizationComponentServerFacet'
}

export interface InstancedLootComponent {
  __type: string
  baseclass1: FacetedComponent
  m_instancedloottype: number
}
export function isInstancedLootComponent(obj: any): obj is InstancedLootComponent {
  return obj?.['__type'] === 'InstancedLootComponent'
}

export interface InstancedLootComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_initialevents: Array<EventData>
  m_rolledevents: Array<EventData>
  m_lootedevents: Array<EventData>
  m_rarityparticleentityref: Array<LocalEntityRef>
}
export function isInstancedLootComponentClientFacet(obj: any): obj is InstancedLootComponentClientFacet {
  return obj?.['__type'] === 'InstancedLootComponentClientFacet'
}

export interface InstancedLootComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_loottableid: string
  m_backstoryspecificloot: boolean
  m_completelylootedevents: Array<EventData>
}
export function isInstancedLootComponentServerFacet(obj: any): obj is InstancedLootComponentServerFacet {
  return obj?.['__type'] === 'InstancedLootComponentServerFacet'
}

export interface NameComponent {
  __type: string
  baseclass1: FacetedComponent
  m_name: string
}
export function isNameComponent(obj: any): obj is NameComponent {
  return obj?.['__type'] === 'NameComponent'
}

export interface NameComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isNameComponentClientFacet(obj: any): obj is NameComponentClientFacet {
  return obj?.['__type'] === 'NameComponentClientFacet'
}

export interface NameComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isNameComponentServerFacet(obj: any): obj is NameComponentServerFacet {
  return obj?.['__type'] === 'NameComponentServerFacet'
}

export interface MaterialOverrideComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isMaterialOverrideComponent(obj: any): obj is MaterialOverrideComponent {
  return obj?.['__type'] === 'MaterialOverrideComponent'
}

export interface MaterialOverrideComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_entitytoswapmaton: LocalEntityRef
  m_overridenameontrigger: string
  m_overrides: Array<MaterialOverrideInfo>
}
export function isMaterialOverrideComponentClientFacet(obj: any): obj is MaterialOverrideComponentClientFacet {
  return obj?.['__type'] === 'MaterialOverrideComponentClientFacet'
}

export interface MaterialOverrideInfo {
  __type: string
  m_name: string
  m_materialasset: AzFramework__SimpleAssetReference_MB__MaterialOverrideAsset_
}
export function isMaterialOverrideInfo(obj: any): obj is MaterialOverrideInfo {
  return obj?.['__type'] === 'MaterialOverrideInfo'
}

export interface AzFramework__SimpleAssetReference_MB__MaterialOverrideAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_MB__MaterialOverrideAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_MB__MaterialOverrideAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<MB::MaterialOverrideAsset>'
}

export interface MaterialOverrideComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMaterialOverrideComponentServerFacet(obj: any): obj is MaterialOverrideComponentServerFacet {
  return obj?.['__type'] === 'MaterialOverrideComponentServerFacet'
}

export interface GameRigidBodyComponent {
  __type: string
  baseclass1: FacetedComponent
  m_center: Array<number>
  m_collisiontype: number
  m_rnrasset: Asset
  m_materialoverrideasset: Asset
  m_collisionshape: null | QueryShapeBox | QueryShapeSphere | QueryShapeCylinder
  m_shapeentity: EntityId
  m_setprismasset: boolean
  m_isdynamic: boolean
  m_mass: number
  m_lineardamping: number
  m_angulardamping: number
  m_sleepminenergy: number
  m_interactwithtriggers: boolean
  m_strfilter: string
  m_gameplayflags: []
  m_scaleshapes: boolean
  m_deprecationwarning: string
  m_converttoeditorgamerigidbodycomponent: boolean
  m_configuration: GameRigidBodyConfig
}
export function isGameRigidBodyComponent(obj: any): obj is GameRigidBodyComponent {
  return obj?.['__type'] === 'GameRigidBodyComponent'
}

export interface GameRigidBodyComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGameRigidBodyComponentClientFacet(obj: any): obj is GameRigidBodyComponentClientFacet {
  return obj?.['__type'] === 'GameRigidBodyComponentClientFacet'
}

export interface GameRigidBodyComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_loggridinfo: boolean
  m_configuration: GameRigidBodyServerFacetConfig
}
export function isGameRigidBodyComponentServerFacet(obj: any): obj is GameRigidBodyComponentServerFacet {
  return obj?.['__type'] === 'GameRigidBodyComponentServerFacet'
}

export interface GameRigidBodyServerFacetConfig {
  __type: string
  m_loggridinfo: boolean
}
export function isGameRigidBodyServerFacetConfig(obj: any): obj is GameRigidBodyServerFacetConfig {
  return obj?.['__type'] === 'GameRigidBodyServerFacetConfig'
}

export interface GameRigidBodyConfig {
  __type: string
  m_center: Array<number>
  m_collisiontype: number
  m_rnrasset: Asset
  m_materialoverrideasset: Asset
  m_collisionshape: QueryShapeBox | null | QueryShapeCylinder | QueryShapeSphere | QueryShapeAabb | QueryShapeCapsule
  m_shapeentity: EntityId
  m_isdynamic: boolean
  m_mass: number
  m_lineardamping: number
  m_angulardamping: number
  m_sleepminenergy: number
  m_interactwithtriggers: boolean
  m_strfilter: string
  m_gameplayflags: Array<number>
  m_scaleshapes: boolean
  m_applyalignmentdetails: boolean
}
export function isGameRigidBodyConfig(obj: any): obj is GameRigidBodyConfig {
  return obj?.['__type'] === 'GameRigidBodyConfig'
}

export interface EventRerouterComponent {
  __type: string
  baseclass1: FacetedComponent
  m_events: Array<EventData>
}
export function isEventRerouterComponent(obj: any): obj is EventRerouterComponent {
  return obj?.['__type'] === 'EventRerouterComponent'
}

export interface EventRerouterComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isEventRerouterComponentClientFacet(obj: any): obj is EventRerouterComponentClientFacet {
  return obj?.['__type'] === 'EventRerouterComponentClientFacet'
}

export interface EventRerouterComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isEventRerouterComponentServerFacet(obj: any): obj is EventRerouterComponentServerFacet {
  return obj?.['__type'] === 'EventRerouterComponentServerFacet'
}

export interface SphereShapeComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: SphereShapeConfig
}
export function isSphereShapeComponent(obj: any): obj is SphereShapeComponent {
  return obj?.['__type'] === 'SphereShapeComponent'
}

export interface SphereShapeConfig {
  __type: string
  radius: number
}
export function isSphereShapeConfig(obj: any): obj is SphereShapeConfig {
  return obj?.['__type'] === 'SphereShapeConfig'
}

export interface Crc32 {
  __type: string
  value: number
}
export function isCrc32(obj: any): obj is Crc32 {
  return obj?.['__type'] === 'Crc32'
}

export interface AzFramework__ScriptPropertyGenericClass {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  value: DynamicSerializableField
}
export function isAzFramework__ScriptPropertyGenericClass(obj: any): obj is AzFramework__ScriptPropertyGenericClass {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyGenericClass'
}

export interface DynamicSerializableField {
  __type: string
  typeid: string
  m_data: EntityId | Array<number> | Color | EventData | ScriptBindScriptEvent
}
export function isDynamicSerializableField(obj: any): obj is DynamicSerializableField {
  return obj?.['__type'] === 'DynamicSerializableField'
}

export interface StorageComponent {
  __type: string
  baseclass1: FacetedComponent
  m_containerstorage: LocalEntityRef
  m_instancedlootentity: LocalEntityRef
  m_teamcontainerentities: Array<LocalEntityRef>
  m_isplayeruniquestorage: boolean
  m_isteamuniquestorage: boolean
}
export function isStorageComponent(obj: any): obj is StorageComponent {
  return obj?.['__type'] === 'StorageComponent'
}

export interface StorageComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_registeredwithcontainerscreen: boolean
  m_buildableentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
  m_showpreview: boolean
}
export function isStorageComponentClientFacet(obj: any): obj is StorageComponentClientFacet {
  return obj?.['__type'] === 'StorageComponentClientFacet'
}

export interface StorageComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isStorageComponentServerFacet(obj: any): obj is StorageComponentServerFacet {
  return obj?.['__type'] === 'StorageComponentServerFacet'
}

export interface LootDropComponent {
  __type: string
  baseclass1: FacetedComponent
  m_container: LocalEntityRef
  m_ownershipentity: LocalEntityRef
  m_interactentity: LocalEntityRef
  m_isinstancedloot: boolean
}
export function isLootDropComponent(obj: any): obj is LootDropComponent {
  return obj?.['__type'] === 'LootDropComponent'
}

export interface LootDropComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_showpreview: boolean
  m_rarityparticleentityref: Array<LocalEntityRef>
}
export function isLootDropComponentClientFacet(obj: any): obj is LootDropComponentClientFacet {
  return obj?.['__type'] === 'LootDropComponentClientFacet'
}

export interface LootDropComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isLootDropComponentServerFacet(obj: any): obj is LootDropComponentServerFacet {
  return obj?.['__type'] === 'LootDropComponentServerFacet'
}

export interface VariationDataComponent {
  __type: string
  baseclass1: FacetedComponent
  m_variationtableuniquename: string
  m_selectedvariant: string
  m_variantdata: Array<VariantData>
  m_debugvariant: DebugVariantData
}
export function isVariationDataComponent(obj: any): obj is VariationDataComponent {
  return obj?.['__type'] === 'VariationDataComponent'
}

export interface VariationDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isVariationDataComponentClientFacet(obj: any): obj is VariationDataComponentClientFacet {
  return obj?.['__type'] === 'VariationDataComponentClientFacet'
}

export interface VariationDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_persistentdata: PersistentVariationData
}
export function isVariationDataComponentServerFacet(obj: any): obj is VariationDataComponentServerFacet {
  return obj?.['__type'] === 'VariationDataComponentServerFacet'
}

export interface PersistentVariationData {
  __type: string
  m_spawnedvariantname: string
}
export function isPersistentVariationData(obj: any): obj is PersistentVariationData {
  return obj?.['__type'] === 'PersistentVariationData'
}

export interface VariantData {
  __type: string
  m_entity: LocalEntityRef
  m_action: string
  m_colname: string
  m_impostorcolumn: boolean
}
export function isVariantData(obj: any): obj is VariantData {
  return obj?.['__type'] === 'VariantData'
}

export interface DebugVariantData {
  __type: string
  m_sliceasset: Asset
  m_entitiesperrow: number
  m_variantoffset: Array<number>
  m_cangenerateallvariants: boolean
  m_reloadstylesheets: boolean
  m_openvarianttable: boolean
}
export function isDebugVariantData(obj: any): obj is DebugVariantData {
  return obj?.['__type'] === 'DebugVariantData'
}

export interface GatherableControllerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_isreplenishable: boolean
  m_gatherableradius: number
  m_gatherableentryid: string
  m_gatheringstartevent: EventData
  m_gatheringendevent: EventData
  m_gatheringinterruptedevent: Array<EventData>
  m_alignmententityref: LocalEntityRef
  m_instancedlootentityref: LocalEntityRef
  m_showonmapuicomponententityref: LocalEntityRef
  m_interactcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__Interact__void__
  m_enableuseachievementforclientstate: boolean
  m_achievementname: string
  m_isstatecontrolledbyslayerscript: boolean
  m_isthrowableitem: boolean
  m_destructiontimercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DelayedEventComponent__void__
  m_warningtimecomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DelayedEventComponent__void__
  m_defaultappearance: LocalEntityRef
  m_warningtimeelapsedappearance: LocalEntityRef
}
export function isGatherableControllerComponent(obj: any): obj is GatherableControllerComponent {
  return obj?.['__type'] === 'GatherableControllerComponent'
}

export interface GatherableControllerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_highpriorityvfx: EntityId
}
export function isGatherableControllerComponentClientFacet(obj: any): obj is GatherableControllerComponentClientFacet {
  return obj?.['__type'] === 'GatherableControllerComponentClientFacet'
}

export interface GatherableControllerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_obstructions: []
  m_depleters: []
  m_isproximitygatherable: boolean
  m_isdamageablegatherable: boolean
  m_achievementserverstate: number
}
export function isGatherableControllerComponentServerFacet(obj: any): obj is GatherableControllerComponentServerFacet {
  return obj?.['__type'] === 'GatherableControllerComponentServerFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__Interact__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__Interact__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__Interact__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::Interact>(void)>'
  )
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DelayedEventComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DelayedEventComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DelayedEventComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::DelayedEventComponent>(void)>'
  )
}

export interface GatherableStateComponent {
  __type: string
  baseclass1: FacetedComponent
  m_onstateenterevent: EventData
  m_onstateexitevent: EventData
  m_onstateentertransitionevents: Array<GatherableStateTransitionEvents>
  m_onstateexittransitionevents: Array<GatherableStateTransitionEvents>
}
export function isGatherableStateComponent(obj: any): obj is GatherableStateComponent {
  return obj?.['__type'] === 'GatherableStateComponent'
}

export interface GatherableStateComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGatherableStateComponentClientFacet(obj: any): obj is GatherableStateComponentClientFacet {
  return obj?.['__type'] === 'GatherableStateComponentClientFacet'
}

export interface GatherableStateComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGatherableStateComponentServerFacet(obj: any): obj is GatherableStateComponentServerFacet {
  return obj?.['__type'] === 'GatherableStateComponentServerFacet'
}

export interface GatherableStateTransitionEvents {
  __type: string
  m_transitioningstate: number
  m_events: Array<EventData>
}
export function isGatherableStateTransitionEvents(obj: any): obj is GatherableStateTransitionEvents {
  return obj?.['__type'] === 'GatherableStateTransitionEvents'
}

export interface GatherableCondition {
  __type: string
  baseclass1: InteractCondition
}
export function isGatherableCondition(obj: any): obj is GatherableCondition {
  return obj?.['__type'] === 'GatherableCondition'
}

export interface InteractCondition {
  __type: string
}
export function isInteractCondition(obj: any): obj is InteractCondition {
  return obj?.['__type'] === 'InteractCondition'
}

export interface MarkerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isMarkerComponent(obj: any): obj is MarkerComponent {
  return obj?.['__type'] === 'MarkerComponent'
}

export interface MarkerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_markernameoverride: string
  m_ownershipcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__OwnershipComponent__void__
  m_interactcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__Interact__void__
  m_interactcooldownoption: string
  m_siegeweaponcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__SiegeWeaponComponent__void__
  m_npccomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__NpcComponent__void__
  m_screencentertopprioritydistsq: number
  m_screencenterpriorityminscale: number
  m_updateenemyalignmentstatus: boolean
  m_showonenable: boolean
  m_nearrange: number
  m_crouchrange: number
  m_pronerange: number
  m_nearangle: number
  m_farangle: number
  m_angleshrinkdistance: number
  m_targettaggingduration: number
  m_pingsphereradius: number
  m_isdiegeticobjectivepin: boolean
  m_diegeticpositionoverride: Array<number | string>
  m_diegeticobjectiveinstanceid: ObjectiveInstanceId
  m_onlyuseimpactpositionfordamagenumber: boolean
  m_disabledamagenumbers: boolean
  m_verticaloffset: number
  m_creaturetypeoverride: string
  m_forcedisplayhealthbar: boolean
}
export function isMarkerComponentClientFacet(obj: any): obj is MarkerComponentClientFacet {
  return obj?.['__type'] === 'MarkerComponentClientFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__OwnershipComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__OwnershipComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__OwnershipComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::OwnershipComponent>(void)>'
  )
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__SiegeWeaponComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__SiegeWeaponComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__SiegeWeaponComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::SiegeWeaponComponent>(void)>'
  )
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__NpcComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__NpcComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__NpcComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::NpcComponent>(void)>'
  )
}

export interface ObjectiveInstanceId {
  __type: string
  m_objectiveinstanceid: number
}
export function isObjectiveInstanceId(obj: any): obj is ObjectiveInstanceId {
  return obj?.['__type'] === 'ObjectiveInstanceId'
}

export interface MarkerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_shouldreplicate: boolean
}
export function isMarkerComponentServerFacet(obj: any): obj is MarkerComponentServerFacet {
  return obj?.['__type'] === 'MarkerComponentServerFacet'
}

export interface SlayerScriptForwarderComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSlayerScriptForwarderComponent(obj: any): obj is SlayerScriptForwarderComponent {
  return obj?.['__type'] === 'SlayerScriptForwarderComponent'
}

export interface SlayerScriptForwarderClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSlayerScriptForwarderClientFacet(obj: any): obj is SlayerScriptForwarderClientFacet {
  return obj?.['__type'] === 'SlayerScriptForwarderClientFacet'
}

export interface SlayerScriptForwarderServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSlayerScriptForwarderServerFacet(obj: any): obj is SlayerScriptForwarderServerFacet {
  return obj?.['__type'] === 'SlayerScriptForwarderServerFacet'
}

export interface SlayerScriptComponent {
  __type: string
  baseclass1: FacetedComponent
  m_scripttorun: string
  m_scriptdata:
    | $$69c38c99_611d_49f8_ae99_f42d54777fa9
    | $$54cb00f3_c64e_48b9_9779_859545bf46b3
    | null
    | $$5f172f5e_778f_4b17_ba0f_5b3f5ffc2c03
    | CyclicGatherableData
    | LockedInteractGatherableData
    | QuestApophisData
    | $$351fd902_d73d_4ecb_a689_ac95d2619a19
    | $$36675533_c431_4ead_9883_846e3696bf99
    | DungeonBrimstoneSands00Data
    | f4c45b9f_1cdd_469b_bfa1_99877dc1b63f
    | DungeonGreatCleave01
    | DungeonDialPuzzleData
    | e0e11d8b_d02f_4a83_a182_129396a703d2
    | DungeonReekwater00Data
    | a055cb3f_f5b9_4b3b_b56d_3636985699d9
    | DungeonShatteredObeliskData
    | OnEncounterComplete
    | $$476afd4f_dad4_45f0_b3a5_94414c09108b
    | cebc1b0c_b1a5_4ad3_8ec5_2909b9750abc
    | OutpostRushState
    | $$44a169fe_d036_46fb_acd4_4725166c18c4
  m_replicatetoclient: boolean
}
export function isSlayerScriptComponent(obj: any): obj is SlayerScriptComponent {
  return obj?.['__type'] === 'SlayerScriptComponent'
}

export interface SlayerScriptClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSlayerScriptClientFacet(obj: any): obj is SlayerScriptClientFacet {
  return obj?.['__type'] === 'SlayerScriptClientFacet'
}

export interface SlayerScriptServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSlayerScriptServerFacet(obj: any): obj is SlayerScriptServerFacet {
  return obj?.['__type'] === 'SlayerScriptServerFacet'
}

export interface $$69c38c99_611d_49f8_ae99_f42d54777fa9 {
  __type: string
  baseclass1: SlayerScriptData
  lootlockentityevents: b6e08b3f_f4e1_50c2_8752_3cf3c4ab414a
}
export function is$$69c38c99_611d_49f8_ae99_f42d54777fa9(obj: any): obj is $$69c38c99_611d_49f8_ae99_f42d54777fa9 {
  return obj?.['__type'] === '69c38c99-611d-49f8-ae99-f42d54777fa9'
}

export interface SlayerScriptData {
  __type: string
}
export function isSlayerScriptData(obj: any): obj is SlayerScriptData {
  return obj?.['__type'] === 'SlayerScriptData'
}

export interface b6e08b3f_f4e1_50c2_8752_3cf3c4ab414a {
  __type: string
  element: LootLockEvent
}
export function isb6e08b3f_f4e1_50c2_8752_3cf3c4ab414a(obj: any): obj is b6e08b3f_f4e1_50c2_8752_3cf3c4ab414a {
  return obj?.['__type'] === 'b6e08b3f-f4e1-50c2-8752-3cf3c4ab414a'
}

export interface LootLockEvent {
  __type: string
  debugname: string
  debugindex: number
  eventdelayduration: number
  runeventsonunlockaction: boolean
  reverseeventonoppositeaction: boolean
  runeventsonstartup: boolean
  delayeventsuntildonegathering: boolean
  runonclient: boolean
  runonserver: boolean
  entityevents: bf40ff0c_c902_53c4_9b81_38881bb92e54
}
export function isLootLockEvent(obj: any): obj is LootLockEvent {
  return obj?.['__type'] === 'LootLockEvent'
}

export interface bf40ff0c_c902_53c4_9b81_38881bb92e54 {
  __type: string
  element: EntityLootLockEvent
}
export function isbf40ff0c_c902_53c4_9b81_38881bb92e54(obj: any): obj is bf40ff0c_c902_53c4_9b81_38881bb92e54 {
  return obj?.['__type'] === 'bf40ff0c-c902-53c4-9b81-38881bb92e54'
}

export interface EntityLootLockEvent {
  __type: string
  eventtype: number
  applyonchildren: boolean
  entitynames: $$0b66e343_c513_5eb3_b152_770c4628bb73
}
export function isEntityLootLockEvent(obj: any): obj is EntityLootLockEvent {
  return obj?.['__type'] === 'EntityLootLockEvent'
}

export interface $$0b66e343_c513_5eb3_b152_770c4628bb73 {
  __type: string
  element: SlayerScriptEditCrc
}
export function is$$0b66e343_c513_5eb3_b152_770c4628bb73(obj: any): obj is $$0b66e343_c513_5eb3_b152_770c4628bb73 {
  return obj?.['__type'] === '0b66e343-c513-5eb3-b152-770c4628bb73'
}

export interface SlayerScriptEditCrc {
  __type: string
  m_string: string
  m_crc: number
}
export function isSlayerScriptEditCrc(obj: any): obj is SlayerScriptEditCrc {
  return obj?.['__type'] === 'SlayerScriptEditCrc'
}

export interface TagComponent {
  __type: string
  baseclass1: AZ__Component
  tags: Array<Crc32>
}
export function isTagComponent(obj: any): obj is TagComponent {
  return obj?.['__type'] === 'TagComponent'
}

export interface ActionConditionCacheComponent {
  __type: string
  baseclass1: FacetedComponent
  m_iscachingdisabled: boolean
}
export function isActionConditionCacheComponent(obj: any): obj is ActionConditionCacheComponent {
  return obj?.['__type'] === 'ActionConditionCacheComponent'
}

export interface ActionConditionCacheComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isActionConditionCacheComponentClientFacet(obj: any): obj is ActionConditionCacheComponentClientFacet {
  return obj?.['__type'] === 'ActionConditionCacheComponentClientFacet'
}

export interface ActionConditionCacheComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isActionConditionCacheComponentServerFacet(obj: any): obj is ActionConditionCacheComponentServerFacet {
  return obj?.['__type'] === 'ActionConditionCacheComponentServerFacet'
}

export interface GameMasterComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGameMasterComponent(obj: any): obj is GameMasterComponent {
  return obj?.['__type'] === 'GameMasterComponent'
}

export interface GameMasterComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGameMasterComponentClientFacet(obj: any): obj is GameMasterComponentClientFacet {
  return obj?.['__type'] === 'GameMasterComponentClientFacet'
}

export interface GameMasterComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGameMasterComponentServerFacet(obj: any): obj is GameMasterComponentServerFacet {
  return obj?.['__type'] === 'GameMasterComponentServerFacet'
}

export interface ItemManagementComponent {
  __type: string
  baseclass1: FacetedComponent
  m_containercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__
  m_paperdollcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PaperdollComponent__void__
  m_globalstoragecomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__GlobalStorageComponent__void__
  m_currencycomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__CurrencyComponent__void__
  m_currentglobalstoragecontainercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__
}
export function isItemManagementComponent(obj: any): obj is ItemManagementComponent {
  return obj?.['__type'] === 'ItemManagementComponent'
}

export interface ItemManagementComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isItemManagementComponentClientFacet(obj: any): obj is ItemManagementComponentClientFacet {
  return obj?.['__type'] === 'ItemManagementComponentClientFacet'
}

export interface ItemManagementComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isItemManagementComponentServerFacet(obj: any): obj is ItemManagementComponentServerFacet {
  return obj?.['__type'] === 'ItemManagementComponentServerFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::ContainerComponent>(void)>'
  )
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PaperdollComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PaperdollComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PaperdollComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::PaperdollComponent>(void)>'
  )
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__GlobalStorageComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__GlobalStorageComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__GlobalStorageComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::GlobalStorageComponent>(void)>'
  )
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__CurrencyComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__CurrencyComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__CurrencyComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::CurrencyComponent>(void)>'
  )
}

export interface CharacterComponent {
  __type: string
  baseclass1: FacetedComponent
  m_shape: QueryShapeCapsule | null
  m_strfilter: string
  m_maxslope: number
  m_repulsors: Array<RepulsorDescriptor>
  '0x18aee425': f6e6495e_59a8_5724_8de1_d6b68162db92
  m_uselightweightcharactercontroller: boolean
  m_ignoreenvironmentcollisionceilingheight: number
  m_ignoreenvironmentcollisionceilingheightenablethreshold: number
  m_maxextentpoint: Array<number>
  m_addworldcollider: boolean
  m_originrepulsorradius: number
  m_shapeoffset: Array<number>
  '0x15994e18': boolean
}
export function isCharacterComponent(obj: any): obj is CharacterComponent {
  return obj?.['__type'] === 'CharacterComponent'
}

export interface CharacterComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCharacterComponentClientFacet(obj: any): obj is CharacterComponentClientFacet {
  return obj?.['__type'] === 'CharacterComponentClientFacet'
}

export interface CharacterComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCharacterComponentServerFacet(obj: any): obj is CharacterComponentServerFacet {
  return obj?.['__type'] === 'CharacterComponentServerFacet'
}

export interface QueryShapeCapsule {
  __type: string
  baseclass1: QueryShapeBase
  m_height: number
  m_radius: number
  m_axis: Array<number>
}
export function isQueryShapeCapsule(obj: any): obj is QueryShapeCapsule {
  return obj?.['__type'] === 'QueryShapeCapsule'
}

export interface f6e6495e_59a8_5724_8de1_d6b68162db92 {
  __type: string
  element: $$84684376_0649_435e_91c5_333ed737d9ea
}
export function isf6e6495e_59a8_5724_8de1_d6b68162db92(obj: any): obj is f6e6495e_59a8_5724_8de1_d6b68162db92 {
  return obj?.['__type'] === 'f6e6495e-59a8-5724-8de1-d6b68162db92'
}

export interface SpawnerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSpawnerComponent(obj: any): obj is SpawnerComponent {
  return obj?.['__type'] === 'SpawnerComponent'
}

export interface SpawnerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSpawnerComponentClientFacet(obj: any): obj is SpawnerComponentClientFacet {
  return obj?.['__type'] === 'SpawnerComponentClientFacet'
}

export interface SpawnerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_sliceasset: Asset
  m_aliasasset: Asset
  m_destroyspawnsondeactivate: boolean
  m_destroyspawnsondestroyed: boolean
  '0x9f760bb5': boolean
  m_spawncap: number
  m_replicatesourcespawnergderef: boolean
  m_replicatenumactivespawns: boolean
  m_overrideaggrodelay: boolean
  m_aggrodelayoverride: number
}
export function isSpawnerComponentServerFacet(obj: any): obj is SpawnerComponentServerFacet {
  return obj?.['__type'] === 'SpawnerComponentServerFacet'
}

export interface NWTagComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isNWTagComponent(obj: any): obj is NWTagComponent {
  return obj?.['__type'] === 'NWTagComponent'
}

export interface NWTagComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isNWTagComponentClientFacet(obj: any): obj is NWTagComponentClientFacet {
  return obj?.['__type'] === 'NWTagComponentClientFacet'
}

export interface NWTagComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  tags: Array<string>
}
export function isNWTagComponentServerFacet(obj: any): obj is NWTagComponentServerFacet {
  return obj?.['__type'] === 'NWTagComponentServerFacet'
}

export interface SpellTargetIndicatorManagerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSpellTargetIndicatorManagerComponent(obj: any): obj is SpellTargetIndicatorManagerComponent {
  return obj?.['__type'] === 'SpellTargetIndicatorManagerComponent'
}

export interface SpellTargetIndicatorManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_indicatorsliceassets: Array<Asset>
}
export function isSpellTargetIndicatorManagerComponentClientFacet(
  obj: any
): obj is SpellTargetIndicatorManagerComponentClientFacet {
  return obj?.['__type'] === 'SpellTargetIndicatorManagerComponentClientFacet'
}

export interface SpellTargetIndicatorManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSpellTargetIndicatorManagerComponentServerFacet(
  obj: any
): obj is SpellTargetIndicatorManagerComponentServerFacet {
  return obj?.['__type'] === 'SpellTargetIndicatorManagerComponentServerFacet'
}

export interface PlayerArenaComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerArenaComponent(obj: any): obj is PlayerArenaComponent {
  return obj?.['__type'] === 'PlayerArenaComponent'
}

export interface PlayerArenaComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerArenaComponentClientFacet(obj: any): obj is PlayerArenaComponentClientFacet {
  return obj?.['__type'] === 'PlayerArenaComponentClientFacet'
}

export interface PlayerArenaComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerArenaComponentServerFacet(obj: any): obj is PlayerArenaComponentServerFacet {
  return obj?.['__type'] === 'PlayerArenaComponentServerFacet'
}

export interface LoreReaderComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isLoreReaderComponent(obj: any): obj is LoreReaderComponent {
  return obj?.['__type'] === 'LoreReaderComponent'
}

export interface LoreReaderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_currententry: number
}
export function isLoreReaderComponentClientFacet(obj: any): obj is LoreReaderComponentClientFacet {
  return obj?.['__type'] === 'LoreReaderComponentClientFacet'
}

export interface LoreReaderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isLoreReaderComponentServerFacet(obj: any): obj is LoreReaderComponentServerFacet {
  return obj?.['__type'] === 'LoreReaderComponentServerFacet'
}

export interface PlayerTimeComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerTimeComponent(obj: any): obj is PlayerTimeComponent {
  return obj?.['__type'] === 'PlayerTimeComponent'
}

export interface PlayerTimeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerTimeComponentClientFacet(obj: any): obj is PlayerTimeComponentClientFacet {
  return obj?.['__type'] === 'PlayerTimeComponentClientFacet'
}

export interface PlayerTimeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerTimeComponentServerFacet(obj: any): obj is PlayerTimeComponentServerFacet {
  return obj?.['__type'] === 'PlayerTimeComponentServerFacet'
}

export interface CustomizableCharacterComponent {
  __type: string
  baseclass1: AZ__Component
  'character creation mesh asset (male)': Asset
  'character creation mesh asset (female)': Asset
  'character race': string
  'character hairstyle': string
  'skin tone': string
  backstory: string
}
export function isCustomizableCharacterComponent(obj: any): obj is CustomizableCharacterComponent {
  return obj?.['__type'] === 'CustomizableCharacterComponent'
}

export interface AsyncRenderTransformComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAsyncRenderTransformComponent(obj: any): obj is AsyncRenderTransformComponent {
  return obj?.['__type'] === 'AsyncRenderTransformComponent'
}

export interface AsyncRenderTransformComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAsyncRenderTransformComponentClientFacet(obj: any): obj is AsyncRenderTransformComponentClientFacet {
  return obj?.['__type'] === 'AsyncRenderTransformComponentClientFacet'
}

export interface AsyncRenderTransformComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAsyncRenderTransformComponentServerFacet(obj: any): obj is AsyncRenderTransformComponentServerFacet {
  return obj?.['__type'] === 'AsyncRenderTransformComponentServerFacet'
}

export interface PlayerHousingComponent {
  __type: string
  baseclass1: FacetedComponent
  m_containerentityid: EntityId
  m_globalstorageentityid: EntityId
}
export function isPlayerHousingComponent(obj: any): obj is PlayerHousingComponent {
  return obj?.['__type'] === 'PlayerHousingComponent'
}

export interface PlayerHousingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerHousingComponentClientFacet(obj: any): obj is PlayerHousingComponentClientFacet {
  return obj?.['__type'] === 'PlayerHousingComponentClientFacet'
}

export interface PlayerHousingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_playercomponentref: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
  m_groupsentity: EntityId
}
export function isPlayerHousingComponentServerFacet(obj: any): obj is PlayerHousingComponentServerFacet {
  return obj?.['__type'] === 'PlayerHousingComponentServerFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::PlayerComponent>(void)>'
  )
}

export interface TerritoryInteractorComponent {
  __type: string
  baseclass1: FacetedComponent
  m_enableprogressionvalidation: boolean
  m_player: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
}
export function isTerritoryInteractorComponent(obj: any): obj is TerritoryInteractorComponent {
  return obj?.['__type'] === 'TerritoryInteractorComponent'
}

export interface TerritoryInteractorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_invalidtime: WallClockTimePoint
}
export function isTerritoryInteractorComponentClientFacet(obj: any): obj is TerritoryInteractorComponentClientFacet {
  return obj?.['__type'] === 'TerritoryInteractorComponentClientFacet'
}

export interface WallClockTimePoint {
  __type: string
  m_nanosecondssinceepoc: number
}
export function isWallClockTimePoint(obj: any): obj is WallClockTimePoint {
  return obj?.['__type'] === 'WallClockTimePoint'
}

export interface TerritoryInteractorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_territoryid: number
  m_territorygovernanceref: RemoteTypelessServerFacetRef
  m_territoryprogressionref: RemoteTypelessServerFacetRef
  m_territoryraidsetupref: RemoteTypelessServerFacetRef
  m_raidside: number
  m_raidpermission: number
}
export function isTerritoryInteractorComponentServerFacet(obj: any): obj is TerritoryInteractorComponentServerFacet {
  return obj?.['__type'] === 'TerritoryInteractorComponentServerFacet'
}

export interface RemoteTypelessServerFacetRef {
  __type: string
  m_remoteservergderef: RemoteServerGDERef
  m_targetid: number
}
export function isRemoteTypelessServerFacetRef(obj: any): obj is RemoteTypelessServerFacetRef {
  return obj?.['__type'] === 'RemoteTypelessServerFacetRef'
}

export interface RemoteServerGDERef {
  __type: string
  m_remoteservercontext: RemoteServerContextRef
  m_targetid: GDEID
}
export function isRemoteServerGDERef(obj: any): obj is RemoteServerGDERef {
  return obj?.['__type'] === 'RemoteServerGDERef'
}

export interface RemoteServerContextRef {
  __type: string
  m_actorid: string
}
export function isRemoteServerContextRef(obj: any): obj is RemoteServerContextRef {
  return obj?.['__type'] === 'RemoteServerContextRef'
}

export interface TriggerAreaDetectable {
  __type: string
  baseclass1: AZ__Component
  relevanceradius: number
  staticposition: boolean
  onlyonlocalplayer: boolean
  excludelocalplayer: boolean
}
export function isTriggerAreaDetectable(obj: any): obj is TriggerAreaDetectable {
  return obj?.['__type'] === 'TriggerAreaDetectable'
}

export interface HunterSightComponent {
  __type: string
  baseclass1: FacetedComponent
  m_materialasset: AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  m_hunterstatuseffectcategory: string
  m_smokestatuseffectcategory: string
}
export function isHunterSightComponent(obj: any): obj is HunterSightComponent {
  return obj?.['__type'] === 'HunterSightComponent'
}

export interface HunterSightComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isHunterSightComponentClientFacet(obj: any): obj is HunterSightComponentClientFacet {
  return obj?.['__type'] === 'HunterSightComponentClientFacet'
}

export interface HunterSightComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isHunterSightComponentServerFacet(obj: any): obj is HunterSightComponentServerFacet {
  return obj?.['__type'] === 'HunterSightComponentServerFacet'
}

export interface SessionTrackingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSessionTrackingComponent(obj: any): obj is SessionTrackingComponent {
  return obj?.['__type'] === 'SessionTrackingComponent'
}

export interface SessionTrackingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSessionTrackingComponentClientFacet(obj: any): obj is SessionTrackingComponentClientFacet {
  return obj?.['__type'] === 'SessionTrackingComponentClientFacet'
}

export interface SessionTrackingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_persistentdata: PersistentSessionData
}
export function isSessionTrackingComponentServerFacet(obj: any): obj is SessionTrackingComponentServerFacet {
  return obj?.['__type'] === 'SessionTrackingComponentServerFacet'
}

export interface PersistentSessionData {
  __type: string
  m_sessionstart: WallClockTimePoint
  m_lastsend: WallClockTimePoint
}
export function isPersistentSessionData(obj: any): obj is PersistentSessionData {
  return obj?.['__type'] === 'PersistentSessionData'
}

export interface ServerTransferComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isServerTransferComponent(obj: any): obj is ServerTransferComponent {
  return obj?.['__type'] === 'ServerTransferComponent'
}

export interface ServerTransferComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isServerTransferComponentClientFacet(obj: any): obj is ServerTransferComponentClientFacet {
  return obj?.['__type'] === 'ServerTransferComponentClientFacet'
}

export interface ServerTransferComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isServerTransferComponentServerFacet(obj: any): obj is ServerTransferComponentServerFacet {
  return obj?.['__type'] === 'ServerTransferComponentServerFacet'
}

export interface NavMeshDebugComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isNavMeshDebugComponent(obj: any): obj is NavMeshDebugComponent {
  return obj?.['__type'] === 'NavMeshDebugComponent'
}

export interface NavMeshDebugComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isNavMeshDebugComponentClientFacet(obj: any): obj is NavMeshDebugComponentClientFacet {
  return obj?.['__type'] === 'NavMeshDebugComponentClientFacet'
}

export interface NavMeshDebugComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_clientreffortiledebugstats: ClientRef
  m_pathrequestid: number
}
export function isNavMeshDebugComponentServerFacet(obj: any): obj is NavMeshDebugComponentServerFacet {
  return obj?.['__type'] === 'NavMeshDebugComponentServerFacet'
}

export interface ClientRef {
  __type: string
  m_clientref: string
}
export function isClientRef(obj: any): obj is ClientRef {
  return obj?.['__type'] === 'ClientRef'
}

export interface SkinnedMeshComponent {
  __type: string
  baseclass1: AZ__Component
  'skinned mesh render node': SkinnedMeshComponentRenderNode
  'load mesh on activate': boolean
}
export function isSkinnedMeshComponent(obj: any): obj is SkinnedMeshComponent {
  return obj?.['__type'] === 'SkinnedMeshComponent'
}

export interface SkinnedMeshComponentRenderNode {
  __type: string
  visible: boolean
  'skinned mesh': Asset
  'material override': AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  'material overcoat': AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  'material override asset': Asset
  'material overcoat asset': Asset
  'render options': SkinnedRenderOptions
}
export function isSkinnedMeshComponentRenderNode(obj: any): obj is SkinnedMeshComponentRenderNode {
  return obj?.['__type'] === 'SkinnedMeshComponentRenderNode'
}

export interface SkinnedRenderOptions {
  __type: string
  opacity: number
  maxviewdistance: number
  viewdistancemultiplier: number
  lodratio: number
  castdynamicshadows: boolean
  usevisareas: boolean
  rainoccluder: boolean
  acceptdecals: boolean
  acceptsnow: boolean
  alwaysrender: boolean
  lod_minscreenpct: Array<number>
  sorttype: number
  acceptsilhouette: boolean
  neverfrustumcull: boolean
  mirrorplane: EntityId
}
export function isSkinnedRenderOptions(obj: any): obj is SkinnedRenderOptions {
  return obj?.['__type'] === 'SkinnedRenderOptions'
}

export interface PathingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPathingComponent(obj: any): obj is PathingComponent {
  return obj?.['__type'] === 'PathingComponent'
}

export interface PathingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPathingComponentClientFacet(obj: any): obj is PathingComponentClientFacet {
  return obj?.['__type'] === 'PathingComponentClientFacet'
}

export interface PathingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_navigationprofile: NavigationProfile
}
export function isPathingComponentServerFacet(obj: any): obj is PathingComponentServerFacet {
  return obj?.['__type'] === 'PathingComponentServerFacet'
}

export interface NavigationProfile {
  __type: string
  m_navabilities: Array<number>
  m_areacosts: Array<NavigationAreaCost>
  m_navconfigs: Array<NavConfiguration>
}
export function isNavigationProfile(obj: any): obj is NavigationProfile {
  return obj?.['__type'] === 'NavigationProfile'
}

export interface AudioDataFollowerComponent {
  __type: string
  baseclass1: AZ__Component
  'meter settings': $$5c2be455_c7de_5ac4_a834_88e740cff639
  'rtpc meter settings': $$3b1d6fe2_1ca5_51ed_a0b2_99392b9ae7d1
  'audio markers': boolean
}
export function isAudioDataFollowerComponent(obj: any): obj is AudioDataFollowerComponent {
  return obj?.['__type'] === 'AudioDataFollowerComponent'
}

export interface $$5c2be455_c7de_5ac4_a834_88e740cff639 {
  __type: string
  element: LevelMeterSettings
}
export function is$$5c2be455_c7de_5ac4_a834_88e740cff639(obj: any): obj is $$5c2be455_c7de_5ac4_a834_88e740cff639 {
  return obj?.['__type'] === '5c2be455-c7de-5ac4-a834-88e740cff639'
}

export interface $$3b1d6fe2_1ca5_51ed_a0b2_99392b9ae7d1 {
  __type: string
  element: RtpcMeterSettings
}
export function is$$3b1d6fe2_1ca5_51ed_a0b2_99392b9ae7d1(obj: any): obj is $$3b1d6fe2_1ca5_51ed_a0b2_99392b9ae7d1 {
  return obj?.['__type'] === '3b1d6fe2-1ca5-51ed-a0b2-99392b9ae7d1'
}

export interface PlayerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_inventoryentity: LocalEntityRef
  m_localplayerentity: LocalEntityRef
  m_remoteplayerentity: LocalEntityRef
  m_incapacitatedentity: LocalEntityRef
  m_localsavedataentity: LocalEntityRef
  m_currencycomponententityid: EntityId
  m_playerhomeentity: LocalEntityRef
}
export function isPlayerComponent(obj: any): obj is PlayerComponent {
  return obj?.['__type'] === 'PlayerComponent'
}

export interface PlayerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_localplayerknowledge: number
  m_receivedvalidtransform: boolean
}
export function isPlayerComponentClientFacet(obj: any): obj is PlayerComponentClientFacet {
  return obj?.['__type'] === 'PlayerComponentClientFacet'
}

export interface PlayerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerComponentServerFacet(obj: any): obj is PlayerComponentServerFacet {
  return obj?.['__type'] === 'PlayerComponentServerFacet'
}

export interface ObjectiveInteractorComponent {
  __type: string
  baseclass1: FacetedComponent
  m_interactorcomponententityid: EntityId
}
export function isObjectiveInteractorComponent(obj: any): obj is ObjectiveInteractorComponent {
  return obj?.['__type'] === 'ObjectiveInteractorComponent'
}

export interface ObjectiveInteractorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isObjectiveInteractorComponentClientFacet(obj: any): obj is ObjectiveInteractorComponentClientFacet {
  return obj?.['__type'] === 'ObjectiveInteractorComponentClientFacet'
}

export interface ObjectiveInteractorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isObjectiveInteractorComponentServerFacet(obj: any): obj is ObjectiveInteractorComponentServerFacet {
  return obj?.['__type'] === 'ObjectiveInteractorComponentServerFacet'
}

export interface GritComponent {
  __type: string
  baseclass1: FacetedComponent
  m_min: number
  m_initmax: number
  m_maxnohittime: number
  m_defaultstaggerresistrating: number
  m_resetpercentonactiveswitch: number
  m_setnoreactionwhenactive: boolean
  m_usestaminaasvalue: boolean
  m_listenerentities: []
  m_statmultiplierentity: LocalEntityRef
  m_paperdollentity: LocalEntityRef
}
export function isGritComponent(obj: any): obj is GritComponent {
  return obj?.['__type'] === 'GritComponent'
}

export interface GritComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGritComponentClientFacet(obj: any): obj is GritComponentClientFacet {
  return obj?.['__type'] === 'GritComponentClientFacet'
}

export interface GritComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGritComponentServerFacet(obj: any): obj is GritComponentServerFacet {
  return obj?.['__type'] === 'GritComponentServerFacet'
}

export interface PlayerAppearanceComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerAppearanceComponent(obj: any): obj is PlayerAppearanceComponent {
  return obj?.['__type'] === 'PlayerAppearanceComponent'
}

export interface PlayerAppearanceComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerAppearanceComponentClientFacet(obj: any): obj is PlayerAppearanceComponentClientFacet {
  return obj?.['__type'] === 'PlayerAppearanceComponentClientFacet'
}

export interface PlayerAppearanceComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerAppearanceComponentServerFacet(obj: any): obj is PlayerAppearanceComponentServerFacet {
  return obj?.['__type'] === 'PlayerAppearanceComponentServerFacet'
}

export interface PlayerAudioProxyComponent {
  __type: string
  baseclass1: AudioProxyComponent
}
export function isPlayerAudioProxyComponent(obj: any): obj is PlayerAudioProxyComponent {
  return obj?.['__type'] === 'PlayerAudioProxyComponent'
}

export interface PlayerAudioProxyComponentClientFacet {
  __type: string
  baseclass1: AudioProxyComponentClientFacet
}
export function isPlayerAudioProxyComponentClientFacet(obj: any): obj is PlayerAudioProxyComponentClientFacet {
  return obj?.['__type'] === 'PlayerAudioProxyComponentClientFacet'
}

export interface AudioProxyComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_trackjointvelocity: boolean
  m_maxtrackingradius: number
}
export function isAudioProxyComponentClientFacet(obj: any): obj is AudioProxyComponentClientFacet {
  return obj?.['__type'] === 'AudioProxyComponentClientFacet'
}

export interface PlayerAudioProxyComponentServerFacet {
  __type: string
  baseclass1: AudioProxyComponentServerFacet
}
export function isPlayerAudioProxyComponentServerFacet(obj: any): obj is PlayerAudioProxyComponentServerFacet {
  return obj?.['__type'] === 'PlayerAudioProxyComponentServerFacet'
}

export interface AudioProxyComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAudioProxyComponentServerFacet(obj: any): obj is AudioProxyComponentServerFacet {
  return obj?.['__type'] === 'AudioProxyComponentServerFacet'
}

export interface AbilityInstanceTrackingComponent {
  __type: string
  baseclass1: FacetedComponent
  m_instancelimits: Array<AbilityInstanceLimit>
}
export function isAbilityInstanceTrackingComponent(obj: any): obj is AbilityInstanceTrackingComponent {
  return obj?.['__type'] === 'AbilityInstanceTrackingComponent'
}

export interface AbilityInstanceTrackingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAbilityInstanceTrackingComponentClientFacet(
  obj: any
): obj is AbilityInstanceTrackingComponentClientFacet {
  return obj?.['__type'] === 'AbilityInstanceTrackingComponentClientFacet'
}

export interface AbilityInstanceTrackingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAbilityInstanceTrackingComponentServerFacet(
  obj: any
): obj is AbilityInstanceTrackingComponentServerFacet {
  return obj?.['__type'] === 'AbilityInstanceTrackingComponentServerFacet'
}

export interface AbilityInstanceLimit {
  __type: string
  m_type: number
  m_maxnuminstances: number
}
export function isAbilityInstanceLimit(obj: any): obj is AbilityInstanceLimit {
  return obj?.['__type'] === 'AbilityInstanceLimit'
}

export interface ActionListComponent {
  __type: string
  baseclass1: FacetedComponent
  m_actiongridnew: Asset
  m_defaulttags: Array<string>
  m_damagetable: SpringboardDataSheetContainer
  m_skinnedmeshentity: LocalEntityRef
  m_controllerdefinition: AzFramework__SimpleAssetReference_LmbrCentral__MannequinControllerDefinitionAsset_
  m_animationdatabase: AzFramework__SimpleAssetReference_LmbrCentral__MannequinAnimationDatabaseAsset_
  m_scopedata: Array<ALCScopeData>
  m_cdfpath: AzFramework__SimpleAssetReference_CharacterDefinitionAsset_
  m_motionparametersmoothingsettings: MotionParameterSmoothingSettings
  m_hitvolumesentity: LocalEntityRef
  m_usegroundslopedeadzone: boolean
  m_groundslopedeadzonemin: number
  m_groundslopedeadzonemax: number
  m_analoglftxinput: string
  m_analoglftyinput: string
  m_analogrgtxinput: string
  m_analogrgtyinput: string
  m_analoglftxdeadzone: number
  m_analoglftydeadzone: number
  m_analogrgtxdeadzone: number
  m_analogrgtydeadzone: number
  m_aimsmoothtime: number
  m_aimfadeinspeed: number
  m_aimfadeoutspeed: number
  m_aimdistancesmoothtime: number
  m_aimdistancemin: number
  m_aimfadeoutangle: number
  m_meleeloscheckverticalangleoffset: number
  m_meleeloscheckoriginheightoverride: number
  m_spawnaction: string
  m_statmultiplierentity: LocalEntityRef
  m_maxmeleevsenvironmentimpactangle: number
}
export function isActionListComponent(obj: any): obj is ActionListComponent {
  return obj?.['__type'] === 'ActionListComponent'
}

export interface ActionListComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_lagswitchtimer: number
  m_throttleinput: boolean
  m_characterintegrationdeltaonlythreshold: number
  m_characterintegrationvelocityfraction: number
  m_characterintegrationdeltafraction: number
}
export function isActionListComponentClientFacet(obj: any): obj is ActionListComponentClientFacet {
  return obj?.['__type'] === 'ActionListComponentClientFacet'
}

export interface ActionListComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_nearbyplayeraoientity: LocalEntityRef
  m_minionspawnerentity: LocalEntityRef
  m_rangedminionspawnerentityid: EntityId
}
export function isActionListComponentServerFacet(obj: any): obj is ActionListComponentServerFacet {
  return obj?.['__type'] === 'ActionListComponentServerFacet'
}

export interface SpringboardDataSheetContainer {
  __type: string
  asset: AzFramework__SimpleAssetReference_MB__DataSheetAsset_
}
export function isSpringboardDataSheetContainer(obj: any): obj is SpringboardDataSheetContainer {
  return obj?.['__type'] === 'SpringboardDataSheetContainer'
}

export interface AzFramework__SimpleAssetReference_MB__DataSheetAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_MB__DataSheetAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_MB__DataSheetAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<MB::DataSheetAsset>'
}

export interface AzFramework__SimpleAssetReference_LmbrCentral__MannequinControllerDefinitionAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_LmbrCentral__MannequinControllerDefinitionAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_LmbrCentral__MannequinControllerDefinitionAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<LmbrCentral::MannequinControllerDefinitionAsset>'
}

export interface AzFramework__SimpleAssetReference_LmbrCentral__MannequinAnimationDatabaseAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_LmbrCentral__MannequinAnimationDatabaseAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_LmbrCentral__MannequinAnimationDatabaseAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<LmbrCentral::MannequinAnimationDatabaseAsset>'
}

export interface AzFramework__SimpleAssetReference_CharacterDefinitionAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_CharacterDefinitionAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_CharacterDefinitionAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<CharacterDefinitionAsset>'
}

export interface MotionParameterSmoothingSettings {
  __type: string
  movementspeedepsilon: number
  groundangleconvergetime: number
  travelangleconvergetime: number
  traveldistanceconvergetime: number
  travelspeedconvergetime: number
  turnangleconvergetime: number
  turnspeedconvergetime: number
  turnspeedscale: number
}
export function isMotionParameterSmoothingSettings(obj: any): obj is MotionParameterSmoothingSettings {
  return obj?.['__type'] === 'MotionParameterSmoothingSettings'
}

export interface TemporaryAffiliationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTemporaryAffiliationComponentClientFacet(obj: any): obj is TemporaryAffiliationComponentClientFacet {
  return obj?.['__type'] === 'TemporaryAffiliationComponentClientFacet'
}

export interface TemporaryAffiliationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_forceenablereplication: boolean
  m_affiliationstoapplyoninstantiation: Array<$$59fe499c_650b_50bd_ac05_909d3d56505c>
}
export function isTemporaryAffiliationComponentServerFacet(obj: any): obj is TemporaryAffiliationComponentServerFacet {
  return obj?.['__type'] === 'TemporaryAffiliationComponentServerFacet'
}

export interface $$362911e7_76a9_4d90_afdd_166b0dbd5f13 {
  __type: string
  baseclass1: FacetedComponent
}
export function is$$362911e7_76a9_4d90_afdd_166b0dbd5f13(obj: any): obj is $$362911e7_76a9_4d90_afdd_166b0dbd5f13 {
  return obj?.['__type'] === '362911e7-76a9-4d90-afdd-166b0dbd5f13'
}

export interface $$3d80df0c_7d0e_4400_a0f1_67c633084755 {
  __type: string
  baseclass1: ClientFacet
}
export function is$$3d80df0c_7d0e_4400_a0f1_67c633084755(obj: any): obj is $$3d80df0c_7d0e_4400_a0f1_67c633084755 {
  return obj?.['__type'] === '3d80df0c-7d0e-4400-a0f1-67c633084755'
}

export interface $$4f7e6c60_63c6_42f4_97a6_1d4ef47b8d7d {
  __type: string
  baseclass1: ServerFacet
}
export function is$$4f7e6c60_63c6_42f4_97a6_1d4ef47b8d7d(obj: any): obj is $$4f7e6c60_63c6_42f4_97a6_1d4ef47b8d7d {
  return obj?.['__type'] === '4f7e6c60-63c6-42f4-97a6-1d4ef47b8d7d'
}

export interface PlaytestUIComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlaytestUIComponent(obj: any): obj is PlaytestUIComponent {
  return obj?.['__type'] === 'PlaytestUIComponent'
}

export interface PlaytestUIComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlaytestUIComponentClientFacet(obj: any): obj is PlaytestUIComponentClientFacet {
  return obj?.['__type'] === 'PlaytestUIComponentClientFacet'
}

export interface PlaytestUIComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlaytestUIComponentServerFacet(obj: any): obj is PlaytestUIComponentServerFacet {
  return obj?.['__type'] === 'PlaytestUIComponentServerFacet'
}

export interface ContractsComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isContractsComponent(obj: any): obj is ContractsComponent {
  return obj?.['__type'] === 'ContractsComponent'
}

export interface ContractsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isContractsComponentClientFacet(obj: any): obj is ContractsComponentClientFacet {
  return obj?.['__type'] === 'ContractsComponentClientFacet'
}

export interface ContractsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isContractsComponentServerFacet(obj: any): obj is ContractsComponentServerFacet {
  return obj?.['__type'] === 'ContractsComponentServerFacet'
}

export interface FishingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isFishingComponent(obj: any): obj is FishingComponent {
  return obj?.['__type'] === 'FishingComponent'
}

export interface FishingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFishingComponentClientFacet(obj: any): obj is FishingComponentClientFacet {
  return obj?.['__type'] === 'FishingComponentClientFacet'
}

export interface FishingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFishingComponentServerFacet(obj: any): obj is FishingComponentServerFacet {
  return obj?.['__type'] === 'FishingComponentServerFacet'
}

export interface EntitlementComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isEntitlementComponent(obj: any): obj is EntitlementComponent {
  return obj?.['__type'] === 'EntitlementComponent'
}

export interface EntitlementComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isEntitlementComponentClientFacet(obj: any): obj is EntitlementComponentClientFacet {
  return obj?.['__type'] === 'EntitlementComponentClientFacet'
}

export interface EntitlementComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isEntitlementComponentServerFacet(obj: any): obj is EntitlementComponentServerFacet {
  return obj?.['__type'] === 'EntitlementComponentServerFacet'
}

export interface ConversationComponent {
  __type: string
  baseclass1: FacetedComponent
  m_objectivesentity: LocalEntityRef
  m_currentnpc: Crc32
  m_currentconversationstateid: Crc32
}
export function isConversationComponent(obj: any): obj is ConversationComponent {
  return obj?.['__type'] === 'ConversationComponent'
}

export interface ConversationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isConversationComponentClientFacet(obj: any): obj is ConversationComponentClientFacet {
  return obj?.['__type'] === 'ConversationComponentClientFacet'
}

export interface ConversationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isConversationComponentServerFacet(obj: any): obj is ConversationComponentServerFacet {
  return obj?.['__type'] === 'ConversationComponentServerFacet'
}

export interface PlayerHomeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playerentity: LocalEntityRef
}
export function isPlayerHomeComponent(obj: any): obj is PlayerHomeComponent {
  return obj?.['__type'] === 'PlayerHomeComponent'
}

export interface PlayerHomeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_debugsetcooldown: number
}
export function isPlayerHomeComponentClientFacet(obj: any): obj is PlayerHomeComponentClientFacet {
  return obj?.['__type'] === 'PlayerHomeComponentClientFacet'
}

export interface PlayerHomeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerHomeComponentServerFacet(obj: any): obj is PlayerHomeComponentServerFacet {
  return obj?.['__type'] === 'PlayerHomeComponentServerFacet'
}

export interface NotificationServiceComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isNotificationServiceComponent(obj: any): obj is NotificationServiceComponent {
  return obj?.['__type'] === 'NotificationServiceComponent'
}

export interface NotificationServiceComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isNotificationServiceComponentClientFacet(obj: any): obj is NotificationServiceComponentClientFacet {
  return obj?.['__type'] === 'NotificationServiceComponentClientFacet'
}

export interface NotificationServiceComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isNotificationServiceComponentServerFacet(obj: any): obj is NotificationServiceComponentServerFacet {
  return obj?.['__type'] === 'NotificationServiceComponentServerFacet'
}

export interface UIActionManagerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isUIActionManagerComponent(obj: any): obj is UIActionManagerComponent {
  return obj?.['__type'] === 'UIActionManagerComponent'
}

export interface UIActionManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isUIActionManagerComponentClientFacet(obj: any): obj is UIActionManagerComponentClientFacet {
  return obj?.['__type'] === 'UIActionManagerComponentClientFacet'
}

export interface UIActionManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isUIActionManagerComponentServerFacet(obj: any): obj is UIActionManagerComponentServerFacet {
  return obj?.['__type'] === 'UIActionManagerComponentServerFacet'
}

export interface CameraLockComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isCameraLockComponent(obj: any): obj is CameraLockComponent {
  return obj?.['__type'] === 'CameraLockComponent'
}

export interface CameraLockComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_closerangescan: Cylinder
  m_midrangescan: Wedge
  m_precisionscan: OBB
  m_maxlockrange: number
  m_toggleinput: string
  m_toggleonpressorrelease: boolean
  m_toggleonpressorreleaseplayersetting: string
  m_nexttargetcwinput: string
  m_nexttargetccwinput: string
  m_disabledoninit: boolean
  m_requirealltargetsvisible: boolean
  m_requireonscreen: boolean
  m_cameraoffset: Array<number>
  m_useplayerfacing: boolean
  m_targetswitchinterpolationtime: number
  m_targetloslosstime: number
  m_mousemovementtrackingtime: number
  m_mousexmovementthreshold: number
  m_mouseymovementthreshold: number
  m_mousemovementtrackingignoretime: number
  m_mousemovementinnerzonemaxangle: number
  m_mousemovementouterzonemaxangle: number
  m_mousemovementinnerzonexsize: number
  m_mousemovementinnerzoneysize: number
}
export function isCameraLockComponentClientFacet(obj: any): obj is CameraLockComponentClientFacet {
  return obj?.['__type'] === 'CameraLockComponentClientFacet'
}

export interface Cylinder {
  __type: string
  baseclass1: Wedge
}
export function isCylinder(obj: any): obj is Cylinder {
  return obj?.['__type'] === 'Cylinder'
}

export interface Wedge {
  __type: string
  baseclass1: Base
  m_radius: number
  m_height: number
  m_maxangle: number
  m_heightsubweight: number
  m_radiussubweight: number
  m_anglesubweight: number
}
export function isWedge(obj: any): obj is Wedge {
  return obj?.['__type'] === 'Wedge'
}

export interface Base {
  __type: string
  m_scanweight: number
}
export function isBase(obj: any): obj is Base {
  return obj?.['__type'] === 'Base'
}

export interface OBB {
  __type: string
  baseclass1: Base
  m_length: number
  m_width: number
  m_height: number
  m_lengthsubweight: number
  m_widthsubweight: number
  m_heightsubweight: number
}
export function isOBB(obj: any): obj is OBB {
  return obj?.['__type'] === 'OBB'
}

export interface CameraLockComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCameraLockComponentServerFacet(obj: any): obj is CameraLockComponentServerFacet {
  return obj?.['__type'] === 'CameraLockComponentServerFacet'
}

export interface ObjectivesComponent {
  __type: string
  baseclass1: FacetedComponent
  m_objectivesenabled: boolean
  m_ispoiobjectivescomponent: boolean
  m_participanttrackerid: EntityId
  m_territorydetectorref: LocalEntityRef
}
export function isObjectivesComponent(obj: any): obj is ObjectivesComponent {
  return obj?.['__type'] === 'ObjectivesComponent'
}

export interface ObjectivesComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isObjectivesComponentClientFacet(obj: any): obj is ObjectivesComponentClientFacet {
  return obj?.['__type'] === 'ObjectivesComponentClientFacet'
}

export interface ObjectivesComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isObjectivesComponentServerFacet(obj: any): obj is ObjectivesComponentServerFacet {
  return obj?.['__type'] === 'ObjectivesComponentServerFacet'
}

export interface BuilderComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isBuilderComponent(obj: any): obj is BuilderComponent {
  return obj?.['__type'] === 'BuilderComponent'
}

export interface BuilderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBuilderComponentClientFacet(obj: any): obj is BuilderComponentClientFacet {
  return obj?.['__type'] === 'BuilderComponentClientFacet'
}

export interface BuilderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBuilderComponentServerFacet(obj: any): obj is BuilderComponentServerFacet {
  return obj?.['__type'] === 'BuilderComponentServerFacet'
}

export interface GameModeParticipantComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGameModeParticipantComponent(obj: any): obj is GameModeParticipantComponent {
  return obj?.['__type'] === 'GameModeParticipantComponent'
}

export interface GameModeParticipantComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGameModeParticipantComponentClientFacet(obj: any): obj is GameModeParticipantComponentClientFacet {
  return obj?.['__type'] === 'GameModeParticipantComponentClientFacet'
}

export interface GameModeParticipantComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGameModeParticipantComponentServerFacet(obj: any): obj is GameModeParticipantComponentServerFacet {
  return obj?.['__type'] === 'GameModeParticipantComponentServerFacet'
}

export interface CampingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isCampingComponent(obj: any): obj is CampingComponent {
  return obj?.['__type'] === 'CampingComponent'
}

export interface CampingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCampingComponentClientFacet(obj: any): obj is CampingComponentClientFacet {
  return obj?.['__type'] === 'CampingComponentClientFacet'
}

export interface CampingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_playerhomeentity: LocalEntityRef
  m_playerentity: LocalEntityRef
  m_groupsentity: LocalEntityRef
}
export function isCampingComponentServerFacet(obj: any): obj is CampingComponentServerFacet {
  return obj?.['__type'] === 'CampingComponentServerFacet'
}

export interface InteractorComponent {
  __type: string
  baseclass1: FacetedComponent
  m_emptyinteractref: RemoteTypelessServerFacetRef
}
export function isInteractorComponent(obj: any): obj is InteractorComponent {
  return obj?.['__type'] === 'InteractorComponent'
}

export interface InteractorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isInteractorComponentClientFacet(obj: any): obj is InteractorComponentClientFacet {
  return obj?.['__type'] === 'InteractorComponentClientFacet'
}

export interface InteractorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isInteractorComponentServerFacet(obj: any): obj is InteractorComponentServerFacet {
  return obj?.['__type'] === 'InteractorComponentServerFacet'
}

export interface InteractorUIComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isInteractorUIComponent(obj: any): obj is InteractorUIComponent {
  return obj?.['__type'] === 'InteractorUIComponent'
}

export interface InteractorUIComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_playerentity: LocalEntityRef
  m_playerhomeentity: LocalEntityRef
  m_paperdollentity: LocalEntityRef
  m_interactorentity: LocalEntityRef
  m_craftingentity: LocalEntityRef
  m_repaircomponententity: LocalEntityRef
  m_inventorycontainerentity: LocalEntityRef
  m_uiactionmanagerentity: LocalEntityRef
  m_currencyconversionentity: LocalEntityRef
  m_currencyentityid: EntityId
  m_campingentity: LocalEntityRef
  m_playertradeentity: LocalEntityRef
  m_objectivesentity: LocalEntityRef
}
export function isInteractorUIComponentClientFacet(obj: any): obj is InteractorUIComponentClientFacet {
  return obj?.['__type'] === 'InteractorUIComponentClientFacet'
}

export interface InteractorUIComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isInteractorUIComponentServerFacet(obj: any): obj is InteractorUIComponentServerFacet {
  return obj?.['__type'] === 'InteractorUIComponentServerFacet'
}

export interface TimeComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTimeComponent(obj: any): obj is TimeComponent {
  return obj?.['__type'] === 'TimeComponent'
}

export interface TimeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTimeComponentClientFacet(obj: any): obj is TimeComponentClientFacet {
  return obj?.['__type'] === 'TimeComponentClientFacet'
}

export interface TimeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_synctoallclients: boolean
}
export function isTimeComponentServerFacet(obj: any): obj is TimeComponentServerFacet {
  return obj?.['__type'] === 'TimeComponentServerFacet'
}

export interface TrackableComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTrackableComponent(obj: any): obj is TrackableComponent {
  return obj?.['__type'] === 'TrackableComponent'
}

export interface TrackableComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTrackableComponentClientFacet(obj: any): obj is TrackableComponentClientFacet {
  return obj?.['__type'] === 'TrackableComponentClientFacet'
}

export interface TrackableComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTrackableComponentServerFacet(obj: any): obj is TrackableComponentServerFacet {
  return obj?.['__type'] === 'TrackableComponentServerFacet'
}

export interface AttributeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_prereloadattributes: []
}
export function isAttributeComponent(obj: any): obj is AttributeComponent {
  return obj?.['__type'] === 'AttributeComponent'
}

export interface AttributeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_pendingspentpoints: []
  m_totalpendingspentpoints: number
  m_totalspentpoints: number
  m_cachedspentpoints: []
  m_cachedattributes: []
  m_cachedunspentpoints: number
}
export function isAttributeComponentClientFacet(obj: any): obj is AttributeComponentClientFacet {
  return obj?.['__type'] === 'AttributeComponentClientFacet'
}

export interface AttributeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAttributeComponentServerFacet(obj: any): obj is AttributeComponentServerFacet {
  return obj?.['__type'] === 'AttributeComponentServerFacet'
}

export interface CombatStatusComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
}
export function isCombatStatusComponent(obj: any): obj is CombatStatusComponent {
  return obj?.['__type'] === 'CombatStatusComponent'
}

export interface CombatStatusComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCombatStatusComponentClientFacet(obj: any): obj is CombatStatusComponentClientFacet {
  return obj?.['__type'] === 'CombatStatusComponentClientFacet'
}

export interface CombatStatusComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_combatdurationseconds: number
  m_activecombattimerseconds: number
  m_killedtargettimerseconds: number
}
export function isCombatStatusComponentServerFacet(obj: any): obj is CombatStatusComponentServerFacet {
  return obj?.['__type'] === 'CombatStatusComponentServerFacet'
}

export interface HUDComponent {
  __type: string
  baseclass1: FacetedComponent
  m_vitalsentity: LocalEntityRef
  m_staminaentity: LocalEntityRef
  m_cooldowntimersentity: LocalEntityRef
  m_interactorentity: LocalEntityRef
  m_eventnotificationentity: LocalEntityRef
  m_socialentity: LocalEntityRef
  m_inventoryentity: LocalEntityRef
  m_craftingentity: LocalEntityRef
  m_builderentity: LocalEntityRef
  m_repairentity: LocalEntityRef
  m_paperdollentity: LocalEntityRef
  m_currencyconversionentity: LocalEntityRef
  m_gatheringentity: LocalEntityRef
  m_playerentity: LocalEntityRef
  m_objectiveentity: LocalEntityRef
}
export function isHUDComponent(obj: any): obj is HUDComponent {
  return obj?.['__type'] === 'HUDComponent'
}

export interface HUDComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isHUDComponentClientFacet(obj: any): obj is HUDComponentClientFacet {
  return obj?.['__type'] === 'HUDComponentClientFacet'
}

export interface HUDComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isHUDComponentServerFacet(obj: any): obj is HUDComponentServerFacet {
  return obj?.['__type'] === 'HUDComponentServerFacet'
}

export interface TransactionComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTransactionComponent(obj: any): obj is TransactionComponent {
  return obj?.['__type'] === 'TransactionComponent'
}

export interface TransactionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTransactionComponentClientFacet(obj: any): obj is TransactionComponentClientFacet {
  return obj?.['__type'] === 'TransactionComponentClientFacet'
}

export interface TransactionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTransactionComponentServerFacet(obj: any): obj is TransactionComponentServerFacet {
  return obj?.['__type'] === 'TransactionComponentServerFacet'
}

export interface PlayerTradeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playerentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
}
export function isPlayerTradeComponent(obj: any): obj is PlayerTradeComponent {
  return obj?.['__type'] === 'PlayerTradeComponent'
}

export interface PlayerTradeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerTradeComponentClientFacet(obj: any): obj is PlayerTradeComponentClientFacet {
  return obj?.['__type'] === 'PlayerTradeComponentClientFacet'
}

export interface PlayerTradeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerTradeComponentServerFacet(obj: any): obj is PlayerTradeComponentServerFacet {
  return obj?.['__type'] === 'PlayerTradeComponentServerFacet'
}

export interface PlayerSettingsComponent {
  __type: string
  baseclass1: FacetedComponent
  m_settings: Array<PlayerSetting>
}
export function isPlayerSettingsComponent(obj: any): obj is PlayerSettingsComponent {
  return obj?.['__type'] === 'PlayerSettingsComponent'
}

export interface PlayerSettingsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerSettingsComponentClientFacet(obj: any): obj is PlayerSettingsComponentClientFacet {
  return obj?.['__type'] === 'PlayerSettingsComponentClientFacet'
}

export interface PlayerSettingsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerSettingsComponentServerFacet(obj: any): obj is PlayerSettingsComponentServerFacet {
  return obj?.['__type'] === 'PlayerSettingsComponentServerFacet'
}

export interface PlayerSetting {
  __type: string
  m_name: string
  m_consolevarname: string
  m_helptext: string
  m_defaultvalue: boolean
  m_sourceint: number
}
export function isPlayerSetting(obj: any): obj is PlayerSetting {
  return obj?.['__type'] === 'PlayerSetting'
}

export interface UnstuckComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isUnstuckComponent(obj: any): obj is UnstuckComponent {
  return obj?.['__type'] === 'UnstuckComponent'
}

export interface UnstuckComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isUnstuckComponentClientFacet(obj: any): obj is UnstuckComponentClientFacet {
  return obj?.['__type'] === 'UnstuckComponentClientFacet'
}

export interface UnstuckComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isUnstuckComponentServerFacet(obj: any): obj is UnstuckComponentServerFacet {
  return obj?.['__type'] === 'UnstuckComponentServerFacet'
}

export interface ActivateVirtualInputComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isActivateVirtualInputComponent(obj: any): obj is ActivateVirtualInputComponent {
  return obj?.['__type'] === 'ActivateVirtualInputComponent'
}

export interface ActivateVirtualInputComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isActivateVirtualInputComponentClientFacet(obj: any): obj is ActivateVirtualInputComponentClientFacet {
  return obj?.['__type'] === 'ActivateVirtualInputComponentClientFacet'
}

export interface ActivateVirtualInputComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isActivateVirtualInputComponentServerFacet(obj: any): obj is ActivateVirtualInputComponentServerFacet {
  return obj?.['__type'] === 'ActivateVirtualInputComponentServerFacet'
}

export interface SpectatorModeComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSpectatorModeComponent(obj: any): obj is SpectatorModeComponent {
  return obj?.['__type'] === 'SpectatorModeComponent'
}

export interface SpectatorModeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSpectatorModeComponentClientFacet(obj: any): obj is SpectatorModeComponentClientFacet {
  return obj?.['__type'] === 'SpectatorModeComponentClientFacet'
}

export interface SpectatorModeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSpectatorModeComponentServerFacet(obj: any): obj is SpectatorModeComponentServerFacet {
  return obj?.['__type'] === 'SpectatorModeComponentServerFacet'
}

export interface ReactionTrackingComponent {
  __type: string
  baseclass1: FacetedComponent
  m_exitreactiondelayseconds: number
}
export function isReactionTrackingComponent(obj: any): obj is ReactionTrackingComponent {
  return obj?.['__type'] === 'ReactionTrackingComponent'
}

export interface ReactionTrackingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isReactionTrackingComponentClientFacet(obj: any): obj is ReactionTrackingComponentClientFacet {
  return obj?.['__type'] === 'ReactionTrackingComponentClientFacet'
}

export interface ReactionTrackingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isReactionTrackingComponentServerFacet(obj: any): obj is ReactionTrackingComponentServerFacet {
  return obj?.['__type'] === 'ReactionTrackingComponentServerFacet'
}

export interface MetaAchievementComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isMetaAchievementComponent(obj: any): obj is MetaAchievementComponent {
  return obj?.['__type'] === 'MetaAchievementComponent'
}

export interface MetaAchievementComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMetaAchievementComponentClientFacet(obj: any): obj is MetaAchievementComponentClientFacet {
  return obj?.['__type'] === 'MetaAchievementComponentClientFacet'
}

export interface MetaAchievementComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMetaAchievementComponentServerFacet(obj: any): obj is MetaAchievementComponentServerFacet {
  return obj?.['__type'] === 'MetaAchievementComponentServerFacet'
}

export interface FxScriptComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isFxScriptComponent(obj: any): obj is FxScriptComponent {
  return obj?.['__type'] === 'FxScriptComponent'
}

export interface FxScriptComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_scriptlists: Array<FxScriptListWrapper>
  m_fxscripts: Array<Asset>
  m_runoninitfxlist: Array<string>
  m_runontriggerfxlist: Array<string>
  m_materialassets: Array<FxScriptMaterialRefHelper>
  m_fxscriptinitialized: boolean
  m_fxscripttriggered: boolean
}
export function isFxScriptComponentClientFacet(obj: any): obj is FxScriptComponentClientFacet {
  return obj?.['__type'] === 'FxScriptComponentClientFacet'
}

export interface FxScriptListWrapper {
  __type: string
  m_scriptlist: SpringboardStyleSheetContainer
}
export function isFxScriptListWrapper(obj: any): obj is FxScriptListWrapper {
  return obj?.['__type'] === 'FxScriptListWrapper'
}

export interface SpringboardStyleSheetContainer {
  __type: string
  asset: AzFramework__SimpleAssetReference_MB__StyleSheetAsset_
}
export function isSpringboardStyleSheetContainer(obj: any): obj is SpringboardStyleSheetContainer {
  return obj?.['__type'] === 'SpringboardStyleSheetContainer'
}

export interface AzFramework__SimpleAssetReference_MB__StyleSheetAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_MB__StyleSheetAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_MB__StyleSheetAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<MB::StyleSheetAsset>'
}

export interface FxScriptMaterialRefHelper {
  __type: string
  m_assetref: AzFramework__SimpleAssetReference_MB__MaterialOverrideAsset_
  m_key: string
}
export function isFxScriptMaterialRefHelper(obj: any): obj is FxScriptMaterialRefHelper {
  return obj?.['__type'] === 'FxScriptMaterialRefHelper'
}

export interface FxScriptComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFxScriptComponentServerFacet(obj: any): obj is FxScriptComponentServerFacet {
  return obj?.['__type'] === 'FxScriptComponentServerFacet'
}

export interface DebugComponent {
  __type: string
  baseclass1: FacetedComponent
  m_rootentityid: EntityId
  m_overridecamerarelativemotion: boolean
  m_camerarelativemotionspeed: Array<number>
  m_camerarelativemotionaccel: Array<number>
  m_camerarelativemotiondecel: Array<number>
  m_isignoredbyai: boolean
}
export function isDebugComponent(obj: any): obj is DebugComponent {
  return obj?.['__type'] === 'DebugComponent'
}

export interface DebugComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_groupaction: number
  m_remoteplayerdatarequestid: string
}
export function isDebugComponentClientFacet(obj: any): obj is DebugComponentClientFacet {
  return obj?.['__type'] === 'DebugComponentClientFacet'
}

export interface DebugComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDebugComponentServerFacet(obj: any): obj is DebugComponentServerFacet {
  return obj?.['__type'] === 'DebugComponentServerFacet'
}

export interface CriticalHitsComponent {
  __type: string
  baseclass1: FacetedComponent
  m_inactivitytime: number
}
export function isCriticalHitsComponent(obj: any): obj is CriticalHitsComponent {
  return obj?.['__type'] === 'CriticalHitsComponent'
}

export interface CriticalHitsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCriticalHitsComponentClientFacet(obj: any): obj is CriticalHitsComponentClientFacet {
  return obj?.['__type'] === 'CriticalHitsComponentClientFacet'
}

export interface CriticalHitsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCriticalHitsComponentServerFacet(obj: any): obj is CriticalHitsComponentServerFacet {
  return obj?.['__type'] === 'CriticalHitsComponentServerFacet'
}

export interface PlayerDataBroadcastComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerDataBroadcastComponent(obj: any): obj is PlayerDataBroadcastComponent {
  return obj?.['__type'] === 'PlayerDataBroadcastComponent'
}

export interface PlayerDataBroadcastComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerDataBroadcastComponentClientFacet(obj: any): obj is PlayerDataBroadcastComponentClientFacet {
  return obj?.['__type'] === 'PlayerDataBroadcastComponentClientFacet'
}

export interface PlayerDataBroadcastComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerDataBroadcastComponentServerFacet(obj: any): obj is PlayerDataBroadcastComponentServerFacet {
  return obj?.['__type'] === 'PlayerDataBroadcastComponentServerFacet'
}

export interface MagicComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isMagicComponent(obj: any): obj is MagicComponent {
  return obj?.['__type'] === 'MagicComponent'
}

export interface MagicComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMagicComponentClientFacet(obj: any): obj is MagicComponentClientFacet {
  return obj?.['__type'] === 'MagicComponentClientFacet'
}

export interface MagicComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMagicComponentServerFacet(obj: any): obj is MagicComponentServerFacet {
  return obj?.['__type'] === 'MagicComponentServerFacet'
}

export interface ItemDropComponent {
  __type: string
  baseclass1: FacetedComponent
  m_prefabspawnerentity: LocalEntityRef
  m_prefabspawnerentityhouse: LocalEntityRef
  m_instancedprefabspawnerentity: LocalEntityRef
  m_containertransferentity: LocalEntityRef
  m_paperdollentity: LocalEntityRef
  m_inventoryentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
}
export function isItemDropComponent(obj: any): obj is ItemDropComponent {
  return obj?.['__type'] === 'ItemDropComponent'
}

export interface ItemDropComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isItemDropComponentClientFacet(obj: any): obj is ItemDropComponentClientFacet {
  return obj?.['__type'] === 'ItemDropComponentClientFacet'
}

export interface ItemDropComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isItemDropComponentServerFacet(obj: any): obj is ItemDropComponentServerFacet {
  return obj?.['__type'] === 'ItemDropComponentServerFacet'
}

export interface PerkConditionComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPerkConditionComponent(obj: any): obj is PerkConditionComponent {
  return obj?.['__type'] === 'PerkConditionComponent'
}

export interface PerkConditionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPerkConditionComponentClientFacet(obj: any): obj is PerkConditionComponentClientFacet {
  return obj?.['__type'] === 'PerkConditionComponentClientFacet'
}

export interface PerkConditionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPerkConditionComponentServerFacet(obj: any): obj is PerkConditionComponentServerFacet {
  return obj?.['__type'] === 'PerkConditionComponentServerFacet'
}

export interface EmoteControllerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isEmoteControllerComponent(obj: any): obj is EmoteControllerComponent {
  return obj?.['__type'] === 'EmoteControllerComponent'
}

export interface EmoteControllerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isEmoteControllerComponentClientFacet(obj: any): obj is EmoteControllerComponentClientFacet {
  return obj?.['__type'] === 'EmoteControllerComponentClientFacet'
}

export interface EmoteControllerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isEmoteControllerComponentServerFacet(obj: any): obj is EmoteControllerComponentServerFacet {
  return obj?.['__type'] === 'EmoteControllerComponentServerFacet'
}

export interface PlayerPositionTrackingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerPositionTrackingComponent(obj: any): obj is PlayerPositionTrackingComponent {
  return obj?.['__type'] === 'PlayerPositionTrackingComponent'
}

export interface PlayerPositionTrackingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerPositionTrackingComponentClientFacet(
  obj: any
): obj is PlayerPositionTrackingComponentClientFacet {
  return obj?.['__type'] === 'PlayerPositionTrackingComponentClientFacet'
}

export interface PlayerPositionTrackingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_distributionaoiradius: number
  m_reportingdistancethresholdmeters: number
  m_timebetweenreportsmillis: number
}
export function isPlayerPositionTrackingComponentServerFacet(
  obj: any
): obj is PlayerPositionTrackingComponentServerFacet {
  return obj?.['__type'] === 'PlayerPositionTrackingComponentServerFacet'
}

export interface WorldBoundTrackerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_statuseffect: EffectData
}
export function isWorldBoundTrackerComponent(obj: any): obj is WorldBoundTrackerComponent {
  return obj?.['__type'] === 'WorldBoundTrackerComponent'
}

export interface WorldBoundTrackerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_sliceasset: Asset
  m_boundspawndistance: number
  m_boundwallheight: number
  m_boundspawndistancesq: number
}
export function isWorldBoundTrackerComponentClientFacet(obj: any): obj is WorldBoundTrackerComponentClientFacet {
  return obj?.['__type'] === 'WorldBoundTrackerComponentClientFacet'
}

export interface WorldBoundTrackerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isWorldBoundTrackerComponentServerFacet(obj: any): obj is WorldBoundTrackerComponentServerFacet {
  return obj?.['__type'] === 'WorldBoundTrackerComponentServerFacet'
}

export interface PlayerInputFiltersComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerInputFiltersComponent(obj: any): obj is PlayerInputFiltersComponent {
  return obj?.['__type'] === 'PlayerInputFiltersComponent'
}

export interface PlayerInputFiltersComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_filters: Array<InputFilter>
}
export function isPlayerInputFiltersComponentClientFacet(obj: any): obj is PlayerInputFiltersComponentClientFacet {
  return obj?.['__type'] === 'PlayerInputFiltersComponentClientFacet'
}

export interface InputFilter {
  __type: string
  m_name: string
  m_inverted: boolean
  m_inputstofilter: Array<string>
}
export function isInputFilter(obj: any): obj is InputFilter {
  return obj?.['__type'] === 'InputFilter'
}

export interface PlayerInputFiltersComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerInputFiltersComponentServerFacet(obj: any): obj is PlayerInputFiltersComponentServerFacet {
  return obj?.['__type'] === 'PlayerInputFiltersComponentServerFacet'
}

export interface LootTrackerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isLootTrackerComponent(obj: any): obj is LootTrackerComponent {
  return obj?.['__type'] === 'LootTrackerComponent'
}

export interface LootTrackerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_setresettimeseconds: number
}
export function isLootTrackerComponentClientFacet(obj: any): obj is LootTrackerComponentClientFacet {
  return obj?.['__type'] === 'LootTrackerComponentClientFacet'
}

export interface LootTrackerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_globalstorageentityref: LocalEntityRef
  m_lootdropprefabentityref: LocalEntityRef
}
export function isLootTrackerComponentServerFacet(obj: any): obj is LootTrackerComponentServerFacet {
  return obj?.['__type'] === 'LootTrackerComponentServerFacet'
}

export interface HomingComponent {
  __type: string
  baseclass1: FacetedComponent
  m_ishoming: boolean
}
export function isHomingComponent(obj: any): obj is HomingComponent {
  return obj?.['__type'] === 'HomingComponent'
}

export interface HomingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_targetscanwedge: HomingTargetScanWedge
  m_maxscanrangesquared: number
  m_ignoreguildmembers: boolean
  m_requirealltargetsvisible: boolean
  m_instanceid: EntityId
}
export function isHomingComponentClientFacet(obj: any): obj is HomingComponentClientFacet {
  return obj?.['__type'] === 'HomingComponentClientFacet'
}

export interface HomingTargetScanWedge {
  __type: string
  m_radius: number
  m_height: number
  m_maxangle: number
  m_heightweight: number
  m_radiusweight: number
  m_angleweight: number
  m_minconewidth: number
  m_radiussquared: number
  m_radiussquaredinv: number
  m_heightinv: number
  m_mindotprod: number
  m_dotproddiffinv: number
}
export function isHomingTargetScanWedge(obj: any): obj is HomingTargetScanWedge {
  return obj?.['__type'] === 'HomingTargetScanWedge'
}

export interface HomingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isHomingComponentServerFacet(obj: any): obj is HomingComponentServerFacet {
  return obj?.['__type'] === 'HomingComponentServerFacet'
}

export interface LocalPlayerDebugComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isLocalPlayerDebugComponent(obj: any): obj is LocalPlayerDebugComponent {
  return obj?.['__type'] === 'LocalPlayerDebugComponent'
}

export interface LocalPlayerDebugComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isLocalPlayerDebugComponentClientFacet(obj: any): obj is LocalPlayerDebugComponentClientFacet {
  return obj?.['__type'] === 'LocalPlayerDebugComponentClientFacet'
}

export interface LocalPlayerDebugComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isLocalPlayerDebugComponentServerFacet(obj: any): obj is LocalPlayerDebugComponentServerFacet {
  return obj?.['__type'] === 'LocalPlayerDebugComponentServerFacet'
}

export interface TraversalComponent {
  __type: string
  baseclass1: FacetedComponent
  m_usetraversalraycast: boolean
  m_enablestepup: boolean
  m_enablevault: boolean
  m_enablemantling: boolean
  m_calculatevaultfixup: boolean
  m_alignmentinterpolationtime: number
  m_enablestandresizetest: boolean
  m_enablecrouchresizetest: boolean
  m_enablecrawlresizetest: boolean
  m_charactercontrollerresizeparams: CharacterControllerResizeParams
  m_traversalraycastparams: TraversalRaycastParams
}
export function isTraversalComponent(obj: any): obj is TraversalComponent {
  return obj?.['__type'] === 'TraversalComponent'
}

export interface TraversalComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTraversalComponentClientFacet(obj: any): obj is TraversalComponentClientFacet {
  return obj?.['__type'] === 'TraversalComponentClientFacet'
}

export interface TraversalComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTraversalComponentServerFacet(obj: any): obj is TraversalComponentServerFacet {
  return obj?.['__type'] === 'TraversalComponentServerFacet'
}

export interface CharacterControllerResizeParams {
  __type: string
  m_crouchcapsulehalfheight: number
  m_crawlcapsulehalfheight: number
}
export function isCharacterControllerResizeParams(obj: any): obj is CharacterControllerResizeParams {
  return obj?.['__type'] === 'CharacterControllerResizeParams'
}

export interface TraversalRaycastParams {
  __type: string
  m_playerradius: number
  m_playercapsuleheight: number
  m_sphereradius: number
  m_spherecastbuffer: number
  m_maxslopeangle: number
  m_stepupmindetectionheight: number
  m_stepupmaxdetectionheight: number
  m_stepupdetectionrange: number
  m_stepupcheckstandingspace: boolean
  m_maxstepbaseangle: number
  m_vaultdetectionrange: number
  m_vaultmindetectionheight: number
  m_vaultmaxdetectionheight: number
  m_vaultmaxdistance: number
  m_vaultmindistance: number
  m_vaultmaxlandingheightdiff: number
  m_mantledetectionrange: number
  m_mantlingmindetectionheight: number
  m_mantlingmaxdetectionheight: number
  m_mantleascentcastradius: number
  m_mantleledgecastradius: number
  m_checkmantlestandingspace: boolean
  m_platformcenterdistance: number
  m_platformheightthreshold: number
  m_platformsphereradius: number
  m_minslopeangledot: number
  m_maxstepbaseangledot: number
}
export function isTraversalRaycastParams(obj: any): obj is TraversalRaycastParams {
  return obj?.['__type'] === 'TraversalRaycastParams'
}

export interface RewardTrackComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isRewardTrackComponent(obj: any): obj is RewardTrackComponent {
  return obj?.['__type'] === 'RewardTrackComponent'
}

export interface RewardTrackComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isRewardTrackComponentClientFacet(obj: any): obj is RewardTrackComponentClientFacet {
  return obj?.['__type'] === 'RewardTrackComponentClientFacet'
}

export interface RewardTrackComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isRewardTrackComponentServerFacet(obj: any): obj is RewardTrackComponentServerFacet {
  return obj?.['__type'] === 'RewardTrackComponentServerFacet'
}

export interface SpectatedPlayerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSpectatedPlayerComponent(obj: any): obj is SpectatedPlayerComponent {
  return obj?.['__type'] === 'SpectatedPlayerComponent'
}

export interface SpectatedPlayerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSpectatedPlayerComponentClientFacet(obj: any): obj is SpectatedPlayerComponentClientFacet {
  return obj?.['__type'] === 'SpectatedPlayerComponentClientFacet'
}

export interface SpectatedPlayerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_ispublic: boolean
}
export function isSpectatedPlayerComponentServerFacet(obj: any): obj is SpectatedPlayerComponentServerFacet {
  return obj?.['__type'] === 'SpectatedPlayerComponentServerFacet'
}

export interface AttackHeightRetargetComponent {
  __type: string
  baseclass1: FacetedComponent
  m_skinnedmeshentityid: EntityId
  m_defaultblendintime: number
  m_defaultblendouttime: number
  m_defaultminangledegrees: number
  m_defaultmaxangledegrees: number
  m_defaultupperangleoffsetdegrees: number
  m_defaultlowerangleoffsetdegrees: number
  m_deadzoneangledegrees: number
  m_jointnames: Array<string>
  m_locktargetdironstart: boolean
}
export function isAttackHeightRetargetComponent(obj: any): obj is AttackHeightRetargetComponent {
  return obj?.['__type'] === 'AttackHeightRetargetComponent'
}

export interface AttackHeightRetargetComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAttackHeightRetargetComponentClientFacet(obj: any): obj is AttackHeightRetargetComponentClientFacet {
  return obj?.['__type'] === 'AttackHeightRetargetComponentClientFacet'
}

export interface AttackHeightRetargetComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAttackHeightRetargetComponentServerFacet(obj: any): obj is AttackHeightRetargetComponentServerFacet {
  return obj?.['__type'] === 'AttackHeightRetargetComponentServerFacet'
}

export interface PlayerAOIComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerAOIComponent(obj: any): obj is PlayerAOIComponent {
  return obj?.['__type'] === 'PlayerAOIComponent'
}

export interface PlayerAOIComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerAOIComponentClientFacet(obj: any): obj is PlayerAOIComponentClientFacet {
  return obj?.['__type'] === 'PlayerAOIComponentClientFacet'
}

export interface PlayerAOIComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerAOIComponentServerFacet(obj: any): obj is PlayerAOIComponentServerFacet {
  return obj?.['__type'] === 'PlayerAOIComponentServerFacet'
}

export interface ItemSkinningComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isItemSkinningComponent(obj: any): obj is ItemSkinningComponent {
  return obj?.['__type'] === 'ItemSkinningComponent'
}

export interface ItemSkinningComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isItemSkinningComponentClientFacet(obj: any): obj is ItemSkinningComponentClientFacet {
  return obj?.['__type'] === 'ItemSkinningComponentClientFacet'
}

export interface ItemSkinningComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isItemSkinningComponentServerFacet(obj: any): obj is ItemSkinningComponentServerFacet {
  return obj?.['__type'] === 'ItemSkinningComponentServerFacet'
}

export interface GatheringComponent {
  __type: string
  baseclass1: FacetedComponent
  m_staminacost: number
  m_staminacostcategory: string
  m_durabilitycost: number
  m_onehandedgatheringdistance: number
  m_twohandedgatheringdistance: number
  m_containercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__
  m_paperdollcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PaperdollComponent__void__
  m_interactorcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__InteractorComponent__void__
  m_loottrackerentity: LocalEntityRef
  m_isgatheringwater: boolean
}
export function isGatheringComponent(obj: any): obj is GatheringComponent {
  return obj?.['__type'] === 'GatheringComponent'
}

export interface GatheringComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGatheringComponentClientFacet(obj: any): obj is GatheringComponentClientFacet {
  return obj?.['__type'] === 'GatheringComponentClientFacet'
}

export interface GatheringComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGatheringComponentServerFacet(obj: any): obj is GatheringComponentServerFacet {
  return obj?.['__type'] === 'GatheringComponentServerFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__InteractorComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__InteractorComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__InteractorComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::InteractorComponent>(void)>'
  )
}

export interface CameraLockTargetComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isCameraLockTargetComponent(obj: any): obj is CameraLockTargetComponent {
  return obj?.['__type'] === 'CameraLockTargetComponent'
}

export interface CameraLockTargetComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_isnottargetablewhendead: boolean
  m_isnottargetablewhendeathsdoor: boolean
  m_offset: Array<number>
}
export function isCameraLockTargetComponentClientFacet(obj: any): obj is CameraLockTargetComponentClientFacet {
  return obj?.['__type'] === 'CameraLockTargetComponentClientFacet'
}

export interface CameraLockTargetComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_nottargetableoninit: boolean
}
export function isCameraLockTargetComponentServerFacet(obj: any): obj is CameraLockTargetComponentServerFacet {
  return obj?.['__type'] === 'CameraLockTargetComponentServerFacet'
}

export interface WaterLevelComponent {
  __type: string
  baseclass1: FacetedComponent
  m_waterassetname: string
  m_gatheringduration: number
  m_wateramount: number
  m_displayname: string
  m_interactoptionref: InteractOptionRef
  m_amount: number
}
export function isWaterLevelComponent(obj: any): obj is WaterLevelComponent {
  return obj?.['__type'] === 'WaterLevelComponent'
}

export interface WaterLevelComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_islocalplayer: boolean
  m_waterstatus: number
  m_wasfocused: boolean
  m_gatheringstartremainingtime: number
  m_unifiedinteractoptions: []
}
export function isWaterLevelComponentClientFacet(obj: any): obj is WaterLevelComponentClientFacet {
  return obj?.['__type'] === 'WaterLevelComponentClientFacet'
}

export interface WaterLevelComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isWaterLevelComponentServerFacet(obj: any): obj is WaterLevelComponentServerFacet {
  return obj?.['__type'] === 'WaterLevelComponentServerFacet'
}

export interface InteractOptionRef {
  __type: string
  m_interactoption: string
}
export function isInteractOptionRef(obj: any): obj is InteractOptionRef {
  return obj?.['__type'] === 'InteractOptionRef'
}

export interface FootstepComponent {
  __type: string
  baseclass1: AZ__Component
  'play from bone': boolean
  'always play': boolean
  'raycast collision filter': string
  'override footstep character': string
}
export function isFootstepComponent(obj: any): obj is FootstepComponent {
  return obj?.['__type'] === 'FootstepComponent'
}

export interface HomingTargetComponent {
  __type: string
  baseclass1: FacetedComponent
  m_isvalidhomingoverrridetarget: boolean
}
export function isHomingTargetComponent(obj: any): obj is HomingTargetComponent {
  return obj?.['__type'] === 'HomingTargetComponent'
}

export interface HomingTargetComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_isnottargetablewhendead: boolean
  m_isnottargetablewhendeathsdoor: boolean
  m_offset: Array<number>
}
export function isHomingTargetComponentClientFacet(obj: any): obj is HomingTargetComponentClientFacet {
  return obj?.['__type'] === 'HomingTargetComponentClientFacet'
}

export interface HomingTargetComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_nottargetableoninit: boolean
}
export function isHomingTargetComponentServerFacet(obj: any): obj is HomingTargetComponentServerFacet {
  return obj?.['__type'] === 'HomingTargetComponentServerFacet'
}

export interface MountComponent {
  __type: string
  baseclass1: FacetedComponent
  m_mountentity: LocalEntityRef
  '0x6dc3d9b9': Array<string>
}
export function isMountComponent(obj: any): obj is MountComponent {
  return obj?.['__type'] === 'MountComponent'
}

export interface MountComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMountComponentClientFacet(obj: any): obj is MountComponentClientFacet {
  return obj?.['__type'] === 'MountComponentClientFacet'
}

export interface MountComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMountComponentServerFacet(obj: any): obj is MountComponentServerFacet {
  return obj?.['__type'] === 'MountComponentServerFacet'
}

export interface MotionParameterSmoothingComponent {
  __type: string
  baseclass1: AZ__Component
  settings: MotionParameterSmoothingSettings
}
export function isMotionParameterSmoothingComponent(obj: any): obj is MotionParameterSmoothingComponent {
  return obj?.['__type'] === 'MotionParameterSmoothingComponent'
}

export interface VegetationBendingComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationBendingConfig
}
export function isVegetationBendingComponent(obj: any): obj is VegetationBendingComponent {
  return obj?.['__type'] === 'VegetationBendingComponent'
}

export interface VegetationBendingConfig {
  __type: string
  m_priority: number
  m_radius: number
  m_height: number
  m_shrinkable: number
  m_offset: Array<number>
  m_effectiveheightaboveground: number
}
export function isVegetationBendingConfig(obj: any): obj is VegetationBendingConfig {
  return obj?.['__type'] === 'VegetationBendingConfig'
}

export interface OwnershipMessageComponent {
  __type: string
  baseclass1: FacetedComponent
  m_handledownershipmessages: Array<OwnershipMessageEvent>
}
export function isOwnershipMessageComponent(obj: any): obj is OwnershipMessageComponent {
  return obj?.['__type'] === 'OwnershipMessageComponent'
}

export interface OwnershipMessageComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isOwnershipMessageComponentClientFacet(obj: any): obj is OwnershipMessageComponentClientFacet {
  return obj?.['__type'] === 'OwnershipMessageComponentClientFacet'
}

export interface OwnershipMessageComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_spawnmessagetoowner: string
  m_deathmessagetoowner: string
  m_destroymessagetoowner: string
}
export function isOwnershipMessageComponentServerFacet(obj: any): obj is OwnershipMessageComponentServerFacet {
  return obj?.['__type'] === 'OwnershipMessageComponentServerFacet'
}

export interface EconomyTrackerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isEconomyTrackerComponent(obj: any): obj is EconomyTrackerComponent {
  return obj?.['__type'] === 'EconomyTrackerComponent'
}

export interface EconomyTrackerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isEconomyTrackerComponentClientFacet(obj: any): obj is EconomyTrackerComponentClientFacet {
  return obj?.['__type'] === 'EconomyTrackerComponentClientFacet'
}

export interface EconomyTrackerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isEconomyTrackerComponentServerFacet(obj: any): obj is EconomyTrackerComponentServerFacet {
  return obj?.['__type'] === 'EconomyTrackerComponentServerFacet'
}

export interface VegetationAudioComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isVegetationAudioComponent(obj: any): obj is VegetationAudioComponent {
  return obj?.['__type'] === 'VegetationAudioComponent'
}

export interface PlayerTurretComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playerentityid: EntityId
}
export function isPlayerTurretComponent(obj: any): obj is PlayerTurretComponent {
  return obj?.['__type'] === 'PlayerTurretComponent'
}

export interface PlayerTurretComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerTurretComponentClientFacet(obj: any): obj is PlayerTurretComponentClientFacet {
  return obj?.['__type'] === 'PlayerTurretComponentClientFacet'
}

export interface PlayerTurretComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerTurretComponentServerFacet(obj: any): obj is PlayerTurretComponentServerFacet {
  return obj?.['__type'] === 'PlayerTurretComponentServerFacet'
}

export interface AITargetableComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAITargetableComponent(obj: any): obj is AITargetableComponent {
  return obj?.['__type'] === 'AITargetableComponent'
}

export interface AITargetableComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAITargetableComponentClientFacet(obj: any): obj is AITargetableComponentClientFacet {
  return obj?.['__type'] === 'AITargetableComponentClientFacet'
}

export interface AITargetableComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_subscriberupdatethrottleduration: number
  m_lowhealthpercentthreshold: number
}
export function isAITargetableComponentServerFacet(obj: any): obj is AITargetableComponentServerFacet {
  return obj?.['__type'] === 'AITargetableComponentServerFacet'
}

export interface PlayerCutsceneComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerCutsceneComponent(obj: any): obj is PlayerCutsceneComponent {
  return obj?.['__type'] === 'PlayerCutsceneComponent'
}

export interface PlayerCutsceneComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_cutsceneinfo: CutsceneInfo
  '0x74067768': Asset
}
export function isPlayerCutsceneComponentClientFacet(obj: any): obj is PlayerCutsceneComponentClientFacet {
  return obj?.['__type'] === 'PlayerCutsceneComponentClientFacet'
}

export interface CutsceneInfo {
  __type: string
  m_camerastate: string
  m_camerastateorigin: Array<number>
  m_camerastatelookat: Array<number>
  m_enterblendtime: number
  m_exitblendtime: number
  m_hideuiontrigger: boolean
  m_originenterblendtime: number
  m_originexitblendtime: number
  m_followentity: EntityId
  m_originentity: EntityId
  m_useabsolutepos: boolean
  m_hideplayeravatar: boolean
  m_hidenearbyplayeravatars: boolean
  m_blockplayerinput: boolean
  m_cancelinventory: boolean
  m_interruptincombat: boolean
  m_interruptonmovement: boolean
  m_canskip: boolean
  m_playfadeeffect: boolean
  m_bannertitlelabeltext: string
  m_bannertitletext: string
  m_bannerdescriptiontext: string
  m_oncutscenestartevents: Array<EventData>
  m_oncutscenestoppedevents: Array<EventData>
  m_sourceslicename: string
  '0x9313cd57': Array<number>
  '0x0ef38c9a': Array<number>
  '0xbecb8cdc': boolean
}
export function isCutsceneInfo(obj: any): obj is CutsceneInfo {
  return obj?.['__type'] === 'CutsceneInfo'
}

export interface PlayerCutsceneComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerCutsceneComponentServerFacet(obj: any): obj is PlayerCutsceneComponentServerFacet {
  return obj?.['__type'] === 'PlayerCutsceneComponentServerFacet'
}

export interface MaterialEffectComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isMaterialEffectComponent(obj: any): obj is MaterialEffectComponent {
  return obj?.['__type'] === 'MaterialEffectComponent'
}

export interface MaterialEffectComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMaterialEffectComponentClientFacet(obj: any): obj is MaterialEffectComponentClientFacet {
  return obj?.['__type'] === 'MaterialEffectComponentClientFacet'
}

export interface MaterialEffectComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMaterialEffectComponentServerFacet(obj: any): obj is MaterialEffectComponentServerFacet {
  return obj?.['__type'] === 'MaterialEffectComponentServerFacet'
}

export interface NavMeshConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isNavMeshConstraintComponent(obj: any): obj is NavMeshConstraintComponent {
  return obj?.['__type'] === 'NavMeshConstraintComponent'
}

export interface InputConfigurationComponent {
  __type: string
  baseclass1: AZ__Component
  'input event bindings': Asset
  'input contexts': []
}
export function isInputConfigurationComponent(obj: any): obj is InputConfigurationComponent {
  return obj?.['__type'] === 'InputConfigurationComponent'
}

export interface AudioListenerComponent {
  __type: string
  baseclass1: AZ__Component
  'rotation entity': EntityId
  'position entity': EntityId
  'fixed offset': Array<number>
  'offset ratio': number
}
export function isAudioListenerComponent(obj: any): obj is AudioListenerComponent {
  return obj?.['__type'] === 'AudioListenerComponent'
}

export interface VoiceChatComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isVoiceChatComponent(obj: any): obj is VoiceChatComponent {
  return obj?.['__type'] === 'VoiceChatComponent'
}

export interface VoiceChatComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isVoiceChatComponentClientFacet(obj: any): obj is VoiceChatComponentClientFacet {
  return obj?.['__type'] === 'VoiceChatComponentClientFacet'
}

export interface VoiceChatComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isVoiceChatComponentServerFacet(obj: any): obj is VoiceChatComponentServerFacet {
  return obj?.['__type'] === 'VoiceChatComponentServerFacet'
}

export interface LocalPlayerProjectileTrackerComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isLocalPlayerProjectileTrackerComponent(obj: any): obj is LocalPlayerProjectileTrackerComponent {
  return obj?.['__type'] === 'LocalPlayerProjectileTrackerComponent'
}

export interface JavCameraControllerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isJavCameraControllerComponent(obj: any): obj is JavCameraControllerComponent {
  return obj?.['__type'] === 'JavCameraControllerComponent'
}

export interface JavCameraControllerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_pointcameras: Array<LocalEntityRef>
}
export function isJavCameraControllerComponentClientFacet(obj: any): obj is JavCameraControllerComponentClientFacet {
  return obj?.['__type'] === 'JavCameraControllerComponentClientFacet'
}

export interface JavCameraControllerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isJavCameraControllerComponentServerFacet(obj: any): obj is JavCameraControllerComponentServerFacet {
  return obj?.['__type'] === 'JavCameraControllerComponentServerFacet'
}

export interface HousingDecorationComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isHousingDecorationComponent(obj: any): obj is HousingDecorationComponent {
  return obj?.['__type'] === 'HousingDecorationComponent'
}

export interface CameraEffectsComponent {
  __type: string
  baseclass1: AZ__Component
  shakeonactivate: boolean
  shakerange: number
  shakeid: string
}
export function isCameraEffectsComponent(obj: any): obj is CameraEffectsComponent {
  return obj?.['__type'] === 'CameraEffectsComponent'
}

export interface LimbIKComponent {
  __type: string
  baseclass1: AZ__Component
  settings: LimbIKSettings
  m_characterentityid: EntityId
}
export function isLimbIKComponent(obj: any): obj is LimbIKComponent {
  return obj?.['__type'] === 'LimbIKComponent'
}

export interface LimbIKSettings {
  __type: string
  enabled: boolean
  animationlayer: number
  rootjoint: string
  fadeoutdistancerange: Array<number>
  rootoffsetrange: Array<number>
  blendikspeedrange: Array<number>
  contactraylength: number
  chainmaxverticaloffset: number
  rootsmoothtime: number
  limbs: Array<LimbIKLimbConfig>
}
export function isLimbIKSettings(obj: any): obj is LimbIKSettings {
  return obj?.['__type'] === 'LimbIKSettings'
}

export interface LimbIKLimbConfig {
  __type: string
  jointname: string
  solvername: string
  weightjointname: string
  blendweightsmoothtime: number
  targetsmoothtimeupanddown: Array<number>
  slopenormalsmoothtime: number
  slopeanglelimitdegs: number
  autoblendrange: Array<number>
  autoblendrangescale: number
}
export function isLimbIKLimbConfig(obj: any): obj is LimbIKLimbConfig {
  return obj?.['__type'] === 'LimbIKLimbConfig'
}

export interface StaminaComponent {
  __type: string
  baseclass1: FacetedComponent
  m_min: number
  m_initmax: number
  m_regenrate: number
  m_blockregenrate: number
  m_blockregenrateispercentage: boolean
  m_usevitalsstaminavalues: boolean
  m_maxwindedtime: number
  m_staminacosts: SpringboardDataSheetContainer
  m_listenerentities: []
  m_characterattributeentity: LocalEntityRef
  '0x72cc582e': boolean
  '0x6c716ee8': number
}
export function isStaminaComponent(obj: any): obj is StaminaComponent {
  return obj?.['__type'] === 'StaminaComponent'
}

export interface StaminaComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_blockupdateui: boolean
}
export function isStaminaComponentClientFacet(obj: any): obj is StaminaComponentClientFacet {
  return obj?.['__type'] === 'StaminaComponentClientFacet'
}

export interface StaminaComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isStaminaComponentServerFacet(obj: any): obj is StaminaComponentServerFacet {
  return obj?.['__type'] === 'StaminaComponentServerFacet'
}

export interface StatMultiplierTableComponent {
  __type: string
  baseclass1: FacetedComponent
  decimal_places: number
  m_basevalue: number
  m_paperdollentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
}
export function isStatMultiplierTableComponent(obj: any): obj is StatMultiplierTableComponent {
  return obj?.['__type'] === 'StatMultiplierTableComponent'
}

export interface StatMultiplierTableComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isStatMultiplierTableComponentClientFacet(obj: any): obj is StatMultiplierTableComponentClientFacet {
  return obj?.['__type'] === 'StatMultiplierTableComponentClientFacet'
}

export interface StatMultiplierTableComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isStatMultiplierTableComponentServerFacet(obj: any): obj is StatMultiplierTableComponentServerFacet {
  return obj?.['__type'] === 'StatMultiplierTableComponentServerFacet'
}

export interface StatusEffectsComponent {
  __type: string
  baseclass1: FacetedComponent
  m_paperdollentity: LocalEntityRef
  m_playercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
}
export function isStatusEffectsComponent(obj: any): obj is StatusEffectsComponent {
  return obj?.['__type'] === 'StatusEffectsComponent'
}

export interface StatusEffectsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_selectedeffect: number
}
export function isStatusEffectsComponentClientFacet(obj: any): obj is StatusEffectsComponentClientFacet {
  return obj?.['__type'] === 'StatusEffectsComponentClientFacet'
}

export interface StatusEffectsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_areaafflictionentities: []
  m_initialstatuseffects: Array<EffectData>
}
export function isStatusEffectsComponentServerFacet(obj: any): obj is StatusEffectsComponentServerFacet {
  return obj?.['__type'] === 'StatusEffectsComponentServerFacet'
}

export interface CooldownTimersComponent {
  __type: string
  baseclass1: FacetedComponent
  m_characterattributeentity: LocalEntityRef
  m_cooldowntimersdata: SpringboardDataSheetContainer
}
export function isCooldownTimersComponent(obj: any): obj is CooldownTimersComponent {
  return obj?.['__type'] === 'CooldownTimersComponent'
}

export interface CooldownTimersComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCooldownTimersComponentClientFacet(obj: any): obj is CooldownTimersComponentClientFacet {
  return obj?.['__type'] === 'CooldownTimersComponentClientFacet'
}

export interface CooldownTimersComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCooldownTimersComponentServerFacet(obj: any): obj is CooldownTimersComponentServerFacet {
  return obj?.['__type'] === 'CooldownTimersComponentServerFacet'
}

export interface AbilityComponent {
  __type: string
  baseclass1: FacetedComponent
  m_specialattack1: string
  m_specialattack2: string
  m_specialattack3: string
  m_specialattackhold1: string
  m_specialattackhold2: string
  m_specialattackhold3: string
  m_initialabilities: Array<AbilityEditorData>
  '0xf2e7cb07': Array<string>
  m_disabledattacktypecrcs: Array<Crc32>
}
export function isAbilityComponent(obj: any): obj is AbilityComponent {
  return obj?.['__type'] === 'AbilityComponent'
}

export interface AbilityComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAbilityComponentClientFacet(obj: any): obj is AbilityComponentClientFacet {
  return obj?.['__type'] === 'AbilityComponentClientFacet'
}

export interface AbilityComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAbilityComponentServerFacet(obj: any): obj is AbilityComponentServerFacet {
  return obj?.['__type'] === 'AbilityComponentServerFacet'
}

export interface WeaponAccuracyComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isWeaponAccuracyComponent(obj: any): obj is WeaponAccuracyComponent {
  return obj?.['__type'] === 'WeaponAccuracyComponent'
}

export interface WeaponAccuracyComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isWeaponAccuracyComponentClientFacet(obj: any): obj is WeaponAccuracyComponentClientFacet {
  return obj?.['__type'] === 'WeaponAccuracyComponentClientFacet'
}

export interface WeaponAccuracyComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isWeaponAccuracyComponentServerFacet(obj: any): obj is WeaponAccuracyComponentServerFacet {
  return obj?.['__type'] === 'WeaponAccuracyComponentServerFacet'
}

export interface CombatTextComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isCombatTextComponent(obj: any): obj is CombatTextComponent {
  return obj?.['__type'] === 'CombatTextComponent'
}

export interface CombatTextComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_datatable: SpringboardDataSheetContainer
  m_showcombattextinchat: boolean
}
export function isCombatTextComponentClientFacet(obj: any): obj is CombatTextComponentClientFacet {
  return obj?.['__type'] === 'CombatTextComponentClientFacet'
}

export interface CombatTextComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_sendcombattexttoclients: boolean
}
export function isCombatTextComponentServerFacet(obj: any): obj is CombatTextComponentServerFacet {
  return obj?.['__type'] === 'CombatTextComponentServerFacet'
}

export interface ManaComponent {
  __type: string
  baseclass1: FacetedComponent
  m_min: number
  m_initmax: number
  m_regenrate: number
  m_characterattributeentity: LocalEntityRef
  m_manacosts: SpringboardDataSheetContainer
}
export function isManaComponent(obj: any): obj is ManaComponent {
  return obj?.['__type'] === 'ManaComponent'
}

export interface ManaComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_blockupdateui: boolean
}
export function isManaComponentClientFacet(obj: any): obj is ManaComponentClientFacet {
  return obj?.['__type'] === 'ManaComponentClientFacet'
}

export interface ManaComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isManaComponentServerFacet(obj: any): obj is ManaComponentServerFacet {
  return obj?.['__type'] === 'ManaComponentServerFacet'
}

export interface ChargeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_min: number
  m_initmax: number
  m_decayrate: number
  m_characterattributeentity: LocalEntityRef
}
export function isChargeComponent(obj: any): obj is ChargeComponent {
  return obj?.['__type'] === 'ChargeComponent'
}

export interface ChargeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_blockupdateui: boolean
}
export function isChargeComponentClientFacet(obj: any): obj is ChargeComponentClientFacet {
  return obj?.['__type'] === 'ChargeComponentClientFacet'
}

export interface ChargeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isChargeComponentServerFacet(obj: any): obj is ChargeComponentServerFacet {
  return obj?.['__type'] === 'ChargeComponentServerFacet'
}

export interface FactionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_requestsetpvpflagthrottletimems: number
}
export function isFactionComponent(obj: any): obj is FactionComponent {
  return obj?.['__type'] === 'FactionComponent'
}

export interface FactionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFactionComponentClientFacet(obj: any): obj is FactionComponentClientFacet {
  return obj?.['__type'] === 'FactionComponentClientFacet'
}

export interface FactionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFactionComponentServerFacet(obj: any): obj is FactionComponentServerFacet {
  return obj?.['__type'] === 'FactionComponentServerFacet'
}

export interface WaypointsComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
}
export function isWaypointsComponent(obj: any): obj is WaypointsComponent {
  return obj?.['__type'] === 'WaypointsComponent'
}

export interface WaypointsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isWaypointsComponentClientFacet(obj: any): obj is WaypointsComponentClientFacet {
  return obj?.['__type'] === 'WaypointsComponentClientFacet'
}

export interface WaypointsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isWaypointsComponentServerFacet(obj: any): obj is WaypointsComponentServerFacet {
  return obj?.['__type'] === 'WaypointsComponentServerFacet'
}

export interface GroupsComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
  m_vitalscomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__VitalsComponent__void__
  m_gametransformcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__GameTransformComponent__void__
  m_waypointscomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__WaypointsComponent__void__
}
export function isGroupsComponent(obj: any): obj is GroupsComponent {
  return obj?.['__type'] === 'GroupsComponent'
}

export interface GroupsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGroupsComponentClientFacet(obj: any): obj is GroupsComponentClientFacet {
  return obj?.['__type'] === 'GroupsComponentClientFacet'
}

export interface GroupsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_memberupdatesdelayseconds: number
  m_initialgameeventname: string
}
export function isGroupsComponentServerFacet(obj: any): obj is GroupsComponentServerFacet {
  return obj?.['__type'] === 'GroupsComponentServerFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__VitalsComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__VitalsComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__VitalsComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::VitalsComponent>(void)>'
  )
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__GameTransformComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__GameTransformComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__GameTransformComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::GameTransformComponent>(void)>'
  )
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__WaypointsComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__WaypointsComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__WaypointsComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::WaypointsComponent>(void)>'
  )
}

export interface TwitchComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTwitchComponent(obj: any): obj is TwitchComponent {
  return obj?.['__type'] === 'TwitchComponent'
}

export interface TwitchComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTwitchComponentClientFacet(obj: any): obj is TwitchComponentClientFacet {
  return obj?.['__type'] === 'TwitchComponentClientFacet'
}

export interface TwitchComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTwitchComponentServerFacet(obj: any): obj is TwitchComponentServerFacet {
  return obj?.['__type'] === 'TwitchComponentServerFacet'
}

export interface PlayerNameTagComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayerNameTagComponent(obj: any): obj is PlayerNameTagComponent {
  return obj?.['__type'] === 'PlayerNameTagComponent'
}

export interface PlayerNameTagComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerNameTagComponentClientFacet(obj: any): obj is PlayerNameTagComponentClientFacet {
  return obj?.['__type'] === 'PlayerNameTagComponentClientFacet'
}

export interface PlayerNameTagComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayerNameTagComponentServerFacet(obj: any): obj is PlayerNameTagComponentServerFacet {
  return obj?.['__type'] === 'PlayerNameTagComponentServerFacet'
}

export interface SocialComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSocialComponent(obj: any): obj is SocialComponent {
  return obj?.['__type'] === 'SocialComponent'
}

export interface SocialComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_maxchatdistance: number
  m_maxwavedistance: number
  m_maxwaveanglefromcenter: number
}
export function isSocialComponentClientFacet(obj: any): obj is SocialComponentClientFacet {
  return obj?.['__type'] === 'SocialComponentClientFacet'
}

export interface SocialComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_maxtimetoacceptwave: number
  m_warrequesttimeoutseconds: number
  m_playerhomeentity: LocalEntityRef
  m_v2datapatternmaxcallspermethod: number
}
export function isSocialComponentServerFacet(obj: any): obj is SocialComponentServerFacet {
  return obj?.['__type'] === 'SocialComponentServerFacet'
}

export interface GuildsComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGuildsComponent(obj: any): obj is GuildsComponent {
  return obj?.['__type'] === 'GuildsComponent'
}

export interface GuildsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGuildsComponentClientFacet(obj: any): obj is GuildsComponentClientFacet {
  return obj?.['__type'] === 'GuildsComponentClientFacet'
}

export interface GuildsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGuildsComponentServerFacet(obj: any): obj is GuildsComponentServerFacet {
  return obj?.['__type'] === 'GuildsComponentServerFacet'
}

export interface ChatComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playerentity: LocalEntityRef
}
export function isChatComponent(obj: any): obj is ChatComponent {
  return obj?.['__type'] === 'ChatComponent'
}

export interface ChatComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_mintimebetweenchatmsgsms: number
}
export function isChatComponentClientFacet(obj: any): obj is ChatComponentClientFacet {
  return obj?.['__type'] === 'ChatComponentClientFacet'
}

export interface ChatComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_chatthrottlewindowsize: number
  m_numthrottledchatmessages: number
}
export function isChatComponentServerFacet(obj: any): obj is ChatComponentServerFacet {
  return obj?.['__type'] === 'ChatComponentServerFacet'
}

export interface PlayerGenericInviteComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
}
export function isPlayerGenericInviteComponent(obj: any): obj is PlayerGenericInviteComponent {
  return obj?.['__type'] === 'PlayerGenericInviteComponent'
}

export interface PlayerGenericInviteComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPlayerGenericInviteComponentClientFacet(obj: any): obj is PlayerGenericInviteComponentClientFacet {
  return obj?.['__type'] === 'PlayerGenericInviteComponentClientFacet'
}

export interface P2PTradeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_player: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
}
export function isP2PTradeComponent(obj: any): obj is P2PTradeComponent {
  return obj?.['__type'] === 'P2PTradeComponent'
}

export interface P2PTradeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isP2PTradeComponentClientFacet(obj: any): obj is P2PTradeComponentClientFacet {
  return obj?.['__type'] === 'P2PTradeComponentClientFacet'
}

export interface CurrencyComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playercomponententityid: EntityId
}
export function isCurrencyComponent(obj: any): obj is CurrencyComponent {
  return obj?.['__type'] === 'CurrencyComponent'
}

export interface CurrencyComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCurrencyComponentClientFacet(obj: any): obj is CurrencyComponentClientFacet {
  return obj?.['__type'] === 'CurrencyComponentClientFacet'
}

export interface CurrencyComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCurrencyComponentServerFacet(obj: any): obj is CurrencyComponentServerFacet {
  return obj?.['__type'] === 'CurrencyComponentServerFacet'
}

export interface PaperdollComponent {
  __type: string
  baseclass1: FacetedComponent
  m_initpaperdolldata: Array<InitPaperdollData>
  m_paperdollvisualslotmapping: Array<fd14840b_21bd_5c50_9fac_d20ce0b95474>
  m_inventorycontainercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__
  m_vitalsentity: LocalEntityRef
  m_quickslotentity: LocalEntityRef
  m_onbreakentity: LocalEntityRef
  m_noequipmannequintag: string
  m_rowreference: string
  m_customizablecharacterentity: LocalEntityRef
  m_paperdollasset: Asset
  m_playercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
  m_playertradeentity: LocalEntityRef
}
export function isPaperdollComponent(obj: any): obj is PaperdollComponent {
  return obj?.['__type'] === 'PaperdollComponent'
}

export interface PaperdollComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPaperdollComponentClientFacet(obj: any): obj is PaperdollComponentClientFacet {
  return obj?.['__type'] === 'PaperdollComponentClientFacet'
}

export interface PaperdollComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPaperdollComponentServerFacet(obj: any): obj is PaperdollComponentServerFacet {
  return obj?.['__type'] === 'PaperdollComponentServerFacet'
}

export interface fd14840b_21bd_5c50_9fac_d20ce0b95474 {
  __type: string
  value1: number
  value2: string
}
export function isfd14840b_21bd_5c50_9fac_d20ce0b95474(obj: any): obj is fd14840b_21bd_5c50_9fac_d20ce0b95474 {
  return obj?.['__type'] === 'fd14840b-21bd-5c50-9fac-d20ce0b95474'
}

export interface ItemRepairComponent {
  __type: string
  baseclass1: FacetedComponent
  m_containercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__
  m_paperdollcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PaperdollComponent__void__
  m_tradeskillentity: LocalEntityRef
}
export function isItemRepairComponent(obj: any): obj is ItemRepairComponent {
  return obj?.['__type'] === 'ItemRepairComponent'
}

export interface ItemRepairComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isItemRepairComponentClientFacet(obj: any): obj is ItemRepairComponentClientFacet {
  return obj?.['__type'] === 'ItemRepairComponentClientFacet'
}

export interface ItemRepairComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isItemRepairComponentServerFacet(obj: any): obj is ItemRepairComponentServerFacet {
  return obj?.['__type'] === 'ItemRepairComponentServerFacet'
}

export interface CurrencyConversionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_containercomponententityid: EntityId
  m_interactorcomponententityid: EntityId
  m_globalstoragecomponententityid: EntityId
}
export function isCurrencyConversionComponent(obj: any): obj is CurrencyConversionComponent {
  return obj?.['__type'] === 'CurrencyConversionComponent'
}

export interface CurrencyConversionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCurrencyConversionComponentClientFacet(obj: any): obj is CurrencyConversionComponentClientFacet {
  return obj?.['__type'] === 'CurrencyConversionComponentClientFacet'
}

export interface CurrencyConversionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCurrencyConversionComponentServerFacet(obj: any): obj is CurrencyConversionComponentServerFacet {
  return obj?.['__type'] === 'CurrencyConversionComponentServerFacet'
}

export interface CraftingComponent {
  __type: string
  baseclass1: FacetedComponent
  m_craftingstationasset: Asset
  m_interactorcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__InteractorComponent__void__
  m_playercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PlayerComponent__void__
  m_vitalsentity: LocalEntityRef
  m_paperdollcomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__PaperdollComponent__void__
}
export function isCraftingComponent(obj: any): obj is CraftingComponent {
  return obj?.['__type'] === 'CraftingComponent'
}

export interface CraftingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCraftingComponentClientFacet(obj: any): obj is CraftingComponentClientFacet {
  return obj?.['__type'] === 'CraftingComponentClientFacet'
}

export interface CraftingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCraftingComponentServerFacet(obj: any): obj is CraftingComponentServerFacet {
  return obj?.['__type'] === 'CraftingComponentServerFacet'
}

export interface IncapacitatedCharacterComponent {
  __type: string
  baseclass1: FacetedComponent
  m_targetentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
}
export function isIncapacitatedCharacterComponent(obj: any): obj is IncapacitatedCharacterComponent {
  return obj?.['__type'] === 'IncapacitatedCharacterComponent'
}

export interface IncapacitatedCharacterComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isIncapacitatedCharacterComponentClientFacet(
  obj: any
): obj is IncapacitatedCharacterComponentClientFacet {
  return obj?.['__type'] === 'IncapacitatedCharacterComponentClientFacet'
}

export interface IncapacitatedCharacterComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isIncapacitatedCharacterComponentServerFacet(
  obj: any
): obj is IncapacitatedCharacterComponentServerFacet {
  return obj?.['__type'] === 'IncapacitatedCharacterComponentServerFacet'
}

export interface ContainerTransferComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isContainerTransferComponent(obj: any): obj is ContainerTransferComponent {
  return obj?.['__type'] === 'ContainerTransferComponent'
}

export interface ContainerTransferComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isContainerTransferComponentClientFacet(obj: any): obj is ContainerTransferComponentClientFacet {
  return obj?.['__type'] === 'ContainerTransferComponentClientFacet'
}

export interface ContainerTransferComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_fromcontainers: Array<LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__>
  m_tocontainer: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__ContainerComponent__void__
}
export function isContainerTransferComponentServerFacet(obj: any): obj is ContainerTransferComponentServerFacet {
  return obj?.['__type'] === 'ContainerTransferComponentServerFacet'
}

export interface CategoricalProgressionComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isCategoricalProgressionComponent(obj: any): obj is CategoricalProgressionComponent {
  return obj?.['__type'] === 'CategoricalProgressionComponent'
}

export interface CategoricalProgressionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isCategoricalProgressionComponentClientFacet(
  obj: any
): obj is CategoricalProgressionComponentClientFacet {
  return obj?.['__type'] === 'CategoricalProgressionComponentClientFacet'
}

export interface CategoricalProgressionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCategoricalProgressionComponentServerFacet(
  obj: any
): obj is CategoricalProgressionComponentServerFacet {
  return obj?.['__type'] === 'CategoricalProgressionComponentServerFacet'
}

export interface ContributionTrackerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_vitalsentityid: EntityId
  m_prefabspawnerentityref: LocalEntityRef
}
export function isContributionTrackerComponent(obj: any): obj is ContributionTrackerComponent {
  return obj?.['__type'] === 'ContributionTrackerComponent'
}

export interface ContributionTrackerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isContributionTrackerComponentClientFacet(obj: any): obj is ContributionTrackerComponentClientFacet {
  return obj?.['__type'] === 'ContributionTrackerComponentClientFacet'
}

export interface ContributionTrackerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_contributionpointsheet: SpringboardDataSheetContainer
  m_categories: Array<string>
  m_gatherablecontrollerid: EntityId
  m_registerforvitalsevents: boolean
  m_mutatorrewardspawnposoverride: Array<number>
}
export function isContributionTrackerComponentServerFacet(obj: any): obj is ContributionTrackerComponentServerFacet {
  return obj?.['__type'] === 'ContributionTrackerComponentServerFacet'
}

export interface AchievementComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAchievementComponent(obj: any): obj is AchievementComponent {
  return obj?.['__type'] === 'AchievementComponent'
}

export interface AchievementComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAchievementComponentClientFacet(obj: any): obj is AchievementComponentClientFacet {
  return obj?.['__type'] === 'AchievementComponentClientFacet'
}

export interface AchievementComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAchievementComponentServerFacet(obj: any): obj is AchievementComponentServerFacet {
  return obj?.['__type'] === 'AchievementComponentServerFacet'
}

export interface ProgressionPointComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isProgressionPointComponent(obj: any): obj is ProgressionPointComponent {
  return obj?.['__type'] === 'ProgressionPointComponent'
}

export interface ProgressionPointComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isProgressionPointComponentClientFacet(obj: any): obj is ProgressionPointComponentClientFacet {
  return obj?.['__type'] === 'ProgressionPointComponentClientFacet'
}

export interface ProgressionPointComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isProgressionPointComponentServerFacet(obj: any): obj is ProgressionPointComponentServerFacet {
  return obj?.['__type'] === 'ProgressionPointComponentServerFacet'
}

export interface GameEventComponent {
  __type: string
  baseclass1: FacetedComponent
  m_gameeventdatabase: Asset
  m_combateventbusentity: LocalEntityRef
}
export function isGameEventComponent(obj: any): obj is GameEventComponent {
  return obj?.['__type'] === 'GameEventComponent'
}

export interface GameEventComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGameEventComponentClientFacet(obj: any): obj is GameEventComponentClientFacet {
  return obj?.['__type'] === 'GameEventComponentClientFacet'
}

export interface GameEventComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_progressionentity: LocalEntityRef
}
export function isGameEventComponentServerFacet(obj: any): obj is GameEventComponentServerFacet {
  return obj?.['__type'] === 'GameEventComponentServerFacet'
}

export interface ContributionComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isContributionComponent(obj: any): obj is ContributionComponent {
  return obj?.['__type'] === 'ContributionComponent'
}

export interface ContributionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isContributionComponentClientFacet(obj: any): obj is ContributionComponentClientFacet {
  return obj?.['__type'] === 'ContributionComponentClientFacet'
}

export interface ContributionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isContributionComponentServerFacet(obj: any): obj is ContributionComponentServerFacet {
  return obj?.['__type'] === 'ContributionComponentServerFacet'
}

export interface ProgressionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_deathlosspercentage: number
}
export function isProgressionComponent(obj: any): obj is ProgressionComponent {
  return obj?.['__type'] === 'ProgressionComponent'
}

export interface ProgressionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isProgressionComponentClientFacet(obj: any): obj is ProgressionComponentClientFacet {
  return obj?.['__type'] === 'ProgressionComponentClientFacet'
}

export interface ProgressionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isProgressionComponentServerFacet(obj: any): obj is ProgressionComponentServerFacet {
  return obj?.['__type'] === 'ProgressionComponentServerFacet'
}

export interface EventNotificationComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playerentity: LocalEntityRef
  m_notificationsbeginenabled: boolean
  m_builderentity: LocalEntityRef
  m_inventorycontainerentity: LocalEntityRef
  m_socialentity: LocalEntityRef
  m_currencyconversionentity: LocalEntityRef
  m_eventnotificationdatabase: Asset
}
export function isEventNotificationComponent(obj: any): obj is EventNotificationComponent {
  return obj?.['__type'] === 'EventNotificationComponent'
}

export interface EventNotificationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_islocalplayer: boolean
  m_notificationtimes: []
}
export function isEventNotificationComponentClientFacet(obj: any): obj is EventNotificationComponentClientFacet {
  return obj?.['__type'] === 'EventNotificationComponentClientFacet'
}

export interface EventNotificationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isEventNotificationComponentServerFacet(obj: any): obj is EventNotificationComponentServerFacet {
  return obj?.['__type'] === 'EventNotificationComponentServerFacet'
}

export interface LeaderboardComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isLeaderboardComponent(obj: any): obj is LeaderboardComponent {
  return obj?.['__type'] === 'LeaderboardComponent'
}

export interface LeaderboardComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isLeaderboardComponentClientFacet(obj: any): obj is LeaderboardComponentClientFacet {
  return obj?.['__type'] === 'LeaderboardComponentClientFacet'
}

export interface LeaderboardComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isLeaderboardComponentServerFacet(obj: any): obj is LeaderboardComponentServerFacet {
  return obj?.['__type'] === 'LeaderboardComponentServerFacet'
}

export interface LocalPlayerSaveDataComponent {
  __type: string
  baseclass1: AZ__Component
  'customizable character entity': EntityId
}
export function isLocalPlayerSaveDataComponent(obj: any): obj is LocalPlayerSaveDataComponent {
  return obj?.['__type'] === 'LocalPlayerSaveDataComponent'
}

export interface HitVolumeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_center: Array<number>
  m_shape: QueryShapeCapsule | QueryShapeSphere | QueryShapeCylinder
  m_damagemult: number
  m_isheadshot: boolean
  m_islegshot: boolean
  m_volumename: string
  m_strfilter: string
  m_targetbonename: string
  m_hitcategory: string
  m_lightweightcharacterentityid: EntityId
}
export function isHitVolumeComponent(obj: any): obj is HitVolumeComponent {
  return obj?.['__type'] === 'HitVolumeComponent'
}

export interface HitVolumeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isHitVolumeComponentClientFacet(obj: any): obj is HitVolumeComponentClientFacet {
  return obj?.['__type'] === 'HitVolumeComponentClientFacet'
}

export interface HitVolumeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_hitvolumeupdatefrequency: number
}
export function isHitVolumeComponentServerFacet(obj: any): obj is HitVolumeComponentServerFacet {
  return obj?.['__type'] === 'HitVolumeComponentServerFacet'
}

export interface CameraComponent {
  __type: string
  baseclass1: AZ__Component
  'field of view': number
  'near clip plane distance': number
  'far clip plane distance': number
  specifydimensions: boolean
  frustumwidth: number
  frustumheight: number
  enableonactivate: boolean
  blendfactor: number
}
export function isCameraComponent(obj: any): obj is CameraComponent {
  return obj?.['__type'] === 'CameraComponent'
}

export interface HubLocalCacheComponent {
  __type: string
  baseclass1: FacetedComponent
  m_agentdescriptor: HubLocalCacheAgentDescriptor
  m_detectordescriptors: Array<HubLocalCacheDetectorDescriptor>
  m_forceenabletick: boolean
}
export function isHubLocalCacheComponent(obj: any): obj is HubLocalCacheComponent {
  return obj?.['__type'] === 'HubLocalCacheComponent'
}

export interface HubLocalCacheComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isHubLocalCacheComponentClientFacet(obj: any): obj is HubLocalCacheComponentClientFacet {
  return obj?.['__type'] === 'HubLocalCacheComponentClientFacet'
}

export interface HubLocalCacheComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isHubLocalCacheComponentServerFacet(obj: any): obj is HubLocalCacheComponentServerFacet {
  return obj?.['__type'] === 'HubLocalCacheComponentServerFacet'
}

export interface HubLocalCacheAgentDescriptor {
  __type: string
  registerasagent: boolean
  observablefilter: string
}
export function isHubLocalCacheAgentDescriptor(obj: any): obj is HubLocalCacheAgentDescriptor {
  return obj?.['__type'] === 'HubLocalCacheAgentDescriptor'
}

export interface HubLocalCacheDetectorDescriptor {
  __type: string
  name: string
  observerfilter: string
  detectorshape: number
  boundsentityid: EntityId
  bounds: Array<number>
  cylinderradius: number
  cylinderheight: number
  staticdetector: boolean
  boundsoffset: Array<number>
  metadataupdatefrequencyms: number
  maxtrackedagents: number
  showineditor: boolean
  ignoreheight: boolean
}
export function isHubLocalCacheDetectorDescriptor(obj: any): obj is HubLocalCacheDetectorDescriptor {
  return obj?.['__type'] === 'HubLocalCacheDetectorDescriptor'
}

export interface PositionalTicketingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPositionalTicketingComponent(obj: any): obj is PositionalTicketingComponent {
  return obj?.['__type'] === 'PositionalTicketingComponent'
}

export interface PositionalTicketingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPositionalTicketingComponentClientFacet(obj: any): obj is PositionalTicketingComponentClientFacet {
  return obj?.['__type'] === 'PositionalTicketingComponentClientFacet'
}

export interface PositionalTicketingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPositionalTicketingComponentServerFacet(obj: any): obj is PositionalTicketingComponentServerFacet {
  return obj?.['__type'] === 'PositionalTicketingComponentServerFacet'
}

export interface FtueMetricComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isFtueMetricComponent(obj: any): obj is FtueMetricComponent {
  return obj?.['__type'] === 'FtueMetricComponent'
}

export interface FtueMetricComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFtueMetricComponentClientFacet(obj: any): obj is FtueMetricComponentClientFacet {
  return obj?.['__type'] === 'FtueMetricComponentClientFacet'
}

export interface FtueMetricComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFtueMetricComponentServerFacet(obj: any): obj is FtueMetricComponentServerFacet {
  return obj?.['__type'] === 'FtueMetricComponentServerFacet'
}

export interface TimelineControllerComponent {
  __type: string
  baseclass1: FacetedComponent
  timelineeventmappings: AZStd__unordered_flat_map
  timelineeventmappingscrc: AZStd__unordered_flat_map
  interactentityid: EntityId
}
export function isTimelineControllerComponent(obj: any): obj is TimelineControllerComponent {
  return obj?.['__type'] === 'TimelineControllerComponent'
}

export interface TimelineControllerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTimelineControllerComponentClientFacet(obj: any): obj is TimelineControllerComponentClientFacet {
  return obj?.['__type'] === 'TimelineControllerComponentClientFacet'
}

export interface TimelineControllerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTimelineControllerComponentServerFacet(obj: any): obj is TimelineControllerComponentServerFacet {
  return obj?.['__type'] === 'TimelineControllerComponentServerFacet'
}

export interface AZStd__unordered_flat_map {
  __type: string
  element: f7f30d6d_06d0_5533_acb3_8fbe9d047904 | e42047b1_c78d_5b68_8b27_dfbc3e14994a
}
export function isAZStd__unordered_flat_map(obj: any): obj is AZStd__unordered_flat_map {
  return obj?.['__type'] === 'AZStd::unordered_flat_map'
}

export interface MusicalPerformanceIndicatorComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isMusicalPerformanceIndicatorComponent(obj: any): obj is MusicalPerformanceIndicatorComponent {
  return obj?.['__type'] === 'MusicalPerformanceIndicatorComponent'
}

export interface MusicalPerformanceIndicatorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_indicatorentities: Array<LocalEntityRef>
  m_localplayeronly: boolean
}
export function isMusicalPerformanceIndicatorComponentClientFacet(
  obj: any
): obj is MusicalPerformanceIndicatorComponentClientFacet {
  return obj?.['__type'] === 'MusicalPerformanceIndicatorComponentClientFacet'
}

export interface MusicalPerformanceIndicatorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMusicalPerformanceIndicatorComponentServerFacet(
  obj: any
): obj is MusicalPerformanceIndicatorComponentServerFacet {
  return obj?.['__type'] === 'MusicalPerformanceIndicatorComponentServerFacet'
}

export interface TimelineComponent {
  __type: string
  baseclass1: FacetedComponent
  m_timelines: Array<TimelineEntry>
}
export function isTimelineComponent(obj: any): obj is TimelineComponent {
  return obj?.['__type'] === 'TimelineComponent'
}

export interface TimelineComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTimelineComponentClientFacet(obj: any): obj is TimelineComponentClientFacet {
  return obj?.['__type'] === 'TimelineComponentClientFacet'
}

export interface TimelineComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTimelineComponentServerFacet(obj: any): obj is TimelineComponentServerFacet {
  return obj?.['__type'] === 'TimelineComponentServerFacet'
}

export interface TimelineEntry {
  __type: string
  timelineownerid: EntityId
  name: string
  namecrc: Crc32
  timelineasset: Asset
  runonactivate: boolean
  loop: boolean
  environment: number
  ontriggeraction: number
  onuntriggeraction: number
  layerentityassignments: Array<LayerEntityAssignment>
}
export function isTimelineEntry(obj: any): obj is TimelineEntry {
  return obj?.['__type'] === 'TimelineEntry'
}

export interface LayerEntityAssignment {
  __type: string
  entityid: EntityId
  layerid: string
  layername: string
  layerindex: number
}
export function isLayerEntityAssignment(obj: any): obj is LayerEntityAssignment {
  return obj?.['__type'] === 'LayerEntityAssignment'
}

export interface $$9d2f173a_ae75_4a1e_8f6f_d476c587f313 {
  __type: string
  baseclass1: FacetedComponent
  m_timelinecomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__TimelineComponent__void__
}
export function is$$9d2f173a_ae75_4a1e_8f6f_d476c587f313(obj: any): obj is $$9d2f173a_ae75_4a1e_8f6f_d476c587f313 {
  return obj?.['__type'] === '9d2f173a-ae75-4a1e-8f6f-d476c587f313'
}

export interface MusicalPerformancePlayerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMusicalPerformancePlayerComponentClientFacet(
  obj: any
): obj is MusicalPerformancePlayerComponentClientFacet {
  return obj?.['__type'] === 'MusicalPerformancePlayerComponentClientFacet'
}

export interface MusicalPerformancePlayerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_performancegdeasset: Asset
}
export function isMusicalPerformancePlayerComponentServerFacet(
  obj: any
): obj is MusicalPerformancePlayerComponentServerFacet {
  return obj?.['__type'] === 'MusicalPerformancePlayerComponentServerFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__TimelineComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__TimelineComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__TimelineComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::TimelineComponent>(void)>'
  )
}

export interface DiegeticObjectivePinsComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDiegeticObjectivePinsComponent(obj: any): obj is DiegeticObjectivePinsComponent {
  return obj?.['__type'] === 'DiegeticObjectivePinsComponent'
}

export interface DiegeticObjectivePinsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_diegeticpinentities: Array<LocalEntityRef>
  m_lastplayerpos: Array<number>
  m_sortedpinids: []
  m_pinidstodata: $$5b5c3e6d_91fc_5863_96ca_57879b448a3c
  m_lastupdatedplayerpostime: WallClockTimePoint
}
export function isDiegeticObjectivePinsComponentClientFacet(
  obj: any
): obj is DiegeticObjectivePinsComponentClientFacet {
  return obj?.['__type'] === 'DiegeticObjectivePinsComponentClientFacet'
}

export interface $$5b5c3e6d_91fc_5863_96ca_57879b448a3c {
  __type: string
}
export function is$$5b5c3e6d_91fc_5863_96ca_57879b448a3c(obj: any): obj is $$5b5c3e6d_91fc_5863_96ca_57879b448a3c {
  return obj?.['__type'] === '5b5c3e6d-91fc-5863-96ca-57879b448a3c'
}

export interface DiegeticObjectivePinsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDiegeticObjectivePinsComponentServerFacet(
  obj: any
): obj is DiegeticObjectivePinsComponentServerFacet {
  return obj?.['__type'] === 'DiegeticObjectivePinsComponentServerFacet'
}

export interface f7f30d6d_06d0_5533_acb3_8fbe9d047904 {
  __type: string
  value1: string
  value2: Array<EventData>
}
export function isf7f30d6d_06d0_5533_acb3_8fbe9d047904(obj: any): obj is f7f30d6d_06d0_5533_acb3_8fbe9d047904 {
  return obj?.['__type'] === 'f7f30d6d-06d0-5533-acb3-8fbe9d047904'
}

export interface e42047b1_c78d_5b68_8b27_dfbc3e14994a {
  __type: string
  value1: Crc32
  value2: Array<EventData>
}
export function ise42047b1_c78d_5b68_8b27_dfbc3e14994a(obj: any): obj is e42047b1_c78d_5b68_8b27_dfbc3e14994a {
  return obj?.['__type'] === 'e42047b1-c78d-5b68-8b27-dfbc3e14994a'
}

export interface WhisperPlayerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isWhisperPlayerComponent(obj: any): obj is WhisperPlayerComponent {
  return obj?.['__type'] === 'WhisperPlayerComponent'
}

export interface WhisperPlayerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isWhisperPlayerComponentClientFacet(obj: any): obj is WhisperPlayerComponentClientFacet {
  return obj?.['__type'] === 'WhisperPlayerComponentClientFacet'
}

export interface WhisperPlayerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isWhisperPlayerComponentServerFacet(obj: any): obj is WhisperPlayerComponentServerFacet {
  return obj?.['__type'] === 'WhisperPlayerComponentServerFacet'
}

export interface $$1937fe82_e3fc_4f21_9788_8bdfec29a43b {
  __type: string
  baseclass1: FacetedComponent
}
export function is$$1937fe82_e3fc_4f21_9788_8bdfec29a43b(obj: any): obj is $$1937fe82_e3fc_4f21_9788_8bdfec29a43b {
  return obj?.['__type'] === '1937fe82-e3fc-4f21-9788-8bdfec29a43b'
}

export interface SeasonsRewardsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSeasonsRewardsComponentClientFacet(obj: any): obj is SeasonsRewardsComponentClientFacet {
  return obj?.['__type'] === 'SeasonsRewardsComponentClientFacet'
}

export interface SeasonsRewardsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSeasonsRewardsComponentServerFacet(obj: any): obj is SeasonsRewardsComponentServerFacet {
  return obj?.['__type'] === 'SeasonsRewardsComponentServerFacet'
}

export interface SeasonsRewardsTrackedStatComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSeasonsRewardsTrackedStatComponent(obj: any): obj is SeasonsRewardsTrackedStatComponent {
  return obj?.['__type'] === 'SeasonsRewardsTrackedStatComponent'
}

export interface SeasonsRewardsTrackedStatComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSeasonsRewardsTrackedStatComponentClientFacet(
  obj: any
): obj is SeasonsRewardsTrackedStatComponentClientFacet {
  return obj?.['__type'] === 'SeasonsRewardsTrackedStatComponentClientFacet'
}

export interface SeasonsRewardsTrackedStatComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSeasonsRewardsTrackedStatComponentServerFacet(
  obj: any
): obj is SeasonsRewardsTrackedStatComponentServerFacet {
  return obj?.['__type'] === 'SeasonsRewardsTrackedStatComponentServerFacet'
}

export interface $$5a67f793_0d02_4fac_876d_131a40642505 {
  __type: string
  baseclass1: FacetedComponent
}
export function is$$5a67f793_0d02_4fac_876d_131a40642505(obj: any): obj is $$5a67f793_0d02_4fac_876d_131a40642505 {
  return obj?.['__type'] === '5a67f793-0d02-4fac-876d-131a40642505'
}

export interface $$3d595d6a_a89b_464c_a1ff_f3b242423065 {
  __type: string
  baseclass1: ClientFacet
}
export function is$$3d595d6a_a89b_464c_a1ff_f3b242423065(obj: any): obj is $$3d595d6a_a89b_464c_a1ff_f3b242423065 {
  return obj?.['__type'] === '3d595d6a-a89b-464c-a1ff-f3b242423065'
}

export interface ade49f45_eb0a_481c_bfa5_afb78de0c3ef {
  __type: string
  baseclass1: ServerFacet
}
export function isade49f45_eb0a_481c_bfa5_afb78de0c3ef(obj: any): obj is ade49f45_eb0a_481c_bfa5_afb78de0c3ef {
  return obj?.['__type'] === 'ade49f45-eb0a-481c-bfa5-afb78de0c3ef'
}

export interface GlobalStorageComponent {
  __type: string
  baseclass1: FacetedComponent
  m_containerstorage: LocalEntityRef
  m_interactorentity: LocalEntityRef
  m_notificationentity: LocalEntityRef
  m_interactionnotificationid: string
}
export function isGlobalStorageComponent(obj: any): obj is GlobalStorageComponent {
  return obj?.['__type'] === 'GlobalStorageComponent'
}

export interface GlobalStorageComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGlobalStorageComponentClientFacet(obj: any): obj is GlobalStorageComponentClientFacet {
  return obj?.['__type'] === 'GlobalStorageComponentClientFacet'
}

export interface GlobalStorageComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGlobalStorageComponentServerFacet(obj: any): obj is GlobalStorageComponentServerFacet {
  return obj?.['__type'] === 'GlobalStorageComponentServerFacet'
}

export interface AttachmentComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: AttachmentConfiguration
}
export function isAttachmentComponent(obj: any): obj is AttachmentComponent {
  return obj?.['__type'] === 'AttachmentComponent'
}

export interface AttachmentConfiguration {
  __type: string
  'target id': EntityId
  'target bone name': string
  'target offset': Transform
  'attached initially': boolean
  'scale source': number
  'update tolerance': number
}
export function isAttachmentConfiguration(obj: any): obj is AttachmentConfiguration {
  return obj?.['__type'] === 'AttachmentConfiguration'
}

export interface LevelMeterSettings {
  __type: string
  m_busname: string
  m_mode: number
  m_startactive: boolean
  m_continuous: boolean
  m_triggerlevel: number
  m_resetlevel: number
}
export function isLevelMeterSettings(obj: any): obj is LevelMeterSettings {
  return obj?.['__type'] === 'LevelMeterSettings'
}

export interface RtpcMeterSettings {
  __type: string
  m_rtpcname: string
  m_triggermode: number
  m_startactive: boolean
  m_continuous: boolean
  m_triggerlevel: number
  m_resetlevel: number
}
export function isRtpcMeterSettings(obj: any): obj is RtpcMeterSettings {
  return obj?.['__type'] === 'RtpcMeterSettings'
}

export interface AZ__ScriptPropertyGenericClassArray {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  values: Array<DynamicSerializableField>
  elementtype: string
}
export function isAZ__ScriptPropertyGenericClassArray(obj: any): obj is AZ__ScriptPropertyGenericClassArray {
  return obj?.['__type'] === 'AZ::ScriptPropertyGenericClassArray'
}

export interface AzFramework__ScriptPropertyStringArray {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  values: Array<string>
}
export function isAzFramework__ScriptPropertyStringArray(obj: any): obj is AzFramework__ScriptPropertyStringArray {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyStringArray'
}

export interface DecalComponent {
  __type: string
  baseclass1: AZ__Component
  decalconfiguration: DecalConfiguration
}
export function isDecalComponent(obj: any): obj is DecalComponent {
  return obj?.['__type'] === 'DecalComponent'
}

export interface DecalConfiguration {
  __type: string
  visible: boolean
  projectiontype: number
  material: AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  sortpriority: number
  depth: number
  offset: Array<number>
  color: Color
  opacity: number
  deferred: boolean
  deferredpostprocess: boolean
  deferredstring: string
  'max view distance': number
  'view distance multiplier': number
  'min spec': number
}
export function isDecalConfiguration(obj: any): obj is DecalConfiguration {
  return obj?.['__type'] === 'DecalConfiguration'
}

export interface LightComponent {
  __type: string
  baseclass1: AZ__Component
  lightconfiguration: LightConfiguration
}
export function isLightComponent(obj: any): obj is LightComponent {
  return obj?.['__type'] === 'LightComponent'
}

export interface LightConfiguration {
  __type: string
  lighttype: number
  visible: boolean
  oninitially: boolean
  color: Color
  diffusemultiplier: number
  specmultiplier: number
  ambient: boolean
  pointmaxdistance: number
  pointattenuationbulbsize: number
  areawidth: number
  areaheight: number
  areamaxdistance: number
  areafov: number
  projectordistance: number
  projectorattenuationbulbsize: number
  projectorfov: number
  projectornearplane: number
  projectortexture: AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_
  projectormaterial: AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  'area x,y,z': Array<number>
  sortpriority: number
  cubemapresolution: number
  cubemaptexture: string
  boxproject: boolean
  boxheight: number
  boxlength: number
  boxwidth: number
  attenuationfalloffmax: number
  todinfluence: number
  viewdistancemultiplier: number
  minimumspec: number
  castshadowsspec: number
  ignorevisareas: boolean
  indooronly: boolean
  affectsthisareaonly: boolean
  volumetricfogonly: boolean
  volumetricfog: boolean
  deferred: boolean
  terrainshadows: boolean
  shadowbias: number
  shadowresscale: number
  shadowslopebias: number
  shadowupdateminradius: number
  shadowupdateratio: number
  shadowmaxcameradistance: number
  animindex: number
  animspeed: number
  animphaserandom: boolean
  animphase: number
}
export function isLightConfiguration(obj: any): obj is LightConfiguration {
  return obj?.['__type'] === 'LightConfiguration'
}

export interface AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<LmbrCentral::TextureAsset>'
}

export interface BotComponent {
  __type: string
  baseclass1: FacetedComponent
  m_requestid: number
}
export function isBotComponent(obj: any): obj is BotComponent {
  return obj?.['__type'] === 'BotComponent'
}

export interface BotComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBotComponentClientFacet(obj: any): obj is BotComponentClientFacet {
  return obj?.['__type'] === 'BotComponentClientFacet'
}

export interface BotComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBotComponentServerFacet(obj: any): obj is BotComponentServerFacet {
  return obj?.['__type'] === 'BotComponentServerFacet'
}

export interface UiTransform2dComponent {
  __type: string
  baseclass1: AZ__Component
  anchors: Anchors
  offsets: Offsets
  pivot: Array<number>
  rotation: number
  scale: Array<number>
  scaletodevice: boolean
  computetransformwhenhidden: boolean
}
export function isUiTransform2dComponent(obj: any): obj is UiTransform2dComponent {
  return obj?.['__type'] === 'UiTransform2dComponent'
}

export interface Anchors {
  __type: string
  left: number
  top: number
  right: number
  bottom: number
}
export function isAnchors(obj: any): obj is Anchors {
  return obj?.['__type'] === 'Anchors'
}

export interface Offsets {
  __type: string
  left: number
  top: number
  right: number
  bottom: number
}
export function isOffsets(obj: any): obj is Offsets {
  return obj?.['__type'] === 'Offsets'
}

export interface UiElementComponent {
  __type: string
  baseclass1: AZ__Component
  id: number
  isenabled: boolean
  isvisibleineditor: boolean
  isselectableineditor: boolean
  isselectedineditor: boolean
  isexpandedineditor: boolean
  childentityidorder: Array<ChildEntityIdOrderEntry>
  ischildrenrendersortable: boolean
  renderpriority: number
  multithreadchildren: boolean
}
export function isUiElementComponent(obj: any): obj is UiElementComponent {
  return obj?.['__type'] === 'UiElementComponent'
}

export interface ChildEntityIdOrderEntry {
  __type: string
  childentityid: EntityId
  sortindex: number
}
export function isChildEntityIdOrderEntry(obj: any): obj is ChildEntityIdOrderEntry {
  return obj?.['__type'] === 'ChildEntityIdOrderEntry'
}

export interface UiFaderComponent {
  __type: string
  baseclass1: AZ__Component
  fade: number
  userendertotexture: boolean
}
export function isUiFaderComponent(obj: any): obj is UiFaderComponent {
  return obj?.['__type'] === 'UiFaderComponent'
}

export interface UiTextComponent {
  __type: string
  baseclass1: AZ__Component
  text: string
  markupenabled: boolean
  imagesenabled: boolean
  color: Color
  alpha: number
  fontfilename: AzFramework__SimpleAssetReference_LyShine__FontAsset_
  fontsize: number
  effectindex: number
  texthalignment: number
  textvalignment: number
  characterspacing: number
  linespacing: number
  overflowmode: number
  wraptextsetting: number
  shrinktofit: number
  minshrinkscale: number
  caseoverride: number
}
export function isUiTextComponent(obj: any): obj is UiTextComponent {
  return obj?.['__type'] === 'UiTextComponent'
}

export interface AzFramework__SimpleAssetReference_LyShine__FontAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_LyShine__FontAsset_(
  obj: any
): obj is AzFramework__SimpleAssetReference_LyShine__FontAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<LyShine::FontAsset>'
}

export interface UiLayoutFitterComponent {
  __type: string
  baseclass1: AZ__Component
  horizontalfit: boolean
  verticalfit: boolean
}
export function isUiLayoutFitterComponent(obj: any): obj is UiLayoutFitterComponent {
  return obj?.['__type'] === 'UiLayoutFitterComponent'
}

export interface UiImageComponent {
  __type: string
  baseclass1: AZ__Component
  spritetype: number
  spritetexture: Asset
  index: number
  rendertargetname: string
  isrendertargetsrgb: boolean
  color: Color
  alpha: number
  imagetype: number
  fillcenter: boolean
  stretchsliced: boolean
  blendmode: number
  filltype: number
  fillamount: number
  fillstartangle: number
  fillcornerorigin: number
  filledgeorigin: number
  fillclockwise: boolean
}
export function isUiImageComponent(obj: any): obj is UiImageComponent {
  return obj?.['__type'] === 'UiImageComponent'
}

export interface UiButtonComponent {
  __type: string
  baseclass1: UiInteractableComponent
  actionname: string
  actionnameright: string
  actionnamepressedright: string
  useclickbehavior: boolean
  clicksqtolerance: number
  sethoveronpress: EntityId
}
export function isUiButtonComponent(obj: any): obj is UiButtonComponent {
  return obj?.['__type'] === 'UiButtonComponent'
}

export interface UiInteractableComponent {
  __type: string
  baseclass1: AZ__Component
  ishandlingevents: boolean
  hoverstateactions: Array<UiInteractableStateAlpha | UiInteractableStateSprite>
  pressedstateactions: Array<UiInteractableStateSprite>
  disabledstateactions: []
  navigationsettings: UiNavigationSettings
  isautoactivationenabled: boolean
  hoverstartactionname: string
  hoverendactionname: string
  pressedactionname: string
  releasedactionname: string
  '0x24695ca7': boolean
  '0x6cb356e8': boolean
  '0x059b1386': boolean
  '0x896ee5a2': number
  '0x785a3bff': boolean
  '0xdf2b1889': number
}
export function isUiInteractableComponent(obj: any): obj is UiInteractableComponent {
  return obj?.['__type'] === 'UiInteractableComponent'
}

export interface UiNavigationSettings {
  __type: string
  navigationmode: number
  onupentity: EntityId
  ondownentity: EntityId
  onleftentity: EntityId
  onrightentity: EntityId
}
export function isUiNavigationSettings(obj: any): obj is UiNavigationSettings {
  return obj?.['__type'] === 'UiNavigationSettings'
}

export interface UiMaskComponent {
  __type: string
  baseclass1: AZ__Component
  enablemasking: boolean
  maskinteraction: boolean
  childmaskelement: EntityId
  userendertotexture: boolean
  drawbehind: boolean
  drawinfront: boolean
  usealphatest: boolean
}
export function isUiMaskComponent(obj: any): obj is UiMaskComponent {
  return obj?.['__type'] === 'UiMaskComponent'
}

export interface UiLayoutCellComponent {
  __type: string
  baseclass1: AZ__Component
  minwidthoverridden: boolean
  minwidth: number
  minheightoverridden: boolean
  minheight: number
  targetwidthoverridden: boolean
  targetwidth: number
  targetheightoverridden: boolean
  targetheight: number
  extrawidthratiooverridden: boolean
  extrawidthratio: number
  extraheightratiooverridden: boolean
  extraheightratio: number
}
export function isUiLayoutCellComponent(obj: any): obj is UiLayoutCellComponent {
  return obj?.['__type'] === 'UiLayoutCellComponent'
}

export interface UiLayoutRowComponent {
  __type: string
  baseclass1: AZ__Component
  padding: Padding
  spacing: number
  order: number
  childhalignment: number
  childvalignment: number
  ignoredefaultlayoutcells: boolean
}
export function isUiLayoutRowComponent(obj: any): obj is UiLayoutRowComponent {
  return obj?.['__type'] === 'UiLayoutRowComponent'
}

export interface Padding {
  __type: string
  left: number
  top: number
  right: number
  bottom: number
}
export function isPadding(obj: any): obj is Padding {
  return obj?.['__type'] === 'Padding'
}

export interface UiDynamicLayoutComponent {
  __type: string
  baseclass1: AZ__Component
  numchildelements: number
}
export function isUiDynamicLayoutComponent(obj: any): obj is UiDynamicLayoutComponent {
  return obj?.['__type'] === 'UiDynamicLayoutComponent'
}

export interface UiFlipbookAnimationComponent {
  __type: string
  baseclass1: AZ__Component
  'start frame': number
  'end frame': number
  'loop start frame': number
  'loop type': number
  'framerate unit': number
  framerate: number
  'start delay': number
  'loop delay': number
  'reverse delay': number
  'auto play': boolean
}
export function isUiFlipbookAnimationComponent(obj: any): obj is UiFlipbookAnimationComponent {
  return obj?.['__type'] === 'UiFlipbookAnimationComponent'
}

export interface UiImageSequenceComponent {
  __type: string
  baseclass1: AZ__Component
  imagetype: number
  imagelist: Array<Asset>
  imagesequencedirectory: string
  index: number
  color: Color
  alpha: number
  blendmode: number
}
export function isUiImageSequenceComponent(obj: any): obj is UiImageSequenceComponent {
  return obj?.['__type'] === 'UiImageSequenceComponent'
}

export interface UiInteractableStateAlpha {
  __type: string
  targetentity: EntityId
  alpha: number
}
export function isUiInteractableStateAlpha(obj: any): obj is UiInteractableStateAlpha {
  return obj?.['__type'] === 'UiInteractableStateAlpha'
}

export interface UiLayoutColumnComponent {
  __type: string
  baseclass1: AZ__Component
  padding: Padding
  spacing: number
  order: number
  childhalignment: number
  childvalignment: number
  ignoredefaultlayoutcells: boolean
}
export function isUiLayoutColumnComponent(obj: any): obj is UiLayoutColumnComponent {
  return obj?.['__type'] === 'UiLayoutColumnComponent'
}

export interface UiDropTargetComponent {
  __type: string
  baseclass1: AZ__Component
  dropvalidstateactions: Array<UiInteractableStateColor>
  dropinvalidstateactions: Array<UiInteractableStateColor>
  navigationsettings: UiNavigationSettings
  ondropactionname: string
}
export function isUiDropTargetComponent(obj: any): obj is UiDropTargetComponent {
  return obj?.['__type'] === 'UiDropTargetComponent'
}

export interface UiInteractableStateColor {
  __type: string
  targetentity: EntityId
  color: Color
}
export function isUiInteractableStateColor(obj: any): obj is UiInteractableStateColor {
  return obj?.['__type'] === 'UiInteractableStateColor'
}

export interface UiInteractableStateSprite {
  __type: string
  targetentity: EntityId
  sprite: Asset
  index: number
}
export function isUiInteractableStateSprite(obj: any): obj is UiInteractableStateSprite {
  return obj?.['__type'] === 'UiInteractableStateSprite'
}

export interface UiDesaturatorComponent {
  __type: string
  baseclass1: AZ__Component
  saturation: number
}
export function isUiDesaturatorComponent(obj: any): obj is UiDesaturatorComponent {
  return obj?.['__type'] === 'UiDesaturatorComponent'
}

export interface UiSpawnerComponent {
  __type: string
  baseclass1: AZ__Component
  slice: Asset
  spawnonactivate: boolean
}
export function isUiSpawnerComponent(obj: any): obj is UiSpawnerComponent {
  return obj?.['__type'] === 'UiSpawnerComponent'
}

export interface UiLayoutGridComponent {
  __type: string
  baseclass1: AZ__Component
  padding: Padding
  spacing: Array<number>
  cellsize: Array<number>
  horizontalorder: number
  verticalorder: number
  startingwith: number
  childhalignment: number
  childvalignment: number
  layoutvisibleonly: boolean
}
export function isUiLayoutGridComponent(obj: any): obj is UiLayoutGridComponent {
  return obj?.['__type'] === 'UiLayoutGridComponent'
}

export interface UiRadioButtonComponent {
  __type: string
  baseclass1: UiInteractableComponent
  optionalcheckedentity: EntityId
  optionaluncheckedentity: EntityId
  group: EntityId
  ischecked: boolean
  changedactionname: string
  turnonactionname: string
  turnoffactionname: string
}
export function isUiRadioButtonComponent(obj: any): obj is UiRadioButtonComponent {
  return obj?.['__type'] === 'UiRadioButtonComponent'
}

export interface UiDropdownOptionComponent {
  __type: string
  baseclass1: AZ__Component
  owningdropdown: EntityId
  textelement: EntityId
  iconelement: EntityId
}
export function isUiDropdownOptionComponent(obj: any): obj is UiDropdownOptionComponent {
  return obj?.['__type'] === 'UiDropdownOptionComponent'
}

export interface UiLayoutRowFixedComponent {
  __type: string
  baseclass1: AZ__Component
  spacing: number
  order: number
  childhalignment: number
  childvalignment: number
  layoutvisibleonly: boolean
}
export function isUiLayoutRowFixedComponent(obj: any): obj is UiLayoutRowFixedComponent {
  return obj?.['__type'] === 'UiLayoutRowFixedComponent'
}

export interface UiCheckboxComponent {
  __type: string
  baseclass1: UiInteractableComponent
  optionalcheckedentity: EntityId
  optionaluncheckedentity: EntityId
  ischecked: boolean
  changedactionname: string
  turnonactionname: string
  turnoffactionname: string
}
export function isUiCheckboxComponent(obj: any): obj is UiCheckboxComponent {
  return obj?.['__type'] === 'UiCheckboxComponent'
}

export interface UiScrollBarComponent {
  __type: string
  baseclass1: UiInteractableComponent
  handleentity: EntityId
  orientation: number
  value: number
  handlesize: number
  minhandlepixelsize: number
  valuechangingactionname: string
  valuechangedactionname: string
}
export function isUiScrollBarComponent(obj: any): obj is UiScrollBarComponent {
  return obj?.['__type'] === 'UiScrollBarComponent'
}

export interface UiDropdownComponent {
  __type: string
  baseclass1: UiInteractableComponent
  content: EntityId
  expandedparent: EntityId
  textelement: EntityId
  iconelement: EntityId
  expandonhover: boolean
  waittime: number
  collapseonoutsideclick: boolean
  expandedstateactions: []
  expandedactionname: string
  collapsedactionname: string
  optionselectedactionname: string
}
export function isUiDropdownComponent(obj: any): obj is UiDropdownComponent {
  return obj?.['__type'] === 'UiDropdownComponent'
}

export interface UiScrollBoxComponent {
  __type: string
  baseclass1: UiInteractableComponent
  contententity: EntityId
  scrolloffset: Array<number>
  constrainscrolling: boolean
  enableeasing: boolean
  allowdragging: boolean
  snapmode: number
  snapgrid: Array<number>
  allowhorizsrolling: boolean
  hscrollbarentity: EntityId
  hscrollbarvisibility: number
  allowvertscrolling: boolean
  vscrollbarentity: EntityId
  vscrollbarvisibility: number
  scrolloffsetchangingactionname: string
  scrolloffsetchangedactionname: string
}
export function isUiScrollBoxComponent(obj: any): obj is UiScrollBoxComponent {
  return obj?.['__type'] === 'UiScrollBoxComponent'
}

export interface UiScrollBarMouseWheelComponent {
  __type: string
  baseclass1: AZ__Component
  wheelstepvalue: number
  scrollbarentity: EntityId
}
export function isUiScrollBarMouseWheelComponent(obj: any): obj is UiScrollBarMouseWheelComponent {
  return obj?.['__type'] === 'UiScrollBarMouseWheelComponent'
}

export interface UiDraggableComponent {
  __type: string
  baseclass1: UiInteractableComponent
  dragnormalstateactions: []
  dragvalidstateactions: []
  draginvalidstateactions: []
}
export function isUiDraggableComponent(obj: any): obj is UiDraggableComponent {
  return obj?.['__type'] === 'UiDraggableComponent'
}

export interface UiSliderComponent {
  __type: string
  baseclass1: UiInteractableComponent
  trackentity: EntityId
  fillentity: EntityId
  manipulatorentity: EntityId
  value: number
  minvalue: number
  maxvalue: number
  stepvalue: number
  valuechangingactionname: string
  valuechangedactionname: string
}
export function isUiSliderComponent(obj: any): obj is UiSliderComponent {
  return obj?.['__type'] === 'UiSliderComponent'
}

export interface UiRadioButtonGroupComponent {
  __type: string
  baseclass1: AZ__Component
  allowrestoreunchecked: boolean
  changedactionname: string
}
export function isUiRadioButtonGroupComponent(obj: any): obj is UiRadioButtonGroupComponent {
  return obj?.['__type'] === 'UiRadioButtonGroupComponent'
}

export interface UiDynamicScrollBoxComponent {
  __type: string
  baseclass1: AZ__Component
  autorefreshonpostactivate: boolean
  prototypeelement: EntityId
  variableelementsize: boolean
  autocalcelementsize: boolean
  estimatedelementsize: number
  defaultnumelements: number
  hassections: boolean
  headerprototypeelement: EntityId
  stickyheaders: boolean
  variableheadersize: boolean
  autocalcheadersize: boolean
  estimatedheadersize: number
  defaultnumsections: number
}
export function isUiDynamicScrollBoxComponent(obj: any): obj is UiDynamicScrollBoxComponent {
  return obj?.['__type'] === 'UiDynamicScrollBoxComponent'
}

export interface UiProgressBarComponent {
  __type: string
  baseclass1: AZ__Component
  progress: number
  vertical: boolean
  progressbarentity: EntityId
}
export function isUiProgressBarComponent(obj: any): obj is UiProgressBarComponent {
  return obj?.['__type'] === 'UiProgressBarComponent'
}

export interface UiExitHoverEventComponent {
  __type: string
  baseclass1: AZ__Component
  eventname: string
  delay: number
}
export function isUiExitHoverEventComponent(obj: any): obj is UiExitHoverEventComponent {
  return obj?.['__type'] === 'UiExitHoverEventComponent'
}

export interface SequenceAgentComponent {
  __type: string
  baseclass1: AZ__Component
  sequencecomponententityids: Array<EntityId>
}
export function isSequenceAgentComponent(obj: any): obj is SequenceAgentComponent {
  return obj?.['__type'] === 'SequenceAgentComponent'
}

export interface $$54cb00f3_c64e_48b9_9779_859545bf46b3 {
  __type: string
  baseclass1: SlayerScriptData
  usevariationdata: boolean
  events: $$777e8fda_6a1b_55fd_baf9_8aff3c0b7397
}
export function is$$54cb00f3_c64e_48b9_9779_859545bf46b3(obj: any): obj is $$54cb00f3_c64e_48b9_9779_859545bf46b3 {
  return obj?.['__type'] === '54cb00f3-c64e-48b9-9779-859545bf46b3'
}

export interface $$777e8fda_6a1b_55fd_baf9_8aff3c0b7397 {
  __type: string
  element: AchievementEvent
}
export function is$$777e8fda_6a1b_55fd_baf9_8aff3c0b7397(obj: any): obj is $$777e8fda_6a1b_55fd_baf9_8aff3c0b7397 {
  return obj?.['__type'] === '777e8fda-6a1b-55fd-baf9-8aff3c0b7397'
}

export interface AchievementEvent {
  __type: string
  debugname: string
  debugindex: number
  requiredachievementconditional: string
  runeventsonconditionalsatisfied: boolean
  runeventsonenteraoi: boolean
  eventdelayduration: number
  reverseeventsonconditionalunsatisfied: boolean
  entityevents: $$2a3d1e1e_a69f_5860_8934_00c3bfe920cc
  opacityevents: bd28477a_6d73_5d2e_b509_5fd32a06f475
  rotationevents: $$12e435dd_b28e_5082_8e17_67f1bbc894b1
}
export function isAchievementEvent(obj: any): obj is AchievementEvent {
  return obj?.['__type'] === 'AchievementEvent'
}

export interface $$2a3d1e1e_a69f_5860_8934_00c3bfe920cc {
  __type: string
  element: EntityAchievementEvent
}
export function is$$2a3d1e1e_a69f_5860_8934_00c3bfe920cc(obj: any): obj is $$2a3d1e1e_a69f_5860_8934_00c3bfe920cc {
  return obj?.['__type'] === '2a3d1e1e-a69f-5860-8934-00c3bfe920cc'
}

export interface EntityAchievementEvent {
  __type: string
  eventtype: number
  applyonchildren: boolean
  entitynames: $$0b66e343_c513_5eb3_b152_770c4628bb73
}
export function isEntityAchievementEvent(obj: any): obj is EntityAchievementEvent {
  return obj?.['__type'] === 'EntityAchievementEvent'
}

export interface bd28477a_6d73_5d2e_b509_5fd32a06f475 {
  __type: string
  element: OpacityAchievementEvent
}
export function isbd28477a_6d73_5d2e_b509_5fd32a06f475(obj: any): obj is bd28477a_6d73_5d2e_b509_5fd32a06f475 {
  return obj?.['__type'] === 'bd28477a-6d73-5d2e-b509-5fd32a06f475'
}

export interface $$12e435dd_b28e_5082_8e17_67f1bbc894b1 {
  __type: string
  element: RotationAchievementEvent
}
export function is$$12e435dd_b28e_5082_8e17_67f1bbc894b1(obj: any): obj is $$12e435dd_b28e_5082_8e17_67f1bbc894b1 {
  return obj?.['__type'] === '12e435dd-b28e-5082-8e17-67f1bbc894b1'
}

export interface ReadingInteractionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_loreid: string
}
export function isReadingInteractionComponent(obj: any): obj is ReadingInteractionComponent {
  return obj?.['__type'] === 'ReadingInteractionComponent'
}

export interface ReadingInteractionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_readevents: Array<EventData>
}
export function isReadingInteractionComponentClientFacet(obj: any): obj is ReadingInteractionComponentClientFacet {
  return obj?.['__type'] === 'ReadingInteractionComponentClientFacet'
}

export interface ReadingInteractionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isReadingInteractionComponentServerFacet(obj: any): obj is ReadingInteractionComponentServerFacet {
  return obj?.['__type'] === 'ReadingInteractionComponentServerFacet'
}

export interface ObjectiveDetectionVolumeComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isObjectiveDetectionVolumeComponent(obj: any): obj is ObjectiveDetectionVolumeComponent {
  return obj?.['__type'] === 'ObjectiveDetectionVolumeComponent'
}

export interface ObjectiveDetectionVolumeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isObjectiveDetectionVolumeComponentClientFacet(
  obj: any
): obj is ObjectiveDetectionVolumeComponentClientFacet {
  return obj?.['__type'] === 'ObjectiveDetectionVolumeComponentClientFacet'
}

export interface ObjectiveDetectionVolumeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_targettag: string
}
export function isObjectiveDetectionVolumeComponentServerFacet(
  obj: any
): obj is ObjectiveDetectionVolumeComponentServerFacet {
  return obj?.['__type'] === 'ObjectiveDetectionVolumeComponentServerFacet'
}

export interface VegetationBlockerComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationBlockerConfig
}
export function isVegetationBlockerComponent(obj: any): obj is VegetationBlockerComponent {
  return obj?.['__type'] === 'VegetationBlockerComponent'
}

export interface VegetationBlockerConfig {
  __type: string
  inheritbehavior: boolean
  userelativeuvw: boolean
}
export function isVegetationBlockerConfig(obj: any): obj is VegetationBlockerConfig {
  return obj?.['__type'] === 'VegetationBlockerConfig'
}

export interface VegetationAreaComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationAreaConfig
}
export function isVegetationAreaComponent(obj: any): obj is VegetationAreaComponent {
  return obj?.['__type'] === 'VegetationAreaComponent'
}

export interface VegetationAreaConfig {
  __type: string
  priority: number
  areatype: number
  placementmodetypeflag: number
}
export function isVegetationAreaConfig(obj: any): obj is VegetationAreaConfig {
  return obj?.['__type'] === 'VegetationAreaConfig'
}

export interface AudioAreaEnvironmentComponent {
  __type: string
  baseclass1: AZ__Component
  'broad-phase trigger area entity': EntityId
  'environment name': string
  'environment fade distance': number
}
export function isAudioAreaEnvironmentComponent(obj: any): obj is AudioAreaEnvironmentComponent {
  return obj?.['__type'] === 'AudioAreaEnvironmentComponent'
}

export interface SnapToTerrainComponent {
  __type: string
  baseclass1: FacetedComponent
  m_maxrotationangle: number
  m_orienttoterrain: boolean
}
export function isSnapToTerrainComponent(obj: any): obj is SnapToTerrainComponent {
  return obj?.['__type'] === 'SnapToTerrainComponent'
}

export interface SnapToTerrainComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSnapToTerrainComponentClientFacet(obj: any): obj is SnapToTerrainComponentClientFacet {
  return obj?.['__type'] === 'SnapToTerrainComponentClientFacet'
}

export interface SnapToTerrainComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSnapToTerrainComponentServerFacet(obj: any): obj is SnapToTerrainComponentServerFacet {
  return obj?.['__type'] === 'SnapToTerrainComponentServerFacet'
}

export interface AIVariantProviderComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAIVariantProviderComponent(obj: any): obj is AIVariantProviderComponent {
  return obj?.['__type'] === 'AIVariantProviderComponent'
}

export interface AIVariantProviderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAIVariantProviderComponentClientFacet(obj: any): obj is AIVariantProviderComponentClientFacet {
  return obj?.['__type'] === 'AIVariantProviderComponentClientFacet'
}

export interface AIVariantProviderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_vitalstableid: string
  m_vitalstablerowid: string
  m_vitalscategorytableid: string
  m_vitalscategorytablerowid: string
  m_vitalslevel: number
  m_useterritoryleveloverride: boolean
  m_useterritorypostfixoverride: boolean
}
export function isAIVariantProviderComponentServerFacet(obj: any): obj is AIVariantProviderComponentServerFacet {
  return obj?.['__type'] === 'AIVariantProviderComponentServerFacet'
}

export interface PointSpawnerComponent {
  __type: string
  baseclass1: PrefabSpawnerComponent
}
export function isPointSpawnerComponent(obj: any): obj is PointSpawnerComponent {
  return obj?.['__type'] === 'PointSpawnerComponent'
}

export interface PointSpawnerComponentClientFacet {
  __type: string
  baseclass1: PrefabSpawnerComponentClientFacet
}
export function isPointSpawnerComponentClientFacet(obj: any): obj is PointSpawnerComponentClientFacet {
  return obj?.['__type'] === 'PointSpawnerComponentClientFacet'
}

export interface PointSpawnerComponentServerFacet {
  __type: string
  baseclass1: PrefabSpawnerComponentServerFacet
  m_patrolpathentity: LocalEntityRef
  m_maxfailuresallowed: number
  m_maxbackfillradius: number
  m_autospawnenabled: boolean
}
export function isPointSpawnerComponentServerFacet(obj: any): obj is PointSpawnerComponentServerFacet {
  return obj?.['__type'] === 'PointSpawnerComponentServerFacet'
}

export interface AIConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAIConstraintComponent(obj: any): obj is AIConstraintComponent {
  return obj?.['__type'] === 'AIConstraintComponent'
}

export interface AIConstraintComponentClientFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentClientFacet
}
export function isAIConstraintComponentClientFacet(obj: any): obj is AIConstraintComponentClientFacet {
  return obj?.['__type'] === 'AIConstraintComponentClientFacet'
}

export interface SpawnerConstraintComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSpawnerConstraintComponentClientFacet(obj: any): obj is SpawnerConstraintComponentClientFacet {
  return obj?.['__type'] === 'SpawnerConstraintComponentClientFacet'
}

export interface AIConstraintComponentServerFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentServerFacet
  m_configoverrides: Array<$$2f09439e_051f_5360_859e_55eab094feb5>
  m_priority: number
}
export function isAIConstraintComponentServerFacet(obj: any): obj is AIConstraintComponentServerFacet {
  return obj?.['__type'] === 'AIConstraintComponentServerFacet'
}

export interface SpawnerConstraintComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSpawnerConstraintComponentServerFacet(obj: any): obj is SpawnerConstraintComponentServerFacet {
  return obj?.['__type'] === 'SpawnerConstraintComponentServerFacet'
}

export interface AIPathComponent {
  __type: string
  baseclass1: FacetedComponent
  m_waypointids: Array<EntityId>
}
export function isAIPathComponent(obj: any): obj is AIPathComponent {
  return obj?.['__type'] === 'AIPathComponent'
}

export interface AIPathComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAIPathComponentClientFacet(obj: any): obj is AIPathComponentClientFacet {
  return obj?.['__type'] === 'AIPathComponentClientFacet'
}

export interface AIPathComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_controllerdefinition: AzFramework__SimpleAssetReference_LmbrCentral__MannequinControllerDefinitionAsset_
  m_waypointentities: Array<LocalEntityRef>
  m_pathtravesalpolicy: number
  m_depthtest: boolean
}
export function isAIPathComponentServerFacet(obj: any): obj is AIPathComponentServerFacet {
  return obj?.['__type'] === 'AIPathComponentServerFacet'
}

export interface AIWaypointComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAIWaypointComponent(obj: any): obj is AIWaypointComponent {
  return obj?.['__type'] === 'AIWaypointComponent'
}

export interface AIWaypointComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAIWaypointComponentClientFacet(obj: any): obj is AIWaypointComponentClientFacet {
  return obj?.['__type'] === 'AIWaypointComponentClientFacet'
}

export interface AIWaypointComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_taskname: string
  m_minduration: number
  m_maxduration: number
  m_matchalignment: boolean
}
export function isAIWaypointComponentServerFacet(obj: any): obj is AIWaypointComponentServerFacet {
  return obj?.['__type'] === 'AIWaypointComponentServerFacet'
}

export interface BuffBucketsProviderComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isBuffBucketsProviderComponent(obj: any): obj is BuffBucketsProviderComponent {
  return obj?.['__type'] === 'BuffBucketsProviderComponent'
}

export interface BuffBucketsProviderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBuffBucketsProviderComponentClientFacet(obj: any): obj is BuffBucketsProviderComponentClientFacet {
  return obj?.['__type'] === 'BuffBucketsProviderComponentClientFacet'
}

export interface BuffBucketsProviderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_buffbucketeditordata: Array<BuffBucketEditorData>
  m_overridedefaultbuckets: boolean
}
export function isBuffBucketsProviderComponentServerFacet(obj: any): obj is BuffBucketsProviderComponentServerFacet {
  return obj?.['__type'] === 'BuffBucketsProviderComponentServerFacet'
}

export interface BuffBucketEditorData {
  __type: string
  m_buffbucketid: string
  m_buffbucketcrc: Crc32
}
export function isBuffBucketEditorData(obj: any): obj is BuffBucketEditorData {
  return obj?.['__type'] === 'BuffBucketEditorData'
}

export interface PolygonPrismShapeComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: PolygonPrismCommon
  'polygon shape asset id': AssetId
}
export function isPolygonPrismShapeComponent(obj: any): obj is PolygonPrismShapeComponent {
  return obj?.['__type'] === 'PolygonPrismShapeComponent'
}

export interface PolygonPrismCommon {
  __type: string
  polygonprism: PolygonPrism
  'reduced vertices': Array<Array<number>>
}
export function isPolygonPrismCommon(obj: any): obj is PolygonPrismCommon {
  return obj?.['__type'] === 'PolygonPrismCommon'
}

export interface PolygonPrism {
  __type: string
  height: number
  vertexcontainer: VertexContainer_Vector2__
}
export function isPolygonPrism(obj: any): obj is PolygonPrism {
  return obj?.['__type'] === 'PolygonPrism'
}

export interface VertexContainer_Vector2__ {
  __type: string
  vertices: Array<Array<number>>
}
export function isVertexContainer_Vector2__(obj: any): obj is VertexContainer_Vector2__ {
  return obj?.['__type'] === 'VertexContainer<Vector2 >'
}

export interface UiTriggerAreaEventComponent {
  __type: string
  baseclass1: AZ__Component
  m_triggerentity: LocalEntityRef
  m_identifier: string
}
export function isUiTriggerAreaEventComponent(obj: any): obj is UiTriggerAreaEventComponent {
  return obj?.['__type'] === 'UiTriggerAreaEventComponent'
}

export interface POIManagerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playerdetectionentity: EntityId
  m_spawnerdetectionentity: EntityId
}
export function isPOIManagerComponent(obj: any): obj is POIManagerComponent {
  return obj?.['__type'] === 'POIManagerComponent'
}

export interface POIManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPOIManagerComponentClientFacet(obj: any): obj is POIManagerComponentClientFacet {
  return obj?.['__type'] === 'POIManagerComponentClientFacet'
}

export interface POIManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  'config name': string
  'config asset': Asset
}
export function isPOIManagerComponentServerFacet(obj: any): obj is POIManagerComponentServerFacet {
  return obj?.['__type'] === 'POIManagerComponentServerFacet'
}

export interface AreaSpawnerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_showdistributionpreview: boolean
  m_showdistributiontext: boolean
  m_updateapproximatedistribution: boolean
}
export function isAreaSpawnerComponent(obj: any): obj is AreaSpawnerComponent {
  return obj?.['__type'] === 'AreaSpawnerComponent'
}

export interface AreaSpawnerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAreaSpawnerComponentClientFacet(obj: any): obj is AreaSpawnerComponentClientFacet {
  return obj?.['__type'] === 'AreaSpawnerComponentClientFacet'
}

export interface AreaSpawnerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_maintainpopulation: boolean
  '0xba46bbcc': boolean
  m_spawnontrigger: boolean
  m_sliceasset: Asset
  m_aliasasset: Asset
  m_livecount: number
  m_minrespawnrange: number
  m_maxrespawnrange: number
  m_ignorecooldownoverride: boolean
  m_cooldownafterdespawn: boolean
  m_cooldownafterconstraintfail: boolean
  m_locations: Array<LocalEntityRef>
}
export function isAreaSpawnerComponentServerFacet(obj: any): obj is AreaSpawnerComponentServerFacet {
  return obj?.['__type'] === 'AreaSpawnerComponentServerFacet'
}

export interface PointLocationComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPointLocationComponent(obj: any): obj is PointLocationComponent {
  return obj?.['__type'] === 'PointLocationComponent'
}

export interface PointLocationComponentClientFacet {
  __type: string
  baseclass1: AreaSpawnerLocationComponentClientFacet
}
export function isPointLocationComponentClientFacet(obj: any): obj is PointLocationComponentClientFacet {
  return obj?.['__type'] === 'PointLocationComponentClientFacet'
}

export interface AreaSpawnerLocationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAreaSpawnerLocationComponentClientFacet(obj: any): obj is AreaSpawnerLocationComponentClientFacet {
  return obj?.['__type'] === 'AreaSpawnerLocationComponentClientFacet'
}

export interface PointLocationComponentServerFacet {
  __type: string
  baseclass1: AreaSpawnerLocationComponentServerFacet
}
export function isPointLocationComponentServerFacet(obj: any): obj is PointLocationComponentServerFacet {
  return obj?.['__type'] === 'PointLocationComponentServerFacet'
}

export interface AreaSpawnerLocationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_probability: number
  m_cooldownbuffersec: number
}
export function isAreaSpawnerLocationComponentServerFacet(obj: any): obj is AreaSpawnerLocationComponentServerFacet {
  return obj?.['__type'] === 'AreaSpawnerLocationComponentServerFacet'
}

export interface CylinderShapeComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: CylinderShapeConfig
}
export function isCylinderShapeComponent(obj: any): obj is CylinderShapeComponent {
  return obj?.['__type'] === 'CylinderShapeComponent'
}

export interface CylinderShapeConfig {
  __type: string
  height: number
  radius: number
  ignoreends: boolean
}
export function isCylinderShapeConfig(obj: any): obj is CylinderShapeConfig {
  return obj?.['__type'] === 'CylinderShapeConfig'
}

export interface TerritoryComponent {
  __type: string
  baseclass1: FacetedComponent
  m_ispoiterritory: boolean
  m_uselocalbounds: boolean
  m_radius: number
  m_poiguildname: string
  m_poiplayername: string
  m_ownershipentity: LocalEntityRef
  m_buildableentity: LocalEntityRef
  m_territoryboundsentity: LocalEntityRef
  m_discoveryboundsentity: LocalEntityRef
  '0x348da702': string
}
export function isTerritoryComponent(obj: any): obj is TerritoryComponent {
  return obj?.['__type'] === 'TerritoryComponent'
}

export interface TerritoryComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_plumlinepath: string
  m_plumlinematpath: string
  m_wallpath: string
  m_wallmatpath: string
  m_woodenstakepath: string
  m_woodenstakematpath: string
}
export function isTerritoryComponentClientFacet(obj: any): obj is TerritoryComponentClientFacet {
  return obj?.['__type'] === 'TerritoryComponentClientFacet'
}

export interface TerritoryComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTerritoryComponentServerFacet(obj: any): obj is TerritoryComponentServerFacet {
  return obj?.['__type'] === 'TerritoryComponentServerFacet'
}

export interface CameraStateComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isCameraStateComponent(obj: any): obj is CameraStateComponent {
  return obj?.['__type'] === 'CameraStateComponent'
}

export interface CameraStateComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_camerastatedropdown: string
  m_enterblendtime: number
  m_exitblendtime: number
}
export function isCameraStateComponentClientFacet(obj: any): obj is CameraStateComponentClientFacet {
  return obj?.['__type'] === 'CameraStateComponentClientFacet'
}

export interface CameraStateComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isCameraStateComponentServerFacet(obj: any): obj is CameraStateComponentServerFacet {
  return obj?.['__type'] === 'CameraStateComponentServerFacet'
}

export interface SplineComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: SplineCommon
  'spline shape asset id': AssetId
}
export function isSplineComponent(obj: any): obj is SplineComponent {
  return obj?.['__type'] === 'SplineComponent'
}

export interface SplineCommon {
  __type: string
  'spline type': number
  spline: BezierSpline | LinearSpline | CatmullRomSpline
}
export function isSplineCommon(obj: any): obj is SplineCommon {
  return obj?.['__type'] === 'SplineCommon'
}

export interface BezierSpline {
  __type: string
  baseclass1: Spline
  'bezier data': Array<BezierData>
  granularity: number
}
export function isBezierSpline(obj: any): obj is BezierSpline {
  return obj?.['__type'] === 'BezierSpline'
}

export interface Spline {
  __type: string
  vertices: VertexContainer_Vector3__
  closed: boolean
}
export function isSpline(obj: any): obj is Spline {
  return obj?.['__type'] === 'Spline'
}

export interface VertexContainer_Vector3__ {
  __type: string
  vertices: Array<Array<number>>
}
export function isVertexContainer_Vector3__(obj: any): obj is VertexContainer_Vector3__ {
  return obj?.['__type'] === 'VertexContainer<Vector3 >'
}

export interface BezierData {
  __type: string
  forward: Array<number>
  back: Array<number>
  angle: number
}
export function isBezierData(obj: any): obj is BezierData {
  return obj?.['__type'] === 'BezierData'
}

export interface RoadComponent {
  __type: string
  baseclass1: AZ__Component
  road: Road
}
export function isRoadComponent(obj: any): obj is RoadComponent {
  return obj?.['__type'] === 'RoadComponent'
}

export interface Road {
  __type: string
  baseclass1: SplineGeometry
  material: AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  ignoreterrainholes: boolean
}
export function isRoad(obj: any): obj is Road {
  return obj?.['__type'] === 'Road'
}

export interface SplineGeometry {
  __type: string
  width: SplineGeometryWidthModifier
  segmentlength: number
  tilelength: number
  sortpriority: number
  viewdistancemultiplier: number
  minspec: number
}
export function isSplineGeometry(obj: any): obj is SplineGeometry {
  return obj?.['__type'] === 'SplineGeometry'
}

export interface SplineGeometryWidthModifier {
  __type: string
  defaultwidth: number
  widthattribute: SplineAttribute_AttributeType_
}
export function isSplineGeometryWidthModifier(obj: any): obj is SplineGeometryWidthModifier {
  return obj?.['__type'] === 'SplineGeometryWidthModifier'
}

export interface SplineAttribute_AttributeType_ {
  __type: string
  elements: Array<number>
}
export function isSplineAttribute_AttributeType_(obj: any): obj is SplineAttribute_AttributeType_ {
  return obj?.['__type'] === 'SplineAttribute<AttributeType>'
}

export interface PrefabSpawnRandomizer {
  __type: string
  baseclass1: FacetedComponent
  m_minspawncount: number
  m_maxspawncount: number
  m_normalspawntime: number
  m_belowminspawntime: number
  m_spawnonstartup: boolean
}
export function isPrefabSpawnRandomizer(obj: any): obj is PrefabSpawnRandomizer {
  return obj?.['__type'] === 'PrefabSpawnRandomizer'
}

export interface PrefabSpawnRandomizerClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPrefabSpawnRandomizerClientFacet(obj: any): obj is PrefabSpawnRandomizerClientFacet {
  return obj?.['__type'] === 'PrefabSpawnRandomizerClientFacet'
}

export interface PrefabSpawnRandomizerServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPrefabSpawnRandomizerServerFacet(obj: any): obj is PrefabSpawnRandomizerServerFacet {
  return obj?.['__type'] === 'PrefabSpawnRandomizerServerFacet'
}

export interface CompoundShapeComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: CompoundShapeConfiguration
}
export function isCompoundShapeComponent(obj: any): obj is CompoundShapeComponent {
  return obj?.['__type'] === 'CompoundShapeComponent'
}

export interface CompoundShapeConfiguration {
  __type: string
  'child shape entities': Array<EntityId>
}
export function isCompoundShapeConfiguration(obj: any): obj is CompoundShapeConfiguration {
  return obj?.['__type'] === 'CompoundShapeConfiguration'
}

export interface AmbientTypeComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAmbientTypeComponent(obj: any): obj is AmbientTypeComponent {
  return obj?.['__type'] === 'AmbientTypeComponent'
}

export interface AmbientTypeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_ambienttype: string
  m_loadonactivate: boolean
}
export function isAmbientTypeComponentClientFacet(obj: any): obj is AmbientTypeComponentClientFacet {
  return obj?.['__type'] === 'AmbientTypeComponentClientFacet'
}

export interface AmbientTypeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAmbientTypeComponentServerFacet(obj: any): obj is AmbientTypeComponentServerFacet {
  return obj?.['__type'] === 'AmbientTypeComponentServerFacet'
}

export interface VegetationDescriptorListComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationDescriptorListConfig
}
export function isVegetationDescriptorListComponent(obj: any): obj is VegetationDescriptorListComponent {
  return obj?.['__type'] === 'VegetationDescriptorListComponent'
}

export interface VegetationDescriptorListConfig {
  __type: string
  vegetationdescriptors: Array<VegetationDescriptor>
}
export function isVegetationDescriptorListConfig(obj: any): obj is VegetationDescriptorListConfig {
  return obj?.['__type'] === 'VegetationDescriptorListConfig'
}

export interface VegetationDescriptor {
  __type: string
  meshasset: Asset
  materialasset: AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  weight: number
  automerge: boolean
  surfaceoffsettags: []
  surfacedepthtags: []
  surfacefilteroverridemode: number
  inclusivesurfacefiltertags: []
  exclusivesurfacefiltertags: []
  surfacealignmentoverrideenabled: boolean
  surfacealignmentmin: number
  surfacealignmentmax: number
  rotationoverrideenabled: boolean
  rotationmin: Array<number>
  rotationmax: Array<number>
  positionoverrideenabled: boolean
  positionmin: Array<number>
  positionmax: Array<number>
  scaleoverrideenabled: boolean
  scalemin: number
  scalemax: number
  altitudefilteroverrideenabled: boolean
  altitudefiltermin: number
  altitudefiltermax: number
  slopefilteroverrideenabled: boolean
  slopefiltermin: number
  slopefiltermax: number
  bending: number
  userdata: $any
}
export function isVegetationDescriptor(obj: any): obj is VegetationDescriptor {
  return obj?.['__type'] === 'VegetationDescriptor'
}

export interface $any {
  __type: string
  m_data: number
}
export function is$any(obj: any): obj is $any {
  return obj?.['__type'] === 'any'
}

export interface VegetationReferenceShapeComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationReferenceShapeConfig
}
export function isVegetationReferenceShapeComponent(obj: any): obj is VegetationReferenceShapeComponent {
  return obj?.['__type'] === 'VegetationReferenceShapeComponent'
}

export interface VegetationReferenceShapeConfig {
  __type: string
  shapeentityid: EntityId
}
export function isVegetationReferenceShapeConfig(obj: any): obj is VegetationReferenceShapeConfig {
  return obj?.['__type'] === 'VegetationReferenceShapeConfig'
}

export interface VegetationSpawnerComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationSpawnerConfig
}
export function isVegetationSpawnerComponent(obj: any): obj is VegetationSpawnerComponent {
  return obj?.['__type'] === 'VegetationSpawnerComponent'
}

export interface VegetationSpawnerConfig {
  __type: string
  inheritbehavior: boolean
  allowemptymeshes: boolean
  userelativeuvw: boolean
  filterstage: number
}
export function isVegetationSpawnerConfig(obj: any): obj is VegetationSpawnerConfig {
  return obj?.['__type'] === 'VegetationSpawnerConfig'
}

export interface VegetationRotationModifierComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationRotationModifierConfig
}
export function isVegetationRotationModifierComponent(obj: any): obj is VegetationRotationModifierComponent {
  return obj?.['__type'] === 'VegetationRotationModifierComponent'
}

export interface VegetationRotationModifierConfig {
  __type: string
  allowoverrides: boolean
  rangemin: Array<number>
  rangemax: Array<number>
  gradientx: VegetationGradientSampler
  gradienty: VegetationGradientSampler
  gradientz: VegetationGradientSampler
}
export function isVegetationRotationModifierConfig(obj: any): obj is VegetationRotationModifierConfig {
  return obj?.['__type'] === 'VegetationRotationModifierConfig'
}

export interface VegetationGradientSampler {
  __type: string
  gradientid: EntityId
  opacity: number
  enablelevels: boolean
  inputmid: number
  inputmin: number
  inputmax: number
  outputmin: number
  outputmax: number
  enabletransform: boolean
  translate: Array<number>
  scale: Array<number>
  rotate: Array<number>
}
export function isVegetationGradientSampler(obj: any): obj is VegetationGradientSampler {
  return obj?.['__type'] === 'VegetationGradientSampler'
}

export interface VegetationPositionModifierComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationPositionModifierConfig
}
export function isVegetationPositionModifierComponent(obj: any): obj is VegetationPositionModifierComponent {
  return obj?.['__type'] === 'VegetationPositionModifierComponent'
}

export interface VegetationPositionModifierConfig {
  __type: string
  allowoverrides: boolean
  rangemin: Array<number>
  rangemax: Array<number>
  gradientx: VegetationGradientSampler
  gradienty: VegetationGradientSampler
  gradientz: VegetationGradientSampler
  aligntowater: boolean
  waterheightoffset: number
}
export function isVegetationPositionModifierConfig(obj: any): obj is VegetationPositionModifierConfig {
  return obj?.['__type'] === 'VegetationPositionModifierConfig'
}

export interface VegetationSlopeAlignmentModifierComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationSlopeAlignmentModifierConfig
}
export function isVegetationSlopeAlignmentModifierComponent(
  obj: any
): obj is VegetationSlopeAlignmentModifierComponent {
  return obj?.['__type'] === 'VegetationSlopeAlignmentModifierComponent'
}

export interface VegetationSlopeAlignmentModifierConfig {
  __type: string
  allowoverrides: boolean
  rangemin: number
  rangemax: number
  gradient: VegetationGradientSampler
}
export function isVegetationSlopeAlignmentModifierConfig(obj: any): obj is VegetationSlopeAlignmentModifierConfig {
  return obj?.['__type'] === 'VegetationSlopeAlignmentModifierConfig'
}

export interface VegetationDistributionFilterComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationDistributionFilterConfig
}
export function isVegetationDistributionFilterComponent(obj: any): obj is VegetationDistributionFilterComponent {
  return obj?.['__type'] === 'VegetationDistributionFilterComponent'
}

export interface VegetationDistributionFilterConfig {
  __type: string
  filterstage: number
  thresholdmin: number
  thresholdmax: number
  gradient: VegetationGradientSampler
}
export function isVegetationDistributionFilterConfig(obj: any): obj is VegetationDistributionFilterConfig {
  return obj?.['__type'] === 'VegetationDistributionFilterConfig'
}

export interface VegetationScaleModifierComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationScaleModifierConfig
}
export function isVegetationScaleModifierComponent(obj: any): obj is VegetationScaleModifierComponent {
  return obj?.['__type'] === 'VegetationScaleModifierComponent'
}

export interface VegetationScaleModifierConfig {
  __type: string
  allowoverrides: boolean
  rangemin: number
  rangemax: number
  gradient: VegetationGradientSampler
}
export function isVegetationScaleModifierConfig(obj: any): obj is VegetationScaleModifierConfig {
  return obj?.['__type'] === 'VegetationScaleModifierConfig'
}

export interface VegetationDescriptorWeightSelectorComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationDescriptorWeightSelectorConfig
}
export function isVegetationDescriptorWeightSelectorComponent(
  obj: any
): obj is VegetationDescriptorWeightSelectorComponent {
  return obj?.['__type'] === 'VegetationDescriptorWeightSelectorComponent'
}

export interface VegetationDescriptorWeightSelectorConfig {
  __type: string
  sortbehavior: number
  gradient: VegetationGradientSampler
}
export function isVegetationDescriptorWeightSelectorConfig(obj: any): obj is VegetationDescriptorWeightSelectorConfig {
  return obj?.['__type'] === 'VegetationDescriptorWeightSelectorConfig'
}

export interface VegetationRandomGradientComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationRandomGradientConfig
}
export function isVegetationRandomGradientComponent(obj: any): obj is VegetationRandomGradientComponent {
  return obj?.['__type'] === 'VegetationRandomGradientComponent'
}

export interface VegetationRandomGradientConfig {
  __type: string
  randomseed: number
  gradientscale: number
}
export function isVegetationRandomGradientConfig(obj: any): obj is VegetationRandomGradientConfig {
  return obj?.['__type'] === 'VegetationRandomGradientConfig'
}

export interface FastNoiseGradientComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: FastNoiseGradientConfig
}
export function isFastNoiseGradientComponent(obj: any): obj is FastNoiseGradientComponent {
  return obj?.['__type'] === 'FastNoiseGradientComponent'
}

export interface FastNoiseGradientConfig {
  __type: string
  noisetype: number
  seed: number
  frequency: number
  octaves: number
  lacunarity: number
  gain: number
  interp: number
  fractaltype: number
  cellulardistancefunction: number
  cellularreturntype: number
  cellularjitter: number
}
export function isFastNoiseGradientConfig(obj: any): obj is FastNoiseGradientConfig {
  return obj?.['__type'] === 'FastNoiseGradientConfig'
}

export interface PrimitiveColliderComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: PrimitiveColliderConfig
}
export function isPrimitiveColliderComponent(obj: any): obj is PrimitiveColliderComponent {
  return obj?.['__type'] === 'PrimitiveColliderComponent'
}

export interface PrimitiveColliderConfig {
  __type: string
  surfacetypename: string
}
export function isPrimitiveColliderConfig(obj: any): obj is PrimitiveColliderConfig {
  return obj?.['__type'] === 'PrimitiveColliderConfig'
}

export interface WaterVolumeComponent {
  __type: string
  baseclass1: AZ__Component
  common: WaterVolumeCommon
}
export function isWaterVolumeComponent(obj: any): obj is WaterVolumeComponent {
  return obj?.['__type'] === 'WaterVolumeComponent'
}

export interface WaterVolumeCommon {
  __type: string
  materialasset: AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  minspec: number
  surfaceuscale: number
  surfacevscale: number
  viewdistancemultiplier: number
  fogdensity: number
  fogcolor: Array<number>
  fogcolormultiplier: number
  fogcoloraffectedbysun: boolean
  fogshadowing: number
  capfogatvolumedepth: boolean
  causticsenabled: boolean
  causticintensity: number
  caustictiling: number
  causticheight: number
  spillablevolume: number
  volumeaccuracy: number
  extrudeborder: number
  convexborder: boolean
  objectsizelimit: number
  wavesurfacecellsize: number
  wavespeed: number
  wavedampening: number
  wavetimestep: number
  wavesleepthreshold: number
  wavedepthcellsize: number
  waveheightlimit: number
  waveforce: number
  wavesimulationareagrowth: number
}
export function isWaterVolumeCommon(obj: any): obj is WaterVolumeCommon {
  return obj?.['__type'] === 'WaterVolumeCommon'
}

export interface VegetationAreaBlenderComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationAreaBlenderConfig
}
export function isVegetationAreaBlenderComponent(obj: any): obj is VegetationAreaBlenderComponent {
  return obj?.['__type'] === 'VegetationAreaBlenderComponent'
}

export interface VegetationAreaBlenderConfig {
  __type: string
  inheritbehavior: boolean
  propagatebehavior: boolean
  operations: Array<EntityId>
}
export function isVegetationAreaBlenderConfig(obj: any): obj is VegetationAreaBlenderConfig {
  return obj?.['__type'] === 'VegetationAreaBlenderConfig'
}

export interface VegetationPerlinGradientComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationPerlinGradientConfig
}
export function isVegetationPerlinGradientComponent(obj: any): obj is VegetationPerlinGradientComponent {
  return obj?.['__type'] === 'VegetationPerlinGradientComponent'
}

export interface VegetationPerlinGradientConfig {
  __type: string
  randomseed: number
  octave: number
  amplitude: number
  cacheresults: boolean
  cacheresolution: number
}
export function isVegetationPerlinGradientConfig(obj: any): obj is VegetationPerlinGradientConfig {
  return obj?.['__type'] === 'VegetationPerlinGradientConfig'
}

export interface QueryShapeCylinder {
  __type: string
  baseclass1: QueryShapeBase
  m_height: number
  m_radius: number
}
export function isQueryShapeCylinder(obj: any): obj is QueryShapeCylinder {
  return obj?.['__type'] === 'QueryShapeCylinder'
}

export interface LinearSpline {
  __type: string
  baseclass1: Spline
}
export function isLinearSpline(obj: any): obj is LinearSpline {
  return obj?.['__type'] === 'LinearSpline'
}

export interface VoidDestroyerEyeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_linkedmovemententityid: EntityId
}
export function isVoidDestroyerEyeComponent(obj: any): obj is VoidDestroyerEyeComponent {
  return obj?.['__type'] === 'VoidDestroyerEyeComponent'
}

export interface VoidDestroyerEyeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isVoidDestroyerEyeComponentClientFacet(obj: any): obj is VoidDestroyerEyeComponentClientFacet {
  return obj?.['__type'] === 'VoidDestroyerEyeComponentClientFacet'
}

export interface VoidDestroyerEyeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isVoidDestroyerEyeComponentServerFacet(obj: any): obj is VoidDestroyerEyeComponentServerFacet {
  return obj?.['__type'] === 'VoidDestroyerEyeComponentServerFacet'
}

export interface LightweightCharacterComponent {
  __type: string
  baseclass1: FacetedComponent
  m_skinnedmeshentityid: EntityId
  m_cdfpath: AzFramework__SimpleAssetReference_CharacterDefinitionAsset_
}
export function isLightweightCharacterComponent(obj: any): obj is LightweightCharacterComponent {
  return obj?.['__type'] === 'LightweightCharacterComponent'
}

export interface LightweightCharacterComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isLightweightCharacterComponentClientFacet(obj: any): obj is LightweightCharacterComponentClientFacet {
  return obj?.['__type'] === 'LightweightCharacterComponentClientFacet'
}

export interface LightweightCharacterComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_tickanimation: boolean
}
export function isLightweightCharacterComponentServerFacet(obj: any): obj is LightweightCharacterComponentServerFacet {
  return obj?.['__type'] === 'LightweightCharacterComponentServerFacet'
}

export interface StimulusComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isStimulusComponent(obj: any): obj is StimulusComponent {
  return obj?.['__type'] === 'StimulusComponent'
}

export interface StimulusComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isStimulusComponentClientFacet(obj: any): obj is StimulusComponentClientFacet {
  return obj?.['__type'] === 'StimulusComponentClientFacet'
}

export interface StimulusComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_stimulusdurations: Asset
}
export function isStimulusComponentServerFacet(obj: any): obj is StimulusComponentServerFacet {
  return obj?.['__type'] === 'StimulusComponentServerFacet'
}

export interface AITargetCollectorComponent {
  __type: string
  baseclass1: FacetedComponent
  m_replicationcategory: number
}
export function isAITargetCollectorComponent(obj: any): obj is AITargetCollectorComponent {
  return obj?.['__type'] === 'AITargetCollectorComponent'
}

export interface AITargetCollectorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAITargetCollectorComponentClientFacet(obj: any): obj is AITargetCollectorComponentClientFacet {
  return obj?.['__type'] === 'AITargetCollectorComponentClientFacet'
}

export interface AITargetCollectorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_detectionvolumecomponententity: LocalEntityRef
}
export function isAITargetCollectorComponentServerFacet(obj: any): obj is AITargetCollectorComponentServerFacet {
  return obj?.['__type'] === 'AITargetCollectorComponentServerFacet'
}

export interface InvasionAgentComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isInvasionAgentComponent(obj: any): obj is InvasionAgentComponent {
  return obj?.['__type'] === 'InvasionAgentComponent'
}

export interface InvasionAgentComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isInvasionAgentComponentClientFacet(obj: any): obj is InvasionAgentComponentClientFacet {
  return obj?.['__type'] === 'InvasionAgentComponentClientFacet'
}

export interface InvasionAgentComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  objective_priorities: Array<number>
  'consume attack slot': boolean
  'allow assignment while targeting': boolean
}
export function isInvasionAgentComponentServerFacet(obj: any): obj is InvasionAgentComponentServerFacet {
  return obj?.['__type'] === 'InvasionAgentComponentServerFacet'
}

export interface AISpawnPositionTrackingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAISpawnPositionTrackingComponent(obj: any): obj is AISpawnPositionTrackingComponent {
  return obj?.['__type'] === 'AISpawnPositionTrackingComponent'
}

export interface AISpawnPositionTrackingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAISpawnPositionTrackingComponentClientFacet(
  obj: any
): obj is AISpawnPositionTrackingComponentClientFacet {
  return obj?.['__type'] === 'AISpawnPositionTrackingComponentClientFacet'
}

export interface AISpawnPositionTrackingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_mindistancebetweenreportsmeters: number
  m_mintimebetweenreportsmillis: number
}
export function isAISpawnPositionTrackingComponentServerFacet(
  obj: any
): obj is AISpawnPositionTrackingComponentServerFacet {
  return obj?.['__type'] === 'AISpawnPositionTrackingComponentServerFacet'
}

export interface BlackboardComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isBlackboardComponent(obj: any): obj is BlackboardComponent {
  return obj?.['__type'] === 'BlackboardComponent'
}

export interface BlackboardComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBlackboardComponentClientFacet(obj: any): obj is BlackboardComponentClientFacet {
  return obj?.['__type'] === 'BlackboardComponentClientFacet'
}

export interface BlackboardComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_configparams: Array<$$2f09439e_051f_5360_859e_55eab094feb5>
  m_meleedamagefilter: string
}
export function isBlackboardComponentServerFacet(obj: any): obj is BlackboardComponentServerFacet {
  return obj?.['__type'] === 'BlackboardComponentServerFacet'
}

export interface $$2f09439e_051f_5360_859e_55eab094feb5 {
  __type: string
  element: BooleanParameter | FloatParameter | StringParameter | IntegerParameter
}
export function is$$2f09439e_051f_5360_859e_55eab094feb5(obj: any): obj is $$2f09439e_051f_5360_859e_55eab094feb5 {
  return obj?.['__type'] === '2f09439e-051f-5360-859e-55eab094feb5'
}

export interface BooleanParameter {
  __type: string
  baseclass1: GenericParameter
  m_value: boolean
}
export function isBooleanParameter(obj: any): obj is BooleanParameter {
  return obj?.['__type'] === 'BooleanParameter'
}

export interface GenericParameter {
  __type: string
  m_name: string
}
export function isGenericParameter(obj: any): obj is GenericParameter {
  return obj?.['__type'] === 'GenericParameter'
}

export interface BehaviorTreeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_autoevaluationfrequency: number
  m_autoevaluateblackboardvariables: Array<string>
  m_behaviortreeassets: Array<BehaviorTreeAssetRef>
}
export function isBehaviorTreeComponent(obj: any): obj is BehaviorTreeComponent {
  return obj?.['__type'] === 'BehaviorTreeComponent'
}

export interface BehaviorTreeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBehaviorTreeComponentClientFacet(obj: any): obj is BehaviorTreeComponentClientFacet {
  return obj?.['__type'] === 'BehaviorTreeComponentClientFacet'
}

export interface BehaviorTreeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBehaviorTreeComponentServerFacet(obj: any): obj is BehaviorTreeComponentServerFacet {
  return obj?.['__type'] === 'BehaviorTreeComponentServerFacet'
}

export interface BehaviorTreeAssetRef {
  __type: string
  m_assetref: Asset
}
export function isBehaviorTreeAssetRef(obj: any): obj is BehaviorTreeAssetRef {
  return obj?.['__type'] === 'BehaviorTreeAssetRef'
}

export interface PerceptionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_alwaysshowperceptionineditor: boolean
  m_visionoffsetbone: string
  m_additionalvisionoffset: Array<number>
  m_audiooffsetbone: string
  m_additionalaudiooffset: Array<number>
}
export function isPerceptionComponent(obj: any): obj is PerceptionComponent {
  return obj?.['__type'] === 'PerceptionComponent'
}

export interface PerceptionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isPerceptionComponentClientFacet(obj: any): obj is PerceptionComponentClientFacet {
  return obj?.['__type'] === 'PerceptionComponentClientFacet'
}

export interface PerceptionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_targetselectionsharingfilter: string
  m_groupaggrodistance: number
  m_verifygroupaggrolos: boolean
  m_groupaggrosharecap: number
  m_ambientvisionprofile: VisionPerceptionProfile
  m_combatvisionprofile: VisionPerceptionProfile
  m_verifylos: boolean
  m_applyleveldisparityadjustments: boolean
  m_aiaudiotriggerconfiguration: Asset
  m_detectionvolumecomponententity: LocalEntityRef
}
export function isPerceptionComponentServerFacet(obj: any): obj is PerceptionComponentServerFacet {
  return obj?.['__type'] === 'PerceptionComponentServerFacet'
}

export interface VisionPerceptionProfile {
  __type: string
  m_visionangle: number
  m_visiondistance: number
}
export function isVisionPerceptionProfile(obj: any): obj is VisionPerceptionProfile {
  return obj?.['__type'] === 'VisionPerceptionProfile'
}

export interface AITargetSelectorComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAITargetSelectorComponent(obj: any): obj is AITargetSelectorComponent {
  return obj?.['__type'] === 'AITargetSelectorComponent'
}

export interface AITargetSelectorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAITargetSelectorComponentClientFacet(obj: any): obj is AITargetSelectorComponentClientFacet {
  return obj?.['__type'] === 'AITargetSelectorComponentClientFacet'
}

export interface AITargetSelectorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_targetingprofile: Asset
  m_ignorereachability: boolean
  m_ignorevisionperceptionscore: boolean
  m_ignoreaudioperceptionscore: boolean
  m_ignoreproximityperceptionscore: boolean
  m_overrideaggrodelay: boolean
  m_aggrodelayoverridesec: number
  m_aipreventenemytrainingonslice: boolean
  m_targetreachabilityrange: number
}
export function isAITargetSelectorComponentServerFacet(obj: any): obj is AITargetSelectorComponentServerFacet {
  return obj?.['__type'] === 'AITargetSelectorComponentServerFacet'
}

export interface AIPatrolComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAIPatrolComponent(obj: any): obj is AIPatrolComponent {
  return obj?.['__type'] === 'AIPatrolComponent'
}

export interface AIPatrolComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAIPatrolComponentClientFacet(obj: any): obj is AIPatrolComponentClientFacet {
  return obj?.['__type'] === 'AIPatrolComponentClientFacet'
}

export interface AIPatrolComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAIPatrolComponentServerFacet(obj: any): obj is AIPatrolComponentServerFacet {
  return obj?.['__type'] === 'AIPatrolComponentServerFacet'
}

export interface AIManagerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAIManagerComponent(obj: any): obj is AIManagerComponent {
  return obj?.['__type'] === 'AIManagerComponent'
}

export interface BeamAttackComponent {
  __type: string
  baseclass1: FacetedComponent
  m_beamdata: Array<BeamAttackData>
  m_detectionvolume: LocalEntityRef
  m_respecttriggeruntriggerevents: boolean
  m_shouldusetargetprovidedbyspelldetails: boolean
}
export function isBeamAttackComponent(obj: any): obj is BeamAttackComponent {
  return obj?.['__type'] === 'BeamAttackComponent'
}

export interface BeamAttackComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBeamAttackComponentClientFacet(obj: any): obj is BeamAttackComponentClientFacet {
  return obj?.['__type'] === 'BeamAttackComponentClientFacet'
}

export interface BeamAttackComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBeamAttackComponentServerFacet(obj: any): obj is BeamAttackComponentServerFacet {
  return obj?.['__type'] === 'BeamAttackComponentServerFacet'
}

export interface BeamAttackData {
  __type: string
  m_name: string
  m_beamdataentry: string
  m_sourceentity: LocalEntityRef
  m_destinationentity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
  m_gatherableentity: LocalEntityRef
  m_startdelayms: number
  m_beameffectname: string
  m_sourceeffectname: string
  m_destinationeffectname: string
  m_killbeameffectondeactivate: boolean
  m_killsourceeffectondeactivate: boolean
  m_killdestinationeffectondeactivate: boolean
  m_interpolationsmoothtime: number
  m_maxlength: number
  m_radius: number
  m_beamspeed: number
  m_circlepitchspawnangle: number
  m_circleyawspawnangle: number
  m_linestartpointoffset: Array<number>
  m_linedestinationpointoffset: Array<number>
  m_dealdamageonhit: boolean
  m_damagedata: OffenseDamageData
  m_strcollisionfilter: string
  m_usebone: boolean
  m_bonename: string
  m_boneposoffset: Array<number>
  m_bonerotoffset: Array<number>
  m_usedestinationbone: boolean
  m_destinationbonename: string
  m_destinationboneposoffset: Array<number>
  m_usepaperdolldestination: boolean
  m_paperdollslot: number
  m_disablephysics: boolean
  m_ignorestriggerbasedtoggles: boolean
}
export function isBeamAttackData(obj: any): obj is BeamAttackData {
  return obj?.['__type'] === 'BeamAttackData'
}

export interface OffenseDamageData {
  __type: string
  m_damagedatatable: string
  m_damagedataentry: string
  m_basedamage: number
  m_inheritvitalsbasedamage: boolean
  m_inheritsourcebasedamage: boolean
  m_inheritsourcedamagetablerow: boolean
  m_inheritsourceammoid: boolean
  m_donotkillondeathsdoor: boolean
  m_damagerate: number
  m_affliction: string
  m_afflictionvalue: number
  m_blockstaminadamage: number
  m_forcepvpflag: boolean
  m_damageguildandgroup: boolean
}
export function isOffenseDamageData(obj: any): obj is OffenseDamageData {
  return obj?.['__type'] === 'OffenseDamageData'
}

export interface TimeOfDayPOIComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: TimeOfDayPOIConfig
}
export function isTimeOfDayPOIComponent(obj: any): obj is TimeOfDayPOIComponent {
  return obj?.['__type'] === 'TimeOfDayPOIComponent'
}

export interface TimeOfDayPOIConfig {
  __type: string
  filename: string
  sliceasset: Asset
  colorgrading: Asset
  priority: number
  blendtime: number
  blenddistance: number
}
export function isTimeOfDayPOIConfig(obj: any): obj is TimeOfDayPOIConfig {
  return obj?.['__type'] === 'TimeOfDayPOIConfig'
}

export interface OpenMapComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isOpenMapComponent(obj: any): obj is OpenMapComponent {
  return obj?.['__type'] === 'OpenMapComponent'
}

export interface OpenMapClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isOpenMapClientFacet(obj: any): obj is OpenMapClientFacet {
  return obj?.['__type'] === 'OpenMapClientFacet'
}

export interface OpenMapServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isOpenMapServerFacet(obj: any): obj is OpenMapServerFacet {
  return obj?.['__type'] === 'OpenMapServerFacet'
}

export interface HomeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_respawntype: number
  m_respawncooldown: number
  m_nameentity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
  m_rotateplayer: boolean
  m_childspawnpoints: Array<EntityId>
  m_minspawnrange: number
  m_maxspawnrange: number
  m_usingchildspawnpointsforpostwar: boolean
  m_usingchildspawnpointsforrespawns: boolean
  m_uniquespawnpointidongde: number
  m_allowuseasunstuckpoint: boolean
}
export function isHomeComponent(obj: any): obj is HomeComponent {
  return obj?.['__type'] === 'HomeComponent'
}

export interface HomeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isHomeComponentClientFacet(obj: any): obj is HomeComponentClientFacet {
  return obj?.['__type'] === 'HomeComponentClientFacet'
}

export interface HomeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_detectionvolumeentity: LocalEntityRef
  m_snaptoterrainentity: LocalEntityRef
}
export function isHomeComponentServerFacet(obj: any): obj is HomeComponentServerFacet {
  return obj?.['__type'] === 'HomeComponentServerFacet'
}

export interface TimeOfDayConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTimeOfDayConstraintComponent(obj: any): obj is TimeOfDayConstraintComponent {
  return obj?.['__type'] === 'TimeOfDayConstraintComponent'
}

export interface TimeOfDayConstraintComponentClientFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentClientFacet
}
export function isTimeOfDayConstraintComponentClientFacet(obj: any): obj is TimeOfDayConstraintComponentClientFacet {
  return obj?.['__type'] === 'TimeOfDayConstraintComponentClientFacet'
}

export interface TimeOfDayConstraintComponentServerFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentServerFacet
  m_night: boolean
  m_dawn: boolean
  m_day: boolean
  m_dusk: boolean
  '0x079d8c34': boolean
}
export function isTimeOfDayConstraintComponentServerFacet(obj: any): obj is TimeOfDayConstraintComponentServerFacet {
  return obj?.['__type'] === 'TimeOfDayConstraintComponentServerFacet'
}

export interface DetectionVolumeConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDetectionVolumeConstraintComponent(obj: any): obj is DetectionVolumeConstraintComponent {
  return obj?.['__type'] === 'DetectionVolumeConstraintComponent'
}

export interface DetectionVolumeConstraintComponentClientFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentClientFacet
}
export function isDetectionVolumeConstraintComponentClientFacet(
  obj: any
): obj is DetectionVolumeConstraintComponentClientFacet {
  return obj?.['__type'] === 'DetectionVolumeConstraintComponentClientFacet'
}

export interface DetectionVolumeConstraintComponentServerFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentServerFacet
  m_mintrackedagents: number
  m_despawnonempty: boolean
  m_despawnonemptydelay: number
  m_detectionboundsentity: LocalEntityRef
}
export function isDetectionVolumeConstraintComponentServerFacet(
  obj: any
): obj is DetectionVolumeConstraintComponentServerFacet {
  return obj?.['__type'] === 'DetectionVolumeConstraintComponentServerFacet'
}

export interface DarknessConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
  m_spawnscalingspec: Array<SpawnScalingSpecification>
}
export function isDarknessConstraintComponent(obj: any): obj is DarknessConstraintComponent {
  return obj?.['__type'] === 'DarknessConstraintComponent'
}

export interface DarknessConstraintComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDarknessConstraintComponentClientFacet(obj: any): obj is DarknessConstraintComponentClientFacet {
  return obj?.['__type'] === 'DarknessConstraintComponentClientFacet'
}

export interface DarknessConstraintComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_configureddarknessgroup: number
  m_darknesspercentthreshold: number
  m_mode: number
  m_maximumtag: number
}
export function isDarknessConstraintComponentServerFacet(obj: any): obj is DarknessConstraintComponentServerFacet {
  return obj?.['__type'] === 'DarknessConstraintComponentServerFacet'
}

export interface SpawnScalingSpecification {
  __type: string
  m_percentage: number
  m_spawnpercentagetomaintain: number
}
export function isSpawnScalingSpecification(obj: any): obj is SpawnScalingSpecification {
  return obj?.['__type'] === 'SpawnScalingSpecification'
}

export interface DetectableComponent {
  __type: string
  baseclass1: FacetedComponent
  m_strfilter: string
}
export function isDetectableComponent(obj: any): obj is DetectableComponent {
  return obj?.['__type'] === 'DetectableComponent'
}

export interface DetectableComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDetectableComponentClientFacet(obj: any): obj is DetectableComponentClientFacet {
  return obj?.['__type'] === 'DetectableComponentClientFacet'
}

export interface DetectableComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_lastknownposition: Array<number>
  m_lastknownrotation: Array<number>
}
export function isDetectableComponentServerFacet(obj: any): obj is DetectableComponentServerFacet {
  return obj?.['__type'] === 'DetectableComponentServerFacet'
}

export interface EventTimelineComponent {
  __type: string
  baseclass1: FacetedComponent
  m_eventtimelinedata: Array<EventTimelineData>
  m_triggeroninit: boolean
}
export function isEventTimelineComponent(obj: any): obj is EventTimelineComponent {
  return obj?.['__type'] === 'EventTimelineComponent'
}

export interface EventTimelineComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isEventTimelineComponentClientFacet(obj: any): obj is EventTimelineComponentClientFacet {
  return obj?.['__type'] === 'EventTimelineComponentClientFacet'
}

export interface EventTimelineComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isEventTimelineComponentServerFacet(obj: any): obj is EventTimelineComponentServerFacet {
  return obj?.['__type'] === 'EventTimelineComponentServerFacet'
}

export interface EventTimelineData {
  __type: string
  m_delayduration: number
  m_onstartevents: Array<EventTimelineDatapoint>
  m_onendevents: Array<EventTimelineDatapoint>
}
export function isEventTimelineData(obj: any): obj is EventTimelineData {
  return obj?.['__type'] === 'EventTimelineData'
}

export interface EventTimelineDatapoint {
  __type: string
  m_eventdata: EventData
  m_reexecuteuponreload: boolean
}
export function isEventTimelineDatapoint(obj: any): obj is EventTimelineDatapoint {
  return obj?.['__type'] === 'EventTimelineDatapoint'
}

export interface ShowOnMapUIComponent {
  __type: string
  baseclass1: AZ__Component
  'show on map?': boolean
  'show on compass?': boolean
  'map icon asset': AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_
  'map background asset': AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_
  'compass icon asset': AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_
  'tradeskill unlock type': string
  'title localization tag': string
  'description localization tag': string
}
export function isShowOnMapUIComponent(obj: any): obj is ShowOnMapUIComponent {
  return obj?.['__type'] === 'ShowOnMapUIComponent'
}

export interface InteractTeleportComponent {
  __type: string
  baseclass1: FacetedComponent
  m_channelduration: number
}
export function isInteractTeleportComponent(obj: any): obj is InteractTeleportComponent {
  return obj?.['__type'] === 'InteractTeleportComponent'
}

export interface InteractTeleportComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isInteractTeleportComponentClientFacet(obj: any): obj is InteractTeleportComponentClientFacet {
  return obj?.['__type'] === 'InteractTeleportComponentClientFacet'
}

export interface InteractTeleportComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_entitytoteleportto: EntityId
  '0x8bce7bf8': boolean
}
export function isInteractTeleportComponentServerFacet(obj: any): obj is InteractTeleportComponentServerFacet {
  return obj?.['__type'] === 'InteractTeleportComponentServerFacet'
}

export interface AudioShapeComponent {
  __type: string
  baseclass1: AZ__Component
  'exterior follow mode': number
  'interior follow mode': number
  'interior follow offset': number
}
export function isAudioShapeComponent(obj: any): obj is AudioShapeComponent {
  return obj?.['__type'] === 'AudioShapeComponent'
}

export interface InteractionAnimationComponent {
  __type: string
  baseclass1: AZ__Component
  interactionanimationid: string
  interactentityid: EntityId
  timelineentityid: EntityId
  alignmententityid: EntityId
}
export function isInteractionAnimationComponent(obj: any): obj is InteractionAnimationComponent {
  return obj?.['__type'] === 'InteractionAnimationComponent'
}

export interface BlendValueComponent {
  __type: string
  baseclass1: FacetedComponent
  m_randomstartingvalue: boolean
  m_startvalue: number
  m_targetvalue: number
  m_timetoblend: number
  m_blendtype: number
  m_blendmod: number
}
export function isBlendValueComponent(obj: any): obj is BlendValueComponent {
  return obj?.['__type'] === 'BlendValueComponent'
}

export interface BlendValueComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBlendValueComponentClientFacet(obj: any): obj is BlendValueComponentClientFacet {
  return obj?.['__type'] === 'BlendValueComponentClientFacet'
}

export interface BlendValueComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBlendValueComponentServerFacet(obj: any): obj is BlendValueComponentServerFacet {
  return obj?.['__type'] === 'BlendValueComponentServerFacet'
}

export interface RotationComponent {
  __type: string
  baseclass1: FacetedComponent
  m_disableonserver: boolean
  m_activeonstart: boolean
  m_startangle: number
  m_targetangle: number
  m_initialanglepercent: number
  m_axis: number
}
export function isRotationComponent(obj: any): obj is RotationComponent {
  return obj?.['__type'] === 'RotationComponent'
}

export interface RotationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isRotationComponentClientFacet(obj: any): obj is RotationComponentClientFacet {
  return obj?.['__type'] === 'RotationComponentClientFacet'
}

export interface RotationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isRotationComponentServerFacet(obj: any): obj is RotationComponentServerFacet {
  return obj?.['__type'] === 'RotationComponentServerFacet'
}

export interface CapsuleShapeComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: CapsuleShapeConfig
}
export function isCapsuleShapeComponent(obj: any): obj is CapsuleShapeComponent {
  return obj?.['__type'] === 'CapsuleShapeComponent'
}

export interface CapsuleShapeConfig {
  __type: string
  height: number
  radius: number
}
export function isCapsuleShapeConfig(obj: any): obj is CapsuleShapeConfig {
  return obj?.['__type'] === 'CapsuleShapeConfig'
}

export interface CatmullRomSpline {
  __type: string
  baseclass1: Spline
  knotparameterization: number
  granularity: number
}
export function isCatmullRomSpline(obj: any): obj is CatmullRomSpline {
  return obj?.['__type'] === 'CatmullRomSpline'
}

export interface AudioSplineComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isAudioSplineComponent(obj: any): obj is AudioSplineComponent {
  return obj?.['__type'] === 'AudioSplineComponent'
}

export interface VegetationSurfaceSlopeFilterComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationSurfaceSlopeFilterConfig
}
export function isVegetationSurfaceSlopeFilterComponent(obj: any): obj is VegetationSurfaceSlopeFilterComponent {
  return obj?.['__type'] === 'VegetationSurfaceSlopeFilterComponent'
}

export interface VegetationSurfaceSlopeFilterConfig {
  __type: string
  filterstage: number
  allowoverrides: boolean
  slopemin: number
  slopemax: number
}
export function isVegetationSurfaceSlopeFilterConfig(obj: any): obj is VegetationSurfaceSlopeFilterConfig {
  return obj?.['__type'] === 'VegetationSurfaceSlopeFilterConfig'
}

export interface VegetationGradientTransformComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationGradientTransformConfig
}
export function isVegetationGradientTransformComponent(obj: any): obj is VegetationGradientTransformComponent {
  return obj?.['__type'] === 'VegetationGradientTransformComponent'
}

export interface VegetationGradientTransformConfig {
  __type: string
  allowreference: boolean
  shapereference: EntityId
  overridebounds: boolean
  bounds: Array<number>
  transformtype: number
  overridetranslate: boolean
  translate: Array<number>
  overriderotate: boolean
  rotate: Array<number>
  overridescale: boolean
  scale: Array<number>
  frequencyzoom: number
  adjustfrequencytobounds: boolean
  wrappingtype: number
  normalize: boolean
  is3d: boolean
}
export function isVegetationGradientTransformConfig(obj: any): obj is VegetationGradientTransformConfig {
  return obj?.['__type'] === 'VegetationGradientTransformConfig'
}

export interface WeatherComponent {
  __type: string
  baseclass1: AZ__Component
  weatherconfiguration: WeatherConfiguration
}
export function isWeatherComponent(obj: any): obj is WeatherComponent {
  return obj?.['__type'] === 'WeatherComponent'
}

export interface WeatherConfiguration {
  __type: string
  enabled: boolean
  windstrength: number
  windradius: number
  windfadingdistance: number
  spawners: []
}
export function isWeatherConfiguration(obj: any): obj is WeatherConfiguration {
  return obj?.['__type'] === 'WeatherConfiguration'
}

export interface TranslationComponent {
  __type: string
  baseclass1: FacetedComponent
  m_disableonserver: boolean
  m_activeonstart: boolean
  m_startpos: Array<number>
  m_targetpos: Array<number>
  m_initiatranslationpercent: number
}
export function isTranslationComponent(obj: any): obj is TranslationComponent {
  return obj?.['__type'] === 'TranslationComponent'
}

export interface TranslationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTranslationComponentClientFacet(obj: any): obj is TranslationComponentClientFacet {
  return obj?.['__type'] === 'TranslationComponentClientFacet'
}

export interface TranslationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTranslationComponentServerFacet(obj: any): obj is TranslationComponentServerFacet {
  return obj?.['__type'] === 'TranslationComponentServerFacet'
}

export interface VegetationMixedGradientComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationMixedGradientConfig
}
export function isVegetationMixedGradientComponent(obj: any): obj is VegetationMixedGradientComponent {
  return obj?.['__type'] === 'VegetationMixedGradientComponent'
}

export interface VegetationMixedGradientConfig {
  __type: string
  layers: Array<VegetationMixedGradientLayer>
}
export function isVegetationMixedGradientConfig(obj: any): obj is VegetationMixedGradientConfig {
  return obj?.['__type'] === 'VegetationMixedGradientConfig'
}

export interface VegetationMixedGradientLayer {
  __type: string
  enabled: boolean
  operation: number
  gradient: VegetationGradientSampler
}
export function isVegetationMixedGradientLayer(obj: any): obj is VegetationMixedGradientLayer {
  return obj?.['__type'] === 'VegetationMixedGradientLayer'
}

export interface VegetationInvertGradientComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationInvertGradientConfig
}
export function isVegetationInvertGradientComponent(obj: any): obj is VegetationInvertGradientComponent {
  return obj?.['__type'] === 'VegetationInvertGradientComponent'
}

export interface VegetationInvertGradientConfig {
  __type: string
  gradient: VegetationGradientSampler
}
export function isVegetationInvertGradientConfig(obj: any): obj is VegetationInvertGradientConfig {
  return obj?.['__type'] === 'VegetationInvertGradientConfig'
}

export interface VegetationLevelsGradientComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationLevelsGradientConfig
}
export function isVegetationLevelsGradientComponent(obj: any): obj is VegetationLevelsGradientComponent {
  return obj?.['__type'] === 'VegetationLevelsGradientComponent'
}

export interface VegetationLevelsGradientConfig {
  __type: string
  inputmin: number
  inputmid: number
  inputmax: number
  outputmin: number
  outputmax: number
  gradient: VegetationGradientSampler
}
export function isVegetationLevelsGradientConfig(obj: any): obj is VegetationLevelsGradientConfig {
  return obj?.['__type'] === 'VegetationLevelsGradientConfig'
}

export interface VegetationSurfaceMaskFilterComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationSurfaceMaskFilterConfig
}
export function isVegetationSurfaceMaskFilterComponent(obj: any): obj is VegetationSurfaceMaskFilterComponent {
  return obj?.['__type'] === 'VegetationSurfaceMaskFilterComponent'
}

export interface VegetationSurfaceMaskFilterConfig {
  __type: string
  filterstage: number
  allowoverrides: boolean
  inclusivesurfacemasks: Array<VegetationSurfaceTag>
  exclusivesurfacemasks: Array<VegetationSurfaceTag>
}
export function isVegetationSurfaceMaskFilterConfig(obj: any): obj is VegetationSurfaceMaskFilterConfig {
  return obj?.['__type'] === 'VegetationSurfaceMaskFilterConfig'
}

export interface VegetationSurfaceTag {
  __type: string
  surfacetagcrc: number
}
export function isVegetationSurfaceTag(obj: any): obj is VegetationSurfaceTag {
  return obj?.['__type'] === 'VegetationSurfaceTag'
}

export interface VegetationSurfaceAltitudeFilterComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationSurfaceAltitudeFilterConfig
}
export function isVegetationSurfaceAltitudeFilterComponent(obj: any): obj is VegetationSurfaceAltitudeFilterComponent {
  return obj?.['__type'] === 'VegetationSurfaceAltitudeFilterComponent'
}

export interface VegetationSurfaceAltitudeFilterConfig {
  __type: string
  filterstage: number
  allowoverrides: boolean
  shapeentityid: EntityId
  altitudemin: number
  altitudemax: number
}
export function isVegetationSurfaceAltitudeFilterConfig(obj: any): obj is VegetationSurfaceAltitudeFilterConfig {
  return obj?.['__type'] === 'VegetationSurfaceAltitudeFilterConfig'
}

export interface TriggerAreaPlayerCutsceneComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTriggerAreaPlayerCutsceneComponent(obj: any): obj is TriggerAreaPlayerCutsceneComponent {
  return obj?.['__type'] === 'TriggerAreaPlayerCutsceneComponent'
}

export interface TriggerAreaPlayerCutsceneComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_playerentityid: EntityId
  m_cutsceneinfo: CutsceneInfo
  m_endcutsceneondisable: boolean
}
export function isTriggerAreaPlayerCutsceneComponentClientFacet(
  obj: any
): obj is TriggerAreaPlayerCutsceneComponentClientFacet {
  return obj?.['__type'] === 'TriggerAreaPlayerCutsceneComponentClientFacet'
}

export interface TriggerAreaPlayerCutsceneComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTriggerAreaPlayerCutsceneComponentServerFacet(
  obj: any
): obj is TriggerAreaPlayerCutsceneComponentServerFacet {
  return obj?.['__type'] === 'TriggerAreaPlayerCutsceneComponentServerFacet'
}

export interface LensFlareComponent {
  __type: string
  baseclass1: AZ__Component
  lensflareconfiguration: LensFlareConfiguration
}
export function isLensFlareComponent(obj: any): obj is LensFlareComponent {
  return obj?.['__type'] === 'LensFlareComponent'
}

export interface LensFlareConfiguration {
  __type: string
  visible: boolean
  lensflare: string
  minimumspec: number
  lensflarefrustumangle: number
  size: number
  attachtosun: boolean
  affectsthisareaonly: boolean
  ignorevisareas: boolean
  indooronly: boolean
  oninitially: boolean
  viewdistancemultiplier: number
  tint: Array<number>
  tintalpha: number
  brightness: number
  syncanimwithlight: boolean
  lightentity: EntityId
  animindex: number
  animspeed: number
  animphase: number
  syncedanimindex: number
  syncedanimspeed: number
  syncedanimphase: number
}
export function isLensFlareConfiguration(obj: any): obj is LensFlareConfiguration {
  return obj?.['__type'] === 'LensFlareConfiguration'
}

export interface SurfaceAlignmentComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSurfaceAlignmentComponent(obj: any): obj is SurfaceAlignmentComponent {
  return obj?.['__type'] === 'SurfaceAlignmentComponent'
}

export interface SurfaceAlignmentComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_filtername: string
  m_tilt: boolean
  m_snap: boolean
  m_maxrotationangle: number
  m_verticalcastdist: number
}
export function isSurfaceAlignmentComponentClientFacet(obj: any): obj is SurfaceAlignmentComponentClientFacet {
  return obj?.['__type'] === 'SurfaceAlignmentComponentClientFacet'
}

export interface SurfaceAlignmentComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSurfaceAlignmentComponentServerFacet(obj: any): obj is SurfaceAlignmentComponentServerFacet {
  return obj?.['__type'] === 'SurfaceAlignmentComponentServerFacet'
}

export interface FloatParameter {
  __type: string
  baseclass1: GenericParameter
  m_value: number
}
export function isFloatParameter(obj: any): obj is FloatParameter {
  return obj?.['__type'] === 'FloatParameter'
}

export interface GameModeComponent {
  __type: string
  baseclass1: SlayerScriptComponent
}
export function isGameModeComponent(obj: any): obj is GameModeComponent {
  return obj?.['__type'] === 'GameModeComponent'
}

export interface GameModeComponentClientFacet {
  __type: string
  baseclass1: SlayerScriptClientFacet
}
export function isGameModeComponentClientFacet(obj: any): obj is GameModeComponentClientFacet {
  return obj?.['__type'] === 'GameModeComponentClientFacet'
}

export interface GameModeComponentServerFacet {
  __type: string
  baseclass1: SlayerScriptServerFacet
}
export function isGameModeComponentServerFacet(obj: any): obj is GameModeComponentServerFacet {
  return obj?.['__type'] === 'GameModeComponentServerFacet'
}

export interface DetectionVolumeEventComponent {
  __type: string
  baseclass1: FacetedComponent
  m_eventsonenter: Array<DetectionVolumeEvent>
  m_eventsonexit: Array<DetectionVolumeEvent>
  m_detectedgdeonenternotifications: Array<DetectionVolumeEventData>
  m_detectedgdeonexitnotifications: []
  m_eventsonfirstenter: Array<DetectionVolumeEvent>
  m_eventsonlastexit: Array<DetectionVolumeEvent>
}
export function isDetectionVolumeEventComponent(obj: any): obj is DetectionVolumeEventComponent {
  return obj?.['__type'] === 'DetectionVolumeEventComponent'
}

export interface DetectionVolumeEventComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDetectionVolumeEventComponentClientFacet(obj: any): obj is DetectionVolumeEventComponentClientFacet {
  return obj?.['__type'] === 'DetectionVolumeEventComponentClientFacet'
}

export interface DetectionVolumeEventComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_detectionvolumeentity: LocalEntityRef
  m_detectedtargettype: number
  m_detectdeadtargets: boolean
  m_detectdeathsdoortargets: boolean
  m_detectinvulnerabletargets: boolean
  m_updatetargetposition: boolean
}
export function isDetectionVolumeEventComponentServerFacet(obj: any): obj is DetectionVolumeEventComponentServerFacet {
  return obj?.['__type'] === 'DetectionVolumeEventComponentServerFacet'
}

export interface DetectionVolumeEvent {
  __type: string
  m_event: EventData
  m_clientexecutioncondition: number
}
export function isDetectionVolumeEvent(obj: any): obj is DetectionVolumeEvent {
  return obj?.['__type'] === 'DetectionVolumeEvent'
}

export interface NavMeshConstraintComponentClientFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentClientFacet
}
export function isNavMeshConstraintComponentClientFacet(obj: any): obj is NavMeshConstraintComponentClientFacet {
  return obj?.['__type'] === 'NavMeshConstraintComponentClientFacet'
}

export interface NavMeshConstraintComponentServerFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentServerFacet
  m_optout: boolean
  m_checkpath: boolean
  m_checklos: boolean
  m_useoriginalheight: boolean
  m_optinnonai: boolean
  m_overrideinitialdistancecheck: number
}
export function isNavMeshConstraintComponentServerFacet(obj: any): obj is NavMeshConstraintComponentServerFacet {
  return obj?.['__type'] === 'NavMeshConstraintComponentServerFacet'
}

export interface ShapeLocationComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isShapeLocationComponent(obj: any): obj is ShapeLocationComponent {
  return obj?.['__type'] === 'ShapeLocationComponent'
}

export interface ShapeLocationComponentClientFacet {
  __type: string
  baseclass1: AreaSpawnerLocationComponentClientFacet
}
export function isShapeLocationComponentClientFacet(obj: any): obj is ShapeLocationComponentClientFacet {
  return obj?.['__type'] === 'ShapeLocationComponentClientFacet'
}

export interface ShapeLocationComponentServerFacet {
  __type: string
  baseclass1: AreaSpawnerLocationComponentServerFacet
}
export function isShapeLocationComponentServerFacet(obj: any): obj is ShapeLocationComponentServerFacet {
  return obj?.['__type'] === 'ShapeLocationComponentServerFacet'
}

export interface LookAtTargetComponent {
  __type: string
  baseclass1: FacetedComponent
  target: EntityId
  forwardaxis: number
  uselookik: boolean
  lookanimlayeridx: number
  smoothtime: number
  fadeinspeed: number
  fadeoutspeed: number
  fadeoutangle: number
  skinnedmeshentityid: EntityId
  interactentityid: EntityId
  '0xc2cd3a27': boolean
  rotatetotarsmoothtime: number
  '0xcad34304': number
  '0x27caadc6': number
  '0x741c247e': number
  '0x150b6fee': number
  '0x7ecb51b9': string
  '0x451a3be0': string
}
export function isLookAtTargetComponent(obj: any): obj is LookAtTargetComponent {
  return obj?.['__type'] === 'LookAtTargetComponent'
}

export interface LookAtTargetComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isLookAtTargetComponentClientFacet(obj: any): obj is LookAtTargetComponentClientFacet {
  return obj?.['__type'] === 'LookAtTargetComponentClientFacet'
}

export interface LookAtTargetComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isLookAtTargetComponentServerFacet(obj: any): obj is LookAtTargetComponentServerFacet {
  return obj?.['__type'] === 'LookAtTargetComponentServerFacet'
}

export interface NpcComponent {
  __type: string
  baseclass1: FacetedComponent
  m_npckey: string
  m_objectiveproviderentity: LocalEntityRef
}
export function isNpcComponent(obj: any): obj is NpcComponent {
  return obj?.['__type'] === 'NpcComponent'
}

export interface NpcComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isNpcComponentClientFacet(obj: any): obj is NpcComponentClientFacet {
  return obj?.['__type'] === 'NpcComponentClientFacet'
}

export interface NpcComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isNpcComponentServerFacet(obj: any): obj is NpcComponentServerFacet {
  return obj?.['__type'] === 'NpcComponentServerFacet'
}

export interface FogVolumeComponent {
  __type: string
  baseclass1: AZ__Component
  fogvolumeconfiguration: FogVolumeConfiguration
}
export function isFogVolumeComponent(obj: any): obj is FogVolumeComponent {
  return obj?.['__type'] === 'FogVolumeComponent'
}

export interface FogVolumeConfiguration {
  __type: string
  volumetype: number
  color: Color
  hdrdynamic: number
  useglobalfogcolor: boolean
  softedges: number
  windinfluence: number
  globaldensity: number
  densityoffset: number
  nearcutoff: number
  enginespec: number
  distmult: number
  ignoresvisareas: boolean
  affectsthisareaonly: boolean
  falloffdirlong: number
  falloffdirlatitude: number
  falloffshift: number
  falloffscale: number
  rampstart: number
  rampend: number
  rampinfluence: number
  densitynoisescale: number
  densitynoiseoffset: number
  densitynoisetimefrequency: number
  densitynoisefrequency: Array<number>
}
export function isFogVolumeConfiguration(obj: any): obj is FogVolumeConfiguration {
  return obj?.['__type'] === 'FogVolumeConfiguration'
}

export interface $$59fe499c_650b_50bd_ac05_909d3d56505c {
  __type: string
  value1: string
  value2: number
}
export function is$$59fe499c_650b_50bd_ac05_909d3d56505c(obj: any): obj is $$59fe499c_650b_50bd_ac05_909d3d56505c {
  return obj?.['__type'] === '59fe499c-650b-50bd-ac05-909d3d56505c'
}

export interface FoundationState {
  __type: string
  percentcomplete: number
  events: Array<EventData>
}
export function isFoundationState(obj: any): obj is FoundationState {
  return obj?.['__type'] === 'FoundationState'
}

export interface DamageState {
  __type: string
  percentdamaged: number
  events: Array<EventData>
}
export function isDamageState(obj: any): obj is DamageState {
  return obj?.['__type'] === 'DamageState'
}

export interface RuinState {
  __type: string
  m_selecteddamagetype: string
  m_events: Array<EventData>
}
export function isRuinState(obj: any): obj is RuinState {
  return obj?.['__type'] === 'RuinState'
}

export interface SiegeWarfareListenerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSiegeWarfareListenerComponent(obj: any): obj is SiegeWarfareListenerComponent {
  return obj?.['__type'] === 'SiegeWarfareListenerComponent'
}

export interface SiegeWarfareListenerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSiegeWarfareListenerComponentClientFacet(obj: any): obj is SiegeWarfareListenerComponentClientFacet {
  return obj?.['__type'] === 'SiegeWarfareListenerComponentClientFacet'
}

export interface SiegeWarfareListenerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSiegeWarfareListenerComponentServerFacet(obj: any): obj is SiegeWarfareListenerComponentServerFacet {
  return obj?.['__type'] === 'SiegeWarfareListenerComponentServerFacet'
}

export interface SiegeWeaponComponent {
  __type: string
  baseclass1: FacetedComponent
  m_siegeweapontype: number
  m_projectilespawnerentity: LocalEntityRef
}
export function isSiegeWeaponComponent(obj: any): obj is SiegeWeaponComponent {
  return obj?.['__type'] === 'SiegeWeaponComponent'
}

export interface SiegeWeaponComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSiegeWeaponComponentClientFacet(obj: any): obj is SiegeWeaponComponentClientFacet {
  return obj?.['__type'] === 'SiegeWeaponComponentClientFacet'
}

export interface SiegeWeaponComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSiegeWeaponComponentServerFacet(obj: any): obj is SiegeWeaponComponentServerFacet {
  return obj?.['__type'] === 'SiegeWeaponComponentServerFacet'
}

export interface InvasionObjectiveComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isInvasionObjectiveComponent(obj: any): obj is InvasionObjectiveComponent {
  return obj?.['__type'] === 'InvasionObjectiveComponent'
}

export interface InvasionObjectiveComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isInvasionObjectiveComponentClientFacet(obj: any): obj is InvasionObjectiveComponentClientFacet {
  return obj?.['__type'] === 'InvasionObjectiveComponentClientFacet'
}

export interface InvasionObjectiveComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_attackercount: number
  m_guardcount: number
  type: number
  m_attackerpositiontype: number
  m_guardpositiontype: number
  m_offsets: Array<InvasionObjectiveOffset>
  m_radius: number
  m_shapecomponententity: EntityId
  m_faceobjective: boolean
}
export function isInvasionObjectiveComponentServerFacet(obj: any): obj is InvasionObjectiveComponentServerFacet {
  return obj?.['__type'] === 'InvasionObjectiveComponentServerFacet'
}

export interface InvasionObjectiveOffset {
  __type: string
  m_positionoffset: Array<number>
  m_angleoffset: Array<number>
  m_usertype: number
  m_allowmultipleusers: boolean
}
export function isInvasionObjectiveOffset(obj: any): obj is InvasionObjectiveOffset {
  return obj?.['__type'] === 'InvasionObjectiveOffset'
}

export interface TurretComponent {
  __type: string
  baseclass1: FacetedComponent
  m_playerinteractionattachmentname: string
  m_yawjointname: string
  m_pitchjointname: string
  m_projectilespawnjointname: string
  m_holdtofirerepeatedly: boolean
  m_repeatfiredelay: number
  m_firespeed: number
  m_aimtargetdistance: number
  m_yawrotatesmesh: boolean
  m_yawanglemax: number
  m_pitchanglemin: number
  m_pitchanglemax: number
  m_eyeoffset: Array<number>
  m_lookattargetoffset: Array<number>
  m_skinnedmeshentityid: EntityId
  m_projectilespawnerentityid: EntityId
  m_additionalrotateentityid: EntityId
  m_onexitteleportentityid: EntityId
  m_heatmetercapacity: number
  m_heatmetergainrate: number
  m_heatmeterlossrate: number
  m_heatlossdelay: number
  m_overheatcooldownrate: number
  m_usehitscan: boolean
  m_hitscanrangedattackprofile: string
  m_hitscanrangedattackname: string
  m_hitscandamagedata: OffenseDamageData
  m_hitscanfirefromentity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
}
export function isTurretComponent(obj: any): obj is TurretComponent {
  return obj?.['__type'] === 'TurretComponent'
}

export interface TurretComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_interactorscopeidx: number
  m_minnavblendyawdelta: number
  m_maxnavblendyawdelta: number
  m_minnavblendspeed: number
  m_maxnavblendspeed: number
  m_maxnavblendangle: number
  m_navblendholdtime: number
  m_navblendsmoothintime: number
  m_navblendsmoothouttime: number
}
export function isTurretComponentClientFacet(obj: any): obj is TurretComponentClientFacet {
  return obj?.['__type'] === 'TurretComponentClientFacet'
}

export interface TurretComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTurretComponentServerFacet(obj: any): obj is TurretComponentServerFacet {
  return obj?.['__type'] === 'TurretComponentServerFacet'
}

export interface TerritoryInterfaceComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTerritoryInterfaceComponent(obj: any): obj is TerritoryInterfaceComponent {
  return obj?.['__type'] === 'TerritoryInterfaceComponent'
}

export interface TerritoryInterfaceComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTerritoryInterfaceComponentClientFacet(obj: any): obj is TerritoryInterfaceComponentClientFacet {
  return obj?.['__type'] === 'TerritoryInterfaceComponentClientFacet'
}

export interface TerritoryInterfaceComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_territoryid: number
  m_territorygovernanceref: RemoteTypelessServerFacetRef
  m_territoryprogressionref: RemoteTypelessServerFacetRef
  m_territoryraidsetupref: RemoteTypelessServerFacetRef
  m_territorysiegewarfareref: RemoteTypelessServerFacetRef
}
export function isTerritoryInterfaceComponentServerFacet(obj: any): obj is TerritoryInterfaceComponentServerFacet {
  return obj?.['__type'] === 'TerritoryInterfaceComponentServerFacet'
}

export interface DefensiveStructureInteractionComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDefensiveStructureInteractionComponent(obj: any): obj is DefensiveStructureInteractionComponent {
  return obj?.['__type'] === 'DefensiveStructureInteractionComponent'
}

export interface DefensiveStructureInteractionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDefensiveStructureInteractionComponentClientFacet(
  obj: any
): obj is DefensiveStructureInteractionComponentClientFacet {
  return obj?.['__type'] === 'DefensiveStructureInteractionComponentClientFacet'
}

export interface DefensiveStructureInteractionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDefensiveStructureInteractionComponentServerFacet(
  obj: any
): obj is DefensiveStructureInteractionComponentServerFacet {
  return obj?.['__type'] === 'DefensiveStructureInteractionComponentServerFacet'
}

export interface ProjectileSpawnerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_rangedattackprofile: string
  m_rangedattackname: string
  m_ammoid: string
  m_damagedata: OffenseDamageData
  m_defaultfireangledeg: number
  m_defaultfirespeed: number
  m_firecooldown: number
  m_accuracyradius: number
  m_targetoffset: Array<number>
  m_projectilegravity: number
  m_usesammo: boolean
  m_maxammo: number
  m_curammo: number
  m_ownershipentity: LocalEntityRef
  m_triggerinteractoptionentity: LocalEntityRef
  m_axisofrotation: number
  m_rotationincrements: []
}
export function isProjectileSpawnerComponent(obj: any): obj is ProjectileSpawnerComponent {
  return obj?.['__type'] === 'ProjectileSpawnerComponent'
}

export interface ProjectileSpawnerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isProjectileSpawnerComponentClientFacet(obj: any): obj is ProjectileSpawnerComponentClientFacet {
  return obj?.['__type'] === 'ProjectileSpawnerComponentClientFacet'
}

export interface ProjectileSpawnerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_forwardaispawninfo: boolean
}
export function isProjectileSpawnerComponentServerFacet(obj: any): obj is ProjectileSpawnerComponentServerFacet {
  return obj?.['__type'] === 'ProjectileSpawnerComponentServerFacet'
}

export interface SimpleAnimationComponent {
  __type: string
  baseclass1: AZ__Component
  'hide until animated': boolean
  'playback entries': Array<AnimatedLayer>
}
export function isSimpleAnimationComponent(obj: any): obj is SimpleAnimationComponent {
  return obj?.['__type'] === 'SimpleAnimationComponent'
}

export interface QueryShapeAabb {
  __type: string
  baseclass1: QueryShapeBase
  m_aabb: Array<number>
}
export function isQueryShapeAabb(obj: any): obj is QueryShapeAabb {
  return obj?.['__type'] === 'QueryShapeAabb'
}

export interface SkinnedMeshAttachmentVisibilityComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSkinnedMeshAttachmentVisibilityComponent(obj: any): obj is SkinnedMeshAttachmentVisibilityComponent {
  return obj?.['__type'] === 'SkinnedMeshAttachmentVisibilityComponent'
}

export interface SkinnedMeshAttachmentVisibilityComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_skinnedmeshentityid: EntityId
  m_attachmentvisibilityinfos: Array<SkinMeshAttachmentVisibilityInfo>
}
export function isSkinnedMeshAttachmentVisibilityComponentClientFacet(
  obj: any
): obj is SkinnedMeshAttachmentVisibilityComponentClientFacet {
  return obj?.['__type'] === 'SkinnedMeshAttachmentVisibilityComponentClientFacet'
}

export interface SkinMeshAttachmentVisibilityInfo {
  __type: string
  m_name: string
  m_shouldhide: boolean
}
export function isSkinMeshAttachmentVisibilityInfo(obj: any): obj is SkinMeshAttachmentVisibilityInfo {
  return obj?.['__type'] === 'SkinMeshAttachmentVisibilityInfo'
}

export interface SkinnedMeshAttachmentVisibilityComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSkinnedMeshAttachmentVisibilityComponentServerFacet(
  obj: any
): obj is SkinnedMeshAttachmentVisibilityComponentServerFacet {
  return obj?.['__type'] === 'SkinnedMeshAttachmentVisibilityComponentServerFacet'
}

export interface InteractWithItemCostComponent {
  __type: string
  baseclass1: FacetedComponent
  m_interactiontype:
    | InteractWithItemCostType_AddHealth
    | InteractWithItemCostType_AddProjectileSpawnerAmmo
    | InteractWithItemCostType_AddSummoningStone
}
export function isInteractWithItemCostComponent(obj: any): obj is InteractWithItemCostComponent {
  return obj?.['__type'] === 'InteractWithItemCostComponent'
}

export interface InteractWithItemCostComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isInteractWithItemCostComponentClientFacet(obj: any): obj is InteractWithItemCostComponentClientFacet {
  return obj?.['__type'] === 'InteractWithItemCostComponentClientFacet'
}

export interface InteractWithItemCostComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isInteractWithItemCostComponentServerFacet(obj: any): obj is InteractWithItemCostComponentServerFacet {
  return obj?.['__type'] === 'InteractWithItemCostComponentServerFacet'
}

export interface InteractWithItemCostType_AddHealth {
  __type: string
  baseclass1: InteractWithItemCostType
  m_vitalsentity: LocalEntityRef
  m_amount: number
}
export function isInteractWithItemCostType_AddHealth(obj: any): obj is InteractWithItemCostType_AddHealth {
  return obj?.['__type'] === 'InteractWithItemCostType_AddHealth'
}

export interface InteractWithItemCostType {
  __type: string
}
export function isInteractWithItemCostType(obj: any): obj is InteractWithItemCostType {
  return obj?.['__type'] === 'InteractWithItemCostType'
}

export interface InteractWithItemCostType_AddProjectileSpawnerAmmo {
  __type: string
  baseclass1: InteractWithItemCostType
  m_projectilespawnerentity: LocalEntityRef
  m_ammoamount: number
}
export function isInteractWithItemCostType_AddProjectileSpawnerAmmo(
  obj: any
): obj is InteractWithItemCostType_AddProjectileSpawnerAmmo {
  return obj?.['__type'] === 'InteractWithItemCostType_AddProjectileSpawnerAmmo'
}

export interface ShakeComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isShakeComponent(obj: any): obj is ShakeComponent {
  return obj?.['__type'] === 'ShakeComponent'
}

export interface ShakeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_entitytoshake: LocalEntityRef
  m_strength: number
  m_duration: number
}
export function isShakeComponentClientFacet(obj: any): obj is ShakeComponentClientFacet {
  return obj?.['__type'] === 'ShakeComponentClientFacet'
}

export interface ShakeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isShakeComponentServerFacet(obj: any): obj is ShakeComponentServerFacet {
  return obj?.['__type'] === 'ShakeComponentServerFacet'
}

export interface FishingHotspotComponent {
  __type: string
  baseclass1: FacetedComponent
  m_fishinghotspottype: string
}
export function isFishingHotspotComponent(obj: any): obj is FishingHotspotComponent {
  return obj?.['__type'] === 'FishingHotspotComponent'
}

export interface FishingHotspotComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFishingHotspotComponentClientFacet(obj: any): obj is FishingHotspotComponentClientFacet {
  return obj?.['__type'] === 'FishingHotspotComponentClientFacet'
}

export interface FishingHotspotComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFishingHotspotComponentServerFacet(obj: any): obj is FishingHotspotComponentServerFacet {
  return obj?.['__type'] === 'FishingHotspotComponentServerFacet'
}

export interface DungeonExitComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDungeonExitComponent(obj: any): obj is DungeonExitComponent {
  return obj?.['__type'] === 'DungeonExitComponent'
}

export interface DungeonExitClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDungeonExitClientFacet(obj: any): obj is DungeonExitClientFacet {
  return obj?.['__type'] === 'DungeonExitClientFacet'
}

export interface DungeonExitServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDungeonExitServerFacet(obj: any): obj is DungeonExitServerFacet {
  return obj?.['__type'] === 'DungeonExitServerFacet'
}

export interface VegetationWaterDepthFilterComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: VegetationWaterDepthFilterConfig
}
export function isVegetationWaterDepthFilterComponent(obj: any): obj is VegetationWaterDepthFilterComponent {
  return obj?.['__type'] === 'VegetationWaterDepthFilterComponent'
}

export interface VegetationWaterDepthFilterConfig {
  __type: string
  filterstage: number
  waterdepthmin: number
  waterdepthmax: number
  landdistancetowatermin: number
  landdistancetowatermax: number
}
export function isVegetationWaterDepthFilterConfig(obj: any): obj is VegetationWaterDepthFilterConfig {
  return obj?.['__type'] === 'VegetationWaterDepthFilterConfig'
}

export interface RotationAchievementEvent {
  __type: string
  targetrotationpercent: number
  rotationduration: number
  initializerotationtozeropercent: boolean
  entitynames: $$0b66e343_c513_5eb3_b152_770c4628bb73
}
export function isRotationAchievementEvent(obj: any): obj is RotationAchievementEvent {
  return obj?.['__type'] === 'RotationAchievementEvent'
}

export interface StringParameter {
  __type: string
  baseclass1: GenericParameter
  m_value: string
}
export function isStringParameter(obj: any): obj is StringParameter {
  return obj?.['__type'] === 'StringParameter'
}

export interface LuckConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isLuckConstraintComponent(obj: any): obj is LuckConstraintComponent {
  return obj?.['__type'] === 'LuckConstraintComponent'
}

export interface LuckConstraintComponentClientFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentClientFacet
}
export function isLuckConstraintComponentClientFacet(obj: any): obj is LuckConstraintComponentClientFacet {
  return obj?.['__type'] === 'LuckConstraintComponentClientFacet'
}

export interface LuckConstraintComponentServerFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentServerFacet
  m_successprobability: number
}
export function isLuckConstraintComponentServerFacet(obj: any): obj is LuckConstraintComponentServerFacet {
  return obj?.['__type'] === 'LuckConstraintComponentServerFacet'
}

export interface DetectionVolumeTeleportComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDetectionVolumeTeleportComponent(obj: any): obj is DetectionVolumeTeleportComponent {
  return obj?.['__type'] === 'DetectionVolumeTeleportComponent'
}

export interface DetectionVolumeTeleportComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDetectionVolumeTeleportComponentClientFacet(
  obj: any
): obj is DetectionVolumeTeleportComponentClientFacet {
  return obj?.['__type'] === 'DetectionVolumeTeleportComponentClientFacet'
}

export interface DetectionVolumeTeleportComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_entitytoteleportto: EntityId
  m_numberofteleportsbeforedeactivation: number
  m_teleportdelayinseconds: number
  m_onenableevents: Array<EventData>
  m_onteleportevents: Array<EventData>
  m_onmaxteleportsreachedevents: []
  m_ondisableevents: Array<EventData>
}
export function isDetectionVolumeTeleportComponentServerFacet(
  obj: any
): obj is DetectionVolumeTeleportComponentServerFacet {
  return obj?.['__type'] === 'DetectionVolumeTeleportComponentServerFacet'
}

export interface ObjectiveProviderComponent {
  __type: string
  baseclass1: FacetedComponent
  m_editorprovidedmissiontypes: Array<string>
  m_iscommunitygoalboard: boolean
  m_useterritoryid: boolean
  m_disablepvpmissions: boolean
}
export function isObjectiveProviderComponent(obj: any): obj is ObjectiveProviderComponent {
  return obj?.['__type'] === 'ObjectiveProviderComponent'
}

export interface ObjectiveProviderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isObjectiveProviderComponentClientFacet(obj: any): obj is ObjectiveProviderComponentClientFacet {
  return obj?.['__type'] === 'ObjectiveProviderComponentClientFacet'
}

export interface ObjectiveProviderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isObjectiveProviderComponentServerFacet(obj: any): obj is ObjectiveProviderComponentServerFacet {
  return obj?.['__type'] === 'ObjectiveProviderComponentServerFacet'
}

export interface AnimatedLayer {
  __type: string
  'animation name': string
  'layer id': number
  looping: boolean
  'playback speed': number
  'layer weight': number
  animdrivenmotion: boolean
}
export function isAnimatedLayer(obj: any): obj is AnimatedLayer {
  return obj?.['__type'] === 'AnimatedLayer'
}

export interface OffenseCollisionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_damagedata: OffenseDamageData
  m_damageselfdata: OffenseDamageData
  m_entitytoselfdamage: LocalEntityRef
  m_ondamagedamageable: EventData
  m_javshapeghostentity: LocalEntityRef
}
export function isOffenseCollisionComponent(obj: any): obj is OffenseCollisionComponent {
  return obj?.['__type'] === 'OffenseCollisionComponent'
}

export interface OffenseCollisionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isOffenseCollisionComponentClientFacet(obj: any): obj is OffenseCollisionComponentClientFacet {
  return obj?.['__type'] === 'OffenseCollisionComponentClientFacet'
}

export interface OffenseCollisionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_ownershipentity: LocalEntityRef
  m_checkobstructions: boolean
  m_canbeblocked: boolean
}
export function isOffenseCollisionComponentServerFacet(obj: any): obj is OffenseCollisionComponentServerFacet {
  return obj?.['__type'] === 'OffenseCollisionComponentServerFacet'
}

export interface WarCampComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isWarCampComponent(obj: any): obj is WarCampComponent {
  return obj?.['__type'] === 'WarCampComponent'
}

export interface WarCampComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isWarCampComponentClientFacet(obj: any): obj is WarCampComponentClientFacet {
  return obj?.['__type'] === 'WarCampComponentClientFacet'
}

export interface WarCampComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_territorydetectorentity: EntityId
  m_warcampspawns: Array<WarCampSpawn>
  m_prewarbarrierspawnerentity: LocalEntityRef
  m_groupteleportminrange: number
  m_groupteleportmaxrange: number
}
export function isWarCampComponentServerFacet(obj: any): obj is WarCampComponentServerFacet {
  return obj?.['__type'] === 'WarCampComponentServerFacet'
}

export interface WarCampSpawn {
  __type: string
  m_prefabspawner: LocalEntityRef
  m_warcamptiersliceoverrides: Array<Asset>
  m_raididassignmenttype: number
}
export function isWarCampSpawn(obj: any): obj is WarCampSpawn {
  return obj?.['__type'] === 'WarCampSpawn'
}

export interface FortSpawnDataProviderComponent {
  __type: string
  baseclass1: FacetedComponent
  m_fortspawnid: number
  m_siegewarfareentityref: LocalEntityRef
}
export function isFortSpawnDataProviderComponent(obj: any): obj is FortSpawnDataProviderComponent {
  return obj?.['__type'] === 'FortSpawnDataProviderComponent'
}

export interface FortSpawnDataProviderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFortSpawnDataProviderComponentClientFacet(
  obj: any
): obj is FortSpawnDataProviderComponentClientFacet {
  return obj?.['__type'] === 'FortSpawnDataProviderComponentClientFacet'
}

export interface FortSpawnDataProviderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFortSpawnDataProviderComponentServerFacet(
  obj: any
): obj is FortSpawnDataProviderComponentServerFacet {
  return obj?.['__type'] === 'FortSpawnDataProviderComponentServerFacet'
}

export interface RiverComponent {
  __type: string
  baseclass1: AZ__Component
  river: River
}
export function isRiverComponent(obj: any): obj is RiverComponent {
  return obj?.['__type'] === 'RiverComponent'
}

export interface River {
  __type: string
  baseclass1: SplineGeometry
  watervolumedepth: number
  material: AzFramework__SimpleAssetReference_LmbrCentral__MaterialAsset_
  tilewidth: number
  watercapfogatvolumedepth: boolean
  waterfogdensity: number
  fogcolorscale: number
  fogcolor: Color
  fogcoloraffectedbysun: boolean
  waterfogshadowing: number
  watercaustics: boolean
  watercausticintensity: number
  watercausticheight: number
  watercaustictiling: number
  physicalize: boolean
  waterstreamspeed: number
  widthfadedist: number
  lengthstartfadedist: number
  lengthendfadedist: number
}
export function isRiver(obj: any): obj is River {
  return obj?.['__type'] === 'River'
}

export interface ScriptBindScriptEvent {
  __type: string
  entityid: EntityId
  eventname: string
  scriptid: string
}
export function isScriptBindScriptEvent(obj: any): obj is ScriptBindScriptEvent {
  return obj?.['__type'] === 'ScriptBindScriptEvent'
}

export interface DungeonEntranceComponent {
  __type: string
  baseclass1: FacetedComponent
  m_activationboundsshapeentityid: EntityId
  m_gamemode: string
  m_issingleplayerdungeon: boolean
}
export function isDungeonEntranceComponent(obj: any): obj is DungeonEntranceComponent {
  return obj?.['__type'] === 'DungeonEntranceComponent'
}

export interface DungeonEntranceClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_interactentityid: EntityId
}
export function isDungeonEntranceClientFacet(obj: any): obj is DungeonEntranceClientFacet {
  return obj?.['__type'] === 'DungeonEntranceClientFacet'
}

export interface DungeonEntranceServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDungeonEntranceServerFacet(obj: any): obj is DungeonEntranceServerFacet {
  return obj?.['__type'] === 'DungeonEntranceServerFacet'
}

export interface DarknessControllerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_totaldarknessduration: number
  m_activationspec: Array<DarknessActivationSpecification>
  m_groupactivationspec: Array<DarknessGroupSpecification>
  m_territorytype: number
  m_territoryoffset: number
  m_difficultyscalinggroup: string
  m_difficultyscalingtable: SpringboardDataSheetContainer
  m_darknessupdatesenabled: boolean
  '0x9012648c': string
}
export function isDarknessControllerComponent(obj: any): obj is DarknessControllerComponent {
  return obj?.['__type'] === 'DarknessControllerComponent'
}

export interface DarknessControllerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDarknessControllerComponentClientFacet(obj: any): obj is DarknessControllerComponentClientFacet {
  return obj?.['__type'] === 'DarknessControllerComponentClientFacet'
}

export interface DarknessControllerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_darknesslevels: Array<DarknessLevel>
}
export function isDarknessControllerComponentServerFacet(obj: any): obj is DarknessControllerComponentServerFacet {
  return obj?.['__type'] === 'DarknessControllerComponentServerFacet'
}

export interface DarknessLevel {
  __type: string
  threshold: number
  percentage: number
}
export function isDarknessLevel(obj: any): obj is DarknessLevel {
  return obj?.['__type'] === 'DarknessLevel'
}

export interface DarknessActivationSpecification {
  __type: string
  m_starttimehours: number
  m_durationhours: number
}
export function isDarknessActivationSpecification(obj: any): obj is DarknessActivationSpecification {
  return obj?.['__type'] === 'DarknessActivationSpecification'
}

export interface DarknessGroupSpecification {
  __type: string
  m_percentage: number
  m_groupstoactivate: number
}
export function isDarknessGroupSpecification(obj: any): obj is DarknessGroupSpecification {
  return obj?.['__type'] === 'DarknessGroupSpecification'
}

export interface RainComponent {
  __type: string
  baseclass1: AZ__Component
  enabled: boolean
  'rain options': RainOptions
}
export function isRainComponent(obj: any): obj is RainComponent {
  return obj?.['__type'] === 'RainComponent'
}

export interface RainOptions {
  __type: string
  ignorevisareas: boolean
  'disable occlusion': boolean
  innerradius: number
  outerradius: number
  amount: number
  diffusedarkening: number
  raindropsamount: number
  raindropsspeed: number
  raindropslighting: number
  puddlesamount: number
  puddlesmaskamount: number
  puddlesrippleamount: number
  splashesamount: number
}
export function isRainOptions(obj: any): obj is RainOptions {
  return obj?.['__type'] === 'RainOptions'
}

export interface TriggerAreaEntityComponent {
  __type: string
  baseclass1: FacetedComponent
  m_entitiestotrigger: Array<EventData>
}
export function isTriggerAreaEntityComponent(obj: any): obj is TriggerAreaEntityComponent {
  return obj?.['__type'] === 'TriggerAreaEntityComponent'
}

export interface TriggerAreaEntityComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTriggerAreaEntityComponentClientFacet(obj: any): obj is TriggerAreaEntityComponentClientFacet {
  return obj?.['__type'] === 'TriggerAreaEntityComponentClientFacet'
}

export interface TriggerAreaEntityComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTriggerAreaEntityComponentServerFacet(obj: any): obj is TriggerAreaEntityComponentServerFacet {
  return obj?.['__type'] === 'TriggerAreaEntityComponentServerFacet'
}

export interface RenderQualityComponent {
  __type: string
  baseclass1: AZ__Component
  category: string
}
export function isRenderQualityComponent(obj: any): obj is RenderQualityComponent {
  return obj?.['__type'] === 'RenderQualityComponent'
}

export interface RigidPhysicsComponent {
  __type: string
  baseclass1: PhysicsComponent
  configuration: RigidPhysicsConfig
}
export function isRigidPhysicsComponent(obj: any): obj is RigidPhysicsComponent {
  return obj?.['__type'] === 'RigidPhysicsComponent'
}

export interface RigidPhysicsConfig {
  __type: string
  enabledinitially: boolean
  specifymassordensity: number
  mass: number
  density: number
  atrestinitially: boolean
  enablecollisionresponse: boolean
  interactswithtriggers: boolean
  recordcollisions: boolean
  maxrecordedcollisions: number
  simulationdamping: number
  simulationminenergy: number
  buoyancydamping: number
  buoyancydensity: number
  buoyancyresistance: number
}
export function isRigidPhysicsConfig(obj: any): obj is RigidPhysicsConfig {
  return obj?.['__type'] === 'RigidPhysicsConfig'
}

export interface IntegerParameter {
  __type: string
  baseclass1: GenericParameter
  m_value: number
}
export function isIntegerParameter(obj: any): obj is IntegerParameter {
  return obj?.['__type'] === 'IntegerParameter'
}

export interface TransformComponent {
  __type: string
  baseclass1: AZ__Component
  baseclass2: NetBindable
  parent: EntityId
  transform: Transform
  localtransform: Transform
  parentactivationtransformmode: number
  isstatic: boolean
  interpolateposition: number
  interpolaterotation: number
}
export function isTransformComponent(obj: any): obj is TransformComponent {
  return obj?.['__type'] === 'TransformComponent'
}

export interface TerritoryDataProviderComponent {
  __type: string
  baseclass1: AZ__Component
  'territory id': string
  'reload territory definitions': boolean
}
export function isTerritoryDataProviderComponent(obj: any): obj is TerritoryDataProviderComponent {
  return obj?.['__type'] === 'TerritoryDataProviderComponent'
}

export interface PlayCinematicVideoComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPlayCinematicVideoComponent(obj: any): obj is PlayCinematicVideoComponent {
  return obj?.['__type'] === 'PlayCinematicVideoComponent'
}

export interface PlayCinematicVideoClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_cinematicentryid: string
}
export function isPlayCinematicVideoClientFacet(obj: any): obj is PlayCinematicVideoClientFacet {
  return obj?.['__type'] === 'PlayCinematicVideoClientFacet'
}

export interface PlayCinematicVideoServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isPlayCinematicVideoServerFacet(obj: any): obj is PlayCinematicVideoServerFacet {
  return obj?.['__type'] === 'PlayCinematicVideoServerFacet'
}

export interface DefaultCondition {
  __type: string
  baseclass1: InteractCondition
}
export function isDefaultCondition(obj: any): obj is DefaultCondition {
  return obj?.['__type'] === 'DefaultCondition'
}

export interface BuildableStateTransitionEvents {
  __type: string
  m_transitioningstate: number
  m_events: Array<EventData>
}
export function isBuildableStateTransitionEvents(obj: any): obj is BuildableStateTransitionEvents {
  return obj?.['__type'] === 'BuildableStateTransitionEvents'
}

export interface LandClaimComponent {
  __type: string
  baseclass1: FacetedComponent
  m_transformcomponententityid: EntityId
  m_ownershipcomponententityid: EntityId
}
export function isLandClaimComponent(obj: any): obj is LandClaimComponent {
  return obj?.['__type'] === 'LandClaimComponent'
}

export interface LandClaimComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isLandClaimComponentClientFacet(obj: any): obj is LandClaimComponentClientFacet {
  return obj?.['__type'] === 'LandClaimComponentClientFacet'
}

export interface LandClaimComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isLandClaimComponentServerFacet(obj: any): obj is LandClaimComponentServerFacet {
  return obj?.['__type'] === 'LandClaimComponentServerFacet'
}

export interface RenderGuildFlagComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isRenderGuildFlagComponent(obj: any): obj is RenderGuildFlagComponent {
  return obj?.['__type'] === 'RenderGuildFlagComponent'
}

export interface RenderGuildFlagComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isRenderGuildFlagComponentClientFacet(obj: any): obj is RenderGuildFlagComponentClientFacet {
  return obj?.['__type'] === 'RenderGuildFlagComponentClientFacet'
}

export interface RenderGuildFlagComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isRenderGuildFlagComponentServerFacet(obj: any): obj is RenderGuildFlagComponentServerFacet {
  return obj?.['__type'] === 'RenderGuildFlagComponentServerFacet'
}

export interface FtueIslandComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isFtueIslandComponent(obj: any): obj is FtueIslandComponent {
  return obj?.['__type'] === 'FtueIslandComponent'
}

export interface FtueIslandComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFtueIslandComponentClientFacet(obj: any): obj is FtueIslandComponentClientFacet {
  return obj?.['__type'] === 'FtueIslandComponentClientFacet'
}

export interface FtueIslandComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFtueIslandComponentServerFacet(obj: any): obj is FtueIslandComponentServerFacet {
  return obj?.['__type'] === 'FtueIslandComponentServerFacet'
}

export interface ResetFtueSpawnersComponent {
  __type: string
  baseclass1: FacetedComponent
  m_shoulddeactivateentity: boolean
  m_removeallpreviousspawns: boolean
}
export function isResetFtueSpawnersComponent(obj: any): obj is ResetFtueSpawnersComponent {
  return obj?.['__type'] === 'ResetFtueSpawnersComponent'
}

export interface ResetFtueSpawnersComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isResetFtueSpawnersComponentClientFacet(obj: any): obj is ResetFtueSpawnersComponentClientFacet {
  return obj?.['__type'] === 'ResetFtueSpawnersComponentClientFacet'
}

export interface ResetFtueSpawnersComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isResetFtueSpawnersComponentServerFacet(obj: any): obj is ResetFtueSpawnersComponentServerFacet {
  return obj?.['__type'] === 'ResetFtueSpawnersComponentServerFacet'
}

export interface SequenceComponent {
  __type: string
  baseclass1: AZ__Component
  sequence: CAnimSequence
}
export function isSequenceComponent(obj: any): obj is SequenceComponent {
  return obj?.['__type'] === 'SequenceComponent'
}

export interface CAnimSequence {
  __type: string
  name: string
  sequenceentityid: EntityId
  flags: number
  timerange: Range
  id: number
  nodes: Array<
    CAnimSceneNode | CAnimAzEntityNode | CAnimComponentNode | CAnimPostFXNode | CAnimEventNode | CAnimNodeGroup
  >
  sequencetype: number
  events: Array<string>
}
export function isCAnimSequence(obj: any): obj is CAnimSequence {
  return obj?.['__type'] === 'CAnimSequence'
}

export interface Range {
  __type: string
  start: number
  end: number
}
export function isRange(obj: any): obj is Range {
  return obj?.['__type'] === 'Range'
}

export interface CAnimSceneNode {
  __type: string
  baseclass1: CAnimNode
}
export function isCAnimSceneNode(obj: any): obj is CAnimSceneNode {
  return obj?.['__type'] === 'CAnimSceneNode'
}

export interface CAnimNode {
  __type: string
  id: number
  name: string
  flags: number
  tracks: Array<
    CSelectTrack | CCompoundSplineTrack | CCharacterTrack | TAnimSplineTrack_Vec2__ | CBoolTrack | CTrackEventTrack
  >
  parent: number
  type: number
}
export function isCAnimNode(obj: any): obj is CAnimNode {
  return obj?.['__type'] === 'CAnimNode'
}

export interface CSelectTrack {
  __type: string
  baseclass1: TAnimTrack_KeyType__ISelectKey__
}
export function isCSelectTrack(obj: any): obj is CSelectTrack {
  return obj?.['__type'] === 'CSelectTrack'
}

export interface TAnimTrack_KeyType__ISelectKey__ {
  __type: string
  flags: number
  range: Range
  paramtype: CAnimParamType
  keys: Array<ISelectKey>
}
export function isTAnimTrack_KeyType__ISelectKey__(obj: any): obj is TAnimTrack_KeyType__ISelectKey__ {
  return obj?.['__type'] === 'TAnimTrack<KeyType><ISelectKey >'
}

export interface CAnimParamType {
  __type: string
  type: number
  name: string
}
export function isCAnimParamType(obj: any): obj is CAnimParamType {
  return obj?.['__type'] === 'CAnimParamType'
}

export interface ISelectKey {
  __type: string
  baseclass1: IKey
  selectedname: string
  selectedentityid: EntityId
  duration: number
  blendtime: number
}
export function isISelectKey(obj: any): obj is ISelectKey {
  return obj?.['__type'] === 'ISelectKey'
}

export interface IKey {
  __type: string
  time: number
  flags: number
}
export function isIKey(obj: any): obj is IKey {
  return obj?.['__type'] === 'IKey'
}

export interface CAnimAzEntityNode {
  __type: string
  baseclass1: CAnimNode
  entity: EntityId
}
export function isCAnimAzEntityNode(obj: any): obj is CAnimAzEntityNode {
  return obj?.['__type'] === 'CAnimAzEntityNode'
}

export interface CAnimComponentNode {
  __type: string
  baseclass1: CAnimNode
  componentid: number
  componenttypeid: string
}
export function isCAnimComponentNode(obj: any): obj is CAnimComponentNode {
  return obj?.['__type'] === 'CAnimComponentNode'
}

export interface CCompoundSplineTrack {
  __type: string
  flags: number
  paramtype: CAnimParamType
  numsubtracks: number
  subtracks: Array<TAnimSplineTrack_Vec2__ | null>
  subtracknames: Array<string>
  valuetype: number
}
export function isCCompoundSplineTrack(obj: any): obj is CCompoundSplineTrack {
  return obj?.['__type'] === 'CCompoundSplineTrack'
}

export interface TAnimSplineTrack_Vec2__ {
  __type: string
  flags: number
  defaultvalue: Vec2
  paramtype: CAnimParamType
  spline: spline__TrackSplineInterpolator_Vec2_
}
export function isTAnimSplineTrack_Vec2__(obj: any): obj is TAnimSplineTrack_Vec2__ {
  return obj?.['__type'] === 'TAnimSplineTrack<Vec2 >'
}

export interface Vec2 {
  __type: string
  x: number
  y: number
}
export function isVec2(obj: any): obj is Vec2 {
  return obj?.['__type'] === 'Vec2'
}

export interface spline__TrackSplineInterpolator_Vec2_ {
  __type: string
  baseclass1: BezierSplineVec2
}
export function isspline__TrackSplineInterpolator_Vec2_(obj: any): obj is spline__TrackSplineInterpolator_Vec2_ {
  return obj?.['__type'] === 'spline::TrackSplineInterpolator<Vec2>'
}

export interface BezierSplineVec2 {
  __type: string
  baseclass1: TSplineBezierBasisVec2
}
export function isBezierSplineVec2(obj: any): obj is BezierSplineVec2 {
  return obj?.['__type'] === 'BezierSplineVec2'
}

export interface TSplineBezierBasisVec2 {
  __type: string
  keys: Array<spline__SplineKeyEx_Vec2_>
}
export function isTSplineBezierBasisVec2(obj: any): obj is TSplineBezierBasisVec2 {
  return obj?.['__type'] === 'TSplineBezierBasisVec2'
}

export interface CCharacterTrack {
  __type: string
  baseclass1: TAnimTrack_KeyType__ICharacterKey__
  animationlayer: number
}
export function isCCharacterTrack(obj: any): obj is CCharacterTrack {
  return obj?.['__type'] === 'CCharacterTrack'
}

export interface TAnimTrack_KeyType__ICharacterKey__ {
  __type: string
  flags: number
  range: Range
  paramtype: CAnimParamType
  keys: Array<ICharacterKey>
}
export function isTAnimTrack_KeyType__ICharacterKey__(obj: any): obj is TAnimTrack_KeyType__ICharacterKey__ {
  return obj?.['__type'] === 'TAnimTrack<KeyType><ICharacterKey >'
}

export interface ICharacterKey {
  __type: string
  baseclass1: ITimeRangeKey
  animation: string
  pausecompensated: boolean
  blendgap: boolean
  playinplace: boolean
}
export function isICharacterKey(obj: any): obj is ICharacterKey {
  return obj?.['__type'] === 'ICharacterKey'
}

export interface ITimeRangeKey {
  __type: string
  baseclass1: IKey
  duration: number
  start: number
  end: number
  speed: number
  loop: boolean
}
export function isITimeRangeKey(obj: any): obj is ITimeRangeKey {
  return obj?.['__type'] === 'ITimeRangeKey'
}

export interface spline__SplineKeyEx_Vec2_ {
  __type: string
  baseclass1: spline__SplineKey_Vec2_
}
export function isspline__SplineKeyEx_Vec2_(obj: any): obj is spline__SplineKeyEx_Vec2_ {
  return obj?.['__type'] === 'spline::SplineKeyEx<Vec2>'
}

export interface spline__SplineKey_Vec2_ {
  __type: string
  time: number
  flags: number
  value: Vec2
  ds: Vec2
  dd: Vec2
}
export function isspline__SplineKey_Vec2_(obj: any): obj is spline__SplineKey_Vec2_ {
  return obj?.['__type'] === 'spline::SplineKey<Vec2>'
}

export interface CBoolTrack {
  __type: string
  baseclass1: TAnimTrack_KeyType__IBoolKey__
  defaultvalue: boolean
}
export function isCBoolTrack(obj: any): obj is CBoolTrack {
  return obj?.['__type'] === 'CBoolTrack'
}

export interface TAnimTrack_KeyType__IBoolKey__ {
  __type: string
  flags: number
  range: Range
  paramtype: CAnimParamType
  keys: Array<IBoolKey>
}
export function isTAnimTrack_KeyType__IBoolKey__(obj: any): obj is TAnimTrack_KeyType__IBoolKey__ {
  return obj?.['__type'] === 'TAnimTrack<KeyType><IBoolKey >'
}

export interface IBoolKey {
  __type: string
  baseclass1: IKey
}
export function isIBoolKey(obj: any): obj is IBoolKey {
  return obj?.['__type'] === 'IBoolKey'
}

export interface CAnimPostFXNode {
  __type: string
  baseclass1: CAnimNode
}
export function isCAnimPostFXNode(obj: any): obj is CAnimPostFXNode {
  return obj?.['__type'] === 'CAnimPostFXNode'
}

export interface CAnimEventNode {
  __type: string
  baseclass1: CAnimNode
}
export function isCAnimEventNode(obj: any): obj is CAnimEventNode {
  return obj?.['__type'] === 'CAnimEventNode'
}

export interface CTrackEventTrack {
  __type: string
  baseclass1: TAnimTrack_KeyType__IEventKey__
}
export function isCTrackEventTrack(obj: any): obj is CTrackEventTrack {
  return obj?.['__type'] === 'CTrackEventTrack'
}

export interface TAnimTrack_KeyType__IEventKey__ {
  __type: string
  flags: number
  range: Range
  paramtype: CAnimParamType
  keys: Array<IEventKey>
}
export function isTAnimTrack_KeyType__IEventKey__(obj: any): obj is TAnimTrack_KeyType__IEventKey__ {
  return obj?.['__type'] === 'TAnimTrack<KeyType><IEventKey >'
}

export interface IEventKey {
  __type: string
  baseclass1: IKey
  event: string
  eventvalue: string
  anim: string
  target: string
  length: number
}
export function isIEventKey(obj: any): obj is IEventKey {
  return obj?.['__type'] === 'IEventKey'
}

export interface CAnimNodeGroup {
  __type: string
  baseclass1: CAnimNode
}
export function isCAnimNodeGroup(obj: any): obj is CAnimNodeGroup {
  return obj?.['__type'] === 'CAnimNodeGroup'
}

export interface ReactivateFtueEntityComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isReactivateFtueEntityComponent(obj: any): obj is ReactivateFtueEntityComponent {
  return obj?.['__type'] === 'ReactivateFtueEntityComponent'
}

export interface ReactivateFtueEntityComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isReactivateFtueEntityComponentClientFacet(obj: any): obj is ReactivateFtueEntityComponentClientFacet {
  return obj?.['__type'] === 'ReactivateFtueEntityComponentClientFacet'
}

export interface ReactivateFtueEntityComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isReactivateFtueEntityComponentServerFacet(obj: any): obj is ReactivateFtueEntityComponentServerFacet {
  return obj?.['__type'] === 'ReactivateFtueEntityComponentServerFacet'
}

export interface EncounterManagerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_stages: Array<LocalEntityRef>
}
export function isEncounterManagerComponent(obj: any): obj is EncounterManagerComponent {
  return obj?.['__type'] === 'EncounterManagerComponent'
}

export interface EncounterManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isEncounterManagerComponentClientFacet(obj: any): obj is EncounterManagerComponentClientFacet {
  return obj?.['__type'] === 'EncounterManagerComponentClientFacet'
}

export interface EncounterManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_autoactivate: boolean
  m_autoactivatedelayms: number
  m_resetonspawnerror: boolean
  m_ignorespawnerrors: boolean
  m_graceperiod: number
  m_destroyoncompletion: boolean
  m_spawnpriority: number
  m_autoperceiveparticipants: boolean
  m_overrideaggrodelay: boolean
  m_aggrodelayoverride: number
  m_resetencountereventid: string
  m_sendinitialcontributionevent: boolean
}
export function isEncounterManagerComponentServerFacet(obj: any): obj is EncounterManagerComponentServerFacet {
  return obj?.['__type'] === 'EncounterManagerComponentServerFacet'
}

export interface EncounterComponent {
  __type: string
  baseclass1: FacetedComponent
  m_stages: Array<LocalEntityRef>
  m_spawntimeline: Array<SpawnDefinition>
  m_objectives: Array<b27b9a2c_895b_5dbe_813d_dd7a16ebe833>
  m_startactions: Array<$$3c9d208a_2e62_51e2_8aa1_5b6bb7473a52>
  m_endactions: Array<$$3c9d208a_2e62_51e2_8aa1_5b6bb7473a52>
  m_userwave: boolean
}
export function isEncounterComponent(obj: any): obj is EncounterComponent {
  return obj?.['__type'] === 'EncounterComponent'
}

export interface EncounterComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isEncounterComponentClientFacet(obj: any): obj is EncounterComponentClientFacet {
  return obj?.['__type'] === 'EncounterComponentClientFacet'
}

export interface EncounterComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_childstagesoptional: boolean
  m_disablespawnersoncompletion: boolean
}
export function isEncounterComponentServerFacet(obj: any): obj is EncounterComponentServerFacet {
  return obj?.['__type'] === 'EncounterComponentServerFacet'
}

export interface SpawnDefinition {
  __type: string
  m_sliceasset: Asset
  m_aliasasset: Asset
  m_spawndelay: number
  m_count: number
  m_spawnlocations: Array<LocalEntityRef>
}
export function isSpawnDefinition(obj: any): obj is SpawnDefinition {
  return obj?.['__type'] === 'SpawnDefinition'
}

export interface b27b9a2c_895b_5dbe_813d_dd7a16ebe833 {
  __type: string
  element:
    | SliceDestroyedObjective
    | InvasionWaveObjective
    | EntityActiveStateChangedObjective
    | EncounterEventObjective
    | WaitForParentObjective
    | BossPhaseObjective
    | SliceSpawnedObjective
    | AllContributorsDownedObjective
}
export function isb27b9a2c_895b_5dbe_813d_dd7a16ebe833(obj: any): obj is b27b9a2c_895b_5dbe_813d_dd7a16ebe833 {
  return obj?.['__type'] === 'b27b9a2c-895b-5dbe-813d-dd7a16ebe833'
}

export interface SliceDestroyedObjective {
  __type: string
  baseclass1: EncounterObjective
  m_trackedslice: Asset
  m_trackedalias: Asset
  m_requiredcount: number
}
export function isSliceDestroyedObjective(obj: any): obj is SliceDestroyedObjective {
  return obj?.['__type'] === 'SliceDestroyedObjective'
}

export interface EncounterObjective {
  __type: string
  m_timelimit: number
  m_succeedontimeout: boolean
  m_failurecondition: boolean
  m_title: string
  m_description: string
  m_countdownprogress: boolean
  m_backgroundactivation: number
}
export function isEncounterObjective(obj: any): obj is EncounterObjective {
  return obj?.['__type'] === 'EncounterObjective'
}

export interface InvasionWaveObjective {
  __type: string
  baseclass1: EncounterObjective
}
export function isInvasionWaveObjective(obj: any): obj is InvasionWaveObjective {
  return obj?.['__type'] === 'InvasionWaveObjective'
}

export interface ClearContainerOnSiegeWarfareComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isClearContainerOnSiegeWarfareComponent(obj: any): obj is ClearContainerOnSiegeWarfareComponent {
  return obj?.['__type'] === 'ClearContainerOnSiegeWarfareComponent'
}

export interface ClearContainerOnSiegeWarfareComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isClearContainerOnSiegeWarfareComponentClientFacet(
  obj: any
): obj is ClearContainerOnSiegeWarfareComponentClientFacet {
  return obj?.['__type'] === 'ClearContainerOnSiegeWarfareComponentClientFacet'
}

export interface ClearContainerOnSiegeWarfareComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_containerentityid: EntityId
}
export function isClearContainerOnSiegeWarfareComponentServerFacet(
  obj: any
): obj is ClearContainerOnSiegeWarfareComponentServerFacet {
  return obj?.['__type'] === 'ClearContainerOnSiegeWarfareComponentServerFacet'
}

export interface LootTableComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isLootTableComponent(obj: any): obj is LootTableComponent {
  return obj?.['__type'] === 'LootTableComponent'
}

export interface LootTableComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isLootTableComponentClientFacet(obj: any): obj is LootTableComponentClientFacet {
  return obj?.['__type'] === 'LootTableComponentClientFacet'
}

export interface LootTableComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_loottable: string
  m_numberoftimestorun: number
  m_transfercontainerentity: LocalEntityRef
  m_materialaffix: string
  m_typeaffix: string
  m_magicaffix: string
  m_runonactivate: boolean
}
export function isLootTableComponentServerFacet(obj: any): obj is LootTableComponentServerFacet {
  return obj?.['__type'] === 'LootTableComponentServerFacet'
}

export interface UITriggerEventComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isUITriggerEventComponent(obj: any): obj is UITriggerEventComponent {
  return obj?.['__type'] === 'UITriggerEventComponent'
}

export interface UITriggerEventComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_entitywhosenttheuievent: LocalEntityRef
  m_uitriggerevent: string
  m_uiuntriggerevent: string
}
export function isUITriggerEventComponentClientFacet(obj: any): obj is UITriggerEventComponentClientFacet {
  return obj?.['__type'] === 'UITriggerEventComponentClientFacet'
}

export interface UITriggerEventComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isUITriggerEventComponentServerFacet(obj: any): obj is UITriggerEventComponentServerFacet {
  return obj?.['__type'] === 'UITriggerEventComponentServerFacet'
}

export interface TutorialComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTutorialComponent(obj: any): obj is TutorialComponent {
  return obj?.['__type'] === 'TutorialComponent'
}

export interface TutorialComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_tutorialsteps: Array<
    | AreaTriggerTutorialStep
    | ConditionalTutorialStep
    | InputFilterTutorialStep
    | ShowToastTutorialStep
    | OnMovieEndEventTutorialStep
    | OnMutexLockTutorialStep
    | RevealUIElementTutorialStep
    | StopHighlightingUIElementTutorialStep
    | HideToastTutorialStep
    | OnMutexUnlockTutorialStep
    | ShowToastLargeTutorialStep
    | HideLargeToastTutorialStep
  >
  m_autoreset: boolean
}
export function isTutorialComponentClientFacet(obj: any): obj is TutorialComponentClientFacet {
  return obj?.['__type'] === 'TutorialComponentClientFacet'
}

export interface AreaTriggerTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_areas: Array<EntityId>
  m_onenter: boolean
}
export function isAreaTriggerTutorialStep(obj: any): obj is AreaTriggerTutorialStep {
  return obj?.['__type'] === 'AreaTriggerTutorialStep'
}

export interface TutorialStep {
  __type: string
}
export function isTutorialStep(obj: any): obj is TutorialStep {
  return obj?.['__type'] === 'TutorialStep'
}

export interface ConditionalTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_condition: OnOtherTutCompleteTutorialStep
  m_conditionalstep: RevealUIElementTutorialStep
  m_invert: boolean
}
export function isConditionalTutorialStep(obj: any): obj is ConditionalTutorialStep {
  return obj?.['__type'] === 'ConditionalTutorialStep'
}

export interface OnOtherTutCompleteTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_tutid: EntityId
}
export function isOnOtherTutCompleteTutorialStep(obj: any): obj is OnOtherTutCompleteTutorialStep {
  return obj?.['__type'] === 'OnOtherTutCompleteTutorialStep'
}

export interface RevealUIElementTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_uielementname: string
}
export function isRevealUIElementTutorialStep(obj: any): obj is RevealUIElementTutorialStep {
  return obj?.['__type'] === 'RevealUIElementTutorialStep'
}

export interface TutorialComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTutorialComponentServerFacet(obj: any): obj is TutorialComponentServerFacet {
  return obj?.['__type'] === 'TutorialComponentServerFacet'
}

export interface InputFilterTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_filter: string
  m_enable: boolean
  m_allowuiareahitevents: boolean
  m_allowflyout: boolean
  m_allowtransfer: boolean
  m_allownotifications: boolean
}
export function isInputFilterTutorialStep(obj: any): obj is InputFilterTutorialStep {
  return obj?.['__type'] === 'InputFilterTutorialStep'
}

export interface ShowToastTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_msgstring: string
  m_closeoninput: boolean
  m_showtitle: boolean
  m_returntohud: boolean
  m_titlemsgstring: string
  m_position: number
  m_keybindings: Array<string>
  m_keycategories: Array<string>
  m_separators: Array<string>
  m_playrevealsound: boolean
  m_width: number
  m_height: number
  m_candetectinput: boolean
}
export function isShowToastTutorialStep(obj: any): obj is ShowToastTutorialStep {
  return obj?.['__type'] === 'ShowToastTutorialStep'
}

export interface OnMovieEndEventTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_dummyvalue: number
}
export function isOnMovieEndEventTutorialStep(obj: any): obj is OnMovieEndEventTutorialStep {
  return obj?.['__type'] === 'OnMovieEndEventTutorialStep'
}

export interface OnMutexLockTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_dummyvalue: number
}
export function isOnMutexLockTutorialStep(obj: any): obj is OnMutexLockTutorialStep {
  return obj?.['__type'] === 'OnMutexLockTutorialStep'
}

export interface StopHighlightingUIElementTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_uielementname: string
}
export function isStopHighlightingUIElementTutorialStep(obj: any): obj is StopHighlightingUIElementTutorialStep {
  return obj?.['__type'] === 'StopHighlightingUIElementTutorialStep'
}

export interface HideToastTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_dummyvalue: number
}
export function isHideToastTutorialStep(obj: any): obj is HideToastTutorialStep {
  return obj?.['__type'] === 'HideToastTutorialStep'
}

export interface OnMutexUnlockTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_dummyvalue: number
}
export function isOnMutexUnlockTutorialStep(obj: any): obj is OnMutexUnlockTutorialStep {
  return obj?.['__type'] === 'OnMutexUnlockTutorialStep'
}

export interface ShowToastLargeTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_titlemsgstring: string
  m_msglines: Array<TutorialToastMessageLine>
  m_playrevealsound: boolean
}
export function isShowToastLargeTutorialStep(obj: any): obj is ShowToastLargeTutorialStep {
  return obj?.['__type'] === 'ShowToastLargeTutorialStep'
}

export interface TutorialToastMessageLine {
  __type: string
  m_msgtext: string
  m_keybindings: Array<TutorialToastBinding>
}
export function isTutorialToastMessageLine(obj: any): obj is TutorialToastMessageLine {
  return obj?.['__type'] === 'TutorialToastMessageLine'
}

export interface TutorialToastBinding {
  __type: string
  m_keybinding: string
  m_keycategory: string
  m_separatortext: string
}
export function isTutorialToastBinding(obj: any): obj is TutorialToastBinding {
  return obj?.['__type'] === 'TutorialToastBinding'
}

export interface HideLargeToastTutorialStep {
  __type: string
  baseclass1: TutorialStep
  m_dummyvalue: number
}
export function isHideLargeToastTutorialStep(obj: any): obj is HideLargeToastTutorialStep {
  return obj?.['__type'] === 'HideLargeToastTutorialStep'
}

export interface FtueIslandSpawnerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_cutscenenamestooffset: Array<string>
}
export function isFtueIslandSpawnerComponent(obj: any): obj is FtueIslandSpawnerComponent {
  return obj?.['__type'] === 'FtueIslandSpawnerComponent'
}

export interface FtueIslandSpawnerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFtueIslandSpawnerComponentClientFacet(obj: any): obj is FtueIslandSpawnerComponentClientFacet {
  return obj?.['__type'] === 'FtueIslandSpawnerComponentClientFacet'
}

export interface FtueIslandSpawnerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFtueIslandSpawnerComponentServerFacet(obj: any): obj is FtueIslandSpawnerComponentServerFacet {
  return obj?.['__type'] === 'FtueIslandSpawnerComponentServerFacet'
}

export interface FtueDetectionVolumeComponent {
  __type: string
  baseclass1: FacetedComponent
  m_entitiestotrigger: Array<EventData>
}
export function isFtueDetectionVolumeComponent(obj: any): obj is FtueDetectionVolumeComponent {
  return obj?.['__type'] === 'FtueDetectionVolumeComponent'
}

export interface FtueDetectionVolumeComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFtueDetectionVolumeComponentClientFacet(obj: any): obj is FtueDetectionVolumeComponentClientFacet {
  return obj?.['__type'] === 'FtueDetectionVolumeComponentClientFacet'
}

export interface FtueDetectionVolumeComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_entitytoteleportto: EntityId
  m_teleportdelay: number
}
export function isFtueDetectionVolumeComponentServerFacet(obj: any): obj is FtueDetectionVolumeComponentServerFacet {
  return obj?.['__type'] === 'FtueDetectionVolumeComponentServerFacet'
}

export interface FactionControlComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isFactionControlComponent(obj: any): obj is FactionControlComponent {
  return obj?.['__type'] === 'FactionControlComponent'
}

export interface FactionControlComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFactionControlComponentClientFacet(obj: any): obj is FactionControlComponentClientFacet {
  return obj?.['__type'] === 'FactionControlComponentClientFacet'
}

export interface FactionControlComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFactionControlComponentServerFacet(obj: any): obj is FactionControlComponentServerFacet {
  return obj?.['__type'] === 'FactionControlComponentServerFacet'
}

export interface TerritoryGovernanceComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTerritoryGovernanceComponent(obj: any): obj is TerritoryGovernanceComponent {
  return obj?.['__type'] === 'TerritoryGovernanceComponent'
}

export interface TerritoryGovernanceComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTerritoryGovernanceComponentClientFacet(obj: any): obj is TerritoryGovernanceComponentClientFacet {
  return obj?.['__type'] === 'TerritoryGovernanceComponentClientFacet'
}

export interface TerritoryGovernanceComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTerritoryGovernanceComponentServerFacet(obj: any): obj is TerritoryGovernanceComponentServerFacet {
  return obj?.['__type'] === 'TerritoryGovernanceComponentServerFacet'
}

export interface RaidSetupComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isRaidSetupComponent(obj: any): obj is RaidSetupComponent {
  return obj?.['__type'] === 'RaidSetupComponent'
}

export interface RaidSetupComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isRaidSetupComponentClientFacet(obj: any): obj is RaidSetupComponentClientFacet {
  return obj?.['__type'] === 'RaidSetupComponentClientFacet'
}

export interface RaidSetupComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isRaidSetupComponentServerFacet(obj: any): obj is RaidSetupComponentServerFacet {
  return obj?.['__type'] === 'RaidSetupComponentServerFacet'
}

export interface TerritoryProgressionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_availablecategories: []
}
export function isTerritoryProgressionComponent(obj: any): obj is TerritoryProgressionComponent {
  return obj?.['__type'] === 'TerritoryProgressionComponent'
}

export interface TerritoryProgressionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTerritoryProgressionComponentClientFacet(obj: any): obj is TerritoryProgressionComponentClientFacet {
  return obj?.['__type'] === 'TerritoryProgressionComponentClientFacet'
}

export interface TerritoryProgressionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTerritoryProgressionComponentServerFacet(obj: any): obj is TerritoryProgressionComponentServerFacet {
  return obj?.['__type'] === 'TerritoryProgressionComponentServerFacet'
}

export interface LookTargetingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isLookTargetingComponent(obj: any): obj is LookTargetingComponent {
  return obj?.['__type'] === 'LookTargetingComponent'
}

export interface LookTargetingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isLookTargetingComponentClientFacet(obj: any): obj is LookTargetingComponentClientFacet {
  return obj?.['__type'] === 'LookTargetingComponentClientFacet'
}

export interface LookTargetingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_detectionvolumecomponententity: LocalEntityRef
}
export function isLookTargetingComponentServerFacet(obj: any): obj is LookTargetingComponentServerFacet {
  return obj?.['__type'] === 'LookTargetingComponentServerFacet'
}

export interface ALCScopeData {
  __type: string
  scopename: string
  scopeadb: AzFramework__SimpleAssetReference_LmbrCentral__MannequinAnimationDatabaseAsset_
}
export function isALCScopeData(obj: any): obj is ALCScopeData {
  return obj?.['__type'] === 'ALCScopeData'
}

export interface AudioSetTriggerOverrideComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAudioSetTriggerOverrideComponent(obj: any): obj is AudioSetTriggerOverrideComponent {
  return obj?.['__type'] === 'AudioSetTriggerOverrideComponent'
}

export interface AudioSetTriggerOverrideComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_audiotriggeroverrides: Array<TriggerOverridePair>
}
export function isAudioSetTriggerOverrideComponentClientFacet(
  obj: any
): obj is AudioSetTriggerOverrideComponentClientFacet {
  return obj?.['__type'] === 'AudioSetTriggerOverrideComponentClientFacet'
}

export interface TriggerOverridePair {
  __type: string
  m_basetriggername: string
  m_overridetriggername: string
}
export function isTriggerOverridePair(obj: any): obj is TriggerOverridePair {
  return obj?.['__type'] === 'TriggerOverridePair'
}

export interface AudioSetTriggerOverrideComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAudioSetTriggerOverrideComponentServerFacet(
  obj: any
): obj is AudioSetTriggerOverrideComponentServerFacet {
  return obj?.['__type'] === 'AudioSetTriggerOverrideComponentServerFacet'
}

export interface NavConfiguration {
  __type: string
  m_navconfigtype: string
  m_turnratedegs: number
  m_arrivalthreshold: number
  m_minspeed: number
  m_maxspeed: number
  m_linearacceleration: number
  m_lineardeceleration: number
  m_targetrepathdistance: number
  m_selectpositionparams: Parameters
  m_navactionparams: NavActionConfiguration
  m_strafeactionparams: StrafeActionConfiguration
  m_teleport: boolean
  m_additionalnavabilities: Array<number>
  m_turnactionname: string
  m_startactionname: string
  m_navstartrule: number
}
export function isNavConfiguration(obj: any): obj is NavConfiguration {
  return obj?.['__type'] === 'NavConfiguration'
}

export interface Parameters {
  __type: string
  origin: PositionType
  anchor: PositionType
  direction: number
  positionselectmode: number
  checkpathtoorigin: boolean
  checkpathtoanchor: boolean
  startangle: number
  stopangle: number
  favormiddleangle: boolean
  rangemin: number
  rangemax: number
  distancefromwall: number
  queryradius: number
  maxattempts: number
  startangleparam: BehaviorParameter
  stopangleparam: BehaviorParameter
  rangeminparam: BehaviorParameter
  rangemaxparam: BehaviorParameter
  distancefromwallparam: BehaviorParameter
  queryradiusparam: BehaviorParameter
  maxattemptsparam: BehaviorParameter
  groupdetector: BehaviorParameter
  grouprange: BehaviorParameter
}
export function isParameters(obj: any): obj is Parameters {
  return obj?.['__type'] === 'Parameters'
}

export interface PositionType {
  __type: string
  positiontype: number
}
export function isPositionType(obj: any): obj is PositionType {
  return obj?.['__type'] === 'PositionType'
}

export interface BehaviorParameter {
  __type: string
  blackboardkeyname: string
  blackboardkey: number
  storage: $any
  isdefaultvalue: boolean
}
export function isBehaviorParameter(obj: any): obj is BehaviorParameter {
  return obj?.['__type'] === 'BehaviorParameter'
}

export interface NavActionConfiguration {
  __type: string
  m_observeheat: boolean
  m_applyheat: boolean
  m_facetarget: boolean
  m_maxcorridorwidth: number
  m_agentradius: number
  m_angularaccelerationdegs: number
  m_angulardecelerationdegs: number
  m_maxsteeringforce: number
  m_maxavoidanceforce: number
  m_maxseparationforce: number
  m_steeringrampdownrangemin: number
  m_steeringrampdownrangemax: number
  m_enableavoidance: boolean
  m_avoidancelookaheadhorizon: number
  m_avoidanceforce: number
  m_enableseparation: boolean
  m_separationcircleforce: number
  m_separationcircleradius: number
  m_separationconeforce: number
  m_separationconerange: number
  m_separationconeangledegs: number
  m_allowpartialpaths: boolean
}
export function isNavActionConfiguration(obj: any): obj is NavActionConfiguration {
  return obj?.['__type'] === 'NavActionConfiguration'
}

export interface StrafeActionConfiguration {
  __type: string
  m_idealdistancemin: number
  m_idealdistancemax: number
  m_approachdistanceratio: number
  m_retreatdistanceratio: number
  m_lateralmovementfrequencymin: number
  m_lateralmovementfrequencymax: number
  m_lateralmovementanglemin: number
  m_lateralmovementanglemax: number
  m_directmovementfrequencymin: number
  m_directmovementfrequencymax: number
  m_allowstandingstill: boolean
  m_standstillfrequencymin: number
  m_standstillfrequencymax: number
  m_standstilldurationmin: number
  m_standstilldurationmax: number
  m_repositionkeepawaydistance: number
  m_facingconvergencerate: number
}
export function isStrafeActionConfiguration(obj: any): obj is StrafeActionConfiguration {
  return obj?.['__type'] === 'StrafeActionConfiguration'
}

export interface DynamicScaleCancellingComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDynamicScaleCancellingComponent(obj: any): obj is DynamicScaleCancellingComponent {
  return obj?.['__type'] === 'DynamicScaleCancellingComponent'
}

export interface DynamicScaleCancellingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDynamicScaleCancellingComponentClientFacet(
  obj: any
): obj is DynamicScaleCancellingComponentClientFacet {
  return obj?.['__type'] === 'DynamicScaleCancellingComponentClientFacet'
}

export interface DynamicScaleCancellingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDynamicScaleCancellingComponentServerFacet(
  obj: any
): obj is DynamicScaleCancellingComponentServerFacet {
  return obj?.['__type'] === 'DynamicScaleCancellingComponentServerFacet'
}

export interface MaterialOverrideTriggerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_materialoverrideentities: Array<LocalEntityRef>
  m_materialoverridenames: Array<string>
}
export function isMaterialOverrideTriggerComponent(obj: any): obj is MaterialOverrideTriggerComponent {
  return obj?.['__type'] === 'MaterialOverrideTriggerComponent'
}

export interface MaterialOverrideTriggerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMaterialOverrideTriggerComponentClientFacet(
  obj: any
): obj is MaterialOverrideTriggerComponentClientFacet {
  return obj?.['__type'] === 'MaterialOverrideTriggerComponentClientFacet'
}

export interface MaterialOverrideTriggerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMaterialOverrideTriggerComponentServerFacet(
  obj: any
): obj is MaterialOverrideTriggerComponentServerFacet {
  return obj?.['__type'] === 'MaterialOverrideTriggerComponentServerFacet'
}

export interface InitPaperdollData {
  __type: string
  m_slottype: number
  m_itemid: Crc32
  m_itemname: string
}
export function isInitPaperdollData(obj: any): obj is InitPaperdollData {
  return obj?.['__type'] === 'InitPaperdollData'
}

export interface CustomizableMeshComponent {
  __type: string
  baseclass1: AZ__Component
  'character creation mesh asset (male)': Asset
  'character creation mesh asset (female)': Asset
}
export function isCustomizableMeshComponent(obj: any): obj is CustomizableMeshComponent {
  return obj?.['__type'] === 'CustomizableMeshComponent'
}

export interface BossPhaseComponent {
  __type: string
  baseclass1: FacetedComponent
  m_bossphasedata: Array<$$33c158b9_7c9d_54c1_ae8e_ed3c7f5b77c6>
}
export function isBossPhaseComponent(obj: any): obj is BossPhaseComponent {
  return obj?.['__type'] === 'BossPhaseComponent'
}

export interface BossPhaseComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBossPhaseComponentClientFacet(obj: any): obj is BossPhaseComponentClientFacet {
  return obj?.['__type'] === 'BossPhaseComponentClientFacet'
}

export interface BossPhaseComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBossPhaseComponentServerFacet(obj: any): obj is BossPhaseComponentServerFacet {
  return obj?.['__type'] === 'BossPhaseComponentServerFacet'
}

export interface $$33c158b9_7c9d_54c1_ae8e_ed3c7f5b77c6 {
  __type: string
  element: WaveEndedBossPhaseConfig | HealthThresholdBossPhaseConfig
}
export function is$$33c158b9_7c9d_54c1_ae8e_ed3c7f5b77c6(obj: any): obj is $$33c158b9_7c9d_54c1_ae8e_ed3c7f5b77c6 {
  return obj?.['__type'] === '33c158b9-7c9d-54c1-ae8e-ed3c7f5b77c6'
}

export interface WaveEndedBossPhaseConfig {
  __type: string
  baseclass1: BossPhaseConfig
  m_wavenumber: number
}
export function isWaveEndedBossPhaseConfig(obj: any): obj is WaveEndedBossPhaseConfig {
  return obj?.['__type'] === 'WaveEndedBossPhaseConfig'
}

export interface BossPhaseConfig {
  __type: string
  m_onphasestart: EventData
  m_onphaseend: EventData
  m_encounteronlybossphaseconfig: boolean
  m_blackboardphasekey: string
}
export function isBossPhaseConfig(obj: any): obj is BossPhaseConfig {
  return obj?.['__type'] === 'BossPhaseConfig'
}

export interface MinionVitalsProviderComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isMinionVitalsProviderComponent(obj: any): obj is MinionVitalsProviderComponent {
  return obj?.['__type'] === 'MinionVitalsProviderComponent'
}

export interface MinionVitalsProviderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMinionVitalsProviderComponentClientFacet(obj: any): obj is MinionVitalsProviderComponentClientFacet {
  return obj?.['__type'] === 'MinionVitalsProviderComponentClientFacet'
}

export interface MinionVitalsProviderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_usespawnerlevel: boolean
}
export function isMinionVitalsProviderComponentServerFacet(obj: any): obj is MinionVitalsProviderComponentServerFacet {
  return obj?.['__type'] === 'MinionVitalsProviderComponentServerFacet'
}

export interface HealthThresholdBossPhaseConfig {
  __type: string
  baseclass1: BossPhaseConfig
  m_healthpercent: number
}
export function isHealthThresholdBossPhaseConfig(obj: any): obj is HealthThresholdBossPhaseConfig {
  return obj?.['__type'] === 'HealthThresholdBossPhaseConfig'
}

export interface RepulsorDescriptor {
  __type: string
  name: string
  relativeoffset: Array<number>
  radius: number
  attachedtobonename: string
}
export function isRepulsorDescriptor(obj: any): obj is RepulsorDescriptor {
  return obj?.['__type'] === 'RepulsorDescriptor'
}

export interface MomentaryOffenseComponent {
  __type: string
  baseclass1: FacetedComponent
  m_damagedata: OffenseDamageData
  m_ondamagedealt: EventData
  m_useselfasdamagesender: boolean
  m_allowselfdamage: boolean
  m_disabletriggeronenable: boolean
}
export function isMomentaryOffenseComponent(obj: any): obj is MomentaryOffenseComponent {
  return obj?.['__type'] === 'MomentaryOffenseComponent'
}

export interface MomentaryOffenseComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMomentaryOffenseComponentClientFacet(obj: any): obj is MomentaryOffenseComponentClientFacet {
  return obj?.['__type'] === 'MomentaryOffenseComponentClientFacet'
}

export interface MomentaryOffenseComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_shape: QueryShapeSphere | QueryShapeCylinder | QueryShapeBox | null | QueryShapeCapsule
  m_strfilter: string
  m_ownershipentity: LocalEntityRef
  m_snaptoterrainentity: LocalEntityRef
  m_checkobstructions: boolean
  m_canbeblocked: boolean
  m_damagetag: number
}
export function isMomentaryOffenseComponentServerFacet(obj: any): obj is MomentaryOffenseComponentServerFacet {
  return obj?.['__type'] === 'MomentaryOffenseComponentServerFacet'
}

export interface $$84684376_0649_435e_91c5_333ed737d9ea {
  __type: string
  '0x98380e01': string
  m_shape: QueryShapeCapsule
  m_shapeoffset: Array<number>
  '0xda7a5f46': boolean
}
export function is$$84684376_0649_435e_91c5_333ed737d9ea(obj: any): obj is $$84684376_0649_435e_91c5_333ed737d9ea {
  return obj?.['__type'] === '84684376-0649-435e-91c5-333ed737d9ea'
}

export interface NavigationAreaCost {
  __type: string
  m_areatype: number
  m_cost: number
}
export function isNavigationAreaCost(obj: any): obj is NavigationAreaCost {
  return obj?.['__type'] === 'NavigationAreaCost'
}

export interface AbilityEditorData {
  __type: string
  m_abilitycrc: Crc32
  m_abilityid: string
}
export function isAbilityEditorData(obj: any): obj is AbilityEditorData {
  return obj?.['__type'] === 'AbilityEditorData'
}

export interface SpellComponent {
  __type: string
  baseclass1: FacetedComponent
  m_childentities: Array<LocalEntityRef>
  m_eventstotriggeronattachedentitylost: Array<EventData>
}
export function isSpellComponent(obj: any): obj is SpellComponent {
  return obj?.['__type'] === 'SpellComponent'
}

export interface SpellComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSpellComponentClientFacet(obj: any): obj is SpellComponentClientFacet {
  return obj?.['__type'] === 'SpellComponentClientFacet'
}

export interface SpellComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSpellComponentServerFacet(obj: any): obj is SpellComponentServerFacet {
  return obj?.['__type'] === 'SpellComponentServerFacet'
}

export interface CharacterPhysicsComponent {
  __type: string
  baseclass1: AZ__Component
  configuration: CryPlayerPhysicsConfiguration
}
export function isCharacterPhysicsComponent(obj: any): obj is CharacterPhysicsComponent {
  return obj?.['__type'] === 'CharacterPhysicsComponent'
}

export interface CryPlayerPhysicsConfiguration {
  __type: string
  'player dimensions': PlayerDimensions
  'player dynamics': PlayerDynamics
}
export function isCryPlayerPhysicsConfiguration(obj: any): obj is CryPlayerPhysicsConfiguration {
  return obj?.['__type'] === 'CryPlayerPhysicsConfiguration'
}

export interface PlayerDimensions {
  __type: string
  'use capsule': boolean
  'collider radius': number
  'collider half-height': number
  'height collider': number
  'height pivot': number
  'height eye': number
  'height head': number
  'head radius': number
  'unprojection direction': Array<number>
  'max unprojection': number
  'ground contact epsilon': number
}
export function isPlayerDimensions(obj: any): obj is PlayerDimensions {
  return obj?.['__type'] === 'PlayerDimensions'
}

export interface PlayerDynamics {
  __type: string
  mass: number
  inertia: number
  'inertia acceleration': number
  'time impulse recover': number
  'air control': number
  'air resistance': number
  'use custom gravity': boolean
  gravity: Array<number>
  'nod speed': number
  'is active': boolean
  'release ground collider when not active': boolean
  'is swimming': boolean
  'surface index': number
  'min fall angle': number
  'min slide angle': number
  'max climb angle': number
  'max jump angle': number
  'max velocity ground': number
  'collide with terrain': boolean
  'collide with static': boolean
  'collide with rigid': boolean
  'collide with sleeping rigid': boolean
  'collide with living': boolean
  'collide with independent': boolean
  recordcollisions: boolean
  maxrecordedcollisions: number
}
export function isPlayerDynamics(obj: any): obj is PlayerDynamics {
  return obj?.['__type'] === 'PlayerDynamics'
}

export interface TutorialAIComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTutorialAIComponent(obj: any): obj is TutorialAIComponent {
  return obj?.['__type'] === 'TutorialAIComponent'
}

export interface TutorialAIComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTutorialAIComponentClientFacet(obj: any): obj is TutorialAIComponentClientFacet {
  return obj?.['__type'] === 'TutorialAIComponentClientFacet'
}

export interface TutorialAIComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_lootentity: LocalEntityRef
}
export function isTutorialAIComponentServerFacet(obj: any): obj is TutorialAIComponentServerFacet {
  return obj?.['__type'] === 'TutorialAIComponentServerFacet'
}

export interface TargetingComponent {
  __type: string
  baseclass1: FacetedComponent
  m_targethitvolumes: Array<string>
  m_targetpriority: number
}
export function isTargetingComponent(obj: any): obj is TargetingComponent {
  return obj?.['__type'] === 'TargetingComponent'
}

export interface TargetingComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTargetingComponentClientFacet(obj: any): obj is TargetingComponentClientFacet {
  return obj?.['__type'] === 'TargetingComponentClientFacet'
}

export interface TargetingComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTargetingComponentServerFacet(obj: any): obj is TargetingComponentServerFacet {
  return obj?.['__type'] === 'TargetingComponentServerFacet'
}

export interface ParticleEmitBoneLayer {
  __type: string
  'joint name': string
  'enable layer': boolean
  affectedindices: Array<number>
}
export function isParticleEmitBoneLayer(obj: any): obj is ParticleEmitBoneLayer {
  return obj?.['__type'] === 'ParticleEmitBoneLayer'
}

export interface WarboardComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isWarboardComponent(obj: any): obj is WarboardComponent {
  return obj?.['__type'] === 'WarboardComponent'
}

export interface WarboardComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isWarboardComponentClientFacet(obj: any): obj is WarboardComponentClientFacet {
  return obj?.['__type'] === 'WarboardComponentClientFacet'
}

export interface WarboardComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isWarboardComponentServerFacet(obj: any): obj is WarboardComponentServerFacet {
  return obj?.['__type'] === 'WarboardComponentServerFacet'
}

export interface $$5f172f5e_778f_4b17_ba0f_5b3f5ffc2c03 {
  __type: string
  baseclass1: SlayerScriptData
}
export function is$$5f172f5e_778f_4b17_ba0f_5b3f5ffc2c03(obj: any): obj is $$5f172f5e_778f_4b17_ba0f_5b3f5ffc2c03 {
  return obj?.['__type'] === '5f172f5e-778f-4b17-ba0f-5b3f5ffc2c03'
}

export interface ExcludeAOIComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isExcludeAOIComponent(obj: any): obj is ExcludeAOIComponent {
  return obj?.['__type'] === 'ExcludeAOIComponent'
}

export interface ExcludeAOIComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isExcludeAOIComponentClientFacet(obj: any): obj is ExcludeAOIComponentClientFacet {
  return obj?.['__type'] === 'ExcludeAOIComponentClientFacet'
}

export interface ExcludeAOIComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isExcludeAOIComponentServerFacet(obj: any): obj is ExcludeAOIComponentServerFacet {
  return obj?.['__type'] === 'ExcludeAOIComponentServerFacet'
}

export interface CapturePointComponent {
  __type: string
  baseclass1: FacetedComponent
  m_ownershipentity: LocalEntityRef
  m_groupingmode: number
}
export function isCapturePointComponent(obj: any): obj is CapturePointComponent {
  return obj?.['__type'] === 'CapturePointComponent'
}

export interface CapturePointComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_friendlyfillentity: LocalEntityRef
  m_enemyfillentity: LocalEntityRef
  m_neutralfillentity: LocalEntityRef
  m_faction1fillentity: LocalEntityRef
  m_faction2fillentity: LocalEntityRef
  m_faction3fillentity: LocalEntityRef
}
export function isCapturePointComponentClientFacet(obj: any): obj is CapturePointComponentClientFacet {
  return obj?.['__type'] === 'CapturePointComponentClientFacet'
}

export interface CapturePointComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_detectionvolumeentity: LocalEntityRef
  m_territorydetectorentity: LocalEntityRef
  m_capturetime: number
  m_capturetimedecreaseperplayer: number
  m_capturetimeminimum: number
  m_postcapturelocktime: number
  m_endwaroncapture: boolean
  m_siegecapturepointsrequiredtounlock: Array<number>
  m_respawnnamesbyfortspawnid: $$65cdd55c_be9b_5689_8e2c_a4117ff26f6e
}
export function isCapturePointComponentServerFacet(obj: any): obj is CapturePointComponentServerFacet {
  return obj?.['__type'] === 'CapturePointComponentServerFacet'
}

export interface $$65cdd55c_be9b_5689_8e2c_a4117ff26f6e {
  __type: string
  element: d8b4529d_eddb_525c_ba46_09a63951e5fd
}
export function is$$65cdd55c_be9b_5689_8e2c_a4117ff26f6e(obj: any): obj is $$65cdd55c_be9b_5689_8e2c_a4117ff26f6e {
  return obj?.['__type'] === '65cdd55c-be9b-5689-8e2c-a4117ff26f6e'
}

export interface GenericInviteComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGenericInviteComponent(obj: any): obj is GenericInviteComponent {
  return obj?.['__type'] === 'GenericInviteComponent'
}

export interface GenericInviteComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGenericInviteComponentClientFacet(obj: any): obj is GenericInviteComponentClientFacet {
  return obj?.['__type'] === 'GenericInviteComponentClientFacet'
}

export interface GenericInviteComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGenericInviteComponentServerFacet(obj: any): obj is GenericInviteComponentServerFacet {
  return obj?.['__type'] === 'GenericInviteComponentServerFacet'
}

export interface GroupFinderGroupDataComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGroupFinderGroupDataComponent(obj: any): obj is GroupFinderGroupDataComponent {
  return obj?.['__type'] === 'GroupFinderGroupDataComponent'
}

export interface GroupFinderGroupDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGroupFinderGroupDataComponentClientFacet(obj: any): obj is GroupFinderGroupDataComponentClientFacet {
  return obj?.['__type'] === 'GroupFinderGroupDataComponentClientFacet'
}

export interface GroupFinderGroupDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGroupFinderGroupDataComponentServerFacet(obj: any): obj is GroupFinderGroupDataComponentServerFacet {
  return obj?.['__type'] === 'GroupFinderGroupDataComponentServerFacet'
}

export interface GroupDataComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGroupDataComponent(obj: any): obj is GroupDataComponent {
  return obj?.['__type'] === 'GroupDataComponent'
}

export interface GroupDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGroupDataComponentClientFacet(obj: any): obj is GroupDataComponentClientFacet {
  return obj?.['__type'] === 'GroupDataComponentClientFacet'
}

export interface GroupDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGroupDataComponentServerFacet(obj: any): obj is GroupDataComponentServerFacet {
  return obj?.['__type'] === 'GroupDataComponentServerFacet'
}

export interface RaidDataComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isRaidDataComponent(obj: any): obj is RaidDataComponent {
  return obj?.['__type'] === 'RaidDataComponent'
}

export interface RaidDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isRaidDataComponentClientFacet(obj: any): obj is RaidDataComponentClientFacet {
  return obj?.['__type'] === 'RaidDataComponentClientFacet'
}

export interface RaidDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isRaidDataComponentServerFacet(obj: any): obj is RaidDataComponentServerFacet {
  return obj?.['__type'] === 'RaidDataComponentServerFacet'
}

export interface HouseDataComponent {
  __type: string
  baseclass1: FacetedComponent
  m_maxtotalhousingitems: number
  m_maxhousingitemspertag: []
  m_currenttagcounts: []
}
export function isHouseDataComponent(obj: any): obj is HouseDataComponent {
  return obj?.['__type'] === 'HouseDataComponent'
}

export interface HouseDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isHouseDataComponentClientFacet(obj: any): obj is HouseDataComponentClientFacet {
  return obj?.['__type'] === 'HouseDataComponentClientFacet'
}

export interface HouseDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isHouseDataComponentServerFacet(obj: any): obj is HouseDataComponentServerFacet {
  return obj?.['__type'] === 'HouseDataComponentServerFacet'
}

export interface FishingBobberPhysicsHack {
  __type: string
  baseclass1: FacetedComponent
}
export function isFishingBobberPhysicsHack(obj: any): obj is FishingBobberPhysicsHack {
  return obj?.['__type'] === 'FishingBobberPhysicsHack'
}

export interface FishingBobberPhysicsHackClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_waterdrag: number
  m_extrafloatamount: number
}
export function isFishingBobberPhysicsHackClientFacet(obj: any): obj is FishingBobberPhysicsHackClientFacet {
  return obj?.['__type'] === 'FishingBobberPhysicsHackClientFacet'
}

export interface FishingBobberPhysicsHackServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFishingBobberPhysicsHackServerFacet(obj: any): obj is FishingBobberPhysicsHackServerFacet {
  return obj?.['__type'] === 'FishingBobberPhysicsHackServerFacet'
}

export interface FishCaughtComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isFishCaughtComponent(obj: any): obj is FishCaughtComponent {
  return obj?.['__type'] === 'FishCaughtComponent'
}

export interface FishCaughtComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_jumpforce: number
  m_verticalamount: number
}
export function isFishCaughtComponentClientFacet(obj: any): obj is FishCaughtComponentClientFacet {
  return obj?.['__type'] === 'FishCaughtComponentClientFacet'
}

export interface FishCaughtComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFishCaughtComponentServerFacet(obj: any): obj is FishCaughtComponentServerFacet {
  return obj?.['__type'] === 'FishCaughtComponentServerFacet'
}

export interface ParticipantTrackerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isParticipantTrackerComponent(obj: any): obj is ParticipantTrackerComponent {
  return obj?.['__type'] === 'ParticipantTrackerComponent'
}

export interface ParticipantTrackerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isParticipantTrackerComponentClientFacet(obj: any): obj is ParticipantTrackerComponentClientFacet {
  return obj?.['__type'] === 'ParticipantTrackerComponentClientFacet'
}

export interface ParticipantTrackerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_graceperiodsec: number
  m_participantaddedgameeventid: string
}
export function isParticipantTrackerComponentServerFacet(obj: any): obj is ParticipantTrackerComponentServerFacet {
  return obj?.['__type'] === 'ParticipantTrackerComponentServerFacet'
}

export interface ad73f519_a850_4ff0_8733_e7ac9d228c8b {
  __type: string
  baseclass1: FacetedComponent
}
export function isad73f519_a850_4ff0_8733_e7ac9d228c8b(obj: any): obj is ad73f519_a850_4ff0_8733_e7ac9d228c8b {
  return obj?.['__type'] === 'ad73f519-a850-4ff0-8733-e7ac9d228c8b'
}

export interface MusicalPerformanceComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMusicalPerformanceComponentClientFacet(obj: any): obj is MusicalPerformanceComponentClientFacet {
  return obj?.['__type'] === 'MusicalPerformanceComponentClientFacet'
}

export interface MusicalPerformanceComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMusicalPerformanceComponentServerFacet(obj: any): obj is MusicalPerformanceComponentServerFacet {
  return obj?.['__type'] === 'MusicalPerformanceComponentServerFacet'
}

export interface MusicalPerformanceZoneComponent {
  __type: string
  baseclass1: FacetedComponent
  m_detectionvolumeref: LocalEntityRef
  m_exclusionzones: Array<LocalEntityRef>
}
export function isMusicalPerformanceZoneComponent(obj: any): obj is MusicalPerformanceZoneComponent {
  return obj?.['__type'] === 'MusicalPerformanceZoneComponent'
}

export interface MusicalPerformanceZoneComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isMusicalPerformanceZoneComponentClientFacet(
  obj: any
): obj is MusicalPerformanceZoneComponentClientFacet {
  return obj?.['__type'] === 'MusicalPerformanceZoneComponentClientFacet'
}

export interface MusicalPerformanceZoneComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isMusicalPerformanceZoneComponentServerFacet(
  obj: any
): obj is MusicalPerformanceZoneComponentServerFacet {
  return obj?.['__type'] === 'MusicalPerformanceZoneComponentServerFacet'
}

export interface TippingPoolComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTippingPoolComponent(obj: any): obj is TippingPoolComponent {
  return obj?.['__type'] === 'TippingPoolComponent'
}

export interface TippingPoolComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isTippingPoolComponentClientFacet(obj: any): obj is TippingPoolComponentClientFacet {
  return obj?.['__type'] === 'TippingPoolComponentClientFacet'
}

export interface TippingPoolComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isTippingPoolComponentServerFacet(obj: any): obj is TippingPoolComponentServerFacet {
  return obj?.['__type'] === 'TippingPoolComponentServerFacet'
}

export interface InteractionConditionComponent {
  __type: string
  baseclass1: FacetedComponent
  m_condition: GatherableCondition
}
export function isInteractionConditionComponent(obj: any): obj is InteractionConditionComponent {
  return obj?.['__type'] === 'InteractionConditionComponent'
}

export interface InteractionConditionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isInteractionConditionComponentClientFacet(obj: any): obj is InteractionConditionComponentClientFacet {
  return obj?.['__type'] === 'InteractionConditionComponentClientFacet'
}

export interface InteractionConditionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isInteractionConditionComponentServerFacet(obj: any): obj is InteractionConditionComponentServerFacet {
  return obj?.['__type'] === 'InteractionConditionComponentServerFacet'
}

export interface ImpulseComponent {
  __type: string
  baseclass1: FacetedComponent
  m_impulsestrength: number
  m_applyattip: boolean
  m_accountformasswhencomputingimpulse: boolean
}
export function isImpulseComponent(obj: any): obj is ImpulseComponent {
  return obj?.['__type'] === 'ImpulseComponent'
}

export interface ImpulseComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isImpulseComponentClientFacet(obj: any): obj is ImpulseComponentClientFacet {
  return obj?.['__type'] === 'ImpulseComponentClientFacet'
}

export interface ImpulseComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isImpulseComponentServerFacet(obj: any): obj is ImpulseComponentServerFacet {
  return obj?.['__type'] === 'ImpulseComponentServerFacet'
}

export interface CyclicGatherableData {
  __type: string
  baseclass1: SlayerScriptData
  isinstanced: boolean
}
export function isCyclicGatherableData(obj: any): obj is CyclicGatherableData {
  return obj?.['__type'] === 'CyclicGatherableData'
}

export interface LockedInteractGatherableData {
  __type: string
  baseclass1: SlayerScriptData
}
export function isLockedInteractGatherableData(obj: any): obj is LockedInteractGatherableData {
  return obj?.['__type'] === 'LockedInteractGatherableData'
}

export interface OwnershipDataComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isOwnershipDataComponent(obj: any): obj is OwnershipDataComponent {
  return obj?.['__type'] === 'OwnershipDataComponent'
}

export interface OwnershipDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isOwnershipDataComponentClientFacet(obj: any): obj is OwnershipDataComponentClientFacet {
  return obj?.['__type'] === 'OwnershipDataComponentClientFacet'
}

export interface OwnershipDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isOwnershipDataComponentServerFacet(obj: any): obj is OwnershipDataComponentServerFacet {
  return obj?.['__type'] === 'OwnershipDataComponentServerFacet'
}

export interface BotPoiSpawnerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isBotPoiSpawnerComponent(obj: any): obj is BotPoiSpawnerComponent {
  return obj?.['__type'] === 'BotPoiSpawnerComponent'
}

export interface BotPoiSpawnerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isBotPoiSpawnerComponentClientFacet(obj: any): obj is BotPoiSpawnerComponentClientFacet {
  return obj?.['__type'] === 'BotPoiSpawnerComponentClientFacet'
}

export interface BotPoiSpawnerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBotPoiSpawnerComponentServerFacet(obj: any): obj is BotPoiSpawnerComponentServerFacet {
  return obj?.['__type'] === 'BotPoiSpawnerComponentServerFacet'
}

export interface SiegeWarfareDataComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSiegeWarfareDataComponent(obj: any): obj is SiegeWarfareDataComponent {
  return obj?.['__type'] === 'SiegeWarfareDataComponent'
}

export interface SiegeWarfareDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSiegeWarfareDataComponentClientFacet(obj: any): obj is SiegeWarfareDataComponentClientFacet {
  return obj?.['__type'] === 'SiegeWarfareDataComponentClientFacet'
}

export interface SiegeWarfareDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSiegeWarfareDataComponentServerFacet(obj: any): obj is SiegeWarfareDataComponentServerFacet {
  return obj?.['__type'] === 'SiegeWarfareDataComponentServerFacet'
}

export interface AoiExceptionComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAoiExceptionComponent(obj: any): obj is AoiExceptionComponent {
  return obj?.['__type'] === 'AoiExceptionComponent'
}

export interface AoiExceptionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAoiExceptionComponentClientFacet(obj: any): obj is AoiExceptionComponentClientFacet {
  return obj?.['__type'] === 'AoiExceptionComponentClientFacet'
}

export interface AoiExceptionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAoiExceptionComponentServerFacet(obj: any): obj is AoiExceptionComponentServerFacet {
  return obj?.['__type'] === 'AoiExceptionComponentServerFacet'
}

export interface BuildableGridComponent {
  __type: string
  baseclass1: FacetedComponent
  m_numrows: number
  m_numcolumns: number
  m_height: number
  m_aligntoterrainheightwhensnapped: boolean
  m_ignoreplacementruleswhensnapped: boolean
  m_buildablegridlisteners: []
  m_gridheightsdata: Array<BuildableGridHeightData>
}
export function isBuildableGridComponent(obj: any): obj is BuildableGridComponent {
  return obj?.['__type'] === 'BuildableGridComponent'
}

export interface BuildableGridComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_wasaddedtomanager: boolean
  m_hassnaptotransform: boolean
  m_gridsidesactiveclientview: []
  shouldrender: boolean
}
export function isBuildableGridComponentClientFacet(obj: any): obj is BuildableGridComponentClientFacet {
  return obj?.['__type'] === 'BuildableGridComponentClientFacet'
}

export interface BuildableGridComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isBuildableGridComponentServerFacet(obj: any): obj is BuildableGridComponentServerFacet {
  return obj?.['__type'] === 'BuildableGridComponentServerFacet'
}

export interface BuildableGridHeightData {
  __type: string
  m_frontside: BuildableGridSideData
  m_backside: BuildableGridSideData
  m_rightside: BuildableGridSideData
  m_leftside: BuildableGridSideData
}
export function isBuildableGridHeightData(obj: any): obj is BuildableGridHeightData {
  return obj?.['__type'] === 'BuildableGridHeightData'
}

export interface BuildableGridSideData {
  __type: string
  m_side: number
  m_activegridpoints: Array<BuildableGridPointActiveData>
}
export function isBuildableGridSideData(obj: any): obj is BuildableGridSideData {
  return obj?.['__type'] === 'BuildableGridSideData'
}

export interface BuildableGridPointActiveData {
  __type: string
  m_active: boolean
  m_side: number
  m_column: number
}
export function isBuildableGridPointActiveData(obj: any): obj is BuildableGridPointActiveData {
  return obj?.['__type'] === 'BuildableGridPointActiveData'
}

export interface EncounterRewardsComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isEncounterRewardsComponent(obj: any): obj is EncounterRewardsComponent {
  return obj?.['__type'] === 'EncounterRewardsComponent'
}

export interface EncounterRewardsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isEncounterRewardsComponentClientFacet(obj: any): obj is EncounterRewardsComponentClientFacet {
  return obj?.['__type'] === 'EncounterRewardsComponentClientFacet'
}

export interface EncounterRewardsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_successrewards: Array<EncounterRewardTier>
  m_failurerewards: Array<EncounterRewardTier>
  m_universalsuccessgameeventid: string
}
export function isEncounterRewardsComponentServerFacet(obj: any): obj is EncounterRewardsComponentServerFacet {
  return obj?.['__type'] === 'EncounterRewardsComponentServerFacet'
}

export interface AIObjectiveManagerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAIObjectiveManagerComponent(obj: any): obj is AIObjectiveManagerComponent {
  return obj?.['__type'] === 'AIObjectiveManagerComponent'
}

export interface AIObjectiveManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAIObjectiveManagerComponentClientFacet(obj: any): obj is AIObjectiveManagerComponentClientFacet {
  return obj?.['__type'] === 'AIObjectiveManagerComponentClientFacet'
}

export interface AIObjectiveManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_ownershipentityid: EntityId
  m_registerspawnedagents: boolean
}
export function isAIObjectiveManagerComponentServerFacet(obj: any): obj is AIObjectiveManagerComponentServerFacet {
  return obj?.['__type'] === 'AIObjectiveManagerComponentServerFacet'
}

export interface $$3c9d208a_2e62_51e2_8aa1_5b6bb7473a52 {
  __type: string
  element: KillSpawnsAction | EntityEventAction | DestroySliceAction | TeleportContributorsAction
}
export function is$$3c9d208a_2e62_51e2_8aa1_5b6bb7473a52(obj: any): obj is $$3c9d208a_2e62_51e2_8aa1_5b6bb7473a52 {
  return obj?.['__type'] === '3c9d208a-2e62-51e2-8aa1-5b6bb7473a52'
}

export interface KillSpawnsAction {
  __type: string
  baseclass1: EncounterAction
  m_localonly: boolean
}
export function isKillSpawnsAction(obj: any): obj is KillSpawnsAction {
  return obj?.['__type'] === 'KillSpawnsAction'
}

export interface EncounterAction {
  __type: string
}
export function isEncounterAction(obj: any): obj is EncounterAction {
  return obj?.['__type'] === 'EncounterAction'
}

export interface InvasionLaneProviderComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isInvasionLaneProviderComponent(obj: any): obj is InvasionLaneProviderComponent {
  return obj?.['__type'] === 'InvasionLaneProviderComponent'
}

export interface InvasionLaneProviderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isInvasionLaneProviderComponentClientFacet(obj: any): obj is InvasionLaneProviderComponentClientFacet {
  return obj?.['__type'] === 'InvasionLaneProviderComponentClientFacet'
}

export interface InvasionLaneProviderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  lanes: Array<boolean>
}
export function isInvasionLaneProviderComponentServerFacet(obj: any): obj is InvasionLaneProviderComponentServerFacet {
  return obj?.['__type'] === 'InvasionLaneProviderComponentServerFacet'
}

export interface DoorComponent {
  __type: string
  baseclass1: FacetedComponent
  m_collisionentity: LocalEntityRef
  m_disablecollisionblendpctthreshold: number
}
export function isDoorComponent(obj: any): obj is DoorComponent {
  return obj?.['__type'] === 'DoorComponent'
}

export interface DoorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDoorComponentClientFacet(obj: any): obj is DoorComponentClientFacet {
  return obj?.['__type'] === 'DoorComponentClientFacet'
}

export interface DoorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_doorentities: Array<LocalEntityRef>
  m_onopenevent: EventData
  m_oncloseevent: EventData
  m_teleportdistance: number
}
export function isDoorComponentServerFacet(obj: any): obj is DoorComponentServerFacet {
  return obj?.['__type'] === 'DoorComponentServerFacet'
}

export interface UnifiedInteractOptionComponent {
  __type: string
  baseclass1: AZ__Component
  'name text entity': EntityId
  'icon press button entity': EntityId
  'icon hold button entity': EntityId
  'icon press secondary button entity': EntityId
  'icon hold secondary button entity': EntityId
  'hold progress bar entity': EntityId
  'bg entity': EntityId
  'additional info root entity': EntityId
  'button entity id': EntityId
  'hint text entity id': EntityId
  'hover text entity id': EntityId
}
export function isUnifiedInteractOptionComponent(obj: any): obj is UnifiedInteractOptionComponent {
  return obj?.['__type'] === 'UnifiedInteractOptionComponent'
}

export interface BaseSpectatorCameraComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isBaseSpectatorCameraComponent(obj: any): obj is BaseSpectatorCameraComponent {
  return obj?.['__type'] === 'BaseSpectatorCameraComponent'
}

export interface JavSpectatorCameraComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isJavSpectatorCameraComponent(obj: any): obj is JavSpectatorCameraComponent {
  return obj?.['__type'] === 'JavSpectatorCameraComponent'
}

export interface JavSpectatorCameraComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isJavSpectatorCameraComponentClientFacet(obj: any): obj is JavSpectatorCameraComponentClientFacet {
  return obj?.['__type'] === 'JavSpectatorCameraComponentClientFacet'
}

export interface JavSpectatorCameraComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isJavSpectatorCameraComponentServerFacet(obj: any): obj is JavSpectatorCameraComponentServerFacet {
  return obj?.['__type'] === 'JavSpectatorCameraComponentServerFacet'
}

export interface ProjectileComponent {
  __type: string
  baseclass1: FacetedComponent
  m_accel: Array<number>
  m_stucklifetime: number
  m_flyinglifetime: number
  m_canhitowner: boolean
  m_hitenemytargettypes: boolean
  m_collidewithalltargettypes: boolean
  m_onprojectilecollisionevent: EventData
  m_onprojectiledurationelapsedevent: EventData
  m_onprojectilebounceevent: EventData
  m_bouncematerialfxlib: string
}
export function isProjectileComponent(obj: any): obj is ProjectileComponent {
  return obj?.['__type'] === 'ProjectileComponent'
}

export interface ProjectileComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_livingimpactscript: string
  m_whizbyscript: string
  m_flightanim: string
  m_stuckanim: string
  m_whizbydistance: number
  m_meshentity: LocalEntityRef
  m_hidevfxonstuck: boolean
  m_keepactiveonstuck: boolean
  m_playimpacteffectsondestruction: boolean
  m_overridemeshbasedonweapon: boolean
}
export function isProjectileComponentClientFacet(obj: any): obj is ProjectileComponentClientFacet {
  return obj?.['__type'] === 'ProjectileComponentClientFacet'
}

export interface ProjectileComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_basespeed: number
  m_extraspeed: number
  m_timeformaxspeed: number
  m_enddelayedeventsimmediatlyoncollision: boolean
  m_spawnonhitasset: Asset
  m_castfrequencyoverride: number
}
export function isProjectileComponentServerFacet(obj: any): obj is ProjectileComponentServerFacet {
  return obj?.['__type'] === 'ProjectileComponentServerFacet'
}

export interface QuestApophisData {
  __type: string
  baseclass1: SlayerScriptData
}
export function isQuestApophisData(obj: any): obj is QuestApophisData {
  return obj?.['__type'] === 'QuestApophisData'
}

export interface AreaTemporaryAffiliationComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAreaTemporaryAffiliationComponent(obj: any): obj is AreaTemporaryAffiliationComponent {
  return obj?.['__type'] === 'AreaTemporaryAffiliationComponent'
}

export interface AreaTemporaryAffiliationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAreaTemporaryAffiliationComponentClientFacet(
  obj: any
): obj is AreaTemporaryAffiliationComponentClientFacet {
  return obj?.['__type'] === 'AreaTemporaryAffiliationComponentClientFacet'
}

export interface AreaTemporaryAffiliationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_detectionvolumeref: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__DetectionVolumeComponent__void__
  m_affiliationstoapplybyname: Array<$$59fe499c_650b_50bd_ac05_909d3d56505c>
}
export function isAreaTemporaryAffiliationComponentServerFacet(
  obj: any
): obj is AreaTemporaryAffiliationComponentServerFacet {
  return obj?.['__type'] === 'AreaTemporaryAffiliationComponentServerFacet'
}

export interface $$351fd902_d73d_4ecb_a689_ac95d2619a19 {
  __type: string
  baseclass1: SlayerScriptData
}
export function is$$351fd902_d73d_4ecb_a689_ac95d2619a19(obj: any): obj is $$351fd902_d73d_4ecb_a689_ac95d2619a19 {
  return obj?.['__type'] === '351fd902-d73d-4ecb-a689-ac95d2619a19'
}

export interface EntityEventAction {
  __type: string
  baseclass1: EncounterAction
  m_eventdata: EventData
}
export function isEntityEventAction(obj: any): obj is EntityEventAction {
  return obj?.['__type'] === 'EntityEventAction'
}

export interface EntityActiveStateChangedObjective {
  __type: string
  baseclass1: EncounterObjective
  m_targetentityid: EntityId
  m_completeonactivated: boolean
  m_completeondeactivated: boolean
}
export function isEntityActiveStateChangedObjective(obj: any): obj is EntityActiveStateChangedObjective {
  return obj?.['__type'] === 'EntityActiveStateChangedObjective'
}

export interface EncounterEventObjective {
  __type: string
  baseclass1: EncounterObjective
  m_eventid: string
}
export function isEncounterEventObjective(obj: any): obj is EncounterEventObjective {
  return obj?.['__type'] === 'EncounterEventObjective'
}

export interface WaitForParentObjective {
  __type: string
  baseclass1: EncounterObjective
}
export function isWaitForParentObjective(obj: any): obj is WaitForParentObjective {
  return obj?.['__type'] === 'WaitForParentObjective'
}

export interface TerrainConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isTerrainConstraintComponent(obj: any): obj is TerrainConstraintComponent {
  return obj?.['__type'] === 'TerrainConstraintComponent'
}

export interface TerrainConstraintComponentClientFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentClientFacet
}
export function isTerrainConstraintComponentClientFacet(obj: any): obj is TerrainConstraintComponentClientFacet {
  return obj?.['__type'] === 'TerrainConstraintComponentClientFacet'
}

export interface TerrainConstraintComponentServerFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentServerFacet
  m_radius: number
  m_overrideraycastdistoffset: number
}
export function isTerrainConstraintComponentServerFacet(obj: any): obj is TerrainConstraintComponentServerFacet {
  return obj?.['__type'] === 'TerrainConstraintComponentServerFacet'
}

export interface SpellAlignmentComponent {
  __type: string
  m_eventdata: EventData
  m_evaulateoninit: boolean
  m_evaluateontrigger: boolean
  m_targetalignmenttype: number
}
export function isSpellAlignmentComponent(obj: any): obj is SpellAlignmentComponent {
  return obj?.['__type'] === 'SpellAlignmentComponent'
}

export interface BossPhaseObjective {
  __type: string
  baseclass1: EncounterObjective
  m_trackedslice: Asset
  m_trackedalias: Asset
  m_trackedphase: number
}
export function isBossPhaseObjective(obj: any): obj is BossPhaseObjective {
  return obj?.['__type'] === 'BossPhaseObjective'
}

export interface PathLocationComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isPathLocationComponent(obj: any): obj is PathLocationComponent {
  return obj?.['__type'] === 'PathLocationComponent'
}

export interface PathLocationComponentClientFacet {
  __type: string
  baseclass1: AreaSpawnerLocationComponentClientFacet
}
export function isPathLocationComponentClientFacet(obj: any): obj is PathLocationComponentClientFacet {
  return obj?.['__type'] === 'PathLocationComponentClientFacet'
}

export interface PathLocationComponentServerFacet {
  __type: string
  baseclass1: AreaSpawnerLocationComponentServerFacet
  m_deviation: number
}
export function isPathLocationComponentServerFacet(obj: any): obj is PathLocationComponentServerFacet {
  return obj?.['__type'] === 'PathLocationComponentServerFacet'
}

export interface $$36675533_c431_4ead_9883_846e3696bf99 {
  __type: string
  baseclass1: SlayerScriptData
  events: $$77b3bc35_e577_5281_aebe_11c0e1b622bf
}
export function is$$36675533_c431_4ead_9883_846e3696bf99(obj: any): obj is $$36675533_c431_4ead_9883_846e3696bf99 {
  return obj?.['__type'] === '36675533-c431-4ead-9883-846e3696bf99'
}

export interface $$77b3bc35_e577_5281_aebe_11c0e1b622bf {
  __type: string
  element: $$6097aea8_e541_41f4_ba5d_e34806b658e4
}
export function is$$77b3bc35_e577_5281_aebe_11c0e1b622bf(obj: any): obj is $$77b3bc35_e577_5281_aebe_11c0e1b622bf {
  return obj?.['__type'] === '77b3bc35-e577-5281-aebe-11c0e1b622bf'
}

export interface $$6097aea8_e541_41f4_ba5d_e34806b658e4 {
  __type: string
  debugname: string
  debugindex: number
  '0x6a722ada': string
  eventdelayduration: number
  entityevents: $$2a3d1e1e_a69f_5860_8934_00c3bfe920cc
  opacityevents: bd28477a_6d73_5d2e_b509_5fd32a06f475
  rotationevents: $$12e435dd_b28e_5082_8e17_67f1bbc894b1
}
export function is$$6097aea8_e541_41f4_ba5d_e34806b658e4(obj: any): obj is $$6097aea8_e541_41f4_ba5d_e34806b658e4 {
  return obj?.['__type'] === '6097aea8-e541-41f4-ba5d-e34806b658e4'
}

export interface DungeonBrimstoneSands00Data {
  __type: string
  baseclass1: SlayerScriptData
  detectionvolumetriggereddoors: Array<string>
}
export function isDungeonBrimstoneSands00Data(obj: any): obj is DungeonBrimstoneSands00Data {
  return obj?.['__type'] === 'DungeonBrimstoneSands00Data'
}

export interface f4c45b9f_1cdd_469b_bfa1_99877dc1b63f {
  __type: string
  baseclass1: SlayerScriptData
  lightningtrappattern1: Array<string>
  lightningtrappattern2: Array<string>
  lightningtrappattern3: Array<string>
  lightningtrappattern4: Array<string>
  lightningstrikeasset: Asset
}
export function isf4c45b9f_1cdd_469b_bfa1_99877dc1b63f(obj: any): obj is f4c45b9f_1cdd_469b_bfa1_99877dc1b63f {
  return obj?.['__type'] === 'f4c45b9f-1cdd-469b-bfa1-99877dc1b63f'
}

export interface DungeonGreatCleave01 {
  __type: string
  baseclass1: SlayerScriptData
}
export function isDungeonGreatCleave01(obj: any): obj is DungeonGreatCleave01 {
  return obj?.['__type'] === 'DungeonGreatCleave01'
}

export interface DungeonDialPuzzleData {
  __type: string
  baseclass1: SlayerScriptData
}
export function isDungeonDialPuzzleData(obj: any): obj is DungeonDialPuzzleData {
  return obj?.['__type'] === 'DungeonDialPuzzleData'
}

export interface e0e11d8b_d02f_4a83_a182_129396a703d2 {
  __type: string
  baseclass1: SlayerScriptData
}
export function ise0e11d8b_d02f_4a83_a182_129396a703d2(obj: any): obj is e0e11d8b_d02f_4a83_a182_129396a703d2 {
  return obj?.['__type'] === 'e0e11d8b-d02f-4a83-a182-129396a703d2'
}

export interface DungeonReekwater00Data {
  __type: string
  baseclass1: SlayerScriptData
  glyphassets: Array<Asset>
  solutionset1: Array<string>
  solutionset2: Array<string>
  pressureplates: Array<string>
  glyphlights: Array<string>
}
export function isDungeonReekwater00Data(obj: any): obj is DungeonReekwater00Data {
  return obj?.['__type'] === 'DungeonReekwater00Data'
}

export interface a055cb3f_f5b9_4b3b_b56d_3636985699d9 {
  __type: string
  baseclass1: SlayerScriptData
}
export function isa055cb3f_f5b9_4b3b_b56d_3636985699d9(obj: any): obj is a055cb3f_f5b9_4b3b_b56d_3636985699d9 {
  return obj?.['__type'] === 'a055cb3f-f5b9-4b3b-b56d-3636985699d9'
}

export interface DungeonShatteredObeliskData {
  __type: string
  baseclass1: SlayerScriptData
}
export function isDungeonShatteredObeliskData(obj: any): obj is DungeonShatteredObeliskData {
  return obj?.['__type'] === 'DungeonShatteredObeliskData'
}

export interface OnEncounterComplete {
  __type: string
  baseclass1: SlayerScriptData
  statueassets: Array<Asset>
  statue01locations: Array<string>
  statue02locations: Array<string>
  statue03locations: Array<string>
  statue04locations: Array<string>
}
export function isOnEncounterComplete(obj: any): obj is OnEncounterComplete {
  return obj?.['__type'] === 'OnEncounterComplete'
}

export interface $$476afd4f_dad4_45f0_b3a5_94414c09108b {
  __type: string
  baseclass1: SlayerScriptData
}
export function is$$476afd4f_dad4_45f0_b3a5_94414c09108b(obj: any): obj is $$476afd4f_dad4_45f0_b3a5_94414c09108b {
  return obj?.['__type'] === '476afd4f-dad4-45f0-b3a5-94414c09108b'
}

export interface VoidDestroyerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_lightweightcharacterentityid: EntityId
  m_lefteyeprefabspawnerentityid: EntityId
  m_lefteyeattachmentname: string
  m_righteyeprefabspawnerentityid: EntityId
  m_righteyeattachmentname: string
}
export function isVoidDestroyerComponent(obj: any): obj is VoidDestroyerComponent {
  return obj?.['__type'] === 'VoidDestroyerComponent'
}

export interface VoidDestroyerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isVoidDestroyerComponentClientFacet(obj: any): obj is VoidDestroyerComponentClientFacet {
  return obj?.['__type'] === 'VoidDestroyerComponentClientFacet'
}

export interface VoidDestroyerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_lefteyedestroyevents: Array<EventData>
  m_righteyedestroyevents: Array<EventData>
}
export function isVoidDestroyerComponentServerFacet(obj: any): obj is VoidDestroyerComponentServerFacet {
  return obj?.['__type'] === 'VoidDestroyerComponentServerFacet'
}

export interface EncounterRewardTier {
  __type: string
  m_requiredcontribution: number
  m_rewardeventidstrs: Array<string>
}
export function isEncounterRewardTier(obj: any): obj is EncounterRewardTier {
  return obj?.['__type'] === 'EncounterRewardTier'
}

export interface DestroySliceAction {
  __type: string
  baseclass1: EncounterAction
  m_sliceasset: Asset
  m_aliasasset: Asset
  m_localonly: boolean
}
export function isDestroySliceAction(obj: any): obj is DestroySliceAction {
  return obj?.['__type'] === 'DestroySliceAction'
}

export interface ClearEncounterZonesComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isClearEncounterZonesComponent(obj: any): obj is ClearEncounterZonesComponent {
  return obj?.['__type'] === 'ClearEncounterZonesComponent'
}

export interface ClearEncounterZonesComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isClearEncounterZonesComponentClientFacet(obj: any): obj is ClearEncounterZonesComponentClientFacet {
  return obj?.['__type'] === 'ClearEncounterZonesComponentClientFacet'
}

export interface ClearEncounterZonesComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  locations: Array<LocalEntityRef>
}
export function isClearEncounterZonesComponentServerFacet(obj: any): obj is ClearEncounterZonesComponentServerFacet {
  return obj?.['__type'] === 'ClearEncounterZonesComponentServerFacet'
}

export interface FortMajorStructureComponent {
  __type: string
  baseclass1: FacetedComponent
  m_buildableentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
}
export function isFortMajorStructureComponent(obj: any): obj is FortMajorStructureComponent {
  return obj?.['__type'] === 'FortMajorStructureComponent'
}

export interface FortMajorStructureComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFortMajorStructureComponentClientFacet(obj: any): obj is FortMajorStructureComponentClientFacet {
  return obj?.['__type'] === 'FortMajorStructureComponentClientFacet'
}

export interface FortMajorStructureComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFortMajorStructureComponentServerFacet(obj: any): obj is FortMajorStructureComponentServerFacet {
  return obj?.['__type'] === 'FortMajorStructureComponentServerFacet'
}

export interface AIManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAIManagerComponentClientFacet(obj: any): obj is AIManagerComponentClientFacet {
  return obj?.['__type'] === 'AIManagerComponentClientFacet'
}

export interface AIManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_updatefrequencymillis: number
  m_targetselectorentity: EntityId
}
export function isAIManagerComponentServerFacet(obj: any): obj is AIManagerComponentServerFacet {
  return obj?.['__type'] === 'AIManagerComponentServerFacet'
}

export interface AutoRepairComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isAutoRepairComponent(obj: any): obj is AutoRepairComponent {
  return obj?.['__type'] === 'AutoRepairComponent'
}

export interface AutoRepairComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAutoRepairComponentClientFacet(obj: any): obj is AutoRepairComponentClientFacet {
  return obj?.['__type'] === 'AutoRepairComponentClientFacet'
}

export interface AutoRepairComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_buildableentity: LocalEntityRef
  m_repairratesec: number
  m_numitemsperrepair: number
}
export function isAutoRepairComponentServerFacet(obj: any): obj is AutoRepairComponentServerFacet {
  return obj?.['__type'] === 'AutoRepairComponentServerFacet'
}

export interface cebc1b0c_b1a5_4ad3_8ec5_2909b9750abc {
  __type: string
  baseclass1: SlayerScriptData
}
export function iscebc1b0c_b1a5_4ad3_8ec5_2909b9750abc(obj: any): obj is cebc1b0c_b1a5_4ad3_8ec5_2909b9750abc {
  return obj?.['__type'] === 'cebc1b0c-b1a5-4ad3-8ec5-2909b9750abc'
}

export interface RigidBodyComponent {
  __type: string
  baseclass1: AZ__Component
  'physical parameters': RigidBodyConfiguration
}
export function isRigidBodyComponent(obj: any): obj is RigidBodyComponent {
  return obj?.['__type'] === 'RigidBodyComponent'
}

export interface RigidBodyConfiguration {
  __type: string
  'shape type': number
  'shape entity': EntityId
  'rnr asset': Asset
  material: string
  'physics behavior': number
  mass: number
  'initially active': boolean
  'initial linear velocity': Array<number>
  'initial angular velocity': Array<number>
  restitution: number
  friction: number
  'linear damping': number
  'angular damping': number
  'sleeping conditions': number
  'sleep linear velocity': number
  'sleep angular velocity': number
  'sleep energy': number
  'sleep duration': number
  'continuous physics': number
  'continuous distance factor': number
  'continuous sphere radius': number
  'auto inertia tensor': boolean
}
export function isRigidBodyConfiguration(obj: any): obj is RigidBodyConfiguration {
  return obj?.['__type'] === 'RigidBodyConfiguration'
}

export interface DetectionVolumeEventData {
  __type: string
  m_entityref: LocalEntityRef
  m_applyrecursively: boolean
}
export function isDetectionVolumeEventData(obj: any): obj is DetectionVolumeEventData {
  return obj?.['__type'] === 'DetectionVolumeEventData'
}

export interface OwnershipMessageEvent {
  __type: string
  m_message: string
  m_eventdata: EventData
  m_sendtoclients: boolean
}
export function isOwnershipMessageEvent(obj: any): obj is OwnershipMessageEvent {
  return obj?.['__type'] === 'OwnershipMessageEvent'
}

export interface AbilityInstanceComponent {
  __type: string
  baseclass1: FacetedComponent
  m_type: number
}
export function isAbilityInstanceComponent(obj: any): obj is AbilityInstanceComponent {
  return obj?.['__type'] === 'AbilityInstanceComponent'
}

export interface AbilityInstanceComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAbilityInstanceComponentClientFacet(obj: any): obj is AbilityInstanceComponentClientFacet {
  return obj?.['__type'] === 'AbilityInstanceComponentClientFacet'
}

export interface AbilityInstanceComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isAbilityInstanceComponentServerFacet(obj: any): obj is AbilityInstanceComponentServerFacet {
  return obj?.['__type'] === 'AbilityInstanceComponentServerFacet'
}

export interface AutoSpellComponent {
  __type: string
  baseclass1: FacetedComponent
  m_ownershipmessagecomponententityid: EntityId
  m_castevent: EventData
  m_lifetimeexpireevent: EventData
  m_defaultrateoffire: AutoSpellRateOfFire
  m_rateoffireconfigs: Array<AutoSpellRateOfFire>
}
export function isAutoSpellComponent(obj: any): obj is AutoSpellComponent {
  return obj?.['__type'] === 'AutoSpellComponent'
}

export interface AutoSpellComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isAutoSpellComponentClientFacet(obj: any): obj is AutoSpellComponentClientFacet {
  return obj?.['__type'] === 'AutoSpellComponentClientFacet'
}

export interface AutoSpellComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_spellentries: Array<AutoSpellEntry>
  m_skinnedmeshentityid: EntityId
  m_detectionvolumeevententityid: EntityId
  m_lifetime: number
  m_lifetimeonhit: number
  m_castatalltargets: boolean
}
export function isAutoSpellComponentServerFacet(obj: any): obj is AutoSpellComponentServerFacet {
  return obj?.['__type'] === 'AutoSpellComponentServerFacet'
}

export interface AutoSpellEntry {
  __type: string
  m_spellname: string
  m_projectilelaunchangles: Array<number>
}
export function isAutoSpellEntry(obj: any): obj is AutoSpellEntry {
  return obj?.['__type'] === 'AutoSpellEntry'
}

export interface AutoSpellRateOfFire {
  __type: string
  m_ownershipmessagetrigger: string
  m_initialcastdelay: number
  m_cooldown: number
  m_duration: number
  m_triggerevent: EventData
}
export function isAutoSpellRateOfFire(obj: any): obj is AutoSpellRateOfFire {
  return obj?.['__type'] === 'AutoSpellRateOfFire'
}

export interface DetonateTriggerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDetonateTriggerComponent(obj: any): obj is DetonateTriggerComponent {
  return obj?.['__type'] === 'DetonateTriggerComponent'
}

export interface DetonateTriggerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDetonateTriggerComponentClientFacet(obj: any): obj is DetonateTriggerComponentClientFacet {
  return obj?.['__type'] === 'DetonateTriggerComponentClientFacet'
}

export interface DetonateTriggerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isDetonateTriggerComponentServerFacet(obj: any): obj is DetonateTriggerComponentServerFacet {
  return obj?.['__type'] === 'DetonateTriggerComponentServerFacet'
}

export interface SettlementComponent {
  __type: string
  baseclass1: FacetedComponent
  m_isoutpost: boolean
}
export function isSettlementComponent(obj: any): obj is SettlementComponent {
  return obj?.['__type'] === 'SettlementComponent'
}

export interface SettlementComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSettlementComponentClientFacet(obj: any): obj is SettlementComponentClientFacet {
  return obj?.['__type'] === 'SettlementComponentClientFacet'
}

export interface SettlementComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_progressionspawners: Array<SettlementProgressionSpawnerEntry>
}
export function isSettlementComponentServerFacet(obj: any): obj is SettlementComponentServerFacet {
  return obj?.['__type'] === 'SettlementComponentServerFacet'
}

export interface TradingPostComponent {
  __type: string
  baseclass1: FacetedComponent
  m_buydata: []
  m_selldata: []
  m_sellquantities: []
}
export function isTradingPostComponent(obj: any): obj is TradingPostComponent {
  return obj?.['__type'] === 'TradingPostComponent'
}

export interface TradingPostComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_buildableentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
}
export function isTradingPostComponentClientFacet(obj: any): obj is TradingPostComponentClientFacet {
  return obj?.['__type'] === 'TradingPostComponentClientFacet'
}

export interface TradingPostComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_detectionentity: LocalEntityRef
}
export function isTradingPostComponentServerFacet(obj: any): obj is TradingPostComponentServerFacet {
  return obj?.['__type'] === 'TradingPostComponentServerFacet'
}

export interface ItemGenerationComponent {
  __type: string
  baseclass1: FacetedComponent
  m_structuretype: string
  m_containeroutput: LocalEntityRef
  m_recipes: SpringboardDataSheetContainer
}
export function isItemGenerationComponent(obj: any): obj is ItemGenerationComponent {
  return obj?.['__type'] === 'ItemGenerationComponent'
}

export interface ItemGenerationComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_buildableentity: LocalEntityRef
  m_vitalsentity: LocalEntityRef
  m_ownershipentity: LocalEntityRef
}
export function isItemGenerationComponentClientFacet(obj: any): obj is ItemGenerationComponentClientFacet {
  return obj?.['__type'] === 'ItemGenerationComponentClientFacet'
}

export interface ItemGenerationComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isItemGenerationComponentServerFacet(obj: any): obj is ItemGenerationComponentServerFacet {
  return obj?.['__type'] === 'ItemGenerationComponentServerFacet'
}

export interface DestroyOnSiegeWarfareComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isDestroyOnSiegeWarfareComponent(obj: any): obj is DestroyOnSiegeWarfareComponent {
  return obj?.['__type'] === 'DestroyOnSiegeWarfareComponent'
}

export interface DestroyOnSiegeWarfareComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isDestroyOnSiegeWarfareComponentClientFacet(
  obj: any
): obj is DestroyOnSiegeWarfareComponentClientFacet {
  return obj?.['__type'] === 'DestroyOnSiegeWarfareComponentClientFacet'
}

export interface DestroyOnSiegeWarfareComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_destructioncondition: number
}
export function isDestroyOnSiegeWarfareComponentServerFacet(
  obj: any
): obj is DestroyOnSiegeWarfareComponentServerFacet {
  return obj?.['__type'] === 'DestroyOnSiegeWarfareComponentServerFacet'
}

export interface OutpostRushState {
  __type: string
  baseclass1: SlayerScriptData
  ghostbossslice: Asset
  summonedbearslice: Asset
  summonedbruteslice: Asset
  summonedwraithslice: Asset
}
export function isOutpostRushState(obj: any): obj is OutpostRushState {
  return obj?.['__type'] === 'OutpostRushState'
}

export interface OutpostRushSummoningInteractionComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isOutpostRushSummoningInteractionComponent(obj: any): obj is OutpostRushSummoningInteractionComponent {
  return obj?.['__type'] === 'OutpostRushSummoningInteractionComponent'
}

export interface OutpostRushSummoningInteractionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_spawnerentity: LocalEntityRef
  m_onspawnactiveevents: Array<EventData>
}
export function isOutpostRushSummoningInteractionComponentClientFacet(
  obj: any
): obj is OutpostRushSummoningInteractionComponentClientFacet {
  return obj?.['__type'] === 'OutpostRushSummoningInteractionComponentClientFacet'
}

export interface OutpostRushSummoningInteractionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isOutpostRushSummoningInteractionComponentServerFacet(
  obj: any
): obj is OutpostRushSummoningInteractionComponentServerFacet {
  return obj?.['__type'] === 'OutpostRushSummoningInteractionComponentServerFacet'
}

export interface InteractWithItemCostType_AddSummoningStone {
  __type: string
  baseclass1: InteractWithItemCostType
  m_spawnerentity: LocalEntityRef
}
export function isInteractWithItemCostType_AddSummoningStone(
  obj: any
): obj is InteractWithItemCostType_AddSummoningStone {
  return obj?.['__type'] === 'InteractWithItemCostType_AddSummoningStone'
}

export interface PrefabReferencerComponent {
  __type: string
  baseclass1: AZ__Component
  'slice asset list': Array<Asset>
}
export function isPrefabReferencerComponent(obj: any): obj is PrefabReferencerComponent {
  return obj?.['__type'] === 'PrefabReferencerComponent'
}

export interface HousingItemComponent {
  __type: string
  baseclass1: AZ__Component
  collisionmeshentityids: Array<EntityId>
  meshandoutlineentityids: Array<$$30dde93c_e899_5ab9_856d_fc456d054edb>
}
export function isHousingItemComponent(obj: any): obj is HousingItemComponent {
  return obj?.['__type'] === 'HousingItemComponent'
}

export interface FactionControlOwnerComponent {
  __type: string
  baseclass1: FacetedComponent
  m_triggerentity: LocalEntityRef
  m_crowdcontrolentity: LocalEntityRef
}
export function isFactionControlOwnerComponent(obj: any): obj is FactionControlOwnerComponent {
  return obj?.['__type'] === 'FactionControlOwnerComponent'
}

export interface FactionControlOwnerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFactionControlOwnerComponentClientFacet(obj: any): obj is FactionControlOwnerComponentClientFacet {
  return obj?.['__type'] === 'FactionControlOwnerComponentClientFacet'
}

export interface FactionControlOwnerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFactionControlOwnerComponentServerFacet(obj: any): obj is FactionControlOwnerComponentServerFacet {
  return obj?.['__type'] === 'FactionControlOwnerComponentServerFacet'
}

export interface d8b4529d_eddb_525c_ba46_09a63951e5fd {
  __type: string
  value1: number
  value2: string
}
export function isd8b4529d_eddb_525c_ba46_09a63951e5fd(obj: any): obj is d8b4529d_eddb_525c_ba46_09a63951e5fd {
  return obj?.['__type'] === 'd8b4529d-eddb-525c-ba46-09a63951e5fd'
}

export interface SiegeWarfareVulnerableComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSiegeWarfareVulnerableComponent(obj: any): obj is SiegeWarfareVulnerableComponent {
  return obj?.['__type'] === 'SiegeWarfareVulnerableComponent'
}

export interface SiegeWarfareVulnerableComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSiegeWarfareVulnerableComponentClientFacet(
  obj: any
): obj is SiegeWarfareVulnerableComponentClientFacet {
  return obj?.['__type'] === 'SiegeWarfareVulnerableComponentClientFacet'
}

export interface SiegeWarfareVulnerableComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_vulnerabletypes: Array<number>
  m_buildableentity: LocalEntityRef
  m_capturepointstoclaim: Array<number>
}
export function isSiegeWarfareVulnerableComponentServerFacet(
  obj: any
): obj is SiegeWarfareVulnerableComponentServerFacet {
  return obj?.['__type'] === 'SiegeWarfareVulnerableComponentServerFacet'
}

export interface FactionControlInteractComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isFactionControlInteractComponent(obj: any): obj is FactionControlInteractComponent {
  return obj?.['__type'] === 'FactionControlInteractComponent'
}

export interface FactionControlInteractComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFactionControlInteractComponentClientFacet(
  obj: any
): obj is FactionControlInteractComponentClientFacet {
  return obj?.['__type'] === 'FactionControlInteractComponentClientFacet'
}

export interface FactionControlInteractComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_fortexit: boolean
}
export function isFactionControlInteractComponentServerFacet(
  obj: any
): obj is FactionControlInteractComponentServerFacet {
  return obj?.['__type'] === 'FactionControlInteractComponentServerFacet'
}

export interface SpawnerMetricsComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSpawnerMetricsComponent(obj: any): obj is SpawnerMetricsComponent {
  return obj?.['__type'] === 'SpawnerMetricsComponent'
}

export interface SpawnerMetricsComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSpawnerMetricsComponentClientFacet(obj: any): obj is SpawnerMetricsComponentClientFacet {
  return obj?.['__type'] === 'SpawnerMetricsComponentClientFacet'
}

export interface SpawnerMetricsComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSpawnerMetricsComponentServerFacet(obj: any): obj is SpawnerMetricsComponentServerFacet {
  return obj?.['__type'] === 'SpawnerMetricsComponentServerFacet'
}

export interface InvasionComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isInvasionComponent(obj: any): obj is InvasionComponent {
  return obj?.['__type'] === 'InvasionComponent'
}

export interface InvasionComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isInvasionComponentClientFacet(obj: any): obj is InvasionComponentClientFacet {
  return obj?.['__type'] === 'InvasionComponentClientFacet'
}

export interface InvasionComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isInvasionComponentServerFacet(obj: any): obj is InvasionComponentServerFacet {
  return obj?.['__type'] === 'InvasionComponentServerFacet'
}

export interface SiegeWarfareComponent {
  __type: string
  baseclass1: FacetedComponent
  m_fortspawns: Array<FortSpawn>
}
export function isSiegeWarfareComponent(obj: any): obj is SiegeWarfareComponent {
  return obj?.['__type'] === 'SiegeWarfareComponent'
}

export interface SiegeWarfareComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSiegeWarfareComponentClientFacet(obj: any): obj is SiegeWarfareComponentClientFacet {
  return obj?.['__type'] === 'SiegeWarfareComponentClientFacet'
}

export interface SiegeWarfareComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_initialstatuseffects: Array<EffectData>
  m_capturepointstatuseffects: []
  m_territorydetectorentity: LocalEntityRef
  m_siegewarfaredatasliceasset: Asset
  m_prewarbarrierspawnerentity: LocalEntityRef
  m_groupteleportminrange: number
  m_groupteleportmaxrange: number
}
export function isSiegeWarfareComponentServerFacet(obj: any): obj is SiegeWarfareComponentServerFacet {
  return obj?.['__type'] === 'SiegeWarfareComponentServerFacet'
}

export interface FortSpawn {
  __type: string
  m_settlementprogressioncategory: number
  m_settlementprogressionrequiredlevel: number
  m_settlementprogressionlevelsliceoverrides: Array<Asset>
  m_prefabspawner: LocalEntityRef
  m_raididassignmenttype: number
  m_activecondition: number
  m_persistencekey: string
}
export function isFortSpawn(obj: any): obj is FortSpawn {
  return obj?.['__type'] === 'FortSpawn'
}

export interface OwnershipParameterProviderComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isOwnershipParameterProviderComponent(obj: any): obj is OwnershipParameterProviderComponent {
  return obj?.['__type'] === 'OwnershipParameterProviderComponent'
}

export interface OwnershipParameterProviderComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isOwnershipParameterProviderComponentClientFacet(
  obj: any
): obj is OwnershipParameterProviderComponentClientFacet {
  return obj?.['__type'] === 'OwnershipParameterProviderComponentClientFacet'
}

export interface OwnershipParameterProviderComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isOwnershipParameterProviderComponentServerFacet(
  obj: any
): obj is OwnershipParameterProviderComponentServerFacet {
  return obj?.['__type'] === 'OwnershipParameterProviderComponentServerFacet'
}

export interface $$6111a352_6737_5b38_a7cb_e6f30854b36a {
  __type: string
  __value: string
}
export function is$$6111a352_6737_5b38_a7cb_e6f30854b36a(obj: any): obj is $$6111a352_6737_5b38_a7cb_e6f30854b36a {
  return obj?.['__type'] === '6111a352-6737-5b38-a7cb-e6f30854b36a'
}

export interface RadialMeshComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isRadialMeshComponent(obj: any): obj is RadialMeshComponent {
  return obj?.['__type'] === 'RadialMeshComponent'
}

export interface RadialMeshComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_meshasset: Asset
  m_startangle: number
  m_radius: number
  m_nummeshes: number
}
export function isRadialMeshComponentClientFacet(obj: any): obj is RadialMeshComponentClientFacet {
  return obj?.['__type'] === 'RadialMeshComponentClientFacet'
}

export interface RadialMeshComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isRadialMeshComponentServerFacet(obj: any): obj is RadialMeshComponentServerFacet {
  return obj?.['__type'] === 'RadialMeshComponentServerFacet'
}

export interface ImpactComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isImpactComponent(obj: any): obj is ImpactComponent {
  return obj?.['__type'] === 'ImpactComponent'
}

export interface SnowComponent {
  __type: string
  baseclass1: AZ__Component
  enabled: boolean
  'snow options': SnowOptions
}
export function isSnowComponent(obj: any): obj is SnowComponent {
  return obj?.['__type'] === 'SnowComponent'
}

export interface SnowOptions {
  __type: string
  radius: number
  snowamount: number
  frostamount: number
  surfacefreezing: number
  snowbrightness: number
  frostbrightness: number
  snowflakecount: number
  snowflakesize: number
  snowfallbrightness: number
  snowfallgravityscale: number
  snowfallwindscale: number
  snowfallturbulence: number
  snowfallturbulencefreq: number
}
export function isSnowOptions(obj: any): obj is SnowOptions {
  return obj?.['__type'] === 'SnowOptions'
}

export interface SliceSpawnedObjective {
  __type: string
  baseclass1: EncounterObjective
  m_trackedslice: Asset
  m_trackedalias: Asset
  m_requiredcount: number
}
export function isSliceSpawnedObjective(obj: any): obj is SliceSpawnedObjective {
  return obj?.['__type'] === 'SliceSpawnedObjective'
}

export interface OpacityAchievementEvent {
  __type: string
  startingopacity: number
  targetopacity: number
  opacitytransitionduration: number
  applyonchildren: boolean
  entitynames: $$0b66e343_c513_5eb3_b152_770c4628bb73
}
export function isOpacityAchievementEvent(obj: any): obj is OpacityAchievementEvent {
  return obj?.['__type'] === 'OpacityAchievementEvent'
}

export interface ArenaComponent {
  __type: string
  baseclass1: FacetedComponent
  m_activationboundsshapeentityid: EntityId
}
export function isArenaComponent(obj: any): obj is ArenaComponent {
  return obj?.['__type'] === 'ArenaComponent'
}

export interface ArenaComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_interactentityid: EntityId
  m_arenamonstername: string
}
export function isArenaComponentClientFacet(obj: any): obj is ArenaComponentClientFacet {
  return obj?.['__type'] === 'ArenaComponentClientFacet'
}

export interface ArenaComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
  m_useiteminteractavailableentity: LocalEntityRef
  m_contributiontrackerid: EntityId
  m_participanttrackerid: EntityId
  m_boundsdetectionvolumeentityid: EntityId
  m_exitteleportentityid: EntityId
}
export function isArenaComponentServerFacet(obj: any): obj is ArenaComponentServerFacet {
  return obj?.['__type'] === 'ArenaComponentServerFacet'
}

export interface TeleportContributorsAction {
  __type: string
  baseclass1: EncounterAction
  m_teleportentityid: EntityId
  m_contributiontrackerid: EntityId
  m_fadetoblack: boolean
}
export function isTeleportContributorsAction(obj: any): obj is TeleportContributorsAction {
  return obj?.['__type'] === 'TeleportContributorsAction'
}

export interface AllContributorsDownedObjective {
  __type: string
  baseclass1: EncounterObjective
  m_contributiontrackerid: EntityId
}
export function isAllContributorsDownedObjective(obj: any): obj is AllContributorsDownedObjective {
  return obj?.['__type'] === 'AllContributorsDownedObjective'
}

export interface GlobalMapDataComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isGlobalMapDataComponent(obj: any): obj is GlobalMapDataComponent {
  return obj?.['__type'] === 'GlobalMapDataComponent'
}

export interface GlobalMapDataComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isGlobalMapDataComponentClientFacet(obj: any): obj is GlobalMapDataComponentClientFacet {
  return obj?.['__type'] === 'GlobalMapDataComponentClientFacet'
}

export interface GlobalMapDataComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isGlobalMapDataComponentServerFacet(obj: any): obj is GlobalMapDataComponentServerFacet {
  return obj?.['__type'] === 'GlobalMapDataComponentServerFacet'
}

export interface NavigationLink {
  __type: string
  m_startposition: Array<number>
  m_startrotation: Array<number>
  m_endposition: Array<number>
  m_endrotation: Array<number>
  m_invertendrotation: boolean
  m_forwardnavarea: number
  m_forwardmannequintag: string
  m_backwardnavarea: number
  m_backwardmannequintag: string
}
export function isNavigationLink(obj: any): obj is NavigationLink {
  return obj?.['__type'] === 'NavigationLink'
}

export interface FtuePlayerHealthMonitorComponent {
  __type: string
  baseclass1: FacetedComponent
  m_events: Array<EventData>
  m_percentage: number
}
export function isFtuePlayerHealthMonitorComponent(obj: any): obj is FtuePlayerHealthMonitorComponent {
  return obj?.['__type'] === 'FtuePlayerHealthMonitorComponent'
}

export interface FtuePlayerHealthMonitorComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isFtuePlayerHealthMonitorComponentClientFacet(
  obj: any
): obj is FtuePlayerHealthMonitorComponentClientFacet {
  return obj?.['__type'] === 'FtuePlayerHealthMonitorComponentClientFacet'
}

export interface FtuePlayerHealthMonitorComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isFtuePlayerHealthMonitorComponentServerFacet(
  obj: any
): obj is FtuePlayerHealthMonitorComponentServerFacet {
  return obj?.['__type'] === 'FtuePlayerHealthMonitorComponentServerFacet'
}

export interface $$30dde93c_e899_5ab9_856d_fc456d054edb {
  __type: string
  value1: EntityId
  value2: EntityId
}
export function is$$30dde93c_e899_5ab9_856d_fc456d054edb(obj: any): obj is $$30dde93c_e899_5ab9_856d_fc456d054edb {
  return obj?.['__type'] === '30dde93c-e899-5ab9-856d-fc456d054edb'
}

export interface HousingPlotComponent {
  __type: string
  baseclass1: FacetedComponent
  m_enterentityid: EntityId
  m_exitentityid: EntityId
  m_boundsshapeentityids: Array<EntityId>
  m_housetypestring: string
}
export function isHousingPlotComponent(obj: any): obj is HousingPlotComponent {
  return obj?.['__type'] === 'HousingPlotComponent'
}

export interface HousingPlotComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
  m_markercomponent: LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__MarkerComponent__void__
}
export function isHousingPlotComponentClientFacet(obj: any): obj is HousingPlotComponentClientFacet {
  return obj?.['__type'] === 'HousingPlotComponentClientFacet'
}

export interface LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__MarkerComponent__void__ {
  __type: string
  baseclass1: LocalComponentRefBase
}
export function isLocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__MarkerComponent__void__(
  obj: any
): obj is LocalComponentRef_InterfaceType__const_char____cdecl_MB__GetTypeName_class_Javelin__MarkerComponent__void__ {
  return (
    obj?.['__type'] ===
    'LocalComponentRef<InterfaceType><const char *__cdecl MB::GetTypeName<class Javelin::MarkerComponent>(void)>'
  )
}

export interface HousingPlotComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isHousingPlotComponentServerFacet(obj: any): obj is HousingPlotComponentServerFacet {
  return obj?.['__type'] === 'HousingPlotComponentServerFacet'
}

export interface SpawnerLifetimeManagerComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSpawnerLifetimeManagerComponent(obj: any): obj is SpawnerLifetimeManagerComponent {
  return obj?.['__type'] === 'SpawnerLifetimeManagerComponent'
}

export interface SpawnerLifetimeManagerComponentClientFacet {
  __type: string
  baseclass1: ClientFacet
}
export function isSpawnerLifetimeManagerComponentClientFacet(
  obj: any
): obj is SpawnerLifetimeManagerComponentClientFacet {
  return obj?.['__type'] === 'SpawnerLifetimeManagerComponentClientFacet'
}

export interface SpawnerLifetimeManagerComponentServerFacet {
  __type: string
  baseclass1: ServerFacet
}
export function isSpawnerLifetimeManagerComponentServerFacet(
  obj: any
): obj is SpawnerLifetimeManagerComponentServerFacet {
  return obj?.['__type'] === 'SpawnerLifetimeManagerComponentServerFacet'
}

export interface SpawnCapConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isSpawnCapConstraintComponent(obj: any): obj is SpawnCapConstraintComponent {
  return obj?.['__type'] === 'SpawnCapConstraintComponent'
}

export interface SpawnCapConstraintComponentClientFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentClientFacet
}
export function isSpawnCapConstraintComponentClientFacet(obj: any): obj is SpawnCapConstraintComponentClientFacet {
  return obj?.['__type'] === 'SpawnCapConstraintComponentClientFacet'
}

export interface SpawnCapConstraintComponentServerFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentServerFacet
}
export function isSpawnCapConstraintComponentServerFacet(obj: any): obj is SpawnCapConstraintComponentServerFacet {
  return obj?.['__type'] === 'SpawnCapConstraintComponentServerFacet'
}

export interface SettlementProgressionSpawnerEntry {
  __type: string
  m_categoryoption: string
  m_prefabspawner: LocalEntityRef
  m_usealternateslice: boolean
  m_category: number
}
export function isSettlementProgressionSpawnerEntry(obj: any): obj is SettlementProgressionSpawnerEntry {
  return obj?.['__type'] === 'SettlementProgressionSpawnerEntry'
}

export interface e0c0b127_8a14_4830_b6a4_c3b4cada2fe9 {
  __type: string
  baseclass1: FacetedComponent
}
export function ise0c0b127_8a14_4830_b6a4_c3b4cada2fe9(obj: any): obj is e0c0b127_8a14_4830_b6a4_c3b4cada2fe9 {
  return obj?.['__type'] === 'e0c0b127-8a14-4830-b6a4-c3b4cada2fe9'
}

export interface $$6e3c132e_efd7_440d_8e07_578529cae867 {
  __type: string
  baseclass1: ClientFacet
}
export function is$$6e3c132e_efd7_440d_8e07_578529cae867(obj: any): obj is $$6e3c132e_efd7_440d_8e07_578529cae867 {
  return obj?.['__type'] === '6e3c132e-efd7-440d-8e07-578529cae867'
}

export interface $$527d161a_cb9a_486e_a0b9_499fd528ab00 {
  __type: string
  baseclass1: ServerFacet
  m_id: string
  '0xbc37c608': boolean
  m_detectionvolumeentity: LocalEntityRef
  '0xaff62014': number
}
export function is$$527d161a_cb9a_486e_a0b9_499fd528ab00(obj: any): obj is $$527d161a_cb9a_486e_a0b9_499fd528ab00 {
  return obj?.['__type'] === '527d161a-cb9a-486e-a0b9-499fd528ab00'
}

export interface ScheduleConstraintComponent {
  __type: string
  baseclass1: FacetedComponent
}
export function isScheduleConstraintComponent(obj: any): obj is ScheduleConstraintComponent {
  return obj?.['__type'] === 'ScheduleConstraintComponent'
}

export interface ScheduleConstraintComponentClientFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentClientFacet
}
export function isScheduleConstraintComponentClientFacet(obj: any): obj is ScheduleConstraintComponentClientFacet {
  return obj?.['__type'] === 'ScheduleConstraintComponentClientFacet'
}

export interface ScheduleConstraintComponentServerFacet {
  __type: string
  baseclass1: SpawnerConstraintComponentServerFacet
  m_scheduleid: Crc32
  m_selectedschedulename: string
  m_invert: boolean
  '0x70230912': boolean
}
export function isScheduleConstraintComponentServerFacet(obj: any): obj is ScheduleConstraintComponentServerFacet {
  return obj?.['__type'] === 'ScheduleConstraintComponentServerFacet'
}

export interface $$44b34b6c_63b0_443c_beee_272ea4106edc {
  __type: string
  baseclass1: QueryShapeBase
}
export function is$$44b34b6c_63b0_443c_beee_272ea4106edc(obj: any): obj is $$44b34b6c_63b0_443c_beee_272ea4106edc {
  return obj?.['__type'] === '44b34b6c-63b0-443c-beee-272ea4106edc'
}

export interface $$44a169fe_d036_46fb_acd4_4725166c18c4 {
  __type: string
  baseclass1: SlayerScriptData
}
export function is$$44a169fe_d036_46fb_acd4_4725166c18c4(obj: any): obj is $$44a169fe_d036_46fb_acd4_4725166c18c4 {
  return obj?.['__type'] === '44a169fe-d036-46fb-acd4-4725166c18c4'
}

export interface $$6b28df87_d282_4e5b_a817_0b115c72280b {
  __type: string
  baseclass1: AZ__Component
  '0x8f179c5f': string
  '0x23be9686': string
  '0xd7b43ef7': string
  '0xf4b660c8': string
}
export function is$$6b28df87_d282_4e5b_a817_0b115c72280b(obj: any): obj is $$6b28df87_d282_4e5b_a817_0b115c72280b {
  return obj?.['__type'] === '6b28df87-d282-4e5b-a817-0b115c72280b'
}
