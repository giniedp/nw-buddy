package localmappings

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
	LocalMappings LocalMapping `json:"localMappings"`
}

type LocalMapping struct {
	Tracts []Tract `json:"tracts"`
	Colors []Color `json:"m_colors"`
}

type Tract struct {
	Index int    `json:"index"`
	Name  string `json:"name"`
}

type Color struct {
	R uint8 `json:"r"`
	G uint8 `json:"g"`
	B uint8 `json:"b"`
	A uint8 `json:"a"`
}
