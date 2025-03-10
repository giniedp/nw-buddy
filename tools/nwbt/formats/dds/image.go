package dds

import (
	"bytes"
	"nw-buddy/tools/nwfs"
	"slices"
	"strings"
)

type Image struct {
	Data        []byte // The main dds image data
	Alpha       []byte // The attached alpha data (if any)
	Width       int
	Height      int
	IsNormalMap bool
}

func Load(f nwfs.File) (*Image, error) {
	meta, err := LoadMeta(f)
	if err != nil {
		return nil, err
	}
	splits, err := FindSplits(f)
	if err != nil {
		return nil, err
	}

	res := &Image{
		Data:        meta.Data,
		Width:       int(meta.Header.Width),
		Height:      int(meta.Header.Height),
		IsNormalMap: IsNormalMap(f.Path()),
	}

	if len(splits.Base.Files) > 0 {
		data, err := concat(meta, splits.Base)
		if err != nil {
			return nil, err
		}
		res.Data = data
	}
	if splits.Alpha.Header != nil {
		meta, err = LoadMeta(splits.Alpha.Header)
		if err != nil {
			return nil, err
		}
		data, err := concat(meta, splits.Alpha)
		if err != nil {
			return nil, err
		}
		res.Alpha = data
	}

	return res, nil
}

func concat(meta *Meta, split SplitFile) ([]byte, error) {
	if len(split.Files) == 0 {
		return meta.Data, nil
	}
	slices.SortFunc(split.Files, func(a, b nwfs.File) int {
		return strings.Compare(b.Path(), a.Path())
	})

	var buf bytes.Buffer
	// header
	buf.Write(meta.Data[:meta.HeaderSize])
	// mips (largest to smallest)
	for _, split := range split.Files {
		data, err := split.Read()
		if err != nil {
			return nil, err
		}
		buf.Write(data)
	}
	// remaining mips from original data
	buf.Write(meta.Data[meta.HeaderSize:])
	return buf.Bytes(), nil
}
