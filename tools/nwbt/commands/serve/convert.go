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
	"nw-buddy/tools/formats/waterqt"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"os"
	"path"
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
		if targetFormat == ".gltf" || targetFormat == ".glb" {
			return convertSliceToModel(params)
		}
	case ".distribution":
		return convertDistribution(params)
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
		size, _ := strconv.Atoi(query.Get("size"))
		img, err := dds.Load(file, size)
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
				TempDir: flg.TempDir,
				Silent:  true,
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

	if target != ".gltf" && target != ".glb" {
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

	if target != ".gltf" && target != ".glb" {
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

	if target != ".gltf" && target != ".glb" {
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

	if target != ".gltf" && target != ".glb" {
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
	group := importer.AssetGroup{}
	material := file.Path()

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

	if target != ".gltf" && target != ".glb" {
		return nil, fmt.Errorf("unsupported target format x: %s", target)
	}
	base := math.GetBase(params.query.Has(QUERY_YUP))

	group := importer.AssetGroup{}
	for _, entity := range level.LoadEntities(assets, file.Path(), mat4.Identity()) {
		if entity.Model == "" {
			continue
		}
		if path.Ext(entity.Model) == ".cdf" {
			cdfModel, err := assets.LoadCdf(entity.Model)
			if err != nil {
				slog.Warn("CDF not loaded", "file", entity.Model, "err", err)
				continue
			}

			for _, mesh := range cdfModel.SkinAndClothAttachments() {
				model, material := assets.ResolveCgfAndMtl(mesh.Binding, mesh.Material, entity.Material)
				if model != "" {
					group.Geometries = append(group.Geometries, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: material,
					})
				}
			}
		} else {
			group.Geometries = append(group.Geometries, importer.GeometryAsset{
				Entity: importer.Entity{
					Name:      entity.Name,
					Transform: base.Mat4(entity.Transform),
				},
				GeometryFile: entity.Model,
				MaterialFile: entity.Material,
			})
		}
	}
	return convertGltf(assets, group, target == ".glb", params)
}

func convertGltf(assets *game.Assets, group importer.AssetGroup, binary bool, params convertParams) ([]byte, error) {
	cacheDir := imageCacheDir(flg.CacheDir, flg.TextureSize)

	linker := gltf.NewResourceLinker(cacheDir)
	linker.SetRelativeMode(false)
	linker.SkipWrite(true)
	// instruction to merge DDS faces
	queryParam := "merge=true"
	// instruction to resize DDS images
	if flg.TextureSize > 0 {
		queryParam = fmt.Sprintf("%s&size=%d", queryParam, flg.TextureSize)
	}
	linker.SetQueryParam(queryParam)

	document := gltf.NewDocument()
	document.Extras = group.Extra
	document.ImageLinker = linker
	document.ImageLoader = image.LoaderWithConverter{
		Archive: assets.Archive,
		Catalog: assets.Catalog,
		//Cache:   image.NewCache(cacheDir, ".png"),
		Converter: image.BasicConverter{
			Format:  ".dds",
			TempDir: flg.TempDir,
			Silent:  true,
			MaxSize: flg.TextureSize,
		},
	}

	document.Options = gltf.ImportOptions{
		Base:            math.GetBase(params.query.Has(QUERY_YUP)),
		LoadGeometry:    assets.LoadAsset,
		LoadAnimation:   assets.LoadAnimation,
		LoadMaterials:   assets.LoadMaterial,
		Simplify:        false,
		SkipLod:         params.query.Has(QUERY_NO_LOD),
		SkipHelper:      true, // removes $physics $auto nodes
		SkipShadowProxy: params.query.Has(QUERY_NO_PROXY),
		SkipUnlinkedMtl: false,
	}

	if len(group.Animations) > 0 {
		document.MergeSkins()
	}
	for _, anim := range group.Animations {
		document.ImportAssetAnimations(anim)
	}
	for _, geom := range group.Geometries {
		document.ImportAssetGeometry(geom)
	}
	for _, mats := range group.Materials {
		document.ImportMaterials(mats)
	}

	document.ProcessMaterials()
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
