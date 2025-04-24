package serve

import (
	"bufio"
	"bytes"
	"fmt"
	"net/url"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"path"
	"strconv"
	"strings"
)

func convertFile(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
	if target == "" {
		return file.Read()
	}

	filePath := file.Path()
	if dds.IsDDSSplitPart(filePath) {
		return convertDDS(assets, file, target, query)
	}

	switch path.Ext(filePath) {
	case ".datasheet":
		return convertDatasheet(file, target)
	case ".dds":
		return convertDDS(assets, file, target, query)
	case ".tif":
		return convertDDS(assets, file, target, query)
	case ".cgf", ".skin":
		return convertCGF(assets, file, target, query)
	case ".cdf":
		return convertCDF(assets, file, target)
	case ".xml":
		if strings.HasSuffix(file.Path(), ".loc.xml") {
			return convertLocale(file, target)
		}
	}
	return convertAny(file, target)
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

func convertDDS(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
	switch target {
	case "", ".dds":
		img, err := dds.Load(file)
		if err != nil {
			return nil, err
		}
		if img == nil || img.Data == nil {
			return nil, fmt.Errorf("failed to load dds")
		}
		return img.Data, nil
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
		} else {
			return img.Data, nil
		}
	// 	)
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertCGF(assets *game.Assets, file nwfs.File, target string, query url.Values) ([]byte, error) {
	group := importer.AssetGroup{}
	model := file.Path()
	material := query.Get("material")
	model, material = assets.ResolveModelMaterialPair(model, material)
	group.Meshes = append(group.Meshes, importer.GeometryAsset{
		GeometryFile: model,
		MaterialFile: material,
	})
	return convertGltf(assets, group, target == ".glb")
}

func convertCDF(assets *game.Assets, file nwfs.File, target string) ([]byte, error) {
	group := importer.AssetGroup{}
	model := file.Path()
	asset, err := assets.ResolveCdfAsset(model)
	if err != nil {
		return nil, err
	}
	for _, mesh := range asset.SkinAndClothAttachments() {
		model, material := assets.ResolveModelMaterialPair(mesh.Binding, mesh.Material)
		if model != "" {
			group.Meshes = append(group.Meshes, importer.GeometryAsset{
				GeometryFile: model,
				MaterialFile: material,
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
	// instruction to merge DDS faces
	queryParam := "merge=true"
	// instruction to resize DDS images
	if flg.TextureSize > 0 {
		queryParam = fmt.Sprintf("%s&size=%d", queryParam, flg.TextureSize)
	}
	linker.SetQueryParam(queryParam)

	document.ImageLinker = linker
	document.ImageLoader = image.LoaderWithConverter{
		Archive: assets.Archive,
		Catalog: assets.Catalog,
		//Cache:   image.NewCache(cacheDir, ".png"),
		Converter: image.BasicConverter{
			Format:  ".png",
			TempDir: flg.TempDir,
			Silent:  true,
			MaxSize: flg.TextureSize,
		},
	}
	for _, mesh := range group.Meshes {
		document.ImportGeometry(mesh, assets.LoadAsset)
	}
	document.ImportCgfMaterialsBasic()
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

func convertAny(file nwfs.File, target string) ([]byte, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	if azcs.IsAzcs(data) {
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
