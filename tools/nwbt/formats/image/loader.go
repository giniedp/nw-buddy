package image

import (
	"bytes"
	"fmt"
	"image/png"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"regexp"
	"strings"
)

type LoadedImage struct {
	Source string // source asset path
	Format Format // image format, file extension (.dds, .png, etc)
	Width  int    // image width
	Height int    // image height
	Data   []byte // image data
	Alpha  []byte // additional alpha image (if available)
}

type Loader interface {
	LoadImage(imageOrUUID string) (*LoadedImage, error)
}

type LoaderWithConverter struct {
	Archive   nwfs.Archive
	Catalog   catalog.Document
	Converter Converter
	CacheDir  string
}

func NewLoader(archive nwfs.Archive) Loader {
	return LoaderWithConverter{
		Archive: archive,
	}
}

func (r LoaderWithConverter) LoadImage(image string) (*LoadedImage, error) {
	file, err := r.findImageFile(image)
	if err != nil {
		return nil, err
	}
	if cached, ok := r.loadFromCache(file); ok {
		return cached, nil
	}
	loaded, err := r.loadFromFile(file)
	if err != nil {
		return nil, err
	}
	if r.Converter != nil {
		loaded, err = r.Converter.Convert(*loaded)
		if err != nil {
			return nil, err
		}
	}
	r.saveToCache(file, loaded)
	return loaded, nil
}

var uuidReg = regexp.MustCompile(`([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})`)
var (
	ErrImageNotFound       = fmt.Errorf("image not found")
	ErrCatalogNotAvailable = fmt.Errorf("catalog is not available")
	ErrAssetNotFound       = fmt.Errorf("asset not found")
)

func (r LoaderWithConverter) findImageFile(imageOrUuid string) (nwfs.File, error) {
	file := imageOrUuid
	match := uuidReg.FindStringSubmatch(file)
	if len(match) == 2 {
		if r.Catalog == nil {
			return nil, ErrCatalogNotAvailable
		}
		uuid := strings.ToLower(match[1])
		asset := r.Catalog[uuid]
		if asset == nil {
			return nil, fmt.Errorf("%w: %s", ErrAssetNotFound, uuid)
		}
		file = asset.File
	}

	for _, file := range []string{file, utils.ReplaceExt(file, ".dds")} {
		file = nwfs.NormalizePath(file)
		if res, ok := r.Archive.Lookup(file); ok {
			return res, nil
		}
	}
	return nil, fmt.Errorf("%w: %s", ErrImageNotFound, imageOrUuid)
}

func (r LoaderWithConverter) loadFromFile(file nwfs.File) (*LoadedImage, error) {
	res := &LoadedImage{}
	res.Source = file.Path()
	res.Format = Format(path.Ext(file.Path()))

	switch res.Format {
	case FormatDDS:
		img, err := dds.Load(file)
		if err != nil {
			return res, err
		}
		res.Width = img.Width
		res.Height = img.Height
		res.Data = img.Data
		res.Alpha = img.Alpha
		return res, nil
	case FormatPNG:
		data, err := file.Read()
		if err != nil {
			return res, err
		}
		config, err := png.DecodeConfig(bytes.NewBuffer(data))
		if err != nil {
			return res, err
		}
		res.Width = config.Width
		res.Height = config.Height
		res.Data = data
		return res, nil
	default:
		data, err := file.Read()
		if err != nil {
			return res, err
		}
		res.Data = data
		return res, nil
	}
}

func (r LoaderWithConverter) getCachePath(file string) string {
	file = path.Join(r.CacheDir, file)
	if r.Converter != nil {
		file = utils.ReplaceExt(file, string(r.Converter.TargetFormat()))
	}
	return file
}

func (r LoaderWithConverter) loadFromCache(file nwfs.File) (*LoadedImage, bool) {
	if file == nil || r.CacheDir == "" {
		return nil, false
	}
	cachePath := r.getCachePath(file.Path())
	if _, err := os.Stat(cachePath); err != nil {
		return nil, false
	}
	data, err := os.ReadFile(cachePath)
	if err != nil {
		return nil, false
	}
	res := &LoadedImage{}
	res.Source = file.Path()
	res.Format = Format(path.Ext(file.Path()))
	res.Data = data
	cachePath = utils.ReplaceExt(cachePath, ".a"+path.Ext(cachePath))
	if _, err := os.Stat(cachePath); err != nil {
		return res, true
	}
	res.Alpha, _ = os.ReadFile(cachePath)
	return res, true
}

func (r LoaderWithConverter) saveToCache(file nwfs.File, image *LoadedImage) {
	if image == nil || r.CacheDir == "" {
		return
	}
	outPath := r.getCachePath(file.Path())
	outDir := path.Dir(outPath)
	outName := path.Base(outPath)
	outNameA := utils.ReplaceExt(outName, ".a"+path.Ext(outName))
	os.MkdirAll(outDir, os.ModePerm)

	if image.Alpha != nil {
		tmpFileA, _ := os.CreateTemp(outDir, outNameA+"*")
		tmpPath := tmpFileA.Name()
		tmpFileA.Write(image.Alpha)
		tmpFileA.Close()
		os.Rename(tmpPath, path.Join(outDir, outNameA))
	}

	tmpFile, _ := os.CreateTemp(outDir, outName+"*")
	tmpPath := tmpFile.Name()
	tmpFile.Write(image.Data)
	tmpFile.Close()

	os.Rename(tmpPath, path.Join(outDir, outName))

}
