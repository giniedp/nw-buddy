package loc

import (
	"encoding/xml"
	"io"
	"nw-buddy/tools/nwfs"
)

type Document struct {
	XMLName xml.Name `xml:"resources"`
	Entries []Entry  `xml:"string"`
}

type Entry struct {
	XMLName xml.Name `xml:"string"`
	Key     string   `xml:"key,attr"`
	Value   string   `xml:",chardata"`
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
	obj := &Document{}
	err := xml.Unmarshal(data, obj)
	if err != nil {
		return nil, err
	}
	return obj, nil
}
