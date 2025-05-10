package nwmaterial

import (
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/mtl"
)

type Appearance struct {
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

func AppearanceFromMtl(m *mtl.Material) *Appearance {
	if m.Params == nil {
		return nil
	}
	return &Appearance{
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

func AppearanceFromRow(r datasheet.JSONRow) *Appearance {
	return &Appearance{
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
