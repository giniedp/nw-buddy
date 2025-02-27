package image

import (
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"strings"
)

type Format string

const (
	PNG  Format = "png"
	WEBP Format = "webp"
)

type convertConfig struct {
	tmpDir    string
	silent    bool
	normalMap bool
	target    string
}

type ConvertOption func(*convertConfig)

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

func ConvertDDSFile(f nwfs.File, format Format, options ...ConvertOption) ([]byte, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return ConvertDDS(data, format, options...)
}

func ConvertDDS(data []byte, format Format, options ...ConvertOption) (res []byte, err error) {
	defer utils.HandleRecover(&err)

	c := &convertConfig{}
	for _, o := range options {
		o(c)
	}
	if c.tmpDir == "" {
		c.tmpDir = os.TempDir()
	}

	source := utils.Must(copyToTemp(data, ".dds", c.tmpDir))
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
		Silent:        c.silent,
	}

	if c.normalMap {
		texOpts.Format = "rgba"
		texOpts.ReconstructZ = true
		texOpts.InvertY = true
	}

	err = utils.Texconv.Run(source, texOpts)

	if err != nil {
		return nil, err
	}
	if format == PNG {
		return moveOrRead(targetPng, c.target)
	}

	targetWebp := utils.ReplaceExt(source, ".webp")
	defer os.Remove(targetWebp)

	err = utils.Cwebp.Run(targetPng, "-o", targetWebp)
	if err != nil {
		return nil, err
	}

	return moveOrRead(targetWebp, c.target)
}

func copyToTemp(data []byte, ext, dir string) (string, error) {
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
