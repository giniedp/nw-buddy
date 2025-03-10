package chrparams

import (
	"encoding/xml"
	"nw-buddy/tools/nwfs"
	"path"
	"strings"
)

type Document struct {
	XMLName         xml.Name          `xml:"Params" json:"-"`
	AnimationList   AnimationList     `xml:"AnimationList"`
	BBoxIncludeList []BBoxIncludeList `xml:"BBoxIncludeList"`
}

type AnimationList struct {
	XMLName   xml.Name    `xml:"AnimationList" json:"-"`
	Animation []Animation `xml:"Animation"`
}

type Model struct {
	XMLName xml.Name `xml:"Model" json:"-"`
	File    string   `xml:"File,attr"`
}

type Animation struct {
	XMLName xml.Name `xml:"Animation" json:"-"`
	Name    string   `xml:"name,attr"`
	Path    string   `xml:"path,attr"`
}

type Joint struct {
	XMLName xml.Name `xml:"Joint" json:"-"`
	Name    string   `xml:"name,attr"`
}

type BBoxIncludeList struct {
	XMLName xml.Name `xml:"BBoxIncludeList" json:"-"`
	Joints  []Joint  `xml:"Joint"`
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
	err := xml.Unmarshal(data, &document)
	return &document, err
}

func (it *Document) AnimationGlobPaths() []string {
	result := make([]string, 0)
	var filepath string
	for _, anim := range it.AnimationList.Animation {
		if anim.Name == "#filepath" {
			filepath = anim.Path
			continue
		}
		if filepath == "" {
			continue
		}
		extname := strings.ToLower(path.Ext(anim.Path))
		if extname == ".caf" || extname == ".bspace" || extname == ".comb" {
			file := anim.Path
			if strings.HasPrefix(file, "*/") {
				file = "*" + file
			}
			result = append(result, strings.ToLower(path.Join(filepath, file)))
		}
	}
	return result
}

func (it *Document) AnimationIncludePaths() []string {
	result := make([]string, 0)
	for _, anim := range it.AnimationList.Animation {
		if anim.Name == "$Include" {
			result = append(result, anim.Path)
		}
	}
	return result
}
