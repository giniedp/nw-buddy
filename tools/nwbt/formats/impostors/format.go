package impostors

import (
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
)

type Document struct {
	MaterialAssetID string     `json:"materialAssetId"`
	Impostors       []Impostor `json:"impostors"`
}

type Impostor struct {
	CellIndex     int           `json:"cellIndex"`
	MeshAssetID   string        `json:"meshAssetId"`
	WorldPosition WorldPosition `json:"worldPosition"`
}
type WorldPosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

func Load(file nwfs.File) (*Document, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (*Document, error) {
	var document Document
	err := json.UnmarshalJSON(data, &document)
	return &document, err
}
