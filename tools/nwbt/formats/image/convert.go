package image

import (
	"fmt"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"strings"
)

type Format string

const (
	FormatPNG  Format = ".png"
	FormatWEBP Format = ".webp"
	FormatDDS  Format = ".dds"
)

func (f *Format) MimeType() string {
	switch *f {
	case FormatPNG:
		return "image/png"
	case FormatWEBP:
		return "image/webp"
	case FormatDDS:
		return "image/vnd-ms.dds"
	default:
		return ""
	}
}

var (
	ErrUnsupportedInputFormat  = fmt.Errorf("unsupported input format")
	ErrUnsupportedTargetFormat = fmt.Errorf("unsupported target format")
)

type convertConfig struct {
	tmpDir    string
	silent    bool
	normalMap bool
	target    string
	maxSize   uint
}

type ConvertOption func(*convertConfig)

func getConfig(options []ConvertOption) *convertConfig {
	config := &convertConfig{}
	for _, option := range options {
		option(config)
	}
	return config
}

func WithTempDir(tmpDir string) ConvertOption {
	return func(c *convertConfig) {
		c.tmpDir = tmpDir
	}
}

func WithSilent(silent bool) ConvertOption {
	return func(c *convertConfig) {
		c.silent = silent
	}
}

func WithNormalMap(normalMap bool) ConvertOption {
	return func(c *convertConfig) {
		c.normalMap = normalMap
	}
}

func WithTarget(target string) ConvertOption {
	return func(c *convertConfig) {
		c.target = target
	}
}

func WithMaxSize(maxSize uint) ConvertOption {
	return func(c *convertConfig) {
		c.maxSize = maxSize
	}
}

func ConvertFile(file nwfs.File, targetFormat Format, options ...ConvertOption) ([]byte, error) {
	filePath := file.Path()
	ext := path.Ext(filePath)
	switch ext {
	case ".dds":
		return ConvertDDSFile(file, targetFormat, options...)
	case ".png":
		return ConvertPNGFile(file, targetFormat, options...)
	default:
		// TODO: can we convert split part here? need access to the header file
		// if dds.IsDDSSplitPart(filePath) {
		// 	return ConvertDDSFile(file, targetFormat, options...)
		// }
		return nil, fmt.Errorf("%s %w", ext, ErrUnsupportedInputFormat)
	}
}

func ConvertDDSFile(file nwfs.File, target Format, options ...ConvertOption) ([]byte, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return ConvertDDS(data, target, options...)
}

func ConvertDDS(data []byte, target Format, options ...ConvertOption) (res []byte, err error) {
	defer utils.HandleRecover(&err)

	if target == FormatDDS {
		return data, nil
	}
	config := getConfig(options)
	source := utils.Must(copyToTemp(data, ".dds", config.tmpDir))
	sourceDir := path.Dir(source)
	targetPng := utils.ReplaceExt(source, ".png")
	defer os.Remove(source)
	defer os.Remove(targetPng)

	texOpts := utils.TexConvOpt{
		FileType:      "png",
		Overwrite:     true,
		SeparateAlpha: true,
		Nologo:        true,
		FeatureLevel:  "12.1",
		Output:        sourceDir,
		Silent:        config.silent,
	}

	if config.normalMap {
		texOpts.Format = "rgba"
		texOpts.ReconstructZ = true
		texOpts.InvertY = true
	}

	if config.maxSize > 0 {
		h, _ := dds.ParseHeader(data)
		if h.Width > uint32(config.maxSize) {
			aspect := float64(h.Height) / float64(h.Width)
			texOpts.Width = uint32(config.maxSize)
			texOpts.Height = uint32(float64(config.maxSize) * aspect)
		} else if h.Height > uint32(config.maxSize) {
			aspect := float64(h.Width) / float64(h.Height)
			texOpts.Height = uint32(config.maxSize)
			texOpts.Width = uint32(float64(config.maxSize) * aspect)
		}
	}

	err = utils.Texconv.Run(source, texOpts)

	if err != nil {
		return nil, err
	}
	if target == FormatPNG {
		return moveOrRead(targetPng, config.target)
	}

	targetWebp := utils.ReplaceExt(source, ".webp")
	defer os.Remove(targetWebp)

	err = utils.Cwebp.Run(targetPng, "-o", targetWebp)
	if err != nil {
		return nil, err
	}

	return moveOrRead(targetWebp, config.target)
}

func ConvertPNGFile(source nwfs.File, target Format, options ...ConvertOption) ([]byte, error) {
	data, err := source.Read()
	if err != nil {
		return nil, err
	}

	if path.Ext(source.Path()) != ".png" {
		return nil, fmt.Errorf("unsupported source image format %s", path.Ext(source.Path()))
	}

	switch target {
	case FormatPNG:
		return data, nil
	case FormatWEBP:
		return ConvertPNG(data, target, options...)
	default:
		return nil, fmt.Errorf("unsupported target image format %s", target)
	}
}

func ConvertPNG(data []byte, target Format, options ...ConvertOption) ([]byte, error) {
	config := getConfig(options)

	sourcePng := utils.Must(copyToTemp(data, ".png", config.tmpDir))
	targetWebp := utils.ReplaceExt(sourcePng, ".webp")
	defer os.Remove(targetWebp)

	err := utils.Cwebp.Run(sourcePng, "-o", targetWebp)
	if err != nil {
		return nil, err
	}

	return moveOrRead(targetWebp, config.target)
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

func moveOrRead(file string, target string) ([]byte, error) {
	if target == "" {
		goto Read
	}
	if err := os.MkdirAll(path.Dir(target), 0755); err != nil {
		goto Read
	}
	if err := os.Rename(file, utils.ReplaceExt(target, path.Ext(file))); err == nil {
		return nil, nil
	}
Read:
	return os.ReadFile(file)
}
