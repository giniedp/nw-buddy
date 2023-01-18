    
# Descriptive
```ts
  AbilityID:                                      string;
  DisplayName?:                                   string;
  Description?:                                   string;
  Icon?:                                          string;
  UICategory?:                                    string;
  UISpellForManaCheck?:                           string;
  Sound?:                                         string;

```

# Skill Tree
```ts
  TreeColumnPosition?:                            number;
  TreeId?:                                        number;
  TreeRowPosition?:                               number;
  RequiredAbilityId?:                             string;
  UnlockDefault?:                                 boolean; // Greatsword permanent abilities
```

# Filter
```ts
  ExcludeFromGameModes?:                          string; // OutpostRush
  IgnoreDisabledAttackTypes?:                     string; // Heartgem
  TargetCollisionFilters?:                        string; // Structure
  IsInCombatState?:                               boolean; //
  IsNotInCombatState?:                            boolean; // 
  EquipLoadCategory?:                             string; // Fast, Normal
  
  EquipWhenUnsheathed?:                           boolean | number; // WeaponTag must be active weapon
```

# Trigger

```ts
  OnAttachedSpellTargetDied?:                     boolean;
  OnBlockBreak:                                   boolean;
  OnContributedKill?:                             boolean;

  OnCrit:                                         boolean;
  OnCritTaken?:                                   boolean;
  OnBlockedHit:                                   boolean;
  OnBlockedHitTaken?:                             boolean;
  OnHit:                                          boolean;
  OnHitBehind?:                                   boolean;
  OnHitTaken:                                     boolean;
  OnHitTakenWhileInvulnerable?:                   boolean;
  OnHeadShot:                                     boolean;
  OnSelfDamage?:                                  boolean; // Void Gauntlet
  OnFatalDamageTaken?:                            boolean;

  OnDeath:                                        boolean;
  OnDeathsDoor:                                   boolean;
  OnEquipStatusEffect?:                           string;
  OnEventConditionalActivationChance?:            boolean;
  OnEventPassiveConditionsPass?:                  boolean;
  OnExecuted:                                     boolean;
  OnGatheringComplete?:                           boolean;
  OnHasDied?:                                     boolean;
  OnHealed?:                                      boolean;
  OnHealthChanged?:                               boolean;
  OnInActionLongEnough?:                          boolean;
  OnKill:                                         boolean;
  OnLegShot:                                      boolean;
  OnProjPassedThrough?:                           boolean;
  
  OnStatusEffectApplied?:                         boolean;
  OnTargetBlockBreak:                             boolean;
  OnTargetSet?:                                   boolean;
  OnTargetStatusEffectRemoved?:                   boolean;
  OnUsedConsumable?:                              boolean;
  OnWeaponSwap?:                                  boolean;

  AfterAction?:                                   string; // e.g. Dodge
```

# Conditions
```ts
  MyHealthPercent?:                               number; // 100
  MyComparisonType?:                              string; // Equal, GreaterThanOrEqual
  
  AbilityOnCooldownOptions?:                      string; // ActiveWeapon
  AbilityCooldownComparisonType?:                 string; // Equal

  TargetVitalsCategory?:                          string; // e.g. Player
  DontHaveStatusEffect?:                          string;


  AttackType?:                                    string; // Light, Heavy, Magic, Ability
  
  GatheringTradeskill?:                           string; // Skinning, Harvesting (OnGatheringComplete event)
  WeaponTag?:                                     string; // active weapon
  
  DamageTableRow?:                                string; // damage must be one of these damage tables
  DamageTableRowOverride?:                        string; // overrides above
  DamageCategory?:                                string;
  DamageIsMelee?:                                 boolean;
  DamageIsRanged?:                                boolean;

  HasGritActive?:                                 boolean;

  InAction?:                                      string;
  InActionTime?:                                  number;

  TargetHasGritActive?:                           boolean;
  // status effec on target
  TargetStatusEffect?:                            string;
  TargetStatusEffectCategory?:                    string;
  TargetStatusEffectComparison?:                  string; // Equal, Notequal, GreaterThanEqual
  TargetStatusEffectStackSize?:                   number;
  //
  TargetMarker?:                                  string; // IsKnockedDown

  // target health
  TargetHealthPercent?:                           number; // e.g. 30
  TargetComparisonType?:                          string; // LessThan, Equal, GreaterThan
```

# Hit Counter
```ts
  TrackHitCount?:                                 boolean;
  NumberOfTrackedHits?:                           number;
  NumberOfHitsComparisonType?:                    string;
```

# Effects
```ts
  ThreatDamage?:                                  number; // increase thread damage
  ArmorPenetration?:                              number; // increase armor penetration dealt (on target)
  // stamina
  BlockDamage?:                                   number; // increase dealt stamina damage (on target)
  BlockDamageReduction?:                          number; // decrease taken stamina damage (on self)
  // base damage
  DamageTypes?:                                   string; // type of damage to increase (BaseDamage or status effect)
  BaseDamage?:                                    number; // increase dealt base damage (use DamageTypes)
  BaseDamageReduction?:                           number; // decrease taken base damage
  // crit
  CritDamage?:                                    number; // increase dealt crit damage
  CritDamageReduction?:                           number; // decrease taken crit damage
  // stagger
  StaggerDamage?:                                 number; // increase dealt stagger damage (150str bonus)
  StaggerDamageReduction?:                        number; // decrease taken stagger damage (only AI abilities)
  // cooldown reduction
  CooldownTimer?:                                 number; // increase cooldown timer 
  CDRImmediatelyOptions?:                         string; // AllExcept, ActiveWeapon
  // azoth extraction (on gathering complete)
  GiveAzothPercentChance?:                        number;
  Azoth?:                                         number;

  ConsumableHealMod?:                             number; // adds to heal consumable potency
  

  DmgPctToHealth?:                                number; // heal player for damage dealt 

  ElementalArmor?:                                number; // adds % to elemental armor
  PhysicalArmor?:                                 number; // adds % to physical armor
  PhysicalArmorMaxHealthMod?:                     number; // adds % of physical armor to health

  WeaponAccuracy?:                                number; // adds to weapon accuracy

  ToolDurabilityLossMod?:                         number; // adds to tool durability (unused?)

  // increase duration on target status effect (e.g. bleed)
  TargetStatusEffectDurationCats?:                string; // category
  TargetStatusEffectDurationList?:                string; // effect list
  TargetStatusEffectDurationMult?:                number; // added duration in percent
  TargetStatusEffectDurationMod?:                 number; // duration in seconds

  
  Stamina?:                                       number; // restore xx stamina
  // stamina cost reduction
  StaminaCostFlatMod?:                            number; // (150dex bonus)
  StaminaCostList?:                               string; // list of actions
  // transfer status effect (category) from self to target
  StatusEffectCategoryToTransfer?:                string; // sword reverse stab only
  //
  RefundConsumablePercentChance?:                 number; // dublicating toast perk
  IsNotConsumableIds?:                            string; // excluded consumables to refund
  // activates taunt
  EnableTaunt?:                                   boolean;
```

# Unused 
```
  AbilityIdToCheckForTrackedHits?:                string;
```

# Other
```ts
  ActivationCooldown?:                            number; // Cooldown in seconds
```

# Unknown
  CooldownId?:                                    string; //
  UseMinAttackInfoForSelfAppliedSE?:              boolean;


  AbilityList?:                                   string;
  AbilityTrigger?:                                string;
  AllowSelfDamageForHitEvents?:                   boolean;


  
  AttachedTargetSpellIds?:                        string;
  
  AttackerVitalsCategory?:                        string;

  
  CanBeUnapplied?:                                boolean;
  CanBlockRangedOverride?:                        boolean;
  CastSpell?:                                     string;
  CheckStatusEffectsOnTargetOwned?:               boolean;
  
  ConsumeTargetStatusEffectMult?:                 number;

  
  
  DamageTableStatusEffectOverride?:               string;
  
  
  
  DisableApplyPerStatusEffectStack?:              boolean;
  DisableCastSpellDurability?:                    boolean;
  DisableConsecutivePotency?:                     boolean;
  DistComparisonType?:                            string;
  DistFromDefender?:                              number;

  
  DoNotUnequipSelfAppliedSE?:                     boolean;
  
  Duration?:                                      number;

  
  EnableHoldConditionIfTrackedSpellExistsOfType?: string;


  
  FastTravelAzothCostMod?:                        number;
  FastTravelInnCooldownMod?:                      number;
  ForceStatusEffectDamageTableRow?:               boolean;
  
  
  
  HeadshotArmorPenetration?:                      number;
  HeadshotDamage?:                                number;
  HealScalingValueMultiplier?:                    number;
  HitFromBehindArmorPenetration?:                 number;
  HitFromBehindDamage?:                           number;
  HoldConditionButtonIcon?:                       string;
  
  
  IgnoreResetConsecutiveOnDeath?:                 boolean;
  
  IsActiveAbility?:                               boolean; // non passive, executed on action (attack)
  IsGlobalAbility?:                               boolean; // ? 
  IsNonCombatAbility?:                            boolean; 
  IsStackableAbility?:                            boolean; // perk stacks

  Knockback?:                                     number;
  LinearlyScaleToDistance?:                       number;
  LoadedAmmoCount?:                               number;
  LoadedAmmoCountComparisonType?:                 string;
  Mana?:                                          number;
  ManaCostList?:                                  string;
  ManaCostMult?:                                  number;
  MaxConsecutiveHits?:                            number;
  MaxHealth?:                                     number;
  MaxHitCountMultiplier?:                         number;
  MaxMana?:                                       number;
  MaxNumAroundMe?:                                number;
  MaxTrackedHitCounts?:                           number;
  ModifySelfApplyStatusEffectDuration?:           number;

  MyManaComparisonType?:                          string;
  MyManaPercent?:                                 number;
  MyMarker?:                                      string;
  MyStaminaComparisonType?:                       string;
  MyStaminaPercent?:                              number;
  NumAroundComparisonType?:                       string;
  NumAroundMe?:                                   number;
  NumConsecutiveHits?:                            number;
  NumFreeCooldownsPerUse?:                        number;
  NumStatusEffectStacksToRemove?:                 number;
  NumStatusEffectsToRemove?:                      number;
  NumStatusEffectsToTransfer?:                    number;
  NumSuccessfulHits?:                             number;
  NumTargetStatusEffectsToRemove?:                number;

  


  OnlyChangeOwnedStatusEffects?:                  boolean;
  OtherApplyStatusEffect?:                        string;
  PerStatusEffectOnSelf?:                         boolean;
  PerStatusEffectOnSelfMax?:                      number;
  PerStatusEffectOnTarget?:                       boolean;
  PerStatusEffectOnTargetMax?:                    number;

  PowerLevelOverride?:                            number;
  RangedAttackName?:                              string;
  RangedAttackNameOverride?:                      string;
  RefundAmmoPercentChance?:                       number;



  RemoteDamageTableRow?:                          string;
  RemoveStatusEffects?:                           string;
  RemoveTargetStatusEffectCats?:                  string;
  RemoveTargetStatusEffectsList?:                 string;
  RepairDustYieldMod?:                            number;
  RequireReaction?:                               boolean | string;
  
  RequiredEquippedAbilityId?:                     string;
  ResetConsecutiveOnSuccess?:                     boolean | number;
  ResetConsumableCooldowns?:                      string;
  ResetCooldownTimers?:                           string;
  ResetTrackedOnSuccess?:                         boolean;
  SelfApplyStatusEffect?:                         string;
  SelfApplyStatusEffectDurations?:                number;
  SetHealthOnFatalDamageTaken?:                   number;
  SetMannequinTag?:                               string;
  SetMannequinTagStatus?:                         boolean;
  

  
  StatusEffect?:                                  string;
  StatusEffectBeingApplied?:                      string;
  StatusEffectCategories?:                        string;
  StatusEffectCategoriesList?:                    string;
  
  StatusEffectComparison?:                        string;
  StatusEffectDamageTableIdForRowOverride?:       string;
  StatusEffectDamageTableRowOverride?:            string;
  StatusEffectDurationCats?:                      string;
  StatusEffectDurationMod?:                       number;
  StatusEffectDurationMult?:                      number;
  StatusEffectDurationReduction?:                 number;
  StatusEffectStackSize?:                         number;
  StatusEffectsList?:                             string;



  
  


  
