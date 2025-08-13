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
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"path"
	"strconv"
	"strings"

	"golang.org/x/image/tiff"
)

func convertFile(assets *game.Assets, file nwfs.File, targetFormat string, query url.Values) ([]byte, error) {
	if targetFormat == "" {
		return file.Read()
	}

	filePath := file.Path()
	if dds.IsDDSSplitPart(filePath) {
		return convertDDS(assets, file, targetFormat, query)
	}

	switch path.Ext(filePath) {
	case ".datasheet":
		return convertDatasheet(file, targetFormat)
	case ".dds":
		return convertDDS(assets, file, targetFormat, query)
	case ".tif":
		return convertTif(assets, file, targetFormat, query)
	case ".heightmap":
		return convertHeightmap(file, targetFormat)
	case ".cgf", ".skin":
		return convertCGF(assets, file, targetFormat, query)
	case ".caf":
		return convertCAF(assets, file, targetFormat, query)
	case ".cdf":
		return convertCDF(assets, file, targetFormat)
	case ".dynamicslice":
		if targetFormat == ".gltf" || targetFormat == ".glb" {
			return convertSliceToModel(assets, file, targetFormat, query)
		}
	case ".distribution":
		return convertDistribution(file, targetFormat)
	case ".mtl":
		return convertMTL(assets, file, targetFormat, query)
	case ".xml":
		if strings.HasSuffix(file.Path(), ".loc.xml") {
			return convertLocale(file, targetFormat)
		}
	}
	return convertAny(file, targetFormat)
}

func convertDatasheet(file nwfs.File, target string) ([]byte, error) {
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

func convertTif(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
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

func convertDDS(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
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

func convertHeightmap(file nwfs.File, target string) ([]byte, error) {
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

func convertCGF(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
	if target != ".gltf" && target != ".glb" {
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}

	group := importer.AssetGroup{}
	model := file.Path()
	material := query.Get("material")
	model, material = assets.ResolveCgfAndMtl(model, material)
	group.Meshes = append(group.Meshes, importer.GeometryAsset{
		GeometryFile: model,
		MaterialFile: material,
	})
	return convertGltf(assets, group, target == ".glb")
}

func convertCAF(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
	if target != ".gltf" && target != ".glb" {
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}

	group := importer.AssetGroup{}
	model := file.Path()

	filePath := file.Path()
	group.Animations = append(group.Animations, importer.Animation{
		File: model,
		Name: utils.ReplaceExt(path.Base(filePath), path.Ext(filePath)),
	})
	return convertGltf(assets, group, target == ".glb")
}

func convertCDF(assets *game.Assets, file nwfs.File, target string) ([]byte, error) {
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
			group.Meshes = append(group.Meshes, importer.GeometryAsset{
				GeometryFile: model,
				MaterialFile: material,
			})
		}
	}
	return convertGltf(assets, group, target == ".glb")
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

func convertMTL(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
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
		group.Meshes = append(group.Meshes, importer.GeometryAsset{
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

	return convertGltf(assets, group, target == ".glb")
}

func convertSliceToModel(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
	if target != ".gltf" && target != ".glb" {
		return nil, fmt.Errorf("unsupported target format x: %s", target)
	}

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
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: material,
					})
				}
			}
		} else {
			group.Meshes = append(group.Meshes, importer.GeometryAsset{
				Entity: importer.Entity{
					Name:      entity.Name,
					Transform: math.CryToGltfMat4(entity.Transform),
				},
				GeometryFile: entity.Model,
				MaterialFile: entity.Material,
			})
		}
	}
	return convertGltf(assets, group, target == ".glb")
}

func convertGltf(assets *game.Assets, group importer.AssetGroup, binary bool) ([]byte, error) {
	document := gltf.NewDocument()
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
	if len(group.Animations) > 0 {
		document.MergeSkins()
	}
	for _, anim := range group.Animations {
		document.ImportCgfAnimation(anim, assets.LoadAnimation)
	}
	for _, mesh := range group.Meshes {
		document.ImportGeometry(mesh, assets.LoadAsset)
	}
	document.ImportCgfMaterials()
	var b bytes.Buffer
	w := bufio.NewWriter(&b)
	if err := document.Encode(w, binary); err != nil {
		return nil, err
	}
	w.Flush()
	return b.Bytes(), nil
}

func convertLocale(file nwfs.File, target string) ([]byte, error) {
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

func convertDistribution(file nwfs.File, target string) ([]byte, error) {
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

func convertAny(file nwfs.File, target string) ([]byte, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	if azcs.IsBinaryObjectStream(data) {
		return convertAzcs(data, target)
	}

	return nil, fmt.Errorf("unsupported target format: %s", target)
}

func convertAzcs(data []byte, target string) ([]byte, error) {
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
