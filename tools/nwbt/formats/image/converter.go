package image

import (
	"fmt"
	"nw-buddy/tools/formats/dds"
)

type Converter interface {
	TargetFormat() Format
	Convert(image LoadedImage) (*LoadedImage, error)
}

type BasicConverter struct {
	Format  Format // target image format
	TempDir string // temporary directory to be used during conversion
	MaxSize uint   // maximum image width and height
	Silent  bool   // suppress conversion output
}

func (c BasicConverter) TargetFormat() Format {
	return c.Format
}
func (c BasicConverter) Convert(image LoadedImage) (*LoadedImage, error) {

	if image.Data == nil {
		return nil, fmt.Errorf("no image data")
	}

	target := c.Format
	switch image.Format {
	case ".dds":
		data, err := ConvertDDS(image.Data, target,
			WithTempDir(c.TempDir),
			WithSilent(c.Silent),
			WithNormalMap(dds.IsNormalMap(image.Source)),
			WithMaxSize(c.MaxSize),
		)
		if err != nil {
			return nil, err
		}
		image.Format = target
		image.Data = data
		if image.Alpha != nil {
			alphaData, err := ConvertDDS(image.Alpha, target,
				WithTempDir(c.TempDir),
				WithSilent(c.Silent),
				WithNormalMap(false),
				WithMaxSize(c.MaxSize),
			)
			if err != nil {
				return nil, err
			}
			image.Alpha = alphaData
		}
		return &image, nil
	case ".png":
		data, err := ConvertPNG(image.Data, target, WithTempDir(c.TempDir), WithSilent(c.Silent))
		if err != nil {
			return nil, err
		}
		image.Format = target
		image.Data = data
		if image.Alpha != nil {
			alphaData, err := ConvertPNG(image.Alpha, target, WithTempDir(c.TempDir), WithSilent(c.Silent))
			if err != nil {
				return nil, err
			}
			image.Alpha = alphaData
		}
		return &image, nil
	default:
		return nil, fmt.Errorf("%s %w", image.Format, ErrUnsupportedInputFormat)
	}
}
