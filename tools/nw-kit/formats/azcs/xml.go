package azcs

import (
	"encoding/xml"
	"io"
	"nw-buddy/tools/nw-kit/nwfs"
)

type XmlObject struct {
	XMLName  xml.Name     `xml:"ObjectStream"`
	Version  string       `xml:"version,attr"`
	Elements []XmlElement `xml:"Class"`
}

type XmlElement struct {
	XMLName  xml.Name     `xml:"Class"`
	Name     string       `xml:"name,attr"`
	Type     string       `xml:"type,attr"`
	Type2    string       `xml:"specializationTypeId,attr"` // only version 2
	Value    string       `xml:"value,attr"`
	Field    string       `xml:"field,attr"`
	Version  string       `xml:"version,attr"`
	Elements []XmlElement `xml:"Class"`
}

func LoadXml(f nwfs.File) (*XmlObject, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return ParseXml(data)
}

func ReadXml(r io.Reader) (*XmlObject, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return ParseXml(data)
}

func ParseXml(data []byte) (*XmlObject, error) {
	obj := &XmlObject{}
	err := xml.Unmarshal(data, obj)
	if err != nil {
		return nil, err
	}
	return obj, nil
}

type WalkXmlFn func(el *XmlElement, parent *XmlElement, index int, depth int) bool

func (e *XmlObject) Walk(fn WalkXmlFn) bool {
	for i, el := range e.Elements {
		if !el.walk(nil, i, 0, fn) {
			return false
		}
	}
	return true
}

func (e *XmlElement) walk(parent *XmlElement, index, depth int, fn WalkXmlFn) bool {
	if !fn(e, parent, index, depth) {
		return false
	}
	for i, el := range e.Elements {
		if !el.walk(e, i, depth+1, fn) {
			return false
		}
	}
	return true
}
