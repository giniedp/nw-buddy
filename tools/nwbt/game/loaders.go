package game

import (
	"errors"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
)

var (
	ErrNotFound = errors.New("not found")
)

func (it *Assets) LoadObjectStream(file nwfs.File) (any, error) {
	key := file.Path()
	if res, ok := it.objectCache.Load(key); ok {
		return res, nil
	}

	weight := file.Stat().Size()
	node, err := LoadObjectStream(file)
	if err != nil {
		slog.Debug(fmt.Sprintf("no root element in file '%s'", key))
		it.objectCache.Store(key, nil, 0)
		return nil, err
	}
	it.objectCache.Store(key, node, weight)
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
	node, err := it.LoadObjectStream(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.AZ__Entity); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Assets) LoadWorldMaterial(file nwfs.File) (*nwt.WorldMaterialDataAsset, error) {
	node, err := it.LoadObjectStream(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.WorldMaterialDataAsset); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Assets) LoadRegionMaterial(file nwfs.File) (*nwt.RegionMaterialDataAsset, error) {
	node, err := it.LoadObjectStream(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.RegionMaterialDataAsset); ok {
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
	node, err := it.LoadObjectStream(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.RegionSliceDataLookup); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Assets) LoadAliasAsset(file nwfs.File) (*nwt.AliasAsset, error) {
	node, err := it.LoadObjectStream(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.AliasAsset); ok {
		return &v, nil
	}
	return nil, nil
}

func (it *Assets) LookupFileByAssetIdRef(assetIdRef string) (nwfs.File, error) {
	assetId, isAssetId := catalog.ParseAssetId(assetIdRef)
	if !isAssetId || assetId.IsZeroOrEmpty() {
		return nil, nil
	}

	asset := it.Catalog.LookupById(assetId)
	if asset == nil {
		return nil, fmt.Errorf("asset ref '%v' does not exist in catalog: %w", assetIdRef, ErrNotFound)
	}

	return it.LookupFile(asset.File)
}

func (it *Assets) LookupFileByAssetId(id nwt.AssetId) (nwfs.File, error) {
	assetId := catalog.ToAssetId(string(id.Guid), uint(id.SubId))
	if assetId.IsZeroOrEmpty() {
		return nil, nil
	}

	asset := it.Catalog.Lookup(string(id.Guid), uint(id.SubId))
	if asset == nil {
		return nil, fmt.Errorf("asset id '%v' does not exist in catalog: %w", id, ErrNotFound)
	}

	return it.LookupFile(asset.File)
}

func (it *Assets) LookupFileByAsset(azAsset nwt.AzAsset) (nwfs.File, error) {
	if catalog.UUID(azAsset.Guid).IsZeroOrEmpty() {
		return nil, nil
	}

	asset := it.Catalog.Find(azAsset.Guid, azAsset.Subid, azAsset.Type, azAsset.Hint)
	if asset == nil {
		return nil, fmt.Errorf("asset '%v' does not exist in catalog: %w", azAsset, ErrNotFound)
	}

	return it.LookupFile(asset.File)
}

func (c *Assets) LoadCdf(cdfFile string) (*cdf.Document, error) {
	f, err := c.LookupFile(cdfFile)
	if err != nil {
		return nil, err
	}

	doc, err := cdf.Load(f)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (c *Assets) LoadAdb(adbFile string) (*adb.Document, error) {
	f, err := c.LookupFile(adbFile)
	if err != nil {
		return nil, err
	}

	doc, err := adb.Load(f)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (c *Assets) LoadAnimation(anim importer.AnimationAsset) *cgf.File {
	f, err := c.LookupFile(anim.File)
	if err != nil {
		slog.Warn("animation file not found", "file", anim.File)
		return nil
	}
	doc, err := cgf.Load(f)
	if err != nil {
		slog.Warn("animation not loaded", "file", anim.File, "err", err)
		return nil
	}
	return doc
}

func (c *Assets) LoadGeometry(geometryFile string) (*cgf.File, error) {
	f, err := c.LookupFile(geometryFile)
	if err != nil {
		return nil, err
	}
	return cgf.Load(f)
}

func (c *Assets) LoadMaterial(materialFile string) ([]mtl.Material, error) {
	f, err := c.LookupFile(materialFile)
	if err != nil {
		return nil, err
	}
	material, err := mtl.Load(f)
	if err != nil {
		return nil, err
	}
	return material.Collection(), nil
}

func (c *Assets) LoadAsset(mesh importer.GeometryAsset) (*cgf.File, []byte, []mtl.Material) {
	modelFile, ok := c.Archive.Lookup(mesh.GeometryFile)
	if !ok {
		slog.Warn("Model file not found", "file", mesh.GeometryFile)
		return nil, nil, nil
	}

	heapFile, ok := c.Archive.Lookup(mesh.GeometryFile + "heap")
	var heap []byte
	if ok {
		heap, _ = heapFile.Read()
	}

	model, err := cgf.Load(modelFile)
	if err != nil {
		slog.Warn("Model not loaded", "file", mesh.GeometryFile, "err", err)
		return nil, nil, nil
	}

	mtlFile, ok := c.Archive.Lookup(mesh.MaterialFile)
	if !ok {
		slog.Warn("Material not found", "material", mesh.MaterialFile, "model", mesh.GeometryFile, "name", mesh.Name)
		return nil, nil, nil
	}

	material, err := mtl.Load(mtlFile)
	if err != nil {
		slog.Warn("Material not loaded", "file", mesh.MaterialFile, "err", err)
		return nil, nil, nil
	}

	materials := material.Collection()
	return model, heap, materials
}

func (c *Assets) LookupFile(path string) (nwfs.File, error) {
	file, ok := c.Archive.Lookup(path)
	if !ok {
		return nil, fmt.Errorf("file not found in archive: %s: %w", path, ErrNotFound)
	}
	return file, nil
}
