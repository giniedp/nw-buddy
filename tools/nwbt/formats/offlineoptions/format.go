package offlineoptions

import (
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
)

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

type Document struct {
	DistributionDataEnabled bool      `json:"distributionDataEnabled"`
	DistributionBakeSeed    int       `json:"distributionBakeSeed"`
	VegetationDataEnabled   bool      `json:"vegetationDataEnabled"`
	Streaming               Streaming `json:"streaming"`
}

type Streaming struct {
	ImpostorCellEdgeLength int  `json:"impostorCellEdgeLength"`
	RegionChunksEnabled    bool `json:"regionChunksEnabled"`
}
