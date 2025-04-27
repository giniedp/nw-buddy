package serve

import (
	"bufio"
	"bytes"
	"fmt"
	"image/png"
	"net/url"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils/json"
	"path"
	"strconv"
	"strings"

	"golang.org/x/image/tiff"
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
		return convertTif(assets, file, target, query)
	case ".heightmap":
		return convertHeightmap(file, target)
	case ".cgf", ".skin":
		return convertCGF(assets, file, target, query)
	case ".cdf":
		return convertCDF(assets, file, target)
	case ".distribution":
		return convertDistribution(file, target)
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
		img, err := dds.Load(file)
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

func convertCDF(assets *game.Assets, file nwfs.File, target string) ([]byte, error) {
	group := importer.AssetGroup{}
	model := file.Path()
	asset, err := assets.LoadCdf(model)
	if err != nil {
		return nil, err
	}
	for _, mesh := range asset.SkinAndClothAttachments() {
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
	document.ImportCgfMaterials(false)
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
