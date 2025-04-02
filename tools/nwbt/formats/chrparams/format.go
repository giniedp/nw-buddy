package chrparams

import (
	"encoding/xml"
	"log/slog"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
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

func (it *Document) LoadAnimationList(archive nwfs.Archive) ([]adb.AnimationFile, error) {
	included := maps.NewDict[*Document]()
	documents := []*Document{}
	toProcess := []*Document{it}

	for len(toProcess) > 0 {
		current := toProcess[0]
		toProcess = toProcess[1:]
		documents = append(documents, current)

		filePath := current.AnimationIncludePaths()
		for _, filePath := range filePath {
			filePath = nwfs.NormalizePath(filePath)
			if included.Has(filePath) {
				continue
			}
			file, ok := archive.Lookup(filePath)
			if !ok {
				slog.Warn("Animation include not found", "file", filePath)
				continue
			}
			doc, err := Load(file)
			if err != nil {
				slog.Warn("Animation include not loaded", "file", filePath, "err", err)
				continue
			}
			included.Store(filePath, doc)
			toProcess = append(toProcess, doc)
		}
	}

	result := make([]adb.AnimationFile, 0)
	for _, doc := range documents {
		patterns := doc.AnimationGlobPaths()
		files, err := archive.Glob(patterns...)
		if err != nil {
			slog.Warn("failed to glob animation files", "err", err)
			continue
		}
		for _, file := range files {
			switch path.Ext(file.Path()) {
			case ".caf":
				result = append(result, adb.AnimationFile{
					Name: utils.ReplaceExt(path.Base(file.Path()), ""),
					File: file.Path(),
					Type: adb.Caf,
				})
			case ".bspace":
				result = append(result, adb.AnimationFile{
					Name: utils.ReplaceExt(path.Base(file.Path()), ""),
					File: file.Path(),
					Type: adb.Bspace,
				})
			case ".comb":
				result = append(result, adb.AnimationFile{
					Name: utils.ReplaceExt(path.Base(file.Path()), ""),
					File: file.Path(),
					Type: adb.Comb,
				})
			}
		}
	}

	return result, nil

}
