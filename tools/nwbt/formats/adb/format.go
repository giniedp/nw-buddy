package adb

import (
	"encoding/xml"
	"iter"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
)

type Document struct {
	XMLName           xml.Name          `xml:"AnimDB"`
	FragDef           string            `xml:"FragDef,attr"`
	TagDef            string            `xml:"TagDef,attr"`
	FragmentList      FragmentList      `xml:"FragmentList"`
	FragmentBlendList FragmentBlendList `xml:"FragmentBlendList"`
	SubADBs           SubADBs           `xml:"SubADBs"`
}

type SubADBs struct {
	SubADB []SubADB `xml:"SubADB"`
}

type SubADB struct {
	Tags string `xml:"Tags,attr"`
	File string `xml:"File,attr"`
}
type FragmentList struct {
	Fragments []NamedFragment `xml:",any"`
}

func (it *FragmentList) ByName(name string) []Fragment {
	for _, fragment := range it.Fragments {
		if fragment.XMLName.Local == name {
			return fragment.Fragment
		}
	}
	return nil
}

func (it *FragmentList) Iter() iter.Seq2[string, []Fragment] {
	return func(yield func(string, []Fragment) bool) {
		for _, fragment := range it.Fragments {
			if !yield(fragment.XMLName.Local, fragment.Fragment) {
				return
			}
		}
	}
}

type NamedFragment struct {
	XMLName  xml.Name
	Fragment []Fragment
}

type Fragment struct {
	XMLName          xml.Name    `xml:"Fragment"`
	BlendOutDuration float32     `xml:"BlendOutDuration,attr"`
	Tags             string      `xml:"Tags,attr"`
	AnimLayer        []AnimLayer `xml:"AnimLayer"`
	ProcLayer        []ProcLayer `xml:"ProcLayer"`
}

type AnimLayer struct {
	XMLName   xml.Name    `xml:"AnimLayer"`
	Blend     []Blend     `xml:"Blend"`
	Animation []Animation `xml:"Animation"`
}

type Blend struct {
	XMLName   xml.Name `xml:"Blend"`
	ExitTime  float32  `xml:"ExitTime,attr"`
	StartTime float32  `xml:"StartTime,attr"`
	Duration  float32  `xml:"Duration,attr"`
	CurveType float32  `xml:"CurveType,attr"`
}

type Animation struct {
	XMLName xml.Name `xml:"Animation"`
	Name    string   `xml:"name,attr"`
	Weight  float32  `xml:"weight,attr"`
}

type ProcLayer struct {
	XMLName    xml.Name     `xml:"ProcLayer"`
	Blend      []Blend      `xml:"Blend"`
	Procedural []Procedural `xml:"Procedural"`
}

type Procedural struct {
	XMLName xml.Name         `xml:"Procedural"`
	Type    string           `xml:"type,attr"`
	Context string           `xml:"context,attr"`
	Params  ProceduralParams `xml:"ProceduralParams"`
}

type ProceduralParams struct {
	Params []ProceduralParam `xml:",any"`
}

func (it *ProceduralParams) ByName(name string) *ProceduralParam {
	for _, item := range it.Params {
		if item.XMLName.Local == name {
			return &item
		}
	}
	return nil
}

type ProceduralParam struct {
	XMLName xml.Name
	Value   string `xml:"value,attr"`
}

type FragmentBlendList struct {
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

func (doc *Document) GetActions() {
	// const actions: Array<AnimationAction> = []
	for _, fragments := range doc.FragmentList.Iter() {

		// const fragments: AnimationActionFragment[] = []
		for _, fragment := range fragments {
			animationIds := make([]string, 0)
			damageIds := make([]string, 0)
			for _, layer := range fragment.AnimLayer {
				for _, anim := range layer.Animation {
					animationIds = utils.AppendUniqNoZero(animationIds, anim.Name)
				}
			}
			for _, layer := range fragment.ProcLayer {
				for _, proc := range layer.Procedural {
					if param := proc.Params.ByName("DamageTableRow"); param != nil {
						damageIds = utils.AppendUniqNoZero(damageIds, param.Value)
					}
				}
			}
			// fragments.push({
			//   tags: fragment.Tags,
			//   animations: uniq(animations),
			//   damageIds: uniq(damageIds),
			// })
		}
		// actions.push({
		//   name: actionName,
		//   fragments: fragments,
		// })
	}
	// return actions
}
