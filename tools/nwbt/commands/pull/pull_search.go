package pull

import (
	"bytes"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"path"
	"slices"
	"strings"

	"github.com/dustin/go-humanize"
	"github.com/spf13/cobra"
)

var cmdPullSearch = &cobra.Command{
	Use:   TASK_SEARCH,
	Short: "Generates search index files",
	Long:  "",
	Run:   runPullSearch,
}

func runPullSearch(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullSearch()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullSearch(tables []*datasheet.Document, locales *maps.SafeDict[*maps.SafeDict[string]], outDir string) {

	sizes := maps.NewSafeDict[int]()
	counts := maps.NewSafeDict[int]()
	progress.RunTasks(progress.TasksConfig[string, *Blob]{
		Description:   "Search index",
		Tasks:         locales.Keys(),
		ProducerCount: int(flgWorkerCount),
		Producer: func(locale string) (output *Blob, err error) {
			dict, _ := locales.Load(locale)
			index := &SearchIndex{
				tables: tables,
				dict:   dict,
			}
			index.indexItems()
			index.indexHousingItems()
			// index.indexCrafting()
			index.indexPerks()
			index.indexAbilities()
			index.indexStatusEffects()
			index.indexPOI()
			index.indexQuests()
			index.indexVitals()
			index.indexMounts()
			index.indexAppearance()
			index.indexWeaponAppearance()
			index.indexTerritories()

			data, err := index.MarshalJSON()
			output = &Blob{
				Path: path.Join(outDir, locale+".json"),
				Data: data,
			}
			sizes.Store(locale, len(output.Data))
			counts.Store(locale, len(index.rows))
			return
		},
		ConsumerCount: 1,
		Consumer:      writeBlob,
	})

	for lang := range locales.Iter() {
		stats.Add("Search "+lang, "count", counts.Get(lang), "size", humanize.Bytes(uint64(sizes.Get(lang))))
	}
}

type SearchIndex struct {
	tables []*datasheet.Document
	dict   *maps.SafeDict[string]

	rows    []SearchItem
	skipped int
}

func (it *SearchIndex) MarshalJSON() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteRune('[')
	for i, item := range it.rows {
		if i > 0 {
			buf.WriteRune(',')
		}
		buf.WriteRune('\n')
		data, err := json.MarshalJSON(item)
		if err != nil {
			return nil, err
		}
		buf.Write([]byte(strings.TrimSpace(string(data))))
	}
	buf.WriteRune('\n')
	buf.WriteRune(']')
	return buf.Bytes(), nil
}

type SearchItem struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	SubType string `json:"subtype,omitempty"`
	Text    string `json:"text"`
	Icon    string `json:"icon,omitempty"`
	Named   bool   `json:"named,omitzero"`
	Rarity  string `json:"rarity,omitempty"`
	Tier    int    `json:"tier,omitzero"`
	GS      string `json:"gs,omitzero"`
}

func (it *SearchIndex) getString(table *datasheet.Document, row int, col string) string {
	v, err := table.GetValue(row, col)
	if err != nil {
		return ""
	}
	return fmt.Sprintf("%v", v)
}

func (it *SearchIndex) getLocalizedString(table *datasheet.Document, row int, col string) string {
	key := it.getString(table, row, col)
	key = strings.TrimPrefix(key, "@")
	key = strings.ToLower(key)
	value, _ := it.dict.Load(key)
	return value
}

func (it *SearchIndex) add(item SearchItem) {
	if item.Text == "" || item.ID == "" {
		it.skipped++
		return
	}
	it.rows = append(it.rows, item)
}

func (it *SearchIndex) indexItems() {
	for _, table := range it.tables {
		if table.Schema != "MasterItemDefinitions" {
			continue
		}
		isNamed := table.Table == "MasterItemDefinitions_Named"
		rows := table.RowsAsJSON()
		for ri, row := range rows {
			it.add(SearchItem{
				ID:     row.GetString("ItemID"),
				Type:   "item",
				Text:   it.getLocalizedString(table, ri, "Name"),
				Icon:   row.GetString("IconPath"),
				Named:  isNamed,
				Rarity: getItemRarity(row),
				Tier:   row.GetInt("Tier"),
				GS:     getItemGearScoreLabel(row),
			})
		}
	}
}

func (it *SearchIndex) indexHousingItems() {
	for _, table := range it.tables {
		if table.Table != "HouseItems" && table.Table != "HouseItemsMTX" {
			continue
		}
		rows := table.RowsAsJSON()
		for ri, row := range rows {
			it.add(SearchItem{
				ID:     row.GetString("HouseItemID"),
				Type:   "housing",
				Text:   it.getLocalizedString(table, ri, "Name"),
				Icon:   row.GetString("IconPath"),
				Tier:   row.GetInt("Tier"),
				Rarity: getItemRarity(row),
			})
		}
	}
}

func (it *SearchIndex) indexCrafting() {
	for _, table := range it.tables {
		if table.Schema != "CraftingRecipeData" {
			continue
		}
		for row := range table.Rows {
			it.add(SearchItem{
				ID:   it.getString(table, row, "RecipeID"),
				Type: "crafting",
				Text: it.getLocalizedString(table, row, "RecipeNameOverride"),
				//
			})
		}
	}
}

func (it *SearchIndex) indexPerks() {
	for _, table := range it.tables {
		if table.Schema != "PerkData" {
			continue
		}
		for row := range table.Rows {
			name := it.getLocalizedString(table, row, "DisplayName")
			if name == "" {
				name = it.getLocalizedString(table, row, "SecondaryEffectDisplayName")
			}
			it.add(SearchItem{
				ID:   it.getString(table, row, "PerkID"),
				Type: "perk",
				Text: name,
				Icon: it.getString(table, row, "IconPath"),
			})
		}
	}
}

func (it *SearchIndex) indexAbilities() {
	for _, table := range it.tables {
		if table.Schema != "AbilityData" {
			continue
		}
		for row := range table.Rows {
			it.add(SearchItem{
				ID:   it.getString(table, row, "AbilityID"),
				Type: "ability",
				Text: it.getLocalizedString(table, row, "DisplayName"),
				Icon: it.getString(table, row, "Icon"),
			})
		}
	}
}

func (it *SearchIndex) indexStatusEffects() {
	for _, table := range it.tables {
		if table.Schema != "StatusEffectData" {
			continue
		}
		for row := range table.Rows {
			icon := it.getString(table, row, "IconPath")
			if icon == "" {
				icon = it.getString(table, row, "PlaceholderIcon")
			}

			it.add(SearchItem{
				ID:   it.getString(table, row, "StatusID"),
				Type: "statuseffect",
				Text: it.getLocalizedString(table, row, "DisplayName"),
				Icon: icon,
			})
		}
	}
}

func (it *SearchIndex) indexPOI() {
	for _, table := range it.tables {
		if table.Schema != "TerritoryDefinition" {
			continue
		}
		for row := range table.Rows {
			icon := it.getString(table, row, "MapIcon")
			if icon == "" {
				icon = it.getString(table, row, "CompassIcon")
			}

			it.add(SearchItem{
				ID:   it.getString(table, row, "TerritoryID"),
				Type: "zone",
				Text: it.getLocalizedString(table, row, "NameLocalizationKey"),
				Icon: icon,
			})
		}
	}
}

func (it *SearchIndex) indexQuests() {
	for _, table := range it.tables {
		if table.Schema != "Objectives" {
			continue
		}
		for row := range table.Rows {
			it.add(SearchItem{
				ID:      it.getString(table, row, "ObjectiveID"),
				Type:    "quest",
				SubType: it.getString(table, row, "Type"),
				Text:    it.getLocalizedString(table, row, "Title"),
				Icon:    "",
			})
		}
	}
}

func (it *SearchIndex) indexVitals() {
	for _, table := range it.tables {
		if table.Schema != "VitalsBaseData" {
			continue
		}
		for row := range table.Rows {
			it.add(SearchItem{
				ID:   it.getString(table, row, "VitalsID"),
				Type: "vital",
				Text: it.getLocalizedString(table, row, "DisplayName"),
				Icon: "",
			})
		}
	}
}

func (it *SearchIndex) indexMounts() {
	for _, table := range it.tables {
		if table.Schema != "MountData" {
			continue
		}
		for row := range table.Rows {
			name := it.getLocalizedString(table, row, "DisplayName")
			if name == "" {
				continue
			}
			it.add(SearchItem{
				ID:   it.getString(table, row, "MountId"),
				Type: "mount",
				Text: name,
				Icon: it.getString(table, row, "IconPath"),
			})
		}
	}
}

func (it *SearchIndex) indexAppearance() {
	for _, table := range it.tables {
		if table.Schema != "ArmorAppearanceDefinitions" {
			continue
		}
		for row := range table.Rows {
			// TODO:
			// if (item.Name && item.ItemClass?.length > 0) {
			it.add(SearchItem{
				ID:      it.getString(table, row, "ItemID"),
				Type:    "appearance",
				SubType: "gear",
				Text:    it.getLocalizedString(table, row, "Name"),
				Icon:    it.getString(table, row, "IconPath"),
			})
		}
	}
}

func (it *SearchIndex) indexWeaponAppearance() {
	for _, table := range it.tables {
		if table.Schema != "ArmorAppearanceDefinitions" {
			continue
		}
		isInstrument := table.Table == "InstrumentsAppearanceDefinitions"
		for row := range table.Rows {
			subType := "weapon"
			if isInstrument {
				subType = "instrument"
			}
			it.add(SearchItem{
				ID:      it.getString(table, row, "WeaponAppearanceID"),
				Type:    "appearance",
				SubType: subType,
				Text:    it.getLocalizedString(table, row, "Name"),
				Icon:    it.getString(table, row, "IconPath"),
			})
		}
	}
}

func (it *SearchIndex) indexTerritories() {
	for _, table := range it.tables {
		if table.Schema != "TerritoryDefinition" {
			continue
		}
		for row := range table.Rows {
			name := it.getLocalizedString(table, row, "NameLocalizationKey")
			if name == "" {
				continue
			}
			it.add(SearchItem{
				ID:   it.getString(table, row, "TerritoryID"),
				Type: "poi",
				Text: it.getLocalizedString(table, row, "NameLocalizationKey"),
				Icon: it.getString(table, row, "MapIcon"),
			})
		}
	}
}

var rarities = map[string]string{
	"0": "common",
	"1": "uncommon",
	"2": "rare",
	"3": "epic",
	"4": "legendary",
	"5": "artifact",
}

func getItemRarity(row datasheet.JSONRow) string {
	if value, ok := rarities[row.GetString("Rarity")]; ok {
		return value
	}
	if row.GetString("ItemID") == "" {
		return rarities["0"]
	}
	if strings.Contains(row.GetString("ItemClass"), "Artifact") {
		return rarities["5"]
	}
	perkIds := []string{
		row.GetString("Perk1"),
		row.GetString("Perk2"),
		row.GetString("Perk3"),
		row.GetString("Perk4"),
		row.GetString("Perk5"),
	}
	perkIds = slices.DeleteFunc(perkIds, func(id string) bool {
		return id == ""
	})
	switch len(perkIds) {
	case 0:
		return rarities["0"]
	case 1:
		return rarities["0"]
	case 2:
		return rarities["1"]
	case 3:
		return rarities["2"]
	case 4:
		return rarities["3"]
	default:
		return rarities["4"]
	}
}

func getItemGearScoreLabel(row datasheet.JSONRow) string {
	if v := row.GetString("GearScoreOverride"); v != "" && v != "0" {
		return v
	}
	minScore := row.GetString("MinGearScore")
	maxScore := row.GetString("MaxGearScore")
	if minScore != "" && minScore != "0" && maxScore != "" && maxScore != "0" {
		return fmt.Sprintf("%s-%s", minScore, maxScore)
	}
	if maxScore != "" && maxScore != "0" {
		return maxScore
	}
	if minScore != "" && minScore != "0" {
		return minScore
	}
	return ""
}
