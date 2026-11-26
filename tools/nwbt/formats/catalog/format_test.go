package catalog_test

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"testing"

	"github.com/stretchr/testify/require"
)

func getCatalog(t *testing.T) (*catalog.Document, nwfs.Archive) {
	fs, err := nwfs.NewPackedArchive(env.GameDir())
	require.NoError(t, err)

	file, ok := fs.Lookup("assetcatalog.catalog")
	require.True(t, ok)

	data, err := file.Read()
	require.NoError(t, err)

	doc, err := catalog.Parse(data)
	require.NoError(t, err)

	return doc, fs

}
func TestLoad(t *testing.T) {
	doc, _ := getCatalog(t)

	total := 0
	for asset := range doc.All() {
		total++
		require.Same(t, asset, doc.LookupById(asset.AssetId))
		require.Contains(t, doc.AllByGuid(asset.Guid), asset)
	}
	require.Greater(t, total, 0)
}

func TestParseID(t *testing.T) {
	asset, ok := catalog.ParseAssetId("ad7a9b3e-e77f-57fa-9173-eeaf4f865eef")
	require.True(t, ok)
	require.Equal(t, "ad7a9b3e-e77f-57fa-9173-eeaf4f865eef", asset.Guid)
	require.Equal(t, uint32(0), asset.SubID)

	asset, ok = catalog.ParseAssetId("ad7a9b3e-e77f-57fa-9173-eeaf4f865eef:2")
	require.True(t, ok)
	require.Equal(t, "ad7a9b3e-e77f-57fa-9173-eeaf4f865eef", asset.Guid)
	require.Equal(t, uint32(2), asset.SubID)

	asset, ok = catalog.ParseAssetId("ad7a9b3e-e77f-57fa-9173-eeaf4f865eef:ff60")
	require.True(t, ok)
	require.Equal(t, "ad7a9b3e-e77f-57fa-9173-eeaf4f865eef", asset.Guid)
	require.Equal(t, uint32(65376), asset.SubID)

	asset, ok = catalog.ParseAssetId("{ad7a9b3e-e77f-57fa-9173-eeaf4f865eef}:ff60")
	require.True(t, ok)
	require.Equal(t, "ad7a9b3e-e77f-57fa-9173-eeaf4f865eef", asset.Guid)
	require.Equal(t, uint32(65376), asset.SubID)

	asset, ok = catalog.ParseAssetId("ad7a9b3ee77f57fa9173eeaf4f865eef")
	require.True(t, ok)
	require.Equal(t, "ad7a9b3e-e77f-57fa-9173-eeaf4f865eef", asset.Guid)
	require.Equal(t, uint32(0), asset.SubID)
}

func TestParseUUIDprefixToInt(t *testing.T) {

	value, err := catalog.ParseUUIDprefixToInt("00000002-0000-0000-0000-000000000000")
	require.NoError(t, err)
	require.Equal(t, uint32(2), value)

	value, err = catalog.ParseUUIDprefixToInt("00000002")
	require.NoError(t, err)
	require.Equal(t, uint32(2), value)

	value, err = catalog.ParseUUIDprefixToInt("ff60")
	require.NoError(t, err)
	require.Equal(t, uint32(65376), value)

}

func TestLookup(t *testing.T) {
	doc, _ := getCatalog(t)

	asset := doc.Lookup("3276a4fc-b8bb-551e-94d4-b45c210bd0a7", 0)
	require.NotNil(t, asset)
	require.Equal(t, "objects/crafting/architecture/refining_structures/stonemason/textures/jav_struc_refining_stonemason_ddna_lod3.dds", asset.File)

	asset = doc.Lookup("3276a4fc-b8bb-551e-94d4-b45c210bd0a7", 327680)
	require.NotNil(t, asset)
	require.Equal(t, "objects/crafting/architecture/refining_structures/stonemason/textures/jav_struc_refining_stonemason_ddna_lod3.dds.5", asset.File)
}

func TestMaterialTextures(t *testing.T) {
	slog.SetDefault(logging.DefaultFileHandler())

	doc, fs := getCatalog(t)
	materials, _ := fs.Glob("**.mtl")
	for _, file := range materials {
		mtl, err := mtl.Load(file)
		require.NoError(t, err)
		for _, m := range mtl.Collection() {
			for tex := range m.IterTextures() {
				if tex.AssetId == "" {
					continue
				}

				assetId, ok := catalog.ParseAssetId(tex.AssetId)
				if !ok {
					slog.Debug("failed to parse asset id", "assetId", tex.AssetId, "material", m.Name, "file", file)
					continue
				}
				asset := doc.LookupById(assetId)
				if asset == nil {
					slog.Debug("asset not found", "assetId", assetId, "material", m.Name, "file", file)
				}
			}
		}
	}
}
