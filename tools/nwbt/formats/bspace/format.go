package bspace

import (
	"encoding/xml"
	"nw-buddy/tools/nwfs"
	"strconv"
	"strings"
)

func Load(file nwfs.File) (*ParaGroup, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (*ParaGroup, error) {
	var document ParaGroup
	err := xml.Unmarshal(data, &document)
	return &document, err
}

type ParaGroup struct {
	XMLName     xml.Name    `xml:"ParaGroup" json:"-"`
	Dimensions  Dimensions  `xml:"Dimensions"`
	ExampleList ExampleList `xml:"ExampleList"`
}

type Dimensions struct {
	XMLName xml.Name `xml:"Dimensions" json:"-"`
	Param   []Param  `xml:"Param"`
}

type Param struct {
	XMLName xml.Name `xml:"Param" json:"-"`
	Name    string   `xml:"Name,attr"`
	Min     float32  `xml:"Min,attr"`
	Max     float32  `xml:"Max,attr"`
}

type ExampleList struct {
	XMLName  xml.Name  `xml:"ExampleList" json:"-"`
	Examples []Example `xml:"Example"`
}

type Example struct {
	XMLName       xml.Name `xml:"Example" json:"-"`
	Name          string   `xml:"AName,attr"`
	PlaybackScale *float32 `xml:"PlaybackScale,attr"`
	Setter        map[int]string
}

func (e *Example) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	e.Setter = make(map[int]string)
	for _, attr := range start.Attr {
		if attr.Name.Local == "AName" {
			e.Name = attr.Value
			continue
		}
		if attr.Name.Local == "PlaybackScale" {
			if f, err := strconv.ParseFloat(attr.Value, 32); err == nil {
				f32 := float32(f)
				e.PlaybackScale = &f32
			}
			continue
		}
		if strings.HasPrefix(attr.Name.Local, "SetPara") {
			key := strings.TrimPrefix(attr.Name.Local, "SetPara")
			if index, err := strconv.Atoi(key); err == nil {
				e.Setter[index] = attr.Value
			}
			continue
		}
	}
	d.Skip()
	return nil
}

func (g *ParaGroup) ExampleSetPara(ex Example, param string) (string, bool) {
	for i, p := range g.Dimensions.Param {
		if strings.EqualFold(p.Name, param) {
			v, ok := ex.Setter[i]
			return v, ok
		}
	}
	return "", false
}
