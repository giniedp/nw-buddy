package azcs

import (
	"bytes"
	"encoding/xml"
	"io"
	"nw-buddy/tools/nwfs"
)

type XmlObject struct {
	XMLName  xml.Name      `xml:"ObjectStream"`
	Version  string        `xml:"version,attr"`
	Elements []*XmlElement `xml:"Class"`
}

type XmlElement struct {
	XMLName  xml.Name      `xml:"Class"`
	Name     string        `xml:"name,attr"`
	Type     string        `xml:"type,attr"`
	Type2    string        `xml:"specializationTypeId,attr"` // only version 2
	Value    string        `xml:"value,attr"`
	Field    string        `xml:"field,attr"`
	Version  string        `xml:"version,attr"`
	Elements []*XmlElement `xml:"Class"`
}

func IsXmlObjectStream(data []byte) bool {
	// <ObjectStream
	return bytes.HasPrefix(data, []byte("<ObjectStream"))
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

type WalkXmlNode struct {
	Parent  *WalkXmlNode
	Element *XmlElement
	Index   int
	Depth   int
	Data    any
}

type WalkXmlFn func(node *WalkXmlNode) bool

func (e *XmlObject) Walk(fn WalkXmlFn) bool {
	for i, el := range e.Elements {
		node := &WalkXmlNode{Element: el, Index: i, Depth: 0}
		if !el.walk(node, fn) {
			return false
		}
	}
	return true
}

func (e *XmlElement) walk(node *WalkXmlNode, fn WalkXmlFn) bool {
	if !fn(node) {
		return false
	}
	for i, el := range e.Elements {
		next := &WalkXmlNode{Parent: node, Element: el, Index: i, Depth: node.Depth + 1}
		if !el.walk(next, fn) {
			return false
		}
	}
	return true
}
