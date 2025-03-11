package game

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"path"
	"strings"
)

func (it *Assets) LoadAzcs(file nwfs.File) (any, error) {
	key := file.Path()
	if res, ok := it.objectCache.Load(key); ok {
		return res, nil
	}

	node, err := LoadObject(file)
	if err != nil {
		slog.Debug(fmt.Sprintf("no root element in file '%s'", key))
		it.objectCache.Store(key, nil)
		return nil, err
	}
	it.objectCache.Store(key, node)
	return node, nil
}

func (it *Assets) LoadDatasheet(file nwfs.File) (*datasheet.Document, error) {
	key := file.Path()
	if res, ok := it.sheetCache.Load(key); ok {
		return res.(*datasheet.Document), nil
	}

	sheet, err := datasheet.Load(file)
	if err != nil {
		it.sheetCache.Store(key, nil)
		return nil, err
	}
	it.sheetCache.Store(key, &sheet)
	return &sheet, nil
}

func (it *Assets) LoadEntity(file nwfs.File) (*nwt.AZ__Entity, error) {
	node, err := it.LoadAzcs(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.AZ__Entity); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Assets) LoadSliceComponent(file nwfs.File) (*nwt.SliceComponent, error) {
	entity, err := it.LoadEntity(file)
	if entity == nil || err != nil {
		return nil, err
	}
	return FindSliceComponent(entity), nil
}

func (it *Assets) LoadRegionSliceData(file nwfs.File) (*nwt.RegionSliceDataLookup, error) {
	node, err := it.LoadAzcs(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.RegionSliceDataLookup); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Assets) LoadAliasAsset(file nwfs.File) (*nwt.AliasAsset, error) {
	node, err := it.LoadAzcs(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.AliasAsset); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Assets) LookupFileByAssetId(id nwt.AssetId) (nwfs.File, error) {
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

func (it *Assets) LookupFileByAsset(azAsset nwt.AzAsset) (nwfs.File, error) {
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
