package comb

import (
	"encoding/xml"
	"nw-buddy/tools/nwfs"
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
	err := xml.Unmarshal(data, &document)
	return &document, err
}

type Document struct {
	XMLName              xml.Name             `xml:"CombinedBlendSpace" json:"-"`
	Dimensions           Dimensions           `xml:"Dimensions"`
	AdditionalExtraction AdditionalExtraction `xml:"AdditionalExtraction"`
	BlendSpaces          BlendSpaces          `xml:"BlendSpaces"`
}

type Dimensions struct {
	XMLName xml.Name `xml:"Dimensions" json:"-"`
	Param   []Param  `xml:"Param"`
}

type Param struct {
	XMLName xml.Name `xml:"Param" json:"-"`
}

type AdditionalExtraction struct {
	XMLName xml.Name `xml:"AdditionalExtraction" json:"-"`
	Param   []Param  `xml:"Param"`
}

type BlendSpaces struct {
	XMLName    xml.Name     `xml:"BlendSpaces" json:"-"`
	BlendSpace []BlendSpace `xml:"BlendSpace"`
}

type BlendSpace struct {
	XMLName xml.Name `xml:"BlendSpace" json:"-"`
	Name    string   `xml:"AName,attr"`
}
