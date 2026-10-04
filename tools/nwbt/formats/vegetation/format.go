// Package vegetation reads the header and asset table of `region.vegetation` files.
//
// The file holds the baked dynamic vegetation (mostly groundcover) of a region.
// All values are little endian.
//
//	u16 tileSize              // cell size in meters (16)
//	u16 regionSize            // region size in meters (2048)
//	u32 maxInstancesPerCell   // 1024, a 32x32 placement grid per cell
//	u32 offsets[cellsPerAxis^2] // end offset of each block, block i spans [offsets[i-1], offsets[i])
//	                          // block 0 starts after the offset table
//
// Block 0 is the asset table:
//
//	u16 count
//	count * { u8 guid[16], u32 subId, u8 flags, u8 kind, u8 pathLen, char path[pathLen] }
//
// The asset id references the mesh (.cgf), path is an optional material override (.mtl).
// Block i (i > 0) holds the instances of cell i-1 (row major, x fastest):
//
//	u16 groupCount
//	groupCount * { u16 asset, u16 count, count * instance }
//
// Each instance is 16 bytes:
//
//	u32 rotation  // quaternion, x: bits 21-30, y: bits 11-20, z: bits 0-9, sign of w: bit 31
//	u16 x, y      // region local position, value * regionSize / 65535
//	u16 height    // absolute height, value / 31.999512
//	u8  scale     // value / 100
//	u8  unknown   // constant
//	u16 source    // index of the placement point in the cell (0..1023)
//	u16 unknown   // constant 0
package vegetation

import (
	"encoding/binary"
	"fmt"
	"nw-buddy/tools/nwfs"
)

const (
	headerSize        = 8
	assetEntryFixed   = 23
	InstanceSize      = 16
	CellGroupHeadSize = 4
)

type Header struct {
	TileSize            int `json:"tileSize"`
	RegionSize          int `json:"regionSize"`
	MaxInstancesPerCell int `json:"maxInstancesPerCell"`
}

func (h Header) CellsPerAxis() int {
	if h.TileSize == 0 {
		return 0
	}
	return h.RegionSize / h.TileSize
}

type AssetEntry struct {
	Guid     string `json:"guid"`
	SubId    uint32 `json:"subId"`
	Flags    uint8  `json:"flags"`
	Kind     uint8  `json:"kind"`
	Material string `json:"material,omitempty"`
}

type Document struct {
	Header Header
	Assets []AssetEntry
	// number of instances per asset, summed over all cells
	InstanceCounts []int
}

func Load(file nwfs.File) (*Document, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (*Document, error) {
	if len(data) < headerSize {
		return nil, fmt.Errorf("vegetation: file too short")
	}
	doc := &Document{}
	doc.Header.TileSize = int(binary.LittleEndian.Uint16(data[0:]))
	doc.Header.RegionSize = int(binary.LittleEndian.Uint16(data[2:]))
	doc.Header.MaxInstancesPerCell = int(binary.LittleEndian.Uint32(data[4:]))

	cells := doc.Header.CellsPerAxis()
	blockCount := cells * cells
	dataStart := headerSize + blockCount*4
	if blockCount == 0 || len(data) < dataStart {
		return nil, fmt.Errorf("vegetation: invalid header %+v", doc.Header)
	}
	blockRange := func(index int) (int, int) {
		start := dataStart
		if index > 0 {
			start = int(binary.LittleEndian.Uint32(data[headerSize+(index-1)*4:]))
		}
		end := int(binary.LittleEndian.Uint32(data[headerSize+index*4:]))
		return start, end
	}

	// asset table, an empty table is stored as a single zero byte
	start, end := blockRange(0)
	if end > len(data) || start > end {
		return nil, fmt.Errorf("vegetation: invalid asset table range")
	}
	table := data[start:end]
	if len(table) >= 2 {
		count := int(binary.LittleEndian.Uint16(table))
		pos := 2
		for i := 0; i < count; i++ {
			if pos+assetEntryFixed > len(table) {
				return nil, fmt.Errorf("vegetation: asset table truncated")
			}
			entry := AssetEntry{
				Guid:  formatGuid(table[pos : pos+16]),
				SubId: binary.LittleEndian.Uint32(table[pos+16:]),
				Flags: table[pos+20],
				Kind:  table[pos+21],
			}
			pathLen := int(table[pos+22])
			pos += assetEntryFixed
			if pos+pathLen > len(table) {
				return nil, fmt.Errorf("vegetation: asset path truncated")
			}
			entry.Material = string(table[pos : pos+pathLen])
			pos += pathLen
			doc.Assets = append(doc.Assets, entry)
		}
	}

	// instance counts per asset
	doc.InstanceCounts = make([]int, len(doc.Assets))
	for index := 1; index < blockCount; index++ {
		start, end := blockRange(index)
		if end > len(data) || start > end {
			return nil, fmt.Errorf("vegetation: invalid block range %d", index)
		}
		block := data[start:end]
		if len(block) <= 2 {
			continue
		}
		groups := int(binary.LittleEndian.Uint16(block))
		pos := 2
		for g := 0; g < groups && pos+CellGroupHeadSize <= len(block); g++ {
			asset := int(binary.LittleEndian.Uint16(block[pos:]))
			count := int(binary.LittleEndian.Uint16(block[pos+2:]))
			pos += CellGroupHeadSize + count*InstanceSize
			if asset < len(doc.InstanceCounts) {
				doc.InstanceCounts[asset] += count
			}
		}
	}
	return doc, nil
}

func formatGuid(b []byte) string {
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
