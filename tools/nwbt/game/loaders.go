package game

import (
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

func (it *Assets) LoadObjectStream(file nwfs.File) (any, error) {
	key := file.Path()
	if res, ok := it.objectCache.Load(key); ok {
		return res, nil
	}

	node, err := LoadObjectStream(file)
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
		return nil, fmt.Errorf("asset id does not exist in catalog: %v", assetIdRef)
	}
	file, ok := it.Archive.Lookup(asset.File)
	if ok {
		return file, nil
	}
	return nil, fmt.Errorf("asset does not exist in archive: %v", asset)
}

func (it *Assets) LookupFileByAssetId(id nwt.AssetId) (nwfs.File, error) {
	assetId := catalog.ToAssetId(string(id.Guid), uint(id.SubId))
	if assetId.IsZeroOrEmpty() {
		return nil, nil
	}

	asset := it.Catalog.Lookup(string(id.Guid), uint(id.SubId))
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
	if catalog.UUID(azAsset.Guid).IsZeroOrEmpty() {
		return nil, nil
	}

	asset := it.Catalog.Find(azAsset.Guid, azAsset.Type, azAsset.Hint)
	if asset == nil {
		return nil, fmt.Errorf("asset id does not exist in catalog: %v", azAsset)
	}

	file, ok := it.Archive.Lookup(asset.File)
	if ok {
		return file, nil
	}

	return nil, fmt.Errorf("asset does not exist in archive: %v", asset)
}

func (c *Assets) LoadCdf(model string) (*cdf.Document, error) {
	file, ok := c.Archive.Lookup(model)
	if !ok {
		return nil, fmt.Errorf("file not found: %s", model)
	}

	doc, err := cdf.Load(file)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (c *Assets) LoadAdb(filePath string) (*adb.Document, error) {
	file, ok := c.Archive.Lookup(filePath)
	if !ok {
		return nil, fmt.Errorf("file not found: %s", filePath)
	}

	doc, err := adb.Load(file)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (c *Assets) LoadAnimation(anim importer.Animation) *cgf.File {
	mfile, ok := c.Archive.Lookup(anim.File)
	if !ok {
		slog.Warn("Animation file not found", "file", anim.File)
		return nil
	}
	doc, err := cgf.Load(mfile)
	if err != nil {
		slog.Warn("Animation not loaded", "file", anim.File, "err", err)
		return nil
	}
	return doc
}

func (c *Assets) LoadGeometry(geometryFile string) (*cgf.File, error) {
	modelFile, ok := c.Archive.Lookup(geometryFile)
	if !ok {
		return nil, fmt.Errorf("model file not found: %s", geometryFile)
	}
	return cgf.Load(modelFile)
}

func (c *Assets) LoadMaterial(materialFile string) ([]mtl.Material, error) {
	mtlFile, ok := c.Archive.Lookup(materialFile)
	if !ok {
		return nil, fmt.Errorf("material file not found: %s", materialFile)
	}
	material, err := mtl.Load(mtlFile)
	if err != nil {
		return nil, err
	}
	materials := material.Collection()
	return materials, nil
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
