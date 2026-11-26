package dds

import (
	"bytes"
	"encoding/binary"
	"nw-buddy/tools/nwfs"
	"slices"
)

type Image struct {
	Data        []byte // The main dds image data
	Alpha       []byte // The attached alpha data (if any)
	Width       int
	Height      int
	IsNormalMap bool
}

func Load(f nwfs.File, maxSize ...int) (*Image, error) {
	return load(f, false, maxSize...)
}

// LoadPartial merges only the mips up to maxSize, but keeps the original header.
// The result is a DDS file whose header describes the full texture, while the data
// holds the tail of the mip chain (like the unmerged base file, but with more mips).
func LoadPartial(f nwfs.File, maxSize int) (*Image, error) {
	return load(f, true, maxSize)
}

func load(f nwfs.File, keepHeader bool, maxSize ...int) (*Image, error) {
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
		data, err := concat(meta, splits.Base, keepHeader, maxSize...)
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
		data, err := concat(meta, splits.Alpha, keepHeader, maxSize...)
		if err != nil {
			return nil, err
		}
		res.Alpha = data
	}

	return res, nil
}

const cubemapFaces = 6

// mergeCubemapFaces merges split cubemap data into the layout of a plain DDS: all mips of face 0, then face 1, ...
//
// A split part holds one mip level for every face, one face after the other. The base data holds the remaining
// small mips and is already laid out per face. Appending parts and base data in order only works for single images.
func mergeCubemapFaces(parts [][]byte, base []byte) []byte {
	size := len(base)
	for _, part := range parts {
		size += len(part)
	}
	result := make([]byte, 0, size)
	for face := range cubemapFaces {
		for _, part := range parts {
			length := len(part) / cubemapFaces
			result = append(result, part[face*length:(face+1)*length]...)
		}
		length := len(base) / cubemapFaces
		result = append(result, base[face*length:(face+1)*length]...)
	}
	return result
}

func concat(meta *Meta, split SplitFile, keepHeader bool, maxSizes ...int) ([]byte, error) {
	if len(split.Files) == 0 {
		return meta.Data, nil
	}
	maxSize := max(meta.Header.Width, meta.Header.Height)
	if len(maxSizes) > 0 && maxSizes[0] > 0 && maxSizes[0] < int(maxSize) {
		maxSize = uint32(maxSizes[0])
	}

	// largest mip (highest part number) first. A copy: the caller's split stays as is
	files := slices.Clone(split.Files)
	slices.SortFunc(files, func(a, b nwfs.File) int {
		return SplitPartNumber(b.Path()) - SplitPartNumber(a.Path())
	})
	split.Files = files

	var buf bytes.Buffer
	// header
	buf.Write(meta.Data[:meta.HeaderSize])
	parts := make([][]byte, 0, len(split.Files))

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
		parts = append(parts, data)
	}
	baseData := meta.Data[meta.HeaderSize:]
	if meta.IsCubemap() {
		buf.Write(mergeCubemapFaces(parts, baseData))
	} else {
		for _, part := range parts {
			buf.Write(part)
		}
		// remaining mips from original data
		buf.Write(baseData)
	}

	result := buf.Bytes()
	if skipped > 0 && !keepHeader {
		// modify header
		// override width and height
		binary.LittleEndian.PutUint32(result[12:16], uint32(usedHeight))
		binary.LittleEndian.PutUint32(result[16:20], uint32(usedWidth))
		// override mipmap count
		binary.LittleEndian.PutUint32(result[28:32], meta.Header.MipMapCount-uint32(skipped))
	}

	return result, nil
}
