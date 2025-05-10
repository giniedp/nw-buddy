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

	"golang.org/x/sync/singleflight"
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
	ResolveFile(imageOrUUID string) (nwfs.File, error)
}

type LoaderWithConverter struct {
	Archive   nwfs.Archive
	Catalog   *catalog.Document
	Converter Converter
	Cache     Cache
	Group     *singleflight.Group
}

func NewLoader(archive nwfs.Archive) Loader {
	return LoaderWithConverter{
		Archive: archive,
		Group:   new(singleflight.Group),
	}
}

func (r LoaderWithConverter) LoadImage(image string) (*LoadedImage, error) {
	file, err := r.ResolveFile(image)
	if err != nil {
		return nil, err
	}
	if r.Group == nil {
		return r.LoadFile(file)
	}
	value, err, shared := r.Group.Do(file.Path(), func() (any, error) {
		return r.LoadFile(file)
	})
	loaded, _ := value.(*LoadedImage)
	if loaded != nil && shared {
		copy := *loaded
		loaded = &copy
	}
	return loaded, err
}

func (r LoaderWithConverter) LoadFile(file nwfs.File) (*LoadedImage, error) {
	if r.Cache != nil {
		if cached, ok := r.Cache.Load(file); ok {
			return cached, nil
		}
	}
	loaded, err := r.load(file)
	if err != nil {
		return nil, fmt.Errorf("image not loaded: %w", err)
	}
	if r.Converter != nil {
		loaded, err = r.Converter.Convert(*loaded)
		if err != nil {
			return nil, fmt.Errorf("file not converted: %w", err)
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

func (r LoaderWithConverter) ResolveFile(imageOrUuid string) (nwfs.File, error) {
	file := imageOrUuid
	if asset := r.Catalog.LookupByRef(imageOrUuid); asset != nil {
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

	if dds.IsDDSSplitPart(res.Source) {
		file, _ = r.Archive.Lookup(utils.ReplaceExt(file.Path(), ""))
		res.Source = file.Path()
		res.Format = FormatDDS
	}

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
