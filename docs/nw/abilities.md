    
# Abilities

## Identity
```ts
AbilityID:                                      string;
```

## Display
```ts
DisplayName?:                                   string;
Description?:                                   string;
Icon?:                                          string;
UICategory?:                                    string;
UISpellForManaCheck?:                           string;
Sound?:                                         string;
HoldConditionButtonIcon?:                       string;
```

## Skill Tree
```ts
TreeId?:                                        number; // either 0 or 1 (left tree / right tree)
TreeColumnPosition?:                            number; // x position in grid
TreeRowPosition?:                               number; // y position in grid
RequiredAbilityId?:                             string; // dependency, must be enabled
UnlockDefault?:                                 boolean; // Greatsword permanent abilities
```


## Trigger

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

## Conditions
```ts
IgnoreDisabledAttackTypes?:                     string; // Heartgem
TargetCollisionFilters?:                        string; // Structure
EquipLoadCategory?:                             string; // Fast, Normal
// game mode check
ExcludeFromGameModes?:                          string; // OutpostRush
// combat state check
IsInCombatState?:                               boolean;
IsNotInCombatState?:                            boolean;
// active weapon check
EquipWhenUnsheathed?:                           boolean | number; // WeaponTag must be active snf unsheathed weapon
// distance check
DistFromDefender?:                              number; // distance in meters
DistComparisonType?:                            string; // GreaterThan LessThan GreaterThanOrEqual LessThanOrEqual
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
// PvP/PvE check
TargetVitalsCategory?:                          string; // Player
AttackerVitalsCategory?:                        string; // Player
// check status effect on self
DontHaveStatusEffect?:                          string;

AttackType?:                                    string; // Light, Heavy, Magic, Ability

GatheringTradeskill?:                           string; // Skinning, Harvesting (OnGatheringComplete event)
WeaponTag?:                                     string; // active weapon

DamageTableRow?:                                string; // damage must be one of these damage tables
DamageTableRowOverride?:                        string; // overrides above
DamageCategory?:                                string;
DamageIsMelee?:                                 boolean;
DamageIsRanged?:                                boolean;

// animation
InAction?:                                      string; // animation action name
InActionTime?:                                  number; // animation time
// animation marker
TargetMarker?:                                  string; // IsKnockedDown
MyMarker?:                                      string; // BlockEarly

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

## Hit Counter
```ts
TrackHitCount?:                                 boolean;
NumberOfTrackedHits?:                           number;
NumberOfHitsComparisonType?:                    string;
```

## Scale or Multiply Effect

```ts
// Contributes to BaseDamage but with distance scaling
LinearlyScaleToDistance?:                       number; // += clamp(distance / LinearlyScaleToDistance) * BaseDamage
// if MaxNumAroundMe is set
MaxNumAroundMe?:                                number; // += min(NumAroundMe, MaxNumAroundMe) * BaseDamage
// if target has TargetStatusEffectCategory
PerStatusEffectOnTarget?:                       boolean;
PerStatusEffectOnTargetMax?:                    number; // += PerStatusEffectOnTargetMax * BaseDamage
// if self has StatusEffectCategories
StatusEffectCategories?:                        string;
PerStatusEffectOnSelf?:                         boolean;
PerStatusEffectOnSelfMax?:                      number;
```

## Effects
```ts
ThreatDamage?:                                  number; // increase threat damage

// armor penetration
ArmorPenetration?:                              number; // increase armor penetration dealt (on target)
HitFromBehindArmorPenetration?:                 number; // increase armor penetration dealt (on target, from behind)
HeadshotArmorPenetration?:                      number; // increase armor penetration dealt (on target, on headshot)
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
HeadshotDamage?:                                number; // increase dealt crit damage on headshot
HitFromBehindDamage?:                           number; // increase dealt crit damage when from behind
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

// cooldown increase duration on target status effect (e.g. bleed)
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
// When weapon fired, skips this amount of cooldowns
// e.g. shooter stance has 3 shots (skips 2 cooldowns)
NumFreeCooldownsPerUse?:                        number;
// cooldown reduction of status effects
StatusEffectDurationCats?:                      string; // which categories to affect: CC, Debuff, Dot etc.
StatusEffectDurationMod?:                       number; // modification in seconds (StatusEffectBeingApplied)
  // these seem to be somewhat redundant.
  // Both are set on Global_Amulet_DurFortify to same value
  // But description uses only StatusEffectDurationMult
StatusEffectDurationReduction?:                 number; //
StatusEffectDurationMult?:                      number; //
// when a status effect stacks, this duration is applied instead
ModifySelfApplyStatusEffectDuration?:           number;
```


## Other
```ts
IsActiveAbility?:                               boolean; // Ability can be executed (attack)
IsNonCombatAbility?:                            boolean; // Ability non combat related (harvesting bonus,luck)
IsStackableAbility?:                            boolean; // Ability can be stacked
IsGlobalAbility?:                               boolean; // ?
Duration?:                                      number; // cooldown time in seconds
ActivationCooldown?:                            number; // Cooldown in seconds
DoNotUnequipSelfAppliedSE?:                     boolean;
AllowSelfDamageForHitEvents?:                   boolean; // (Defy Death)
UseMinAttackInfoForSelfAppliedSE?:              boolean; // (mutation curse)

EnableHoldConditionIfTrackedSpellExistsOfType?: string; // IcePylon
MaxHitCountMultiplier?:                         number; //
RequireReaction?:                               boolean | string; // checks against a DamageTableRow NoReaction
```

## Unused 
```ts
AbilityIdToCheckForTrackedHits?:                string;
NumStatusEffectStacksToRemove?:                 number; // always empty or 0
```

## Unknown / Unsure
```ts
NumSuccessfulHits?:                             number;
PowerLevelOverride?:                            number; // only on Impactful Strikes
RangedAttackName?:                              string;
RangedAttackNameOverride?:                      string;
CanBeUnapplied?:                                boolean; 
// 
ForceStatusEffectDamageTableRow?:               boolean;
StatusEffectDamageTableIdForRowOverride?:       string;
StatusEffectDamageTableRowOverride?:            string;
```

## TODO
```ts
DisableApplyPerStatusEffectStack?:              boolean;
DisableCastSpellDurability?:                    boolean;
DisableConsecutivePotency?:                     boolean;

MaxTrackedHitCounts?:                           number;
RemoteDamageTableRow?:                          string;

ResetTrackedOnSuccess?:                         boolean;

SetHealthOnFatalDamageTaken?:                   number;
```
