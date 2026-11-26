package image

import (
	"fmt"
	"nw-buddy/tools/formats/dds"
	"sync"
)

type Converter interface {
	TargetFormat() Format
	Convert(image LoadedImage) (*LoadedImage, error)
}

type BasicConverter struct {
	Format  Format // target image format
	MaxSize uint   // maximum image width and height
	// DDS target: format of BC5_SNORM normal maps, NormalFormatKeep (default) or NormalFormatRGBA8
	NormalFormat string
}

// maxSourceSize is the size limit applied on load, by dropping the larger mips of a DDS source: the decoder then
// takes a stored mip instead of resizing (DecodeDDS resizes only when no mip fits).
func (c BasicConverter) maxSourceSize() int {
	return int(c.MaxSize)
}

func (c BasicConverter) TargetFormat() Format {
	return c.Format
}
func (c BasicConverter) Convert(image LoadedImage) (*LoadedImage, error) {

	if image.Data == nil {
		return nil, fmt.Errorf("no image data")
	}

	target := c.Format
	var convertData, convertAlpha func([]byte) ([]byte, error)
	switch image.Format {
	case ".dds":
		convertData = func(data []byte) ([]byte, error) {
			return ConvertDDS(data, target,
				WithNormalMap(dds.IsNormalMap(image.Source)),
				WithMaxSize(c.MaxSize),
				WithNormalFormat(c.NormalFormat),
			)
		}
		convertAlpha = func(data []byte) ([]byte, error) {
			return ConvertDDS(data, target, WithNormalMap(false), WithMaxSize(c.MaxSize))
		}
	case ".png":
		convertData = func(data []byte) ([]byte, error) {
			return ConvertPNG(data, target)
		}
		convertAlpha = convertData
	default:
		return nil, fmt.Errorf("%s %w", image.Format, ErrUnsupportedInputFormat)
	}

	// the image and its alpha image convert in parallel (a KTX2 encode of a large texture takes seconds)
	var alpha []byte
	var alphaErr error
	var wg sync.WaitGroup
	if image.Alpha != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			alpha, alphaErr = convertAlpha(image.Alpha)
		}()
	}
	data, err := convertData(image.Data)
	wg.Wait()
	if err != nil {
		return nil, err
	}
	if alphaErr != nil {
		return nil, alphaErr
	}
	image.Format = target
	image.Data = data
	if image.Alpha != nil {
		image.Alpha = alpha
	}
	return &image, nil
}
