package level

import (
	"image/color"
	"log/slog"
	"nw-buddy/tools/formats/tiff"
	"nw-buddy/tools/game"
)

// TractIndexMap is a region tractmap as tract indices. Indices are in image order like the heightmap:
// row major, row 0 at the region max y. Index 255 marks colors without a tract.
type TractIndexMap struct {
	Size    int
	Indices []byte
}

// LoadTractNames returns the region local tract names, indexed like the TractIndexMap values
func (dir *RegionDirectory) LoadTractNames(assets *game.Assets) []string {
	doc := dir.LoadLocalMappings(assets)
	if doc == nil {
		return nil
	}
	names := make([]string, len(doc.LocalMappings.Tracts))
	for i, tract := range doc.LocalMappings.Tracts {
		if tract.Index >= 0 && tract.Index < len(names) {
			names[tract.Index] = tract.Name
		} else if i < len(names) {
			names[i] = tract.Name
		}
	}
	return names
}

// LoadTractIndexMap decodes region.tractmap.tif and maps each color to its local tract index (localmappings m_colors)
func (dir *RegionDirectory) LoadTractIndexMap(assets *game.Assets) *TractIndexMap {
	doc := dir.LoadLocalMappings(assets)
	if doc == nil {
		return nil
	}
	file, ok := assets.Archive.Lookup(dir.PathTractmapFile())
	if !ok {
		return nil
	}
	data, err := file.Read()
	if err != nil {
		slog.Error("failed to read tractmap", "file", file.Path(), "err", err)
		return nil
	}
	img, err := tiff.Decode(data)
	if err != nil {
		slog.Error("failed to decode tractmap", "file", file.Path(), "err", err)
		return nil
	}

	// m_colors is aligned with the tracts list, the tract index field is authoritative
	byColor := make(map[[3]uint8]byte, len(doc.LocalMappings.Colors))
	for i, c := range doc.LocalMappings.Colors {
		index := i
		if i < len(doc.LocalMappings.Tracts) {
			index = doc.LocalMappings.Tracts[i].Index
		}
		if index < 0 || index > 254 {
			continue
		}
		byColor[[3]uint8{c.R, c.G, c.B}] = byte(index)
	}

	bounds := img.Bounds()
	size := bounds.Dx()
	result := &TractIndexMap{
		Size:    size,
		Indices: make([]byte, size*bounds.Dy()),
	}
	unknown := 0
	for y := 0; y < bounds.Dy(); y++ {
		for x := 0; x < size; x++ {
			c := color.NRGBAModel.Convert(img.At(bounds.Min.X+x, bounds.Min.Y+y)).(color.NRGBA)
			index, ok := byColor[[3]uint8{c.R, c.G, c.B}]
			if !ok {
				index = 255
				unknown++
			}
			result.Indices[y*size+x] = index
		}
	}
	if unknown > 0 {
		slog.Warn("tractmap colors without tract", "file", file.Path(), "pixels", unknown)
	}
	return result
}
