package scan

import (
	"fmt"

	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"path"
	"strings"
	"sync"
)

type Scanner struct {
	Archive     nwfs.Archive
	Catalog     catalog.Document
	objectCache map[string]any
	sheetCache  map[string]datasheet.JSONRows
	cache       map[string]any
	mu          sync.RWMutex
	results     ScanResults
}

func (it *Scanner) Results() ScanResults {
	return it.results
}

func NewScanner(archive nwfs.Archive) (*Scanner, error) {
	catalogFile, ok := archive.Lookup("assetcatalog.catalog")
	if !ok {
		return nil, fmt.Errorf("asset catalog not found")
	}
	catalog, err := catalog.Load(catalogFile)
	if err != nil {
		return nil, fmt.Errorf("failed to load asset catalog: %v", err)
	}

	return &Scanner{
		Archive:     archive,
		Catalog:     catalog,
		objectCache: make(map[string]any),
		sheetCache:  make(map[string]datasheet.JSONRows),
		cache:       make(map[string]any),
	}, nil
}

func (it *Scanner) LoadAzcs(file nwfs.File) (any, error) {
	it.mu.Lock()
	defer it.mu.Unlock()

	key := file.Path()
	if res, ok := it.objectCache[key]; ok {
		return res, nil
	}

	node, err := LoadObject(file)
	if err != nil {
		slog.Debug(fmt.Sprintf("no root element in file '%s'", key))
		it.objectCache[key] = nil
	}
	it.objectCache[key] = node
	return node, nil

}

func (it *Scanner) LoadDatasheet(file nwfs.File) (datasheet.JSONRows, error) {
	it.mu.Lock()
	defer it.mu.Unlock()

	key := file.Path()
	if res, ok := it.sheetCache[key]; ok {
		return res, nil
	}

	sheet, err := datasheet.Load(file)
	if err != nil {
		it.sheetCache[key] = nil
		return nil, fmt.Errorf("scanner can't load datasheet '%s': %w", file.Path(), err)
	}
	it.sheetCache[key] = sheet.RowsAsJSON()
	return it.sheetCache[key], nil
}

func (it *Scanner) LoadEntity(file nwfs.File) (*nwt.AZ__Entity, error) {
	node, err := it.LoadAzcs(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.AZ__Entity); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Scanner) LoadSliceComponent(file nwfs.File) (*nwt.SliceComponent, error) {
	entity, err := it.LoadEntity(file)
	if entity == nil || err != nil {
		return nil, err
	}
	return FindSliceComponent(entity), nil
}

func (it *Scanner) LoadRegionSliceData(file nwfs.File) (*nwt.RegionSliceDataLookup, error) {
	node, err := it.LoadAzcs(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.RegionSliceDataLookup); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Scanner) LoadAliasAsset(file nwfs.File) (*nwt.AliasAsset, error) {
	node, err := it.LoadAzcs(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.AliasAsset); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Scanner) LookupFileByAssetId(id nwt.AssetId) (nwfs.File, error) {
	uuid := string(id.Guid)
	if uuid == "" || uuid == "00000000-0000-0000-0000-000000000000" {
		return nil, nil
	}
	asset := it.Catalog[strings.ToLower(uuid)]
	if asset == nil {
		return nil, fmt.Errorf("asset id does not exist in catalog: %v", id)
	}
	file, ok := it.Archive.Lookup(asset.File)
	if ok {
		return file, nil
	}
	return nil, fmt.Errorf("asset does not exist in archive: %v", asset)
}

func (it *Scanner) LookupFileByAsset(azAsset nwt.AzAsset) (nwfs.File, error) {
	uuid := string(azAsset.Guid)

	if azAsset.Hint != "" {
		// hint seems to be most reliable for our use case

		file, ok := it.Archive.Lookup(strings.ToLower(azAsset.Hint))
		if ok {
			return file, nil
		}
		if path.Ext(azAsset.Hint) == ".slice" {
			file, ok = it.Archive.Lookup(strings.ToLower(utils.ReplaceExt(azAsset.Hint, ".dynamicslice")))
			if ok {
				return file, nil
			}
		}
	}

	if uuid == "" || uuid == "00000000-0000-0000-0000-000000000000" {
		return nil, nil
	}

	asset := it.Catalog[strings.ToLower(uuid)]
	if asset == nil {
		return nil, fmt.Errorf("asset id does not exist in catalog: %v", azAsset)
	}

	file, ok := it.Archive.Lookup(asset.File)
	if ok {
		return file, nil
	}

	return nil, fmt.Errorf("asset does not exist in archive: %v", asset)
}

func (it *Scanner) FindPrefabPathForAmmoId(ammoId string) string {
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
	for _, row := range rec {
		if row.GetString("AmmoID") == ammoId {
			return row.GetString("PrefabPath")
		}
	}
	return ""
}

func (ctx *Scanner) ResolveDynamicSliceNameToFile(sliceName string) nwfs.File {
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
