```ts
StatusID:                   string;
StatusEffect?:              string;
```

# Attribute bonus
```ts
MODConstitution:            number;
MODDexterity:               number;
MODFocus:                   number;
MODIntelligence:            number;
MODStrength:                number;
```

# Absorbtion
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
ABSVitalsCategory?:         string;
```

# Damabe (empower)
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

# Effect resistance
```ts
AFABlight:                  number; // add to resistance %
AFACurse:                   number; // add to resistance %
AFAPoison:                  number; // add to resistance %

RESBlight:                  number; // reduces actual damage
RESCurse:                   number; // reduces actual damage
RESPoison:                  number; // reduces actual damage
```

```ts
ABABleed:                   number;
ABACurse:                   number;
ABADisease:                 number;
ABAFrostbite:               number;
ABAPoison:                  number;
```

```ts
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

# Music progression
```ts
MP_FinalNotePerfectXPBonus: number;
MP_GroupXPBonus:            number;
MP_IgnoreMissedNotes:       number;
MP_OpeningNotesPerfect:     number;
MP_RakeReduction:           number;
MP_SoloXPBonus:             number;
```


```ts
AdditionalDamage?:          string;
AppendToTooltip?:           string;
AttributeModifiers?:        string; // unused attribute mods e.g. Constitution=5

BaseDamageModifier:         number;
BaseDamageType?:            string;

IsAdditiveDamage:           boolean;
DamagePercentage:           number;
DamageType?:                string;
WeaponEffectType?:          string;
PreferHigherScaling:        boolean;
ScalingDexterity:           number;
ScalingFocus:               number;
ScalingIntelligence:        number;
ScalingStrength:            number;


DisableDurabilityLoss:      boolean; // durable perk
DurabilityMod:              number; // fishing pole durability

Encumbrance:                number; // extra pockets
FishRarityRollModifier:     number; // boost to better fish
FishSizeRollModifier:       number; // boost to larger fish
FishingLineStrength:        number; // adds to fishing line strength (is negative value)
GatheringEfficiency:        number; // not on any perk

StaminaRate:                number; // restore stamina rate
ManaRate:                   number; // restore mana rate
MaxCastDistance:            number; // fishing rod
MaxHealthMod:               number; //
MaxManaMod:                 number; // 
MaxStaminaMod:              number; // hearty

FastTravelEncumbranceMod:   number; // unused (on perks)
StaminaDamageModifier:      number; // unused (on perks)
UseCountMultiplier:         number; // unused (on perks)
WeightMultiplier:           number; // unused (on perks)
```
