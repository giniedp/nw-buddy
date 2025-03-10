package cdf

import (
	"encoding/xml"
	"nw-buddy/tools/formats/chrparams"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
)

type Document struct {
	XMLName        xml.Name       `xml:"CharacterDefinition" json:"-"`
	Model          Model          `xml:"Model"`
	AttachmentList AttachmentList `xml:"AttachmentList"`
}

type Model struct {
	XMLName xml.Name `xml:"Model" json:"-"`
	File    string   `xml:"File,attr"`
}

type AttachmentList struct {
	XMLName    xml.Name     `xml:"AttachmentList" json:"-"`
	Attachment []Attachment `xml:"Attachment"`
}

type Attachment struct {
	XMLName      xml.Name `xml:"Attachment" json:"-"`
	Type         string   `xml:"Type,attr"`
	AName        string   `xml:"AName,attr"`
	SerialNumber string   `xml:"SerialNumber,attr"`
	Binding      string   `xml:"Binding,attr"`
	Material     string   `xml:"Material,attr"`
	Flags        int      `xml:"Flags,attr"`
	RelRotation  string   `xml:"RelRotation,attr"`
	RelPosition  string   `xml:"RelPosition,attr"`
	BoneName     string   `xml:"BoneName,attr"`
	ProxyParams  string   `xml:"ProxyParams,attr"`
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

func (it *Document) SkinsOrCloth() []Attachment {
	result := make([]Attachment, 0)
	for _, att := range it.AttachmentList.Attachment {
		if att.Type == "CA_CLOTH" || att.Type == "CA_SKIN" {
			result = append(result, att)
		}
	}
	return result
}

func (it *Document) IsChr() bool {
	return path.Ext(it.Model.File) == ".chr"
}

func (it *Document) AnimationFiles(archive nwfs.Archive) {
	if !it.IsChr() {
		return
	}
	paramsPath := utils.ReplaceExt(it.Model.File, ".chrparams")
	paramsFile, ok := archive.Lookup(paramsPath)
	if !ok {
		return
	}
	params, err := chrparams.Load(paramsFile)
	if err != nil {
		return
	}
	params.AnimationGlobPaths()

	// const globPattern = getChrParamsAnimationGlobs(chrParams, options)
	// const files = await glob(globPattern)
	// const result: CdfAnimationFile[] = []
	// for (const file of files) {
	//   const extname = path.extname(file)
	//   if (extname.toLowerCase() === '.caf') {
	//     result.push({
	//       type: 'caf',
	//       name: path.basename(file, extname),
	//       file,
	//     })
	//     continue
	//   }
	//   if (extname.toLowerCase() === '.bspace') {
	//     const doc = await readBspaceFile(file)
	//     result.push({
	//       type: 'bspace',
	//       name: path.basename(file, extname),
	//       file,
	//       doc,
	//     })
	//     continue
	//   }
	//   if (extname.toLowerCase() === '.comb') {
	//     const doc = await readCombFile(file)
	//     result.push({
	//       type: 'comb',
	//       name: path.basename(file, extname),
	//       file,
	//       doc,
	//     })
	//     continue
	//   }
	// }
	// return result
}
