package adb

import (
	"encoding/xml"
	"iter"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
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

type AnimationAction struct {
	Name      string
	Fragments []AnimationActionFragment
}

type AnimationActionFragment struct {
	Tags       []string
	Animations []string
	DamageIds  []string
}

func (doc *Document) GetActions() []AnimationAction {
	actions := make([]AnimationAction, 0)
	for actionName, fragList := range doc.FragmentList.Iter() {
		fragments := make([]AnimationActionFragment, 0)
		for _, fragment := range fragList {
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
			fragments = append(fragments, AnimationActionFragment{
				Tags:       strings.Split(fragment.Tags, "+"),
				Animations: animationIds,
				DamageIds:  damageIds,
			})
		}
		actions = append(actions, AnimationAction{
			Name:      actionName,
			Fragments: fragments,
		})
	}
	return actions
}

type AnimationFileType string

const (
	Bspace AnimationFileType = "bspace"
	Comb   AnimationFileType = "comb"
	Caf    AnimationFileType = "caf"
)

type AnimationFile struct {
	Name string            `json:"name"`
	File string            `json:"file"`
	Type AnimationFileType `json:"type"`
}

func (doc *Document) SelectModelAnimations(files []AnimationFile) []importer.Animation {
	return SelectModelAnimations(doc.GetActions(), files)
}

func SelectModelAnimations(actions []AnimationAction, files []AnimationFile) []importer.Animation {
	groups := maps.NewDict[*importer.Animation]()

	for _, action := range actions {
		for _, fragment := range action.Fragments {
			animations := make([]AnimationFile, 0)

			for _, animation := range files {
				for _, name := range fragment.Animations {
					if strings.EqualFold(animation.Name, name) {
						animations = append(animations, animation)
					}
				}
			}

			for _, animation := range animations {
				switch animation.Type {
				case Bspace:
				// 	doc, err := bspace.Load(animation.File)
				// bspace:
				// 	for _, example := range animation.Bspace.ExampleList.Examples {
				// 		if _, ok := animation.Bspace.ExampleSetPara(example, "TravelAngle"); ok {
				// 			// angle animation
				// 			continue
				// 		}
				// 		if _, ok := animation.Bspace.ExampleSetPara(example, "TravelSlope"); ok {
				// 			// slope animation
				// 			continue
				// 		}
				// 		if _, ok := animation.Bspace.ExampleSetPara(example, "TurnSpeed"); ok {
				// 			// turn animation
				// 			continue
				// 		}
				// 		// assume this is a basic animation without turn or travel blends
				// 		for _, file := range files {
				// 			if strings.EqualFold(file.Name, example.Name) {
				// 				groups.LoadOrStore(animation.File, &importer.Animation{
				// 					File: animation.File,
				// 					Name: animation.Name,
				// 				})
				// 				break bspace
				// 			}
				// 		}
				// }
				case Comb:
					// const doc, err = comb.Load(animation.File)
				case Caf:
					groups.LoadOrStore(animation.File, &importer.Animation{
						File: animation.File,
						Name: animation.Name,
					})
				}
			}
		}
	}
	result := make([]importer.Animation, 0)
	for _, group := range groups.Values() {
		result = append(result, *group)
	}
	return result
}
