package pull

import (
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/str"
	"os"
	"path"
	"strconv"

	"github.com/spf13/cobra"
)

var cmdPullConstants = &cobra.Command{
	Use:   "constants",
	Short: "Pulls constants from the game files",
	Long:  "",
	Run:   runPullConstants,
}

func runPullConstants(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullConstants()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullConstants(fs nwfs.Archive, outDir string) {
	attrFile, ok := fs.Lookup("sharedassets/genericassets/playerbaseattributes.pbadb")
	if !ok {
		slog.Error("playerbaseattributes.pbadb not found")
		return
	}

	attrObj, err := azcs.Load(attrFile)
	if err != nil {
		slog.Error("failed to load playerbaseattributes.pbadb", "err", err)
		return
	}

	doc, err := rtti.Load(attrObj.Elements[0])
	if err != nil {
		slog.Error("failed to load playerbaseattributes.pbadb", "err", err)
		return
	}

	encumbranceFile, ok := fs.Lookup("sharedassets/springboardentitites/datatables/javelindata_encumbrancelimits.datasheet")
	if !ok {
		slog.Error("javelindata_encumbrancelimits.datasheet not found")
		return
	}
	encData, err := datasheet.Load(encumbranceFile)
	if err != nil {
		slog.Error("failed to load javelindata_encumbrancelimits.datasheet", "err", err)
		return
	}
	encRows := encData.RowsAsJSON()

	expansionFile, ok := fs.Lookup("sharedassets/springboardentitites/datatables/javelindata_expansions.datasheet")
	if !ok {
		slog.Error("javelindata_expansions.datasheet not found")
		return
	}
	expData, err := datasheet.Load(expansionFile)
	if err != nil {
		slog.Error("failed to load javelindata_expansions.datasheet", "err", err)
		return
	}

	constants := maps.NewSafeDict[any]()
	attr, ok := doc.(nwt.PlayerBaseAttributes)
	if !ok {
		slog.Error("playerbaseattributes.pbadb is not a PlayerBaseAttributes")
		return
	}

	pad := attr.Player_attribute_data
	constants.Store("NW_MIN_GEAR_SCORE", int(pad.Min_possible_weapon_gear_score))
	constants.Store("NW_MIN_ARMOR_MITIGATION", float32(pad.Min_armor_mitigation))
	constants.Store("NW_MAX_ARMOR_MITIGATION", float32(pad.Max_armor_mitigation))
	constants.Store("NW_PHYSICAL_ARMOR_SCALE_FACTOR", float32(pad.Physical_armor_scale_factor))
	constants.Store("NW_ELEMENTAL_ARMOR_SCALE_FACTOR", float32(pad.Elemental_armor_scale_factor))
	constants.Store("NW_ARMOR_SET_RATING_EXPONENT", float32(pad.Armor_set_rating_exponent))
	constants.Store("NW_ARMOR_MITIGATION_EXPONENT", float32(pad.Armor_mitigation_exponent))
	constants.Store("NW_ARMOR_RATING_DECIMAL_ACCURACY", int(pad.Armor_rating_decimal_accuracy))
	constants.Store("NW_BASE_DAMAGE_COMPOUND_INCREASE", float32(pad.Base_damage_compound_increase))
	constants.Store("NW_COMPOUND_INCREASE_DIMINISHING_MULTIPLIER", float32(pad.Compound_increase_diminishing_multiplier))
	constants.Store("NW_BASE_DAMAGE_GEAR_SCORE_INTERVAL", int(pad.Base_damage_gear_score_interval))
	constants.Store("NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE", int(pad.Min_possible_weapon_gear_score))
	constants.Store("NW_DIMINISHING_GEAR_SCORE_THRESHOLD", int(pad.Diminishing_gear_score_threshold))
	constants.Store("NW_ROUND_GEARSCORE_UP", bool(pad.Round_gearscore_up_))
	constants.Store("NW_GEAR_SCORE_ROUNDING_INTERVAL", int(pad.Gear_score_rounding_interval))
	constants.Store("NW_MAX_POINTS_PER_ATTRIBUTE", int(pad.Max_points_per_attribute))
	constants.Store("NW_LEVEL_DAMAGE_MULTIPLIER", float32(pad.Level_damage_multiplier))

	constants.Store("NW_ITEM_RARITY_DATA", mapSlice(pad.Item_rarity_data.Element, func(rarity nwt.ItemRarityData) any {
		return map[string]any{
			"displayName":  string(rarity.Rarity_level_loc_string),
			"maxPerkCount": int(rarity.Max_perk_count),
		}
	}))

	constants.Store("NW_CRAFTING_RESULT_LOOT_BUCKET", string(pad.Perk_generation_data.Crafting_result_loot_bucket))
	constants.Store("NW_ROLL_PERK_ON_UPGRADE_GS", int(pad.Perk_generation_data.Roll_perk_on_upgrade_gs))
	constants.Store("NW_ROLL_PERK_ON_UPGRADE_TIER", int(pad.Perk_generation_data.Roll_perk_on_upgrade_tier))
	constants.Store("NW_ROLL_PERK_ON_UPGRADE_PERK_COUNT", int(pad.Perk_generation_data.Roll_perk_on_upgrade_perk_count))

	constants.Store("NW_PERK_GENERATION_DATA", mapSlice(pad.Perk_generation_data.Perk_data_per_tier.Element, func(perk nwt.PerkTierData) any {
		return map[string]any{
			"maxPerkChannel":           int(perk.Max_perk_channel),
			"attributePerkProbability": float32(perk.Attribute_perk_probability),
			"generalGearScorePerkCount": mapSlice(perk.General_gear_score_perk_count.Element, func(it nwt.UUID_14F31861_6045_5B62_B6D2_1FA6DA976FB8) any {
				return mapSlice(it.Value2.Element, func(e nwt.AZStd__pair_5) any {
					return map[string]any{
						"v1": int(e.Value1),
						"v2": int(e.Value2),
					}
				})
			}),
			"craftingGearScorePerkCount": mapSlice(perk.Crafting_gear_score_perk_count.Element, func(it nwt.UUID_14F31861_6045_5B62_B6D2_1FA6DA976FB8) any {
				return mapSlice(it.Value2.Element, func(e nwt.AZStd__pair_5) any {
					return map[string]any{
						"v1": int(e.Value1),
						"v2": int(e.Value2),
					}
				})
			}),
			"attributePerkBucket": string(perk.Attribute_perk_bucket),
		}
	}))

	for _, row := range encRows {
		if row.GetString("ContainerTypeID") == "Player" {
			constants.Store("NW_EQUIP_LOAD_RATIO_FAST", row.GetNumber("EquipLoadRatioFast"))
			constants.Store("NW_EQUIP_LOAD_RATIO_NORMAL", row.GetNumber("EquipLoadRatioNormal"))
			constants.Store("NW_EQUIP_LOAD_RATIO_SLOW", row.GetNumber("EquipLoadRatioSlow"))
			constants.Store("NW_EQUIP_LOAD_DAMAGE_MULT_FAST", row.GetNumber("EquipLoadDamageMultFast"))
			constants.Store("NW_EQUIP_LOAD_DAMAGE_MULT_NORMAL", row.GetNumber("EquipLoadDamageMultNormal"))
			constants.Store("NW_EQUIP_LOAD_DAMAGE_MULT_SLOW", row.GetNumber("EquipLoadDamageMultSlow"))
			constants.Store("NW_EQUIP_LOAD_HEAL_MULT_FAST", row.GetNumber("EquipLoadHealMultFast"))
			constants.Store("NW_EQUIP_LOAD_HEAL_MULT_NORMAL", row.GetNumber("EquipLoadHealMultNormal"))
			constants.Store("NW_EQUIP_LOAD_HEAL_MULT_SLOW", row.GetNumber("EquipLoadHealMultSlow"))
		}
	}

	maxGS := 0
	maxLevel := 0
	maxTradeLevel := 0
	maxCraftGs := 0

	for _, row := range expData.RowsAsJSON() {
		maxGS = max(maxGS, row.GetInt("MaxEquipGS"))
		maxLevel = max(maxLevel, row.GetInt("MaxDisplayLevel"))
		maxTradeLevel = max(maxTradeLevel, row.GetInt("MaxTradeskillLevel"))
		maxCraftGs = max(maxCraftGs, row.GetInt("MaxCraftGS"))
	}
	constants.Store("NW_MAX_GEAR_SCORE", maxGS)
	constants.Store("NW_MAX_CHARACTER_LEVEL", maxLevel)
	constants.Store("NW_MAX_TRADESKILL_LEVEL", maxTradeLevel)
	constants.Store("NW_MAX_CRAFT_GEAR_SCORE", maxCraftGs)

	sb := str.NewBuilder()
	for k, v := range constants.Iter() {
		switch v := v.(type) {
		case string:
			sb.Line("export const %s = %s", k, strconv.Quote(v))
		case int:
			sb.Line("export const %s = %v", k, v)
		case float32:
			sb.Line("export const %s = %v", k, v)
		case bool:
			sb.Line("export const %s = %v", k, v)
		default:
			data, _ := json.MarshalJSON(v, "", "\t")
			sb.Line("export const %s = Object.freeze(%s)", k, string(data))
		}
	}
	outFile := path.Join(outDir, "constants.ts")
	if err := os.WriteFile(outFile, []byte(sb.String()), os.ModePerm); err != nil {
		panic(err)
	}
}

func mapSlice[Slice ~[]E, E any, T any](s Slice, fn func(E) T) []T {
	result := make([]T, 0, len(s))
	for _, v := range s {
		result = append(result, fn(v))
	}
	return result
}
