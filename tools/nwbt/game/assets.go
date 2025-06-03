package game

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/progress"
	"strings"
	"sync"
)

type Assets struct {
	Catalog *catalog.Document
	Archive nwfs.Archive

	objectCache sync.Map
	sheetCache  sync.Map
}

func InitPackedAssets(gameDir string) (*Assets, error) {
	archive, err := nwfs.NewPackedArchive(gameDir)
	if err != nil {
		return nil, err
	}

	bar := progress.Bar(0, "Loading catalog")
	defer bar.Close()
	file, _ := archive.Lookup(catalog.CATALOG_PATH)
	doc, err := catalog.Load(file)
	if err != nil {
		return nil, err
	}
	bar.Close()
	result := &Assets{
		Catalog: doc,
		Archive: archive,
	}
	return result, nil
}

func (it *Assets) FindPrefabPathForAmmoId(ammoId string) string {
	if ammoId == "" {
		return ""
	}
	file, ok := it.Archive.Lookup("sharedassets/springboardentitites/datatables/javelindata_itemdefinitions_ammo.datasheet")
	if !ok {
		slog.Warn("ammo datasheet not found")
		return ""
	}
	rec, err := it.LoadDatasheet(file)
	if rec == nil {
		slog.Warn("ammo datasheet not loaded", "err", err)
		return ""
	}

	for _, row := range rec.RowsAsJSON() {
		if row.GetString("AmmoID") == ammoId {
			return row.GetString("PrefabPath")
		}
	}
	return ""
}

func (it *Assets) FindTableRow(tableName string, idKey string, id string) *datasheet.JSONRow {
	for sheet := range it.EachDatasheet() {
		if !strings.EqualFold(sheet.Table, tableName) {
			continue
		}
		for _, row := range sheet.RowsAsJSON() {
			if strings.EqualFold(row.GetString(idKey), id) {
				return &row
			}
		}
	}
	return nil
}
