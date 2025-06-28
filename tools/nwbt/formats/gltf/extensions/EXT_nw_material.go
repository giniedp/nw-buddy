package extensions

import (
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/mtl"

	"github.com/qmuntal/gltf"
)

const EXT_nw_material = "EXT_nw_material"

type ExtNewWorld struct {
	MaskTexture   *gltf.TextureInfo `json:"maskTexture,omitempty"`
	SmoothTexture *gltf.TextureInfo `json:"smoothTexture,omitempty"`
	Params        *ExtNWAppearance  `json:"params,omitempty"`
	VertColors    bool              `json:"vertColors,omitempty"`
}

func (e *ExtNewWorld) ExtensionName() string {
	return EXT_nw_material
}

type ExtNWAppearance struct {
	EmissiveIntensity string `json:",omitzero"`
	EmissiveColor     string `json:",omitzero"`
	MaskAGloss        string `json:",omitzero"`
	MaskAGlossShift   string `json:",omitzero"`
	MaskASpec         string `json:",omitzero"`
	MaskASpecColor    string `json:",omitzero"`
	MaskBColor        string `json:",omitzero"`
	MaskBOverride     string `json:",omitzero"`
	MaskB             string `json:",omitzero"`
	MaskGColor        string `json:",omitzero"`
	MaskGOverride     string `json:",omitzero"`
	MaskG             string `json:",omitzero"`
	MaskRColor        string `json:",omitzero"`
	MaskROverride     string `json:",omitzero"`
	MaskR             string `json:",omitzero"`
}

func AppearanceFromMtl(m *mtl.Material) *ExtNWAppearance {
	if m.Params == nil {
		return nil
	}
	return &ExtNWAppearance{
		EmissiveIntensity: m.Params.Get("EmittanceMapGamma"),
		EmissiveColor:     m.Params.Get("EmissiveColor"),
		MaskAGloss:        m.Params.Get("MaskAGloss"),
		MaskAGlossShift:   m.Params.Get("MaskAGlossShift"),
		MaskASpec:         m.Params.Get("MaskASpec"),
		MaskASpecColor:    m.Params.Get("MaskASpecColor"),
		MaskBColor:        m.Params.Get("MaskBColor"),
		MaskBOverride:     m.Params.Get("MaskBOverride"),
		MaskB:             m.Params.Get("MaskB"),
		MaskGColor:        m.Params.Get("MaskGColor"),
		MaskGOverride:     m.Params.Get("MaskGOverride"),
		MaskG:             m.Params.Get("MaskG"),
		MaskRColor:        m.Params.Get("MaskRColor"),
		MaskROverride:     m.Params.Get("MaskROverride"),
		MaskR:             m.Params.Get("MaskR"),
	}
}

func AppearanceFromRow(r datasheet.JSONRow) *ExtNWAppearance {
	return &ExtNWAppearance{
		EmissiveIntensity: r.GetString("EmissiveIntensity"),
		EmissiveColor:     r.GetString("EmissiveColor"),
		MaskAGloss:        r.GetString("MaskAGloss"),
		MaskAGlossShift:   r.GetString("MaskAGlossShift"),
		MaskASpec:         r.GetString("MaskASpec"),
		MaskASpecColor:    r.GetString("MaskASpecColor"),
		MaskBColor:        r.GetString("MaskBColor"),
		MaskBOverride:     r.GetString("MaskBOverride"),
		MaskB:             r.GetString("MaskB"),
		MaskGColor:        r.GetString("MaskGColor"),
		MaskGOverride:     r.GetString("MaskGOverride"),
		MaskG:             r.GetString("MaskG"),
		MaskRColor:        r.GetString("MaskRColor"),
		MaskROverride:     r.GetString("MaskROverride"),
		MaskR:             r.GetString("MaskR"),
	}
}
