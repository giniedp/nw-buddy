package ts

import (
	"context"
	"log/slog"
	"nw-buddy/tools/commands/pull/tx"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
	"path"
	"strconv"
	"strings"
)

var ITEM_CLASS_FIXES = map[string]string{
	"2hAxe":       "2HAxe",
	"Greatsword":  "GreatSword",
	"Heartgem":    "HeartGem",
	"Pickaxe":     "PickAxe",
	"spear":       "Spear",
	"named":       "Named",
	"roundShield": "RoundShield",
	"flail":       "Flail",
	"light":       "Light",
	"medium":      "Medium",
}

var COMPARE_TYPE_FIXES = map[string]string{
	"LessthanOrEqual": "LessThanOrEqual",
}
var STATUS_EFFECT_CAT_FIXES = map[string]string{
	// there is DoT and Dot, normalize to Dot
	"DoT": "Dot",
}

func TransformTable(table *datasheet.Document, ctx context.Context) error {
	return tx.TransformTable(table, RULES, ctx)
}

var RULES = []tx.Rule{
	{
		Transforms: []tx.Transformer{
			tx.MapValue{
				Op: transformImagePathColumn,
			},
		},
	},
	{
		Schema: "SeasonsRewardData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep:  ",",
				Keys: []string{"EntitlementIds"},
			},
		},
	},
	{
		Schema: "GameModeData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"PossibleItemDropIds",
					"PossibleItemDropIdsByLevel01",
					"LootTags",
					"MutLootTagsOverride",
				},
			},
		},
	},
	{
		Schema: "BackstoryDefinition",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"ObjectiveUnlockOverride",
					"AchievementUnlockOverride",
					"WeaponMasteries",
					"CategoricalProgression",
					"RespawnPointTerritories",
					"InventoryItem",
				},
			},
		},
	},
	{
		Schema: "VitalsBaseData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"VitalsCategories",
					"LootTags",
				},
			},
			tx.NullifyProps{
				Keys: []string{
					"FoodBaseMax",
					"FoodInitial",
					"FoodBaseTickRate",
					"FoodTickDelay",
					"FoodFullyDepletedDelay",
					"FoodLowerThreshold",
					"FoodUpperThreshold",
					"DrinkMin",
					"DrinkInitial",
					"DrinkBaseMax",
					"DrinkBaseTickRate",
					"DrinkTickDelay",
					"DrinkFullyDepletedDelay",
					"DrinkLowerThreshold",
					"DrinkUpperThreshold",
				},
			},
		},
	},
	{
		Schema: "TerritoryDefinition",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"LootTags",
				},
			},
		},
	},
	{
		Schema: "MutationDifficultyStaticData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"InjectedLootTags",
				},
			},
		},
	},
	{
		Schema: "LootBucketData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep:   ",",
				Match: []string{`Tags\d+`},
			},
			tx.MapProp{
				KeyMatch: []string{`MatchOne\d+`},
				Op: func(key string, value any) any {
					if v, ok := value.(string); ok {
						if strings.EqualFold(v, "TRUE") {
							return true
						}
						if strings.EqualFold(v, "FALSE") {
							return false
						}
					}
					return value
				},
			},
			tx.NullifyProps{
				KeyMatch: []string{`(MatchOne|Quantity)\d+`},
				Test: func(key string, value any) bool {
					switch v := value.(type) {
					case string:
						return v == "" || v == "0" || strings.EqualFold(v, "FALSE")
					case bool:
						return !v
					case float32:
						return v == 0
					case float64:
						return v == 0
					default:
						return false
					}
				},
			},
		},
	},
	{
		Schema: "LootTablesData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep:  ",",
				Keys: []string{"Conditions"},
			},
		},
	},
	{
		Schema: "PvPStoreData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep:   ",",
				Match: []string{`Tag\d`},
			},
		},
	},
	{
		Schema: "DamageData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep:  ",",
				Keys: []string{"StatusEffect"},
			},
		},
	},
	{
		Schema: "EntitlementData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep:  "+",
				Keys: []string{"Reward(s)"},
			},
		},
	},
	{
		Schema: "ConsumableItemDefinitions",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: "+",
				Keys: []string{
					"AddStatusEffects",
					"RemoveStatusEffectCategories",
					"RemoveStatusEffects",
				},
			},
		},
	},
	{
		Schema: "ArmorAppearanceDefinitions",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: "+",
				Keys: []string{
					"ItemClass",
				},
				Map: func(value string) string {
					if v, ok := ITEM_CLASS_FIXES[value]; ok {
						return v
					}
					return value
				},
			},
		},
	},
	{
		Schema: "WeaponAppearanceDefinitions",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: "+",
				Keys: []string{
					"ItemClass",
				},
				Map: func(value string) string {
					if v, ok := ITEM_CLASS_FIXES[value]; ok {
						return v
					}
					return value
				},
			},
		},
	},
	{
		Schema: "SpellData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"StatusEffects",
					"StatusEffectsOnTargetBlockingThisSpell",
				},
			},
		},
	},
	{
		Schema: "AbilityData",
		Transforms: []tx.Transformer{
			tx.MapProp{
				Keys: []string{"NumberOfHitsComparisonType"},
				Op: func(key string, value any) any {
					if str, ok := value.(string); ok {
						str = strings.ReplaceAll(str, "&#160;", "")
						str = COMPARE_TYPE_FIXES[str]
						return str
					}
					return value
				},
			},
			tx.MapProp{
				Keys: []string{"Icon"},
				Op: func(key string, value any) any {
					if str, ok := value.(string); ok && strings.EqualFold(str, "bowAbility5_mod2") {
						return nil
					}
					return value
				},
			},
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"AbilityList",
					"AfterSequence",
					"AttachedTargetSpellIds",
					"AttackType",
					"DamageTableRow",
					"DamageTableRowOverride",
					"DamageTypes",
					"DontHaveStatusEffect",
					"EquipLoadCategory",
					"InSequence",
					"ManaCostList",
					"OnEquipStatusEffect",
					"OtherApplyStatusEffect",
					"RemoteDamageTableRow",
					"RemoveTargetStatusEffectsList",
					"SelfApplyStatusEffect",
					"StaminaCostList",
					"StatusEffectCategories",
					"StatusEffectCategoriesList",
					"StatusEffectDurationCats",
					"StatusEffectsList",
					"TargetStatusEffectCategory",
					"TargetStatusEffectDurationCats",
					"TargetStatusEffectDurationList",
				},
			},
		},
	},
	{
		Schema: "MasterItemDefinitions",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: "+",
				Keys: []string{
					"ItemClass",
				},
				Map: func(value string) string {
					if v, ok := ITEM_CLASS_FIXES[value]; ok {
						return v
					}
					return value
				},
			},
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"IngredientCategories",
				},
			},
			tx.MapPropToArray{
				Sep: ",+",
				Keys: []string{
					"SalvageLootTags",
				},
			},
			tx.NullifyProps{
				Keys: []string{
					"AudioPickup",
					"AudioPlace",
					"AudioUse",
					"AudioCreated",
				},
			},
		},
	},
	{
		Schema: "VariationData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",+",
				Keys: []string{
					"HousingTags",
					"HousingTag1 Placed",
					"HousingTag2 Points",
					"HousingTag3 Limiter",
					"HousingTag5 Buffs",
				},
			},
		},
	},
	{
		Schema: "PerkData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: "+",
				Keys: []string{
					"ItemClass",
				},
				Map: func(value string) string {
					if v, ok := ITEM_CLASS_FIXES[value]; ok {
						return v
					}
					return value
				},
			},
			tx.MapPropToArray{
				Sep: "+",
				Keys: []string{
					"ExclusiveLabels",
					"ExcludeItemClass",
				},
			},
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"EquipAbility",
				},
			},
		},
	},
	{
		Schema: "StatusEffectCategoryData",
		Transforms: []tx.Transformer{
			tx.MapProp{
				Keys: []string{"ValueLimits"},
				Op: func(key string, value any) any {
					var str string
					if v, ok := value.(string); ok {
						str = v
					} else {
						return value
					}

					result := maps.NewDict[float32]()
					if str == "" {
						return result
					}

					parts := strings.Split(str, ",")
					for _, part := range parts {
						kv := strings.SplitN(part, ":", 2)
						if len(kv) != 2 {
							slog.Warn("failed to split value limit", "value", part)
							continue
						}
						limit, err := strconv.ParseFloat(strings.TrimSpace(kv[1]), 32)
						if err != nil {
							slog.Warn("failed to parse value limit", "value", kv[1], "error", err)
						}
						result.Store(kv[0], float32(limit))
					}
					return result.ToMap()
				},
			},
		},
	},
	{
		Schema: "StatusEffectData",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: "+",
				Keys: []string{
					"EffectCategories",
					"RemoveStatusEffectCategories",
				},
				Map: func(value string) string {
					if v, ok := STATUS_EFFECT_CAT_FIXES[value]; ok {
						return v
					}
					return value
				},
			},
			tx.MapPropToArray{
				Sep: ",+",
				Keys: []string{
					"RemoveStatusEffects",
					"EffectDurationMods",
					"RemoveStatusEffectCategories",
					"PauseInGameModesList",
				},
			},
		},
	},
	{
		Schema: "TerritoryDefinition",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"LootTags",
					"VitalsCategory",
					"POITag",
				},
			},
		},
	},
	{
		Schema: "AttributeDefinition",
		Transforms: []tx.Transformer{
			tx.MapPropToArray{
				Sep: ",",
				Keys: []string{
					"EquipAbilities",
				},
			},
		},
	},
	{
		Schema: "VariationData",
		Transforms: []tx.Transformer{
			tx.NullifyProps{
				Keys: []string{
					"AOIRadius",
					"AudioPreload_Depletion",
					"BaseSlice",
					"Collision_Play_SFX",
					"Collision_Stop_SFX",
					"CollisionFX",
					"DepletedMat",
					"DepletedMesh",
					"DepletedSFX",
					"DepletedVFX",
					"DetectableRadius",
					"EndMeshLOD",
					"GatheringRadius",
					"InteractionHeight",
					"InteractionRadius",
					"MarkerRadius",
					"NPC_IdleAnimTimeline",
					"NPC_RunawayTimeline",
					"NPC_Visuals",
					"StartMat",
					"StartMesh",
					"StartMeshLOD",
					"VegAreaClearRadius",
					"VegAreaDataSet",
					"VegAreaInnerRadius",
					"VegAreaOuterRadius",
					"AudioPreload_Burst_1",
					"AudioPreload_Burst_2",
					"AudioPreload_Burst_3",
					"AudioPreload_depleted",
					"AudioPreload_loop",
					"BottomMat",
					"BottomMesh",
					"DepletedVFX",
					"GatheringFX",
					"InteractionMarker_Offset_X",
					"InteractionMarker_Offset_Y",
					"InteractionMarker_Offset_Z",
					"SFX_Burst_1",
					"SFX_Burst_2",
					"SFX_Burst_3",
					"SFX_depleted",
					"SFX_Idle",
					"TopMat",
					"TopMesh_TransformZ",
					"TopMesh",
					"VFX_Idle",
					"Visuals_Healthy",
					"Visual_Healthy",
					"Visual_Depleted",
					"Visual_Frame",
					"VFX_Burst_1",
					"VFX_Burst_2",
					"VFX_Burst_3",
					"EnableBurstParticle1",
					"EnableBurstParticle2",
					"EnableBurstParticle3",
					"Depleted_SFX",
					"DetectableObjectRadius",
					"IdleVFX",
					"Visual_Loot",
					"InteractionX",
					"InteractionY",
					"InteractionZ",
					"DetectableX",
					"DetectableY",
					"DetectableZ",
					"MarkerX",
					"MarkerY",
					"MarkerZ",
				},
			},
		},
	},
	{
		Schema: "VitalsCategoryData",
		Transforms: []tx.Transformer{
			tx.NullifyProps{
				Keys: []string{
					"LocStringGenerationHelper",
				},
			},
		},
	},
}

func transformImagePathColumn(ctx context.Context, key string, value any, row int) any {
	format := ".webp" // TODO: pass into context?
	sheet, _ := datasheet.GetDocument(ctx)
	valueStr, isString := value.(string)

	if sheet == nil {
		if isString {
			return transformImagePathValue(valueStr, format)
		}
		return value
	}

	if strings.EqualFold(sheet.Schema, "CraftingCategoryData") && strings.EqualFold(key, "ImagePath") {
		if valueStr == "" {
			return value
		}
		return transformImagePathValue(path.Join("lyshineui", "images", valueStr), format)
	}

	if strings.EqualFold(sheet.Schema, "MasterItemDefinitions") && (strings.EqualFold(key, "IconPath") || strings.EqualFold(key, "HiResIconPath")) {
		fs, ok := nwfs.GetArchive(ctx)
		if !ok || fs == nil {
			return value
		}
		docs, ok := datasheet.GetDocumentList(ctx)
		if !ok || docs == nil {
			return value
		}

		itemID, _ := sheet.GetValueStr(row, "ItemID")
		iconM, _ := sheet.GetValueStr(row, "ArmorAppearanceM")
		iconF, _ := sheet.GetValueStr(row, "ArmorAppearanceF")
		iconWpn, _ := sheet.GetValueStr(row, "WeaponAppearanceOverride")
		candidates := make([]string, 0, 4)
		candidates = utils.AppendUniqNoZero(candidates, getAppearanceIcon(strings.TrimSpace(iconM), docs, key))
		candidates = utils.AppendUniqNoZero(candidates, getAppearanceIcon(strings.TrimSpace(iconF), docs, key))
		candidates = utils.AppendUniqNoZero(candidates, strings.TrimSpace(valueStr))
		candidates = utils.AppendUniqNoZero(candidates, getAppearanceIcon(strings.TrimSpace(iconWpn), docs, key))

		if len(candidates) == 0 {
			return ""
		}

		for _, icon := range candidates {
			if file, ok := fs.Lookup(icon); ok {
				return utils.ReplaceExt(file.Path(), format)
			}
			if file, ok := fs.Lookup(utils.ReplaceExt(icon, ".dds")); ok {
				return utils.ReplaceExt(file.Path(), format)
			}
		}

		slog.Debug("missing icon", "itemID", itemID, "column", key, "tried", candidates)
		return ""
	}

	if isString {
		return transformImagePathValue(valueStr, format)
	}
	return value
}

func getAppearanceIcon(id string, tables []*datasheet.Document, key string) string {
	if id == "" {
		return ""
	}
	for _, table := range tables {
		idKey := ""
		if table.Schema == "ArmorAppearanceDefinitions" {
			idKey = "ItemID"
		}
		if table.Schema == "WeaponAppearanceDefinitions" {
			idKey = "WeaponAppearanceID"
		}
		if idKey == "" {
			continue
		}

		for i, _ := range table.Rows {
			idValue, _ := table.GetValueStr(i, idKey)
			if !strings.EqualFold(idValue, id) {
				continue
			}
			res, _ := table.GetValueStr(i, key)
			return res
		}
	}
	return ""
}

func transformImagePathValue(value string, format string) string {
	if !strings.HasPrefix(strings.ToLower(value), "lyshineui") {
		return value
	}
	if format == "" {
		format = ".webp"
	}
	value = nwfs.NormalizePath(value)
	value = utils.ReplaceExt(value, format)
	return value
}
