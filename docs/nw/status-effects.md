# Status Effects

```ts
StatusID:                                    string;
EffectCategories?:                           string[];

DisplayName?:                                string;
Description?:                                string;;
PlaceholderIcon?:                            string;
```

## Ignorable

```ts
UiNameplatePriority:                         number;
UIPriority:                                  number;
HideHudDurationNumbers?:                     boolean;
HidesOtherStatusEffectIcons?:                boolean;
OverrideOtherNameplateText?:                 boolean
ShowInNameplates?:                           boolean | string;
ShowInUITray?:                               boolean | string;
ShowTextInDamageNumbers:                     boolean;
ShowTextInNameplates?:                       boolean | string;
ShowUiDamageNumbersOnHeal?:                  boolean;
GameEventId?:                                string;
HealRewardGameEventId?:                      string;
FxScriptOff?:                                string; // deactivates a script
FxScriptOn?:                                 string; // activates a script
DisableSupportContributionRewards?:          boolean;
DisableTelemetry?:                           boolean | string;
IsNegative?:                                 boolean | string; // adds red background to icon
"CostumeChangeId": "string",
```

## Attribute bonus

```ts
MODConstitution?:                            number;
MODDexterity?:                               number;
MODFocus?:                                   number;
MODIntelligence?:                            number;
MODStrength?:                                number;
"AttributePlacingMods": "string",
```

## Absorption

```ts
ABSAcid?:                                    number;
ABSArcane:                                   number;
ABSCorruption:                               number;
ABSFire:                                     number;
ABSIce:                                      number;
ABSLightning:                                number;
ABSNature:                                   number;
ABSSiege:                                    number;
ABSSlash:                                    number;
ABSStandard:                                 number;
ABSStrike:                                   number;
ABSThrust:                                   number;
ABSVitalsCategory?:                          number | string;
```

## Damage

```ts
DMGArcane?:                                  number;
DMGCorruption?:                              number;
DMGFire?:                                    number;
DMGIce?:                                     number;
DMGLightning?:                               number;
DMGNature?:                                  number;
DMGSiege?:                                   number;
DMGSlash?:                                   number;
DMGStandard?:                                number;
DMGStrike?:                                  number;
DMGThrust?:                                  number;
DMGVitalsCategory_Tooltip?:                  number;
DMGVitalsCategory?:                          number | string;
```

## Weakness

```ts
WKNArcane?:                                  number;
WKNCorruption?:                              number;
WKNFire?:                                    number;
WKNIce?:                                     number;
WKNLightning?:                               number;
WKNNature?:                                  number;
WKNSiege?:                                   number;
WKNSlash?:                                   number;
WKNStandard?:                                number;
WKNStrike?:                                  number;
WKNThrust?:                                  number;
```

## Effect resistance

```ts
RESBleed?:                                   number;
RESBlight?:                                  number;
RESCurse?:                                   number;
RESDisease?:                                 number;
RESFrostbite?:                               number;
RESPoison?:                                  number;
"RESSpores": "number",
```

## Gathering bonus

```ts
EFFHarvesting?:                              number;
EFFLogging?:                                 number;
EFFMining?:                                  number;
EFFSkinning?:                                number;
```

# ?

```ts
ABABleed?:                                   number;
ABABlight?:                                  number;
ABACurse?:                                   number;
ABADisease?:                                 number;
ABAFrostbite?:                               number;
ABAPoison?:                                  number;
```

# ?

```ts
BLAArcane?:                                  number;
BLACorruption?:                              number;
BLAFire?:                                    number;
BLAIce?:                                     number;
BLALightning?:                               number;
BLASiege?:                                   number;
BLASlash?:                                   number;
BLAStandard?:                                number;
BLAStrike?:                                  number;
BLAThrust?:                                  number;
```

# ?

```
AFABleed?:                                   number;
AFABlight?:                                  number;
AFACurse?:                                   number;
AFADisease?:                                 number;
AFAFrostbite?:                               number;
AFAPoison?:                                  number;
"AFASpores": "number",
"AFAStunned": "number",
```

## Experience Boost

```ts
EXPFishing?:                                 number;
EXPHarvesting?:                              number;
EXPLeatherworking?:                          number;
EXPLogging?:                                 number;
EXPMining?:                                  number;
EXPSkinning?:                                number;
EXPSmelting?:                                number;
EXPStonecutting?:                            number;
EXPWeaving?:                                 number;
EXPWoodworking?:                             number | string;
```

## Gathering Yield

```ts
MULTFishing?:                                number;
MULTHarvesting?:                             number;
MULTLogging?:                                number;
MULTMining?:                                 number;
MULTSkinning?:                               number;
```

## Luck rol

```ts
ROLCooking?:                                 number;
ROLFishing?:                                 number;
ROLHarvesting?:                              number;
ROLLeatherworking?:                          number;
ROLLogging?:                                 number;
ROLMining?:                                  number;
ROLSkinning?:                                number;
ROLSmelting?:                                number;
ROLStonecutting?:                            number;
ROLWeaving?:                                 number;
ROLWoodworking?:                             number;
```

## Max Gearscore Craft

```ts
MaxGSArcana?:                                number;
MaxGSArmoring?:                              number;
MaxGSEngineering?:                           number;
MaxGSJewelcrafting?:                         number;
MaxGSWeaponsmithing?:                        number;
```

## Min Gearscore Craft

```ts
MGSArcana?:                                  number;
MGSArmoring?:                                number;
MGSEngineering?:                             number;
MGSJewelcrafting?:                           number;
MGSWeaponsmithing?:                          number;
```

## Group XP contribution (music)

```ts
XPIncreases?:                                number | string;
XPIncreasesTooltip?:                         number;
```

## Remove Effect Trigger

```ts
RemoveOnDeath?:                              number | string; // on finish?
RemoveOnDeathsDoor?:                         number | string; // on death but reviveable?
RemoveOnGameModeExit?:                       number | string; // on exit expedition, opr etc.
RemoveOnRespawn?:                            number;
```

## Mods

```ts
AzothMod?:                                   number; // When gain Azoth, gain % more (scaling)
CoreTempMod?:                                number; // something unused
TempMod?:                                    number; // something unused
FactionReputationMod?:                       number; // When gain Reputation, gain % more (scaling, loyalty perk)
FactionTokensMod?:                           number; // When gain Tokens, gain % more (scaling, loyalty perk)
GlobalRollMod?:                              number; // Adds to global luck (trophies, luck perk, perls)
MaxHealthMod?:                               number; //increase max health by %
MoveSpeedMod?:                               number; // increase movement speed by %
SprintSpeedMod?:                             number; // increase sprint speed by %
NonConsumableHealMod?:                       number; // unused?
TerritoryStandingMod?:                       number; // When gain Standing, gain % more (music buff)
EffectDurationMods?:                         string; // e.g. Slow=-1.0+Root=-1.0+UnclampedSlow=-1.0
EffectPotencyMods?:                          string; // e.g. Slow=-1.0+Root=-1.0+UnclampedSlow=-1.0
```

## Conditions

```ts
HitCondition?:                               string; // removes this effect: OnHit OnHitTaken
OnDeathStatusEffect?:                        string; // applied status effect on death
OnEndStatusEffect?:                          string; // applied status effect on effect end
OnHitAffixes?:                               string; // applied status effect on hit something
OnTickStatusEffect?:                         string;
// stacking
OnStackStatusEffect?:                        string; // apply this effect
AddOnStackSize?:                             number; // when this stack size
AddOnStackSizeComparison?:                   string; // fullfills this comparison
```

## Effects

```ts
Encumbrance?:                                number; // increases encumbrance limit
EquipAbility?:                               string; // effect equips this ability
// root
NoDodge:                                     number; // e.g. when stting in turret
NoHealthRegen?:                              number;
NoNav:                                       number;
NoRun:                                       number;
NoSprint:                                    number;
// Stun
Stunned:                                     number;
// Tags using Tools & Knifes
LootTags?:                                   string;

Mana?:                                       number;
ManaModifierDamageBased?:                    number;
ManaRate?:                                   number;

HealMod:                                     number;
HealRewardThreshold?:                        number;
HealScalingValueMultiplier?:                 number | string;
HealThreatMultiplier?:                       number;

Health?:                                     number;
HealthMin?:                                  number;
HealthModifierBasePercent?:                  number;
HealthModifierDamageBased?:                  number;
HealthModifierPercent?:                      number;
HealthRate?:                                 number;

Stamina?:                                    number; // add to stamina
StaminaDamageModifier?:                      number;
StaminaRate:                                 number; // add to stamina restauration rate

```

## TODO

```ts
RemoveEffectModsOnInactive?:                 boolean; //
RemoveStatusEffectCategories?:               string;
RemoveStatusEffects?:                        string;
RemoveUnappliedStacks?:                      boolean | string;

StackMax:                                    number; // maximum number of stacks for this effect
BaseDuration:                                number; // duration in seconds
DurationMax:                                 number; // maximum duration in seconds
TickRate:                                    number; // afflict every X seconds (e.g. DOT tick)
StackDuration?:                              boolean | number | string; // on stack, also stack duration x times
RefreshDuration?:                            boolean | string; // on stack, refresh duration timer with base duration
InheritDuration?:                            boolean | number | string;
InheritTotalDuration?:                       boolean | string;

Afflictions?:                                string; // list of affliction values e.g. AfflictionPoison=30
AllowSelfOnlyAsSourceForAbilities?:          boolean;
ApplicationCooldown?:                        number; // Effect can only be applied once this timeframe
BlockMultipleEffectsFromSameSource?:         boolean;
CastSpell?:                                  string;
CritChanceModifier?:                         number;
DamageSkipsDeathsDoor?:                      boolean;
DamageType?:                                 string;
DelayInitialTick?:                           boolean | number | string;
DisableAllNonAttributePerks?:                boolean;
DisableAllNonAttributePerksExceptionLabels?: string;
DisableCastSpellDurability?:                 boolean;

DontApplyOnEndEffectOnRemove?:               boolean; //
DontApplyOnEndEffectOnTimeOutDeath?:         boolean; //
DontReplaceStack?:                           boolean; //

Drink?:                                      number; // unused, only in test effects
DrinkBurn?:                                  number; // unused, only in test effects
Food?:                                       number; // unused, only in test effects
FoodBurn?:                                   number; // unused, only in test effects

DynamicModelScaleFactor?:                    number; // scale 3d model (isabella on empower)
DynamicModelScaleRampTimeSecs?:              number; // scale 3d model (isabella on empower)

FishingLineStrength?:                        number;
FishSizeRollModifier?:                       number;

ForceReplicateToRemotes?:                    boolean;
FromAlchemy?:                                number; // always 0 or empty
FromSpell?:                                  number;

GrantSanctuary?:                             number;


IgnoreDiminishingReturns?:                   boolean | string;
IgnoreFxScriptWhenPotencyIsZero?:            boolean;
IgnoreInvulnerable?:                         boolean;

INSLogging?:                                 number;
INSMining?:                                  number;
IsClientPredicted?:                          boolean | number | string;
IsTrueDamage?:                               boolean;
ItemClassWeightMods?:                        string;
ItemLootVolumeMods?:                         string;
KeepOnTickEffectOnEnd?:                      boolean;

Notes?:                                      string;
Notification?:                               string;

PotencyMax?:                                 number;
PotencyPerLevel?:                            number;
PreventPassiveAbilitiesOnEquip?:             boolean;
RankSorting?:                                number;
ReapplyAfterPersistenceReload?:              boolean;

RequireReaction?:                            boolean;
RespecAttributes?:                           number;
RespecTradeskills?:                          number;
ScaleAmountOverTime?:                        number;
ScaleAmountOverTimeMax?:                     number;
ShouldRefreshFxScript?:                      number;

Silenced:                                    number;
SlotToFillWeaponDamageInfo?:                 string;
SourceRuneChargeOnApply?:                    number;
SourceRuneChargeOnHealthChangeOnly?:         boolean;
SourceRuneChargeOnTick?:                     number;

StopOnHitCount?:                             number;

TargetOwnsSpell?:                            boolean;

TickCondition?:                              string;

UseHealScalingValue?:                        boolean;
UseLightweightReplication?:                  boolean;
UseSourceWeaponForAbilityEffect?:            boolean;
UseSourceWeaponForSpell?:                    boolean;
WeaponEffectType?:                           string;
WeaponMasteryCategoryId?:                    number | string;
WindowHeader?:                               string;

"NotCombatAction "?:                         boolean;
DamageSplitTaken?:                           number
DamageSplitTakenBySource?:                   number
DismissMount?:                               boolean
DurationAttbScalingMaxValue?:                number
ExpansionForDeathRecap?:                     string
GameEventTypeTradeskillEXPMod?:              string
HealthMinPercent?:                           number
InitialStackSize?:                           boolean
IsServerOnly?:                               boolean
LinkedBeamName?:                             string
LinkedBeamStackThreshold?:                   number
LocTextTagForDeathRecap?:                    string
ModDmgBasedMultValue_ForTooltip?:            number
MountedOnly?:                                boolean
ObjectiveLocTextTagForDeathRecap?:           string
PotencyAttbScalingMaxValue?:                 number
PreventMirrorBeams?:                         boolean
RemoveWhenEnteringGameModeRequiringTeleport?:string
ShowTextInRemoteDamageNumbers?:              boolean
SourceAttributeBasedDurationScalings?:       string
SourceAttributeBasedPotencyScalings?:        string
```
