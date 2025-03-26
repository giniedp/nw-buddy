package scanner

import (
	"encoding/binary"
	"math"
	"nw-buddy/tools/utils/maps"
	"strings"
)

type ScannedVariation struct {
	VariantID string                  `json:"variantID"`
	Spawns    []ScannedVariationSpawn `json:"spawns"`
}

type ScannedVariationSpawn struct {
	MapID     string           `json:"mapID"`
	Encounter string           `json:"encounter"`
	Positions PositionChunkRef `json:"positions"`
	positions []Position       `json:"-"`
}

type PositionChunkRef struct {
	ChunkID       int `json:"chunkID"`
	ElementSize   int `json:"elementSize"`
	ElementOffset int `json:"elementOffset"`
	ElementCount  int `json:"elementCount"`
}

type VariantsResult struct {
	Chunks   [][]byte
	Variants []*ScannedVariation
}

func CollateVariants(rows []VariantEntry) (result VariantsResult, count int) {
	result = VariantsResult{
		Chunks:   make([][]byte, 0),
		Variants: make([]*ScannedVariation, 0),
	}
	index := maps.NewDict[*maps.Dict[*maps.Dict[*ScannedVariationSpawn]]]()
	for _, row := range rows {
		mapId := strings.ToLower(row.MapID)
		position := PositionFromV3(row.Position).Truncate()
		recordID := strings.ToLower(row.VariantID)

		node := index.
			LoadOrCreate(recordID, maps.NewDict).
			LoadOrCreate(mapId, maps.NewDict).
			LoadOrCreate(row.Encounter, func() *ScannedVariationSpawn {
				return &ScannedVariationSpawn{
					MapID:     mapId,
					Encounter: row.Encounter,
				}
			})

		node.positions = append(node.positions, position)
	}

	records := maps.NewDict[*ScannedVariation]()
	chunks := ChunkIndex{}

	for recordID, b1 := range index.SortedIter() {
		node := records.LoadOrCreate(recordID, func() *ScannedVariation {
			return &ScannedVariation{
				VariantID: recordID,
				Spawns:    make([]ScannedVariationSpawn, 0),
			}
		})

		for mapID, b2 := range b1.SortedIter() {
			for encounter, value := range b2.SortedIter() {
				positions := sortAndFilterPositions(value.positions)
				count += len(positions)
				chunkIndex, byteOffset := chunks.Add(positions)
				node.Spawns = append(node.Spawns, ScannedVariationSpawn{
					MapID:     mapID,
					Encounter: encounter,
					Positions: PositionChunkRef{
						ChunkID:       chunkIndex,
						ElementCount:  len(positions),
						ElementSize:   2,              // x and y
						ElementOffset: byteOffset / 8, // 4 bytes per float32
					},
				})
			}
		}
	}

	result.Chunks = chunks.List()
	for _, node := range records.SortedIter() {
		result.Variants = append(result.Variants, node)
	}
	return
}

type ChunkIndex struct {
	current *[]byte
	chunks  []*[]byte
	index   int
}

func (c *ChunkIndex) Add(positions []Position) (int, int) {
	const LIMIT = 4 * 1024 * 1024
	if c.current == nil || len(*c.current) >= LIMIT {
		buf := make([]byte, 0, LIMIT)
		c.current = &buf
		c.chunks = append(c.chunks, &buf)
		c.index = len(c.chunks) - 1
	}

	buf := *c.current
	offset := len(buf)
	for _, point := range positions {
		buf = binary.LittleEndian.AppendUint32(buf, math.Float32bits(float32(point[0])))
		buf = binary.LittleEndian.AppendUint32(buf, math.Float32bits(float32(point[1])))
	}
	*c.current = buf
	return c.index, offset
}

func (c *ChunkIndex) List() [][]byte {
	result := make([][]byte, len(c.chunks))
	for i, chunk := range c.chunks {
		result[i] = *chunk
	}
	return result
}
