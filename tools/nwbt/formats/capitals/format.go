package capitals

import (
	"io"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/math/transform"
)

type Document struct {
	Capitals []Capital `json:"Capitals"`
}

type Capital struct {
	ID           string      `json:"id"`
	Position     *Vector     `json:"worldPosition"`
	Rotation     *Quaternion `json:"rotation"`
	Scale        *float32    `json:"scale"`
	Footprint    *Footprint  `json:"footprint"`
	SliceName    string      `json:"sliceName"`
	SliceAssetID string      `json:"sliceAssetId"`
	VariantName  string      `json:"variantName"`
}

type Vector struct {
	X float32  `json:"x"`
	Y float32  `json:"y"`
	Z float32  `json:"z"`
	W *float32 `json:"w,omitempty"`
}

type Quaternion struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
	Z float32 `json:"z"`
	W float32 `json:"w"`
}
type Footprint struct {
	Type   string  `json:"type"`
	Id     string  `json:"id"`
	Radius float32 `json:"radius"`
}

func Load(f nwfs.File) (*Document, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Read(r io.Reader) (*Document, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (*Document, error) {
	result := &Document{}
	err := json.UnmarshalJSON(data, result)
	return result, err
}

func (doc *Capital) Transform() transform.Node {
	data := []nwt.AzFloat32{
		// Rotation
		0, 0, 0, 1,
		// Scale
		1, 1, 1,
		// Translation
		0, 0, 0,
	}
	skipRotation := false
	if doc.ID == "af072283-0cf3-29ea-ed0f-c11e6449484d" {
		// sharedassets/coatlicue/nw_dungeon_edengrove_00/regions/r_+00_+00/capitals/dungeon_art/dungeon_art.capitals.json
		// "sliceName": "slices/dungeon/natural/dungeon_hallway_natural_16m_a",
		// entry hallway to greenkeeper boss
		skipRotation = true
	}
	if !skipRotation && doc.Rotation != nil {
		data[0] = nwt.AzFloat32(doc.Rotation.X)
		data[1] = nwt.AzFloat32(doc.Rotation.Y)
		data[2] = nwt.AzFloat32(doc.Rotation.Z)
		data[3] = nwt.AzFloat32(doc.Rotation.W)
	}
	if doc.Scale != nil && *doc.Scale != 0 {
		data[4] = nwt.AzFloat32(*doc.Scale)
		data[5] = nwt.AzFloat32(*doc.Scale)
		data[6] = nwt.AzFloat32(*doc.Scale)
	}
	if doc.Position != nil {
		data[7] = nwt.AzFloat32(doc.Position.X)
		data[8] = nwt.AzFloat32(doc.Position.Y)
		data[9] = nwt.AzFloat32(doc.Position.Z)
	}

	return transform.RST(data)
}
