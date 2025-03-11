package game

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"
	"sync"
)

type Assets struct {
	Catalog catalog.Document
	Archive nwfs.Archive

	objectCache sync.Map
	sheetCache  sync.Map
}

func InitPackedAssets(gameDir string) (*Assets, error) {
	archive, err := nwfs.NewPakFS(gameDir)
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

func (ctx *Assets) ResolveDynamicSliceNameToFile(sliceName string) nwfs.File {
	if sliceName == "" || sliceName == "<PLOT>" {
		return nil
	}
	sliceName = strings.ToLower(sliceName)
	sliceName = strings.ReplaceAll(sliceName, "\\", "/")
	sliceName = strings.ReplaceAll(sliceName, "//", "/")

	fileName := sliceName
	if path.Ext(fileName) == "" {
		fileName += ".dynamicslice"
	}

	file, ok := ctx.Archive.LookupBySuffix(fileName)
	if !ok {
		slog.Debug("slice not resolved", "name", sliceName, "file", fileName)
	}
	return file
}
