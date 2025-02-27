package pull

import (
	"bytes"
	"fmt"
	"log/slog"
	"nw-buddy/tools/nw-kit/formats/datasheet"
	"nw-buddy/tools/nw-kit/utils"
	"nw-buddy/tools/nw-kit/utils/progress"
	"path"
	"strings"
)

func pullSearch(tables []*datasheet.Document, locales *utils.Record[*utils.Record[string]], outDir string) {

	progress.RunTasks(progress.TasksConfig[string, *Blob]{
		Description:   "Search index",
		Tasks:         locales.Keys(),
		ProducerCount: int(flgWorkerCount),
		Producer: func(locale string) (output *Blob, err error) {
			dict, _ := locales.Get(locale)
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

			var buf bytes.Buffer
			buf.WriteRune('[')
			for i, item := range index.rows {
				buf.WriteRune('\n')
				data, err := utils.MarshalJSON(item)
				if err != nil {
					slog.Error("Failed to marshal search data", "err", err)
					continue
				}
				buf.Write([]byte(strings.TrimSpace(string(data))))
				if i < len(index.rows)-1 {
					buf.WriteRune(',')
				}
			}
			buf.WriteRune('\n')
			buf.WriteRune(']')

			output = &Blob{
				Path: path.Join(outDir, locale+".json"),
				Data: buf.Bytes(),
			}
			return
		},
		ConsumerCount: 1,
		Consumer:      writeBlob,
	})
}

type SearchIndex struct {
	tables []*datasheet.Document
	dict   *utils.Record[string]

	rows    []SearchItem
	skipped int
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
	value, _ := it.dict.Get(key)
	return value
}

// func (it *SearchIndex) getNumber(table *datasheet.Document, row int, col string) *float32 {
//   v, err := table.GetValue(row, col)
//   if err != nil {
//     return nil
//   }
//   return fmt.Sprintf("%v", v)
// }

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
		for row := range table.Rows {
			it.add(SearchItem{
				ID:    it.getString(table, row, "ItemID"),
				Type:  "item",
				Text:  it.getLocalizedString(table, row, "Name"),
				Icon:  it.getString(table, row, "IconPath"),
				Named: isNamed,
				// Rarity TODO: get rarity
				// Tier: table.TryGetInt(row, "Tier"),
				// GS: table.TryGetString(row, "GearScore"),
			})
		}
	}
}

func (it *SearchIndex) indexHousingItems() {
	for _, table := range it.tables {
		if table.Table != "HouseItems" && table.Table != "HouseItemsMTX" {
			continue
		}
		for row := range table.Rows {
			it.add(SearchItem{
				ID:   it.getString(table, row, "HouseItemID"),
				Type: "housing",
				Text: it.getLocalizedString(table, row, "Name"),
				Icon: it.getString(table, row, "IconPath"),
				// tier: item.Tier,
				// rarity: getItemRarity(item),
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
