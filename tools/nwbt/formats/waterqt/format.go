// Package waterheightmap parses a SerializableWaterQuadtree JSON document
// (as exported from the O3DE / Lumberyard-derived water system) and rasterizes
// the water surface into a square uint16 heightmap.
//
// # Serialization format
//
// The document holds a flat array of WaterNodeData entries that encodes a
// quadtree in level-order (breadth-first). The structure is implicit in the
// array order — there are no child pointers:
//
//   - A node whose height == 65535 is an INTERNAL node. Its four children
//     occupy the next four not-yet-consumed slots of the array.
//   - Any other node is a LEAF holding a real water surface height.
//
// The root (index 0) covers the whole region (regionsize x regionsize world
// units). Each subdivision splits a node into four equal quadrants.

// # Orientation
//
// Rows are written flipped in Y relative to the raw quadrant layout, matching
// the corrected world orientation. If it still disagrees with your terrain
// heightmap convention, flip the row index in fillLeaf (one line).
package waterqt

import (
	"encoding/binary"
	"fmt"
	"image"
	"image/png"
	"io"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/rtti/nwt"

	"github.com/x448/float16"
)

func Load(file nwfs.File) (*Document, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (*Document, error) {
	obj, err := azcs.Parse(data)
	if err != nil {
		return nil, fmt.Errorf("waterqt: failed to parse azcs: %w", err)
	}

	if len(obj.Elements) == 0 {
		return nil, fmt.Errorf("waterqt: azcs has no root elements")
	}

	res, err := rtti.Load(obj.Elements[0])
	if err != nil {
		return nil, fmt.Errorf("waterqt: failed to parse root object: %w", err)
	}

	switch v := res.(type) {
	case nwt.SerializableWaterQuadtree:
		switch vv := v.QuadtreeNodes.(type) {
		case nwt.AZStd__vector_WaterNodeData:
			return &Document{
				RegionSize:    int(v.RegionSize),
				QuadtreeNodes: vv,
			}, nil
		default:
			return nil, fmt.Errorf("waterqt: quadtreenodes is not nwt.AZStd__vector_WaterNodeData, got %T", v.QuadtreeNodes)
		}
	default:
		return nil, fmt.Errorf("waterqt: root object is not SerializableWaterQuadtree, got %T", res)
	}
}

// sentinel marks an internal (subdivided) node.
const sentinel = 65535.0

// Document mirrors the top-level SerializableWaterQuadtree document.
type Document struct {
	RegionSize    int                             `json:"regionsize"`
	QuadtreeNodes nwt.AZStd__vector_WaterNodeData `json:"quadtreenodes"`
}

// Heightmap is a square, row-major grid of uint16 height samples at one texel
// per world unit. Origin is top-left.
type Heightmap struct {
	Size int       // width == height, in texels (== world units)
	Data []float64 // len == Size*Size, row-major
}

// At returns the height sample at (x, y). No bounds checking.
func (h *Heightmap) At(x, y int) float64 { return h.Data[y*h.Size+x] }

// ToUint16Bytes returns the heightmap as little-endian uint16 bytes, ready to upload
// as an r16uint texture (2*Size*Size bytes).
func (r *Heightmap) ToUint16Bytes() []byte {
	out := make([]byte, len(r.Data)*2)
	for i, v := range r.Data {
		bits := uint16(v)
		binary.LittleEndian.PutUint16(out[i*2:], bits)
	}
	return out
}

// ToFloat16Bytes returns the heightmap as little-endian uint16 bytes, ready to upload
// as an r16uint / r16float texture (2*Size*Size bytes).
func (h *Heightmap) ToFloat16Bytes() []byte {
	out := make([]byte, len(h.Data)*2)
	for i, v := range h.Data {
		bits := float16.Fromfloat32(float32(v)).Bits()
		binary.LittleEndian.PutUint16(out[i*2:], bits)
	}
	return out
}

// The returned image references the heightmap's own sample data via the Pix
// slice, so it is only valid as long as the RegionHeightmap is alive. If you
// need the image to outlive the heightmap, copy it first.
func (m *Heightmap) Image() *image.Gray16 {
	img := image.NewGray16(image.Rect(0, 0, int(m.Size), int(m.Size)))
	// image.Gray16 stores pixels as big-endian uint16 pairs. Convert from the
	// native sample slice rather than going through the slow At/Set path.
  img.Pix = m.ToUint16Bytes()
	return img
}

// EncodePNG encodes the heightmap as a 16-bit grayscale PNG into w.
// The PNG uses source image order (top-left origin). Use SampleTerrainXY
// for terrain-space access on the raw samples instead.
func (m *Heightmap) EncodePNG(w io.Writer) error {
	return png.Encode(w, m.Image())
}

func (h *Heightmap) Dilate(radius int) {
	if radius <= 0 {
		return
	}
	size := h.Size
	src := make([]float64, len(h.Data)) // reused across passes
	for range radius {
		// Snapshot so a pass grows exactly one ring and never feeds on its
		// own freshly-written output within the same pass.
		copy(src, h.Data)
		for y := range size {
			for x := range size {
				i := y*size + x
				if src[i] > 0 {
					continue // already water
				}
				var sum float64
				var n int
				for dy := -1; dy <= 1; dy++ {
					ny := y + dy
					if ny < 0 || ny >= size {
						continue
					}
					for dx := -1; dx <= 1; dx++ {
						nx := x + dx
						if nx < 0 || nx >= size {
							continue
						}
						if v := src[ny*size+nx]; v > 0 {
							sum += v
							n++
						}
					}
				}
				if n > 0 {
					h.Data[i] = sum / float64(n)
				}
			}
		}
	}
}

// queued is one node awaiting processing, paired with its world footprint.
type queued struct {
	idx        int // index into the node array
	x, y, side int // world-space footprint (side is a power of two)
}

// ParseWaterHeightmap decodes a SerializableWaterQuadtree JSON document from
// raw bytes and rasterizes the water surface into a uint16 heightmap.
//
// It returns an error if the JSON is malformed, regionsize is not a positive
// power of two, or the node array does not form a complete quadtree (every
// internal node consuming exactly four children, the array consumed exactly).
func (doc *Document) ToHeightmap() (*Heightmap, error) {

	nodes := doc.QuadtreeNodes.Element
	if len(nodes) == 0 {
		return nil, fmt.Errorf("waterheightmap: node array is empty")
	}

	size := doc.RegionSize
	if size <= 0 || size&(size-1) != 0 {
		return nil, fmt.Errorf("waterheightmap: regionsize %d is not a positive power of two", size)
	}

	hm := &Heightmap{Size: size, Data: make([]float64, size*size)}

	// Child quadrant offsets, in units of the half-side. Index order matches
	// the order children appear in the array. (col, row).
	quadX := [4]int{0, 1, 0, 1}
	quadY := [4]int{0, 0, 1, 1}

	// Level-order walk. queue grows as internal nodes are expanded; head is
	// the read cursor. next is the next not-yet-consumed array index — the
	// children of any internal node are always the next four entries.
	queue := make([]queued, 1, len(nodes))
	queue[0] = queued{idx: 0, x: 0, y: 0, side: size}
	next := 1

	for head := 0; head < len(queue); head++ {
		it := queue[head]

		if nodes[it.idx].Height == sentinel {
			// Internal node: enqueue its four children from the next four slots.
			if next+4 > len(nodes) {
				return nil, fmt.Errorf("waterheightmap: node array truncated: "+
					"internal node at %d needs children at %d..%d of %d",
					it.idx, next, next+3, len(nodes))
			}
			half := it.side / 2
			for c := range 4 {
				queue = append(queue, queued{
					idx:  next,
					x:    it.x + quadX[c]*half,
					y:    it.y + quadY[c]*half,
					side: half,
				})
				next++
			}
			continue
		}

		// Leaf: stamp its footprint with the rounded height.
		fillLeaf(hm, it.x, it.y, it.side, float64(nodes[it.idx].Height))
	}

	if next != len(nodes) {
		return nil, fmt.Errorf("waterheightmap: malformed quadtree: consumed %d of %d nodes",
			next, len(nodes))
	}
	return hm, nil
}

// fillLeaf stamps a leaf's square world footprint into the heightmap with the
// given height, rounded to uint16. Rows are flipped in Y to match world
// orientation. A height <= 0 is written as 0 (dry / no water).
func fillLeaf(hm *Heightmap, x, y, side int, height float64) {
	if side == 0 { // sub-texel node: contributes nothing at 1 texel/unit
		return
	}
	size := hm.Size
	for ry := range side {
		dstRow := size - 1 - (y + ry) // flip Y
		base := dstRow*size + x
		row := hm.Data[base : base+side]
		for rx := range row {
			row[rx] = height
		}
	}
}
