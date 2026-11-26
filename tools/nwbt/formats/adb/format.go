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

// Mannequin defaults (Lumberyard ICryMannequin.h SAnimBlend, SAnimationEntry, CFragment)
const (
	DefaultBlendDuration    = 0.2
	DefaultBlendOutDuration = 0.2
)

type Fragment struct {
	XMLName          xml.Name    `xml:"Fragment"`
	BlendOutDuration float32     `xml:"BlendOutDuration,attr"`
	Tags             string      `xml:"Tags,attr"`
	FragTags         string      `xml:"FragTags,attr"`
	AnimLayer        []AnimLayer `xml:"AnimLayer"`
	ProcLayer        []ProcLayer `xml:"ProcLayer"`
}

func (it *Fragment) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	type plain Fragment
	value := plain{BlendOutDuration: DefaultBlendOutDuration}
	if err := d.DecodeElement(&value, &start); err != nil {
		return err
	}
	*it = Fragment(value)
	return nil
}

type AnimLayer struct {
	XMLName   xml.Name    `xml:"AnimLayer"`
	Blend     []Blend     `xml:"Blend"`
	Animation []Animation `xml:"Animation"`
	// Sequence is the layer in authored order: each animation with the blend before it.
	// A blend without an animation (at the end, or two blends in a row) gives an entry without animation.
	Sequence []SequenceEntry `xml:"-"`
}

type SequenceEntry struct {
	// the blend before the animation, nil when omitted (Mannequin uses its defaults)
	Blend *Blend
	// nil for a blend that is not followed by an animation
	Animation *Animation
}

func (it *AnimLayer) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	it.XMLName = start.Name
	var pending *Blend
	for {
		token, err := d.Token()
		if err != nil {
			return err
		}
		switch t := token.(type) {
		case xml.StartElement:
			switch t.Name.Local {
			case "Blend":
				blend := Blend{}
				if err := d.DecodeElement(&blend, &t); err != nil {
					return err
				}
				if pending != nil {
					it.Sequence = append(it.Sequence, SequenceEntry{Blend: pending})
				}
				it.Blend = append(it.Blend, blend)
				pending = &blend
			case "Animation":
				animation := Animation{}
				if err := d.DecodeElement(&animation, &t); err != nil {
					return err
				}
				it.Animation = append(it.Animation, animation)
				it.Sequence = append(it.Sequence, SequenceEntry{Blend: pending, Animation: &animation})
				pending = nil
			default:
				if err := d.Skip(); err != nil {
					return err
				}
			}
		case xml.EndElement:
			if pending != nil {
				it.Sequence = append(it.Sequence, SequenceEntry{Blend: pending})
			}
			return nil
		}
	}
}

type Blend struct {
	XMLName   xml.Name `xml:"Blend"`
	ExitTime  float32  `xml:"ExitTime,attr"`
	StartTime float32  `xml:"StartTime,attr"`
	Duration  float32  `xml:"Duration,attr"`
	CurveType float32  `xml:"CurveType,attr"`
	// blend flags, e.g. "TimeWarping", "Idle2Move" (separated by "+")
	Flags string `xml:"flags,attr"`
}

func (it *Blend) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	type plain Blend
	value := plain{Duration: DefaultBlendDuration}
	if err := d.DecodeElement(&value, &start); err != nil {
		return err
	}
	*it = Blend(value)
	return nil
}

type Animation struct {
	XMLName xml.Name `xml:"Animation"`
	Name    string   `xml:"name,attr"`
	Weight  float32  `xml:"weight,attr"`
	Speed   float32  `xml:"speed,attr"`
	// animation flags, e.g. "Loop" (separated by "+")
	Flags string `xml:"flags,attr"`
}

func (it *Animation) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	type plain Animation
	value := plain{Weight: 1, Speed: 1}
	if err := d.DecodeElement(&value, &start); err != nil {
		return err
	}
	*it = Animation(value)
	return nil
}

// HasFlag tells whether the animation has the flag (case insensitive), e.g. "Loop"
func (it *Animation) HasFlag(flag string) bool {
	return hasFlag(it.Flags, flag)
}

// HasFlag tells whether the blend has the flag (case insensitive), e.g. "TimeWarping"
func (it *Blend) HasFlag(flag string) bool {
	return hasFlag(it.Flags, flag)
}

func hasFlag(flags string, flag string) bool {
	for _, it := range strings.Split(flags, "+") {
		if strings.EqualFold(strings.TrimSpace(it), flag) {
			return true
		}
	}
	return false
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

// AnimationNames returns the names of the animations the fragments of the database play (all fragments and variants,
// not the sub databases), lower case, each once
func (doc *Document) AnimationNames() []string {
	result := make([]string, 0)
	seen := make(map[string]bool)
	for _, fragments := range doc.FragmentList.Iter() {
		for _, fragment := range fragments {
			for _, layer := range fragment.AnimLayer {
				for _, animation := range layer.Animation {
					name := strings.ToLower(animation.Name)
					if name != "" && !seen[name] {
						seen[name] = true
						result = append(result, name)
					}
				}
			}
		}
	}
	return result
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

func (doc *Document) SelectModelAnimations(files []AnimationFile) []importer.AnimationAsset {
	return SelectModelAnimations(doc.GetActions(), files)
}

func SelectModelAnimations(actions []AnimationAction, files []AnimationFile) []importer.AnimationAsset {
	groups := maps.NewDict[*importer.AnimationAsset]()

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
					groups.LoadOrStore(animation.File, &importer.AnimationAsset{
						File: animation.File,
						Name: animation.Name,
					})
				}
			}
		}
	}
	result := make([]importer.AnimationAsset, 0)
	for _, group := range groups.Values() {
		result = append(result, *group)
	}
	return result
}
