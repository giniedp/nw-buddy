# Perks

```ts
PerkID:                  string; // ID of perk
IconPath:                string;
Description:             string;
Category?:               string; // MusicalPerformances (the only category)
DisplayName:             string; // perk name
AppliedPrefix?:          string; // prefix that is added to item name
AppliedSuffix?:          string; // suffix that is added to item name
PerkType:                PerkType; // Inherent (attributes), Gem (gems), Generated (item perks)
ItemClass:               ItemClass[]; // item classes on which this perk is allowed
ExcludeItemClass?:       string[]; // item classes on which this perk is forbidden
Tier:                    number; // Gem Tier
GroupName?:              string; // group name of gems of different tiers
ExclusiveLabels?:        string[];
```

# Deprecations
Some perks have been reworked but old versions still exist in the database

```ts
DeprecatedPerkId?:       string; // the id of the new perk version
ExcludeFromTradingPost?: string; // hides old version from trading post search
```

# Condition
```ts
ConditionEvent:          ConditionEvent; // OnActive OnEqup OnUnsheathed
FishingWaterType?:       string; // active in specific water type (Fresh, Salt)
DayPhases?:              DayPhases; // active on specific day time (Day, Night)
```
`ConditionEvent` is somewhat unclear
- `OnActive` perks are active when weapon is equpped and selected (regardless of sheathed or not)
- `OnUnsheathed` perks are active when weapon is unsheathed
- `OnEquip` perks are active when item is equpped

however all gems have `OnEquip`. This would include inactive (secondary) weapon.


## Scaling

The GSBonus is added to an item GS only if the item class matches

$perkMultiplier = 1 + (ItemClassGSBonus + gearScore - 100) * ScalingPerGearScore$

```ts
ScalingPerGearScore:     number;   // Per GS multiplier for attached ability or affix
ItemClassGSBonus?:       string;   // e.g. VoidGauntlet:500
```

## Attachments
```ts
Affix?:                  string;   // attach affix properties
EquipAbility?:           string[]; // apply abilities
```

## ?
```ts
Channel:                 number; // 1-4
WeaponTag?:              string; // some perks have it, some not. (obsolete?)
```
