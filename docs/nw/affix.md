# Affix Properties

Both `Affix` and `StatusEffect` use `StatusID` as identifier and have some properties in common so probably have the same data structure and meaning but are maintained in different files.

If a perk has `ScalingPerGearScore` then the perk multiplier is used to scale whatever effect value

## Identity

```ts
StatusID:                   string;
```

## Delegate
All Affix that have `StatusEffect` set have no other properties.

```ts
StatusEffect?:              string; // applies another effect
```

## Attribute bonus
All perks of `PerkType=Inherent` have an `Affix` with one or more of these mods.

```ts
MODConstitution:            number;
MODDexterity:               number;
MODFocus:                   number;
MODIntelligence:            number;
MODStrength:                number;
```

## Absorbtion
Simply adds to Absorption stat. Normalized value, `0.05` means `5%`

```ts
ABSArcane:                  number;
ABSCorruption:              number;
ABSFire:                    number;
ABSIce:                     number;
ABSLightning:               number;
ABSNature:                  number;
ABSSiege:                   number;
ABSSlash:                   number;
ABSStandard:                number;
ABSStrike:                  number;
ABSThrust:                  number;
ABSVitalsCategory?:         string; // e.g. Corrupted=0.025
```

## Damage
Simply adds to Damage stat. Normalized value, `0.05` means `5%`

```ts 
DMGArcane:                  number;
DMGCorruption:              number;
DMGFire:                    number;
DMGIce:                     number;
DMGLightning:               number;
DMGNature:                  number;
DMGSlash:                   number;
DMGStrike:                  number;
DMGThrust:                  number;
DMGVitalsCategory?:         string;
```

## Effect Resistance
Simply adds to resistance stat. For `Blight`, `Curse`, `Poision` this is the value
that ticks down when standing in blighted/corrupted/poisoned area

```ts
RESBlight:                  number;
RESCurse:                   number;
RESPoison:                  number;
```

Adds to affliction reduction stat. For `Blight`, `Curse`, `Poision` this slows
down the tick timer (or increases the amount that is restored per tick)

```ts
AFABlight:                  number;
AFACurse:                   number;
AFAPoison:                  number;
```

From testing
- no resistance: 60 ticks down in 30 seconds
- 4 x 625GS items: 120 ticks down in 150 seconds
- regardless of resistance, restoring the value is always same speed (1 per second)

## Music progression
```ts
MP_FinalNotePerfectXPBonus: number;
MP_GroupXPBonus:            number;
MP_IgnoreMissedNotes:       number;
MP_OpeningNotesPerfect:     number;
MP_RakeReduction:           number;
MP_SoloXPBonus:             number;
```

## Damage Conversion
How much damage is converted to specific damage type
- Perks -> only gems
- AI -> mutation effect to split damage from mobs
- AI also uses `IsAdditiveDamage` to make it additive instead of split damage

```ts
DamageType?:                string;
DamagePercentage:           number;
WeaponEffectType?:          string;
IsAdditiveDamage:           boolean;
```

If `PreferHigherScaling` is true, use given scaling for conversion if the output is higher
```ts
PreferHigherScaling:        boolean;
ScalingDexterity:           number;
ScalingFocus:               number;
ScalingIntelligence:        number;
ScalingStrength:            number;
```

## Other stats
```ts
DisableDurabilityLoss:      boolean; // durable perk
DurabilityMod:              number; // fishing pole durability

Encumbrance:                number; // extra pockets
FishRarityRollModifier:     number; // boost to better fish
FishSizeRollModifier:       number; // boost to larger fish
FishingLineStrength:        number; // adds to fishing line strength (is negative value)
GatheringEfficiency:        number; // not on any perk

StaminaRate:                number; // adds to stamina restauration rate
ManaRate:                   number; // adds to mana restauration rate
MaxCastDistance:            number; // add % to cast dist (fishing rod) 
MaxHealthMod:               number; // add % to max health (not on perks)
MaxManaMod:                 number; // add % to max mana (not on perks)
MaxStaminaMod:              number; // add % to max stamina (hearty)
```

## ?
Maybe stats from the early days of the game
```ts
AdditionalDamage?:          string; // found only on 1 affix: affixDyrnwyn
AppendToTooltip?:           string; // some developer hint text
AttributeModifiers?:        string; // e.g. Constitution=5
BaseDamageModifier:         number;
BaseDamageType?:            string; // found only on 3 affix
FastTravelEncumbranceMod:   number; // found only on 3 affix: Nomadic1 Nomadic2 Nomadic3
StaminaDamageModifier:      number; // found only on 3 affix: Unstoppable1 Unstoppable2 Unstoppable3
UseCountMultiplier:         number; // AffixTypeLevel
WeightMultiplier:           number;
```
only found on `AffixTypeLevel2Shield`, `AffixTypeLevel3Shield`, `AffixTypeLevel4Shield`, `AffixTypeLevel5Shield`
but also exists on all wepondefinitions.
```ts
ABABleed:                   number;
ABACurse:                   number;
ABADisease:                 number;
ABAFrostbite:               number;
ABAPoison:                  number;

BLAArcane:                  number;
BLACorruption:              number;
BLAFire:                    number;
BLALightning:               number;
BLASiege:                   number;
BLASlash:                   number;
BLAStandard:                number;
BLAStrike:                  number;
BLAThrust:                  number;
```
