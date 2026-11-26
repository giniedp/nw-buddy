package cdf

import (
	"encoding/xml"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/formats/chrparams"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
	"slices"
	"strconv"
	"strings"
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
	// a .chrparams that replaces the skeleton's own (e.g. the cutscene animations of an IGC character), empty for none
	ParamsOverride string `xml:"ParamsOverride,attr"`
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

// AttachHideAttachment is Lumberyard's FLAGS_ATTACH_HIDE_ATTACHMENT (IAttachment.h): the game does not draw the
// attachment until code shows it at runtime (e.g. alternative gear and heads of story characters, outline shells)
const AttachHideAttachment = 0x01

// Hidden tells whether the game hides the attachment by default
func (it Attachment) Hidden() bool {
	return it.Flags&AttachHideAttachment != 0
}

// RelTransform is the position and rotation (x, y, z, w) of a bone attachment relative to its joint
func (it Attachment) RelTransform() (position [3]float32, rotation [4]float32) {
	rotation[3] = 1
	if p := parseFloats(it.RelPosition); len(p) == 3 {
		copy(position[:], p)
	}
	// the file writes w first
	if q := parseFloats(it.RelRotation); len(q) == 4 {
		rotation = [4]float32{q[1], q[2], q[3], q[0]}
	}
	return position, rotation
}

func parseFloats(value string) []float32 {
	result := make([]float32, 0, 4)
	for _, part := range strings.Split(value, ",") {
		v, err := strconv.ParseFloat(strings.TrimSpace(part), 32)
		if err != nil {
			return nil
		}
		result = append(result, float32(v))
	}
	return result
}

// SkinAndClothAttachments are all skin and cloth attachments, also the hidden ones (see Attachment.Hidden)
func (it *Document) SkinAndClothAttachments() []Attachment {
	return it.AttachmentsByType("CA_CLOTH", "CA_SKIN")
}

// VisibleSkinAndClothAttachments are the skin and cloth attachments the game draws by default
func (it *Document) VisibleSkinAndClothAttachments() []Attachment {
	result := make([]Attachment, 0)
	for _, att := range it.SkinAndClothAttachments() {
		if !att.Hidden() {
			result = append(result, att)
		}
	}
	return result
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

// ChrParamsPath is the animation list of the character: the model's ParamsOverride when set,
// else the .chrparams next to the skeleton. Empty without a skeleton.
func (it *Document) ChrParamsPath() string {
	if !it.IsChr() {
		return ""
	}
	if it.Model.ParamsOverride != "" {
		return nwfs.NormalizePath(it.Model.ParamsOverride)
	}
	return utils.ReplaceExt(nwfs.NormalizePath(it.Model.File), ".chrparams")
}

func (it *Document) LoadAnimationFiles(archive nwfs.Archive) ([]adb.AnimationFile, error) {
	paramsPath := it.ChrParamsPath()
	if paramsPath == "" {
		return nil, nil
	}
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
