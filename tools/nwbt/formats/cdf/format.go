package cdf

import (
	"encoding/xml"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/formats/chrparams"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
	"slices"
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

func (it *Document) SkinAndClothAttachments() []Attachment {
	return it.AttachmentsByType("CA_CLOTH", "CA_SKIN")
}

func (it *Document) ClothAttachments() []Attachment {
	return it.AttachmentsByType("CA_CLOTH")
}

func (it *Document) SkinAttachments() []Attachment {
	return it.AttachmentsByType("CA_SKIN")
}

func (it *Document) AttachmentsByType(types ...string) []Attachment {
	result := make([]Attachment, 0)
	for _, att := range it.AttachmentList.Attachment {
		if slices.Contains(types, att.Type) {
			result = append(result, att)
		}
	}
	return result
}

func (it *Document) IsChr() bool {
	return path.Ext(it.Model.File) == ".chr"
}

func (it *Document) LoadAnimationFiles(archive nwfs.Archive) ([]adb.AnimationFile, error) {
	if !it.IsChr() {
		return nil, nil
	}
	paramsPath := utils.ReplaceExt(it.Model.File, ".chrparams")
	paramsFile, ok := archive.Lookup(paramsPath)
	if !ok {
		return nil, nil
	}
	params, err := chrparams.Load(paramsFile)
	if err != nil {
		return nil, err
	}
	return params.LoadAnimationList(archive)
}
