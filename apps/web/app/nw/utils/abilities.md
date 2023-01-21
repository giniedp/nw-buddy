    
# Descriptive
```ts
  AbilityID:                                      string;
  DisplayName?:                                   string;
  Description?:                                   string;
  Icon?:                                          string;
  UICategory?:                                    string;
  UISpellForManaCheck?:                           string;
  Sound?:                                         string;
  HoldConditionButtonIcon?:                       string;
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

  // distance to target
  DistComparisonType?:                            string; // (GreaterThan|LessThan)(OrEqual)
  DistFromDefender?:                              number;
```

# Trigger

```ts
  OnAttachedSpellTargetDied?:                     boolean;
  AttachedTargetSpellIds?:                        string;

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
  OnHealed?:                                      boolean; // outgoing healing
  OnHealthChanged?:                               boolean;
  OnInActionLongEnough?:                          boolean;
  OnKill:                                         boolean;
  OnLegShot:                                      boolean;
  OnProjPassedThrough?:                           boolean;
  
  OnStatusEffectApplied?:                         boolean;
  StatusEffectBeingApplied?:                      string;

  OnTargetBlockBreak:                             boolean;
  OnTargetSet?:                                   boolean;
  OnTargetStatusEffectRemoved?:                   boolean;
  OnUsedConsumable?:                              boolean;
  OnWeaponSwap?:                                  boolean;

  AfterAction?:                                   string; // e.g. Dodge
  // Trigger on or after ability
  AbilityTrigger?:                                string; // OnPerform, AfterPerform
  AbilityList?:                                   string; // list of abilities
  // check if target has status effect applied by us (TargetStatusEffect, TargetStatusEffectCategory)
  CheckStatusEffectsOnTargetOwned?:               boolean;
```

# Conditions
```ts
  // health check
  MyHealthPercent?:                               number; // 100
  MyComparisonType?:                              string; // Equal, GreaterThanOrEqual
  // target health check
  TargetHealthPercent?:                           number; // e.g. 30
  TargetComparisonType?:                          string; // LessThan, Equal, GreaterThan
  // mana check
  MyManaPercent?:                                 number;
  MyManaComparisonType?:                          string;
  // stamina check
  MyStaminaComparisonType?:                       string;
  MyStaminaPercent?:                              number;
  // 
  AbilityOnCooldownOptions?:                      string; // ActiveWeapon
  AbilityCooldownComparisonType?:                 string; // Equal
  // equipped ability check
  RequiredEquippedAbilityId?:                     string;

  // PvP condition
  TargetVitalsCategory?:                          string; // Player
  AttackerVitalsCategory?:                        string; // Player

  DontHaveStatusEffect?:                          string;

  AttackType?:                                    string; // Light, Heavy, Magic, Ability
  
  GatheringTradeskill?:                           string; // Skinning, Harvesting (OnGatheringComplete event)
  WeaponTag?:                                     string; // active weapon
  
  DamageTableRow?:                                string; // damage must be one of these damage tables
  DamageTableRowOverride?:                        string; // overrides above
  DamageCategory?:                                string;
  DamageIsMelee?:                                 boolean;
  DamageIsRanged?:                                boolean;

  InAction?:                                      string;
  InActionTime?:                                  number;

  // grit check
  HasGritActive?:                                 boolean;
  TargetHasGritActive?:                           boolean;

  // status effect check
  StatusEffect?:                                  string;
  StatusEffectComparison?:                        string;
  StatusEffectStackSize?:                         number;
  // status effec on target
  TargetStatusEffect?:                            string;
  TargetStatusEffectCategory?:                    string;
  TargetStatusEffectComparison?:                  string; // Equal, Notequal, GreaterThanEqual
  TargetStatusEffectStackSize?:                   number;
  // marker conditions
  TargetMarker?:                                  string; // IsKnockedDown
  MyMarker?:                                      string; // BlockEarly

  // consecutive hits
  NumConsecutiveHits?:                            number;
  MaxConsecutiveHits?:                            number;
  ResetConsecutiveOnSuccess?:                     boolean | number;
  IgnoreResetConsecutiveOnDeath?:                 boolean;
  // ammunition comparison
  LoadedAmmoCount?:                               number;
  LoadedAmmoCountComparisonType?:                 string;
  // surrounded by enemies count
  NumAroundMe?:                                   number;
  NumAroundComparisonType?:                       string;
  
```

# Hit Counter
```ts
  TrackHitCount?:                                 boolean;
  NumberOfTrackedHits?:                           number;
  NumberOfHitsComparisonType?:                    string;
```

# Scale or Multiply Effect
```ts
  LinearlyScaleToDistance?:                       number;
  MaxNumAroundMe?:                                number; // multiplies with BaseDamage
  // status effect on target (check TargetStatusEffectCategory)
  PerStatusEffectOnTarget?:                       boolean;
  PerStatusEffectOnTargetMax?:                    number; // limit. if not set, unlimited
  // status effect on self
  StatusEffectCategories?:                        string;
  PerStatusEffectOnSelf?:                         boolean;
  PerStatusEffectOnSelfMax?:                      number;
```

# Effects
```ts
  ThreatDamage?:                                  number; // increase thread damage
  ArmorPenetration?:                              number; // increase armor penetration dealt (on target)
  HitFromBehindArmorPenetration?:                 number; // increase armor penetration dealt (on target, from behind)
  HitFromBehindDamage?:                           number; // increase dealt base damage when from behind
  HeadshotArmorPenetration?:                      number; // increase armor penetration dealt (on target, on headshot)
  HeadshotDamage?:                                number; // increase dealt base damage on headshot
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
  CDRImmediatelyOptions?:                         string; // ActiveWeapon, AllExcept (CooldownId), AbilitySpecific (ColldownId)
  CooldownTimer?:                                 number; // add to cooldown timer ([0: -1])
  CooldownId?:                                    string; // the
  // healing
  HealScalingValueMultiplier?:                    number; // increase outgoing healing
  // azoth extraction (on gathering complete)
  GiveAzothPercentChance?:                        number;
  Azoth?:                                         number;
  // health increase
  MaxHealth?:                                     number;
  // mana increase
  MaxMana?:                                       number;
  // restore mana
  Mana?:                                          number;
  // mana cost reduction
  ManaCostList?:                                  string;
  ManaCostMult?:                                  number;
  // restore stamina
  Stamina?:                                       number;
  // stamina cost reduction (only Radiant Efficiency VG)
  StaminaCostFlatMod?:                            number; // (150dex bonus)
  StaminaCostList?:                               string; // list of actions

  ConsumableHealMod?:                             number; // adds to heal consumable potency
  

  DmgPctToHealth?:                                number; // heal player for damage dealt 

  ElementalArmor?:                                number; // adds % to elemental armor
  PhysicalArmor?:                                 number; // adds % to physical armor
  PhysicalArmorMaxHealthMod?:                     number; // adds % of physical armor to health

  WeaponAccuracy?:                                number; // adds to weapon accuracy

  ToolDurabilityLossMod?:                         number; // adds to tool durability (unused?)

  // increase duration on target status effect (e.g. bleed)
  OnlyChangeOwnedStatusEffects?:                  boolean;// whether to change only applied effects by us
  TargetStatusEffectDurationCats?:                string; // category
  TargetStatusEffectDurationList?:                string; // effect list
  TargetStatusEffectDurationMult?:                number; // added duration in percent
  TargetStatusEffectDurationMod?:                 number; // duration in seconds
  // Apply status effect on target
  OtherApplyStatusEffect?:                        string;
  // remove status effects on target
  RemoveTargetStatusEffectCats?:                  string; // Buff, Debuff
  RemoveTargetStatusEffectsList?:                 string; // list of IDs
  NumTargetStatusEffectsToRemove?:                number; // number of effects to remove
  // remove status effects on self
  RemoveStatusEffects?:                           string; // All, AbilitySpecific or ID
  StatusEffectCategoriesList?:                    string; // Slow, Root, Debuff, DoT, Debilitate
  NumStatusEffectsToRemove?:                      number; // number of effects to remove
  StatusEffectsList?:                             string;
  // add multiplicator to `TargetStatusEffect`
  ConsumeTargetStatusEffectMult?:                 number;
  
  // transfer status effect (category) from self to target
  StatusEffectCategoryToTransfer?:                string; // sword reverse stab only
  NumStatusEffectsToTransfer?:                    number; 
  //
  RefundConsumablePercentChance?:                 number; // dublicating toast perk
  IsNotConsumableIds?:                            string; // excluded consumables to refund
  // activates taunt
  EnableTaunt?:                                   boolean;
  // ??
  Knockback?:                                     number;
  // Apply Effect
  SelfApplyStatusEffect?:                         string;
  SelfApplyStatusEffectDurations?:                number;
  // ? Ai only
  SetMannequinTag?:                               string;
  SetMannequinTagStatus?:                         boolean;
  // 
  DamageTableStatusEffectOverride?:               string;
  // azoth cost reduction
  FastTravelAzothCostMod?:                        number; // on Int_Bonus_300_2, unused?
  // travel inn cooldown reduction
  FastTravelInnCooldownMod?:                      number; // on Foc_Bonus_300_2, unused?
  // 
  RepairDustYieldMod?:                            number; // on Foc_Bonus_100_2, unused?
  // refund arrow/ammo chance
  RefundAmmoPercentChance?:                       number;
  // 
  CanBlockRangedOverride?:                        boolean; // only on Arrow Deflection (greatsword)
  // casts spell from spelltable
  CastSpell?:                                     string;
  // reset effects
  ResetConsumableCooldowns?:                      string;
  ResetCooldownTimers?:                           string;
```

# Unused 
```
  AbilityIdToCheckForTrackedHits?:                string;
```

# Other
```ts
  ActivationCooldown?:                            number; // Cooldown in seconds
  DoNotUnequipSelfAppliedSE?:                     boolean;
  AllowSelfDamageForHitEvents?:                   boolean; // (Defy Death)
  UseMinAttackInfoForSelfAppliedSE?:              boolean; // (mutation curse)

  IsActiveAbility?:                               boolean; // non passive, executed on action (attack)
  IsGlobalAbility?:                               boolean; // ? 
  IsNonCombatAbility?:                            boolean; 
  IsStackableAbility?:                            boolean; // perk stacks

  EnableHoldConditionIfTrackedSpellExistsOfType?: string; // IcePylon

  MaxHitCountMultiplier?:                         number; // only on Rapier_Slash_Mod2

  NumFreeCooldownsPerUse?:                        number; // some musket stuff
  NumStatusEffectStacksToRemove?:                 number; // always empty or 0 (unused?)

```

# Unknown
```ts
  RequireReaction?:                               boolean | string;
  NumSuccessfulHits?:                             number;
  PowerLevelOverride?:                            number; // only on Impactful Strikes
  RangedAttackName?:                              string;
  RangedAttackNameOverride?:                      string;
  CanBeUnapplied?:                                boolean; 
  // 
  ForceStatusEffectDamageTableRow?:               boolean;
  StatusEffectDamageTableIdForRowOverride?:       string;
  StatusEffectDamageTableRowOverride?:            string;
  // duration
  StatusEffectDurationCats?:                      string; // CC, Debuff, Dot etc.
  StatusEffectDurationMod?:                       number;
  StatusEffectDurationMult?:                      number;
  StatusEffectDurationReduction?:                 number;
```

  Duration?:                                      number;
  DisableApplyPerStatusEffectStack?:              boolean;
  DisableCastSpellDurability?:                    boolean;
  DisableConsecutivePotency?:                     boolean;

  MaxTrackedHitCounts?:                           number;
  ModifySelfApplyStatusEffectDuration?:           number;
  
  RemoteDamageTableRow?:                          string;
  

  ResetTrackedOnSuccess?:                         boolean;

  SetHealthOnFatalDamageTaken?:                   number;
