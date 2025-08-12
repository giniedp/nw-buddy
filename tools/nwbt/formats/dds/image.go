package dds

import (
	"bytes"
	"encoding/binary"
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

func Load(f nwfs.File, maxSize ...int) (*Image, error) {
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
		data, err := concat(meta, splits.Base, maxSize...)
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
		data, err := concat(meta, splits.Alpha, maxSize...)
		if err != nil {
			return nil, err
		}
		res.Alpha = data
	}

	return res, nil
}

func concat(meta *Meta, split SplitFile, maxSizes ...int) ([]byte, error) {
	if len(split.Files) == 0 {
		return meta.Data, nil
	}
	maxSize := max(meta.Header.Width, meta.Header.Height)
	if len(maxSizes) > 0 && maxSizes[0] > 0 && maxSizes[0] < int(maxSize) {
		maxSize = uint32(maxSizes[0])
	}

	slices.SortFunc(split.Files, func(a, b nwfs.File) int {
		return strings.Compare(b.Path(), a.Path())
	})

	var buf bytes.Buffer
	// header
	buf.Write(meta.Data[:meta.HeaderSize])

	width := meta.Header.Width
	height := meta.Header.Height
	usedWidth := width
	usedHeight := height
	skipped := 0
	// mips (largest to smallest)
	for i, split := range split.Files {
		if i > 0 {
			width /= 2
			height /= 2
		}
		if width > maxSize || height > maxSize {
			skipped++
			usedWidth = width / 2
			usedHeight = height / 2
			continue
		}

		data, err := split.Read()
		if err != nil {
			return nil, err
		}
		buf.Write(data)
	}
	// remaining mips from original data
	buf.Write(meta.Data[meta.HeaderSize:])

	result := buf.Bytes()
	if skipped > 0 {
		// modify header
		// override width and height
		binary.LittleEndian.PutUint32(result[12:16], uint32(usedHeight))
		binary.LittleEndian.PutUint32(result[16:20], uint32(usedWidth))
		// override mipmap count
		binary.LittleEndian.PutUint32(result[28:32], meta.Header.MipMapCount-uint32(skipped))
	}

	return result, nil
}
