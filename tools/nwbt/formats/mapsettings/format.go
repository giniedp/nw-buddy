package mapsettings

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
	CellResolution int `json:"cellResolution"`
	RegionSize     int `json:"regionSize"`
	RegionType     int `json:"regionType"`
}
