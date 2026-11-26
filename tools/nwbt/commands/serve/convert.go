package serve

import (
	"bufio"
	"bytes"
	"fmt"
	"image/png"
	"log/slog"
	"net/url"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/formats/musicsheet"
	"nw-buddy/tools/formats/waterqt"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/slicemodel"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/math"
	"os"
	"path"
	"slices"
	"strconv"
	"strings"

	"golang.org/x/image/tiff"
)

type convertParams struct {
	file   nwfs.File    // file to convert
	assets *game.Assets // game assets for resolving dependencies and loading data
	target string       // desired output format, e.g. ".gltf", ".png", etc.
	query  url.Values   // query parameters from the request, used for additional instructions like resizing
}

func convertFile(params convertParams) ([]byte, error) {
	file := params.file
	targetFormat := params.target

	if targetFormat == "" {
		return params.file.Read()
	}

	filePath := params.file.Path()
	if dds.IsDDSSplitPart(filePath) {
		return convertDDS(params)
	}

	switch path.Ext(filePath) {
	case ".datasheet":
		return convertDatasheet(params)
	case ".dds":
		return convertDDS(params)
	case ".tif":
		return convertTif(params)
	case ".heightmap":
		return convertHeightmap(params)
	case ".waterqt":
		return convertWaterqt(params)
	case ".cgf", ".skin":
		return convertCGF(params)
	case ".caf":
		return convertCAF(params)
	case ".cdf":
		return convertCDF(params)
	case ".dynamicslice":
		if isModelTarget(targetFormat) {
			return convertSliceToModel(params)
		}
	case ".distribution":
		return convertDistribution(params)
	case ".musicsheetc":
		return convertMusicSheet(params)
	case ".mtl":
		return convertMTL(params)
	case ".xml":
		if strings.HasSuffix(file.Path(), ".loc.xml") {
			return convertLocale(params)
		}
	case ".luac":
		return convertLua(params)
	}
	return convertAny(params)
}

func convertDatasheet(params convertParams) ([]byte, error) {

	file := params.file
	target := params.target

	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	switch target {
	case "":
		return data, nil
	case ".json":
		record, err := datasheet.Parse(data)
		if err != nil {
			return nil, err
		}
		return record.ToJSON("", " ")
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertTif(params convertParams) ([]byte, error) {

	file := params.file
	target := params.target

	switch target {
	case "", ".tif":
		return file.Read()
	case ".png":
		data, err := file.Read()
		if err != nil {
			return nil, err
		}
		img, err := tiff.Decode(bytes.NewReader(data))
		if err != nil {
			return nil, err
		}
		buf := &bytes.Buffer{}
		err = png.Encode(buf, img)
		if err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertDDS(params convertParams) ([]byte, error) {
	assets := params.assets
	file := params.file
	target := params.target
	query := params.query

	switch target {
	case "", ".dds":
		if query.Get("merge") == "false" {
			// serve the unmerged base file (or attached alpha file): the original header,
			// but only the smallest mips, the larger ones are stored in the split files
			return file.Read()
		}
		size, _ := strconv.Atoi(query.Get("size"))
		var img *dds.Image
		var err error
		if query.Get("merge") == "partial" {
			// mips up to `size` with the original header, see dds.LoadPartial
			img, err = dds.LoadPartial(file, size)
		} else {
			img, err = dds.Load(file, size)
		}
		if err != nil {
			return nil, err
		}
		if dds.IsDDSAlpha(file.Path()) && img.Alpha != nil {
			return img.Alpha, nil
		}
		if !dds.IsDDSAlpha(file.Path()) && img.Data != nil {
			return img.Data, nil
		}
		return nil, fmt.Errorf("failed to load dds")
	case ".png", ".webp":
		format := image.Format(target)
		size, _ := strconv.Atoi(query.Get("size"))
		//cacheDir := imageCacheDir(flg.CacheDir, uint(size))
		loader := image.LoaderWithConverter{
			Archive: assets.Archive,
			Catalog: assets.Catalog,
			//Cache:   image.NewCache(cacheDir, string(format)),
			Converter: image.BasicConverter{
				Format:  format,
				MaxSize: uint(size),
			},
		}
		if img, err := loader.LoadImage(file.Path()); err != nil {
			return nil, err
		} else if dds.IsDDSAlpha(file.Path()) {
			return img.Alpha, nil
		} else {
			return img.Data, nil
		}
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertHeightmap(params convertParams) ([]byte, error) {

	file := params.file
	target := params.target

	switch target {
	case "", ".heightmap":
		return file.Read()
	case ".png":
		img, err := heightmap.LoadImage(file)
		if err != nil {
			return nil, err
		}
		buf := &bytes.Buffer{}
		err = png.Encode(buf, img)
		if err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertWaterqt(params convertParams) ([]byte, error) {

	file := params.file
	target := params.target

	switch target {
	case "", ".waterqt":
		return file.Read()
	case ".xml":
		return convertAny(params)
	case ".png":

		doc, err := waterqt.Load(file)
		if err != nil {
			return nil, err
		}
		hm, err := doc.ToHeightmap()
		if err != nil {
			return nil, err
		}
		buf := &bytes.Buffer{}
		if err := hm.EncodePNG(buf); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertCGF(params convertParams) ([]byte, error) {
	assets := params.assets
	file := params.file
	target := params.target
	query := params.query

	if target == targetRawZip {
		return convertRawZip(params)
	}
	if !isModelTarget(target) {
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}

	group := importer.AssetGroup{}
	model := file.Path()
	material := query.Get("material")
	model, material = assets.ResolveCgfAndMtl(model, material)
	group.Geometries = append(group.Geometries, importer.GeometryAsset{
		GeometryFile: model,
		MaterialFile: material,
	})
	return convertGltf(assets, group, target == ".glb", params)
}

func convertCAF(params convertParams) ([]byte, error) {
	assets := params.assets
	file := params.file
	target := params.target

	if !isModelTarget(target) {
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}

	group := importer.AssetGroup{}
	model := file.Path()

	filePath := file.Path()
	group.Animations = append(group.Animations, importer.AnimationAsset{
		File: model,
		Name: utils.ReplaceExt(path.Base(filePath), path.Ext(filePath)),
	})
	return convertGltf(assets, group, target == ".glb", params)
}

func convertCDF(params convertParams) ([]byte, error) {
	assets := params.assets
	file := params.file
	target := params.target

	if !isModelTarget(target) {
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}

	model := file.Path()
	cdfModel, err := assets.LoadCdf(model)
	if err != nil {
		return nil, err
	}

	animations, _ := CollectAnimations(assets, cdfModel)
	group := importer.AssetGroup{
		Extra: map[string]any{
			"animationList": animations,
		},
	}
	selected, err := selectedAnimations(params.query)
	if err != nil {
		return nil, err
	}
	group.Animations = selected

	for _, mesh := range cdfModel.SkinAndClothAttachments() {
		model, material := assets.ResolveCgfAndMtl(mesh.Binding, mesh.Material)
		if model != "" {
			group.Geometries = append(group.Geometries, importer.GeometryAsset{
				GeometryFile: model,
				MaterialFile: material,
			})
		}
	}
	return convertGltf(assets, group, target == ".glb", params)
}

// selectedAnimations are the clips the `animations` query asks to export with a character: a json array of
// `{"name", "file"}`, the name is the glTF animation name. Only .caf files, others are skipped.
func selectedAnimations(query url.Values) ([]importer.AnimationAsset, error) {
	value := query.Get(QUERY_ANIMATIONS)
	if value == "" {
		return nil, nil
	}
	var list []importer.AnimationAsset
	if err := json.UnmarshalJSON([]byte(value), &list); err != nil {
		return nil, fmt.Errorf("invalid %s parameter: %w", QUERY_ANIMATIONS, err)
	}
	result := make([]importer.AnimationAsset, 0, len(list))
	for _, it := range list {
		if strings.ToLower(path.Ext(it.File)) != ".caf" {
			slog.Warn("export animation skipped, not a .caf", "file", it.File)
			continue
		}
		result = append(result, importer.AnimationAsset{File: nwfs.NormalizePath(it.File), Name: it.Name})
	}
	return result, nil
}

func CollectAnimations(assets *game.Assets, cdf *cdf.Document) ([]adb.AnimationFile, error) {
	animations, err := cdf.LoadAnimationFiles(assets.Archive)
	if err != nil {
		return nil, err
	}
	result := make([]adb.AnimationFile, 0)
	for _, animation := range animations {
		switch animation.Type {
		case adb.Caf:
			result = append(result, adb.AnimationFile{
				Name: animation.Name,
				File: animation.File,
				Type: adb.Caf,
			})
		}
	}
	return result, nil
}

func convertMTL(params convertParams) ([]byte, error) {
	assets := params.assets
	file := params.file
	target := params.target

	// addMesh := isTrueParam(params.query.Get("mesh"))

	if !isModelTarget(target) {
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
	group := importer.AssetGroup{}
	material := file.Path()

	// all sub materials in collection order, so that the gltf material index is the sub material index (EXT_nw_mtl_ref)
	group.Materials = append(group.Materials, material)

	collection, err := assets.LoadMaterial(material)
	if err != nil {
		return nil, err
	}
	modelFile, ok := assets.Archive.Lookup("engineassets/objects/default/primitive_plane.cgf")
	if !ok {
		return nil, fmt.Errorf("model file not found: %s", "engineassets/objects/default/primitive_plane.cgf")
	}
	gap := 0.1  // gap between planes
	step := 1.0 // size of the plane
	// count := float64(len(collection))
	for i, mtl := range collection {
		x := float32(float64(i) * (step + gap))
		group.Geometries = append(group.Geometries, importer.GeometryAsset{
			Entity: importer.Entity{
				Name: fmt.Sprintf("material_%d_%s", i, mtl.Name),
				Transform: [16]float32{
					1, 0, 0, 0,
					0, 1, 0, 0,
					0, 0, 1, 0,
					x, 0, 0, 1,
				},
			},
			GeometryFile:          modelFile.Path(),
			MaterialFile:          material,
			OverrideMaterialIndex: &i,
		})
	}

	return convertGltf(assets, group, target == ".glb", params)
}

func convertSliceToModel(params convertParams) ([]byte, error) {
	assets := params.assets
	file := params.file
	target := params.target

	if !isModelTarget(target) {
		return nil, fmt.Errorf("unsupported target format x: %s", target)
	}
	base := math.GetBase(params.query.Has(QUERY_YUP))

	group := importer.AssetGroup{}
	slicemodel.Collect(assets, file, slicemodel.Options{Convert: base.Mat4, KeepSkin: true}, &group)
	return convertGltf(assets, group, target == ".glb", params)
}

func convertGltf(assets *game.Assets, group importer.AssetGroup, binary bool, params convertParams) ([]byte, error) {
	opts := parseModelExportOptions(params.query, params.target)

	document := gltf.NewDocument()
	document.Extras = group.Extra
	zipDir, err := setupTextures(document, assets, opts, params.target)
	if err != nil {
		return nil, err
	}
	if zipDir != "" {
		defer os.RemoveAll(zipDir)
	}

	document.Options = gltf.ImportOptions{
		Base:            math.GetBase(params.query.Has(QUERY_YUP)),
		LoadGeometry:    assets.LoadAsset,
		LoadAnimation:   assets.LoadAnimation,
		LoadMaterials:   assets.LoadMaterial,
		Simplify:        false,
		Quantize:        opts.quantize,
		SkipLod:         params.query.Has(QUERY_NO_LOD),
		SkipHelper:      true, // removes $physics $auto nodes
		SkipShadowProxy: params.query.Has(QUERY_NO_PROXY),
		KeepNoDraw:      opts.keepNoDraw,
		SkipUnlinkedMtl: false,
	}
	if opts.lodAll {
		for _, geom := range slices.Clone(group.Geometries) {
			for _, lod := range lodSiblings(assets, geom.GeometryFile) {
				group.Geometries = append(group.Geometries, importer.GeometryAsset{
					Entity:                geom.Entity,
					GeometryFile:          lod,
					MaterialFile:          geom.MaterialFile,
					Joint:                 geom.Joint,
					SkipSkin:              geom.SkipSkin,
					OverrideMaterialIndex: geom.OverrideMaterialIndex,
				})
			}
		}
	}

	// materials first, so they keep their collection index when geometries add the same materials
	for _, mats := range group.Materials {
		document.ImportMaterialCollection(mats)
	}
	for _, geom := range group.Geometries {
		if geom.Joint == "" {
			document.ImportAssetGeometry(geom)
		}
	}
	// after the geometries: the skins of the parts merge into one skeleton, the animations target its joints by
	// controller id
	if len(group.Animations) > 0 {
		document.MergeSkins()
	}
	// the joints of the merged skeleton
	for _, geom := range group.Geometries {
		if geom.Joint != "" {
			document.ImportAssetGeometry(geom)
		}
	}
	for _, anim := range group.Animations {
		document.ImportAssetAnimations(anim)
	}
	document.ApplyPose(group.Pose)

	materialOptions := []func(*gltf.ImportCgfMaterialsOptions){
		gltf.WithEmissiveRef(opts.emissiveRef),
		gltf.WithSpecularIOR(opts.specularIOR),
	}
	if opts.textures == "embed" || opts.textures == "dds" {
		// png pixels are available (dds: through BakeImageLoader): bake roughness and emissive
		materialOptions = append(materialOptions, gltf.WithTextureBaking(true))
	}
	document.ProcessMaterials(materialOptions...)
	if zipDir != "" {
		return encodeGltfZip(document, zipDir)
	}
	var b bytes.Buffer
	w := bufio.NewWriter(&b)
	if err := document.Encode(w, binary); err != nil {
		return nil, err
	}
	w.Flush()
	return b.Bytes(), nil
}

func convertLocale(params convertParams) ([]byte, error) {

	file := params.file
	target := params.target

	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	switch target {
	case "":
		return data, nil
	case ".json":
		record, err := loc.Parse(data)
		if err != nil {
			return nil, err
		}
		return record.ToJSON("", " ")
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertDistribution(params convertParams) ([]byte, error) {

	file := params.file
	target := params.target

	switch target {
	case ".json":
		doc, err := distribution.Load(file)
		if err != nil {
			return nil, err
		}
		return json.MarshalJSON(doc, "", "\t")
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

// convertMusicSheet: a music sheet of the musical performances as json (difficulty, notes with key, track, time)
func convertMusicSheet(params convertParams) ([]byte, error) {
	switch params.target {
	case ".json":
		sheet, err := musicsheet.Load(params.file)
		if err != nil {
			return nil, err
		}
		return json.MarshalJSON(sheet, "", "\t")
	default:
		return nil, fmt.Errorf("unsupported target format: %s", params.target)
	}
}

func convertAny(params convertParams) ([]byte, error) {

	file := params.file
	target := params.target

	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	if azcs.IsBinaryObjectStream(data) {
		return convertBinaryObjectStream(data, target)
	}
	if azcs.IsXmlObjectStream(data) {
		return convertXmlObjectStream(data, target)
	}

	return nil, fmt.Errorf("unsupported target format: %s", target)
}

func convertBinaryObjectStream(data []byte, target string) ([]byte, error) {
	switch target {
	case "":
		return data, nil
	case ".json":
		object, err := azcs.Parse(data)
		if err != nil {
			return nil, err
		}
		out, err := rtti.ObjectStreamToJSON(object, crcTable, uuidTable)
		return out, err
	case ".xml":
		object, err := azcs.Parse(data)
		if err != nil {
			return nil, err
		}
		out, err := rtti.ObjectStreamToXml(object, crcTable, uuidTable)
		return out, err
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertXmlObjectStream(data []byte, target string) ([]byte, error) {
	switch target {
	case "":
		return data, nil
	case ".json":
		doc, err := azcs.ParseXml(data)
		if err != nil {
			return nil, err
		}
		out, err := rtti.ObjectStreamXmlToJSON(doc, uuidTable)
		return out, err
	case ".xml":
		return data, nil
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func imageCacheDir(cacheDir string, maxSize uint) string {
	if maxSize > 0 {
		cacheDir = path.Join(cacheDir, fmt.Sprintf("%d", maxSize))
	}
	return cacheDir
}

var luacSig = []byte{0x04, 0x00, 0x1b, 0x4c, 0x75, 0x61}

func convertLua(params convertParams) ([]byte, error) {

	file := params.file
	target := params.target

	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	switch target {
	case "":
		return data, nil
	case ".lua":
		if bytes.Equal(luacSig, data[:len(luacSig)]) {
			data = data[2:]
		}

		inputFile, err := copyToTemp(data, ".luac", flg.TempDir)
		defer os.Remove(inputFile)
		if err != nil {
			return nil, err
		}

		result, err := utils.Unluac.Run(inputFile, utils.LuacOpt{})
		if err != nil {
			return nil, err
		}
		return result, nil
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func copyToTemp(data []byte, ext, dir string) (string, error) {
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return "", err
	}
	file, err := os.CreateTemp(dir, "*"+ext)
	if err != nil {
		return "", err
	}
	defer file.Close()

	_, err = file.Write(data)
	if err != nil {
		return "", err
	}
	return strings.ReplaceAll(file.Name(), "\\", "/"), nil
}

func isTrueParam(param string) bool {
	switch param {
	case "1", "true", "yes":
		return true
	}
	return false
}
