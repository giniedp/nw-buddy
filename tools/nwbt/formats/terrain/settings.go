package terrain

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
	GeneratorType          string  `json:"generatorType"`
	HeightCrop             float32 `json:"heightCrop"`
	MountainRoughness      float32 `json:"mountainRoughness"`
	MountainHeight         float32 `json:"mountainHeight"`
	SnowMinimumSlope       float32 `json:"snowMinimumSlope"`
	SnowStartHeight        float32 `json:"snowStartHeight"`
	ValleyIntensity        float32 `json:"valleyIntensity"`
	OceanLevel             float32 `json:"oceanLevel"`
	WorldMaterialAssetPath string  `json:"worldMaterialAssetPath"`
}
