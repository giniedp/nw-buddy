package image

import (
	"bytes"
	"fmt"
	"image/png"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
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
	Cache     Cache
}

func NewLoader(archive nwfs.Archive) Loader {
	return LoaderWithConverter{
		Archive: archive,
	}
}

func (r LoaderWithConverter) LoadImage(image string) (*LoadedImage, error) {
	file, err := r.findFile(image)
	if err != nil {
		return nil, err
	}
	if r.Cache != nil {
		if cached, ok := r.Cache.Load(file); ok {
			return cached, nil
		}
	}
	loaded, err := r.load(file)
	if err != nil {
		return nil, err
	}
	if r.Converter != nil {
		loaded, err = r.Converter.Convert(*loaded)
		if err != nil {
			return nil, err
		}
	}
	if r.Cache != nil {
		r.Cache.Save(file, loaded)
	}
	return loaded, nil
}

var (
	ErrImageNotFound       = fmt.Errorf("image not found")
	ErrCatalogNotAvailable = fmt.Errorf("catalog is not available")
	ErrAssetNotFound       = fmt.Errorf("asset not found")
)

func (r LoaderWithConverter) findFile(imageOrUuid string) (nwfs.File, error) {
	file := imageOrUuid
	if uuid := utils.ExtractUUID(file); uuid != "" {
		if r.Catalog == nil {
			return nil, ErrCatalogNotAvailable
		}
		asset := r.Catalog[strings.ToLower(uuid)]
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

func (r LoaderWithConverter) load(file nwfs.File) (*LoadedImage, error) {
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
