package mtl

import (
	"encoding/xml"
	"iter"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/maps"
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
	Material
	SubMaterials *SubMaterials `xml:"SubMaterials"`
}

func (e *Document) Collection() []Material {
	if e.SubMaterials == nil {
		return []Material{e.Material}
	}
	return e.SubMaterials.Material
}

type Material struct {
	XMLName  xml.Name      `xml:"Material" json:"-"`
	Textures Textures      `xml:"Textures" json:",omitzero"`
	Params   *PublicParams `xml:"PublicParams" json:",omitzero,omitempty"`
	MaterialAttrs
}

type MaterialAttrs struct {
	AlphaTest     *float32 `xml:"AlphaTest,attr" json:",omitempty"`
	CloakAmount   *float32 `xml:"CloakAmount,attr" json:",omitempty"`
	Diffuse       string   `xml:"Diffuse,attr" json:",omitzero,omitempty"`
	Emissive      string   `xml:"Emissive,attr" json:",omitzero,omitempty"`
	Emittance     string   `xml:"Emittance,attr" json:",omitzero,omitempty"`
	GenMask       string   `xml:"GenMask,attr" json:",omitzero,omitempty"`
	MtlFlags      *int     `xml:"MtlFlags,attr" json:",omitempty"`
	Name          string   `xml:"Name,attr" json:",omitzero,omitempty"`
	Opacity       *float32 `xml:"Opacity,attr" json:",omitempty"`
	Shader        string   `xml:"Shader,attr" json:",omitzero"`
	Shininess     *float32 `xml:"Shininess,attr" json:",omitempty"`
	Specular      string   `xml:"Specular,attr" json:",omitzero,omitempty"`
	StringGenMask string   `xml:"StringGenMask,attr" json:",omitzero,omitempty"`
}

func (e *Material) IterTextures() iter.Seq[Texture] {
	return func(yield func(Texture) bool) {
		for _, texture := range e.Textures.Texture {
			if !yield(texture) {
				break
			}
		}
	}
}

func (e *Material) TextureByMapType(mapType MtlMap) *Texture {
	for _, texture := range e.Textures.Texture {
		if texture.Map == mapType {
			return &texture
		}
	}
	return nil
}

type PublicParams struct {
	params *maps.Dict[string]
}

func (e *PublicParams) ToMap() map[string]string {
	if e.params == nil {
		return nil
	}
	return e.params.ToMap()
}

func (e *PublicParams) Len() int {
	if e.params == nil {
		return 0
	}
	return e.params.Len()
}
func (e *PublicParams) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	e.params = maps.NewDict[string]()
	for _, attr := range start.Attr {
		e.params.Store(attr.Name.Local, attr.Value)
	}
	d.Skip()
	return nil
}

func (it *PublicParams) Has(name string) bool {
	if it.params == nil {
		return false
	}
	return it.params.Has(name)
}

func (it *PublicParams) Get(name string) string {
	if it.params == nil {
		return ""
	}
	return it.params.Get(name)
}

func (it *PublicParams) LoadFloat(name string) (float32, bool) {
	if it.params == nil {
		return 0, false
	}
	value, ok := it.params.Load(name)
	if !ok {
		return 0, false
	}
	v, err := strconv.ParseFloat(value, 32)
	if err != nil {
		return 0, false
	}
	return float32(v), true
}

func (it *PublicParams) Load(name string) (string, bool) {
	if it.params == nil {
		return "", false
	}
	return it.params.Load(name)
}

type SubMaterials struct {
	XMLName  xml.Name   `xml:"SubMaterials" json:"-"`
	Material []Material `xml:"Material" json:",omitzero"`
}

type Textures struct {
	XMLName xml.Name  `xml:"Textures" json:"-"`
	Texture []Texture `xml:"Texture" json:",omitzero"`
}

type TextureFilter int

const (
	TextureFilterNone TextureFilter = iota - 1
	TextureFilterPoint
	TextureFilterLinear
	TextureFilterBilinear
	TextureFilterTrilinear
	TextureFilterAnisotropic2x
	TextureFilterAnisotropic4x
	TextureFilterAnisotropic8x
	TextureFilterAnisotropic16x
)

type TextureTile int

const (
	TextureTileOff TextureTile = 0
	TextureTileOn  TextureTile = 1
)

type TextureType int

const (
	TextureType1D TextureType = iota
	TextureType2D
	TextureType3D
	TextureTypeCube
	TextureTypeCubeArray
	TextureTypeDynamic2D
	TextureTypeUser
	TextureTypeNearestCube
)

type Texture struct {
	XMLName xml.Name `xml:"Texture" json:"-"`
	AssetId string   `xml:"AssetId,attr" json:",omitzero"`
	File    string   `xml:"File,attr" json:",omitzero"`
	Map     MtlMap   `xml:"Map,attr" json:",omitzero"`
	// possible values
	//  -1 none (default)
	//  0 point
	//  1 linear
	//  2 bilinear
	//  3 trilinear
	//  4 anisotropic 2x
	//  5 anisotropic 4x
	//  6 anisotropic 8x
	//  7 anisotropic 16x
	Filter *TextureFilter `xml:"Filter,attr"` // do not omit, it's crucial if set
	// possible values
	//  0 = false
	//  1 = true (default)
	IsTileU *TextureTile `xml:"IsTileU,attr"` // do not omit, it's crucial if set
	// possible values
	//  0 = false
	//  1 = true (default)
	IsTileV *TextureTile `xml:"IsTileV,attr"` // do not omit, it's crucial if set
	// possible values
	//  0 = 1D
	//  1 = 2D (default)
	//  2 = 3D
	//  3 = cube
	//  4 = cube array
	//  5 = dynamic 2d
	//  6 = user
	//  7 = nearest cube
	TexType *TextureType `xml:"TexType,attr"`
	TexMod  *TextMod     `xml:"TexMod"`
}

type MtlMap string

const (
	MtlMap_Bumpmap          MtlMap = "Bumpmap"
	MtlMap_Custom           MtlMap = "Custom"
	MtlMap_Decal            MtlMap = "Decal"
	MtlMap_Detail           MtlMap = "Detail"
	MtlMap_Diffuse          MtlMap = "Diffuse"
	MtlMap_Emittance        MtlMap = "Emittance"
	MtlMap_Environment      MtlMap = "Environment"
	MtlMap_Heightmap        MtlMap = "Heightmap"
	MtlMap_Occlusion        MtlMap = "Occlusion"
	MtlMap_Opacity          MtlMap = "Opacity"
	MtlMap_SecondSmoothness MtlMap = "SecondSmoothness"
	MtlMap_Smoothness       MtlMap = "Smoothness"
	MtlMap_Specular         MtlMap = "Specular"
	MtlMap_Specular2        MtlMap = "Specular2"
	MtlMap_SubSurface       MtlMap = "SubSurface"
	MtlMap_1_Custom         MtlMap = "[1] Custom"
	MtlMap_2_Custom         MtlMap = "[2] Custom"
	MtlMap_3_Custom         MtlMap = "[3] Custom"
	MtlMap_4_Custom         MtlMap = "[4] Custom"
	MtlMap_5_Custom         MtlMap = "[5] Custom"
	MtlMap_5_Smoothness     MtlMap = "[5] Smoothness"
)

type TextMod struct {
	OffsetU                     *float32 `xml:",attr" json:",omitzero,omitempty"`
	OffsetV                     *float32 `xml:",attr" json:",omitzero,omitempty"`
	RotateU                     *float32 `xml:",attr" json:",omitzero,omitempty"`
	RotateV                     *float32 `xml:",attr" json:",omitzero,omitempty"`
	RotateW                     *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_bTexGenProjected     *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_RotateType           *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_TexGenType           *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_UOscillatorAmplitude *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_UOscillatorPhase     *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_UOscillatorRate      *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_UOscillatorType      *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_URotateAmplitude     *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_URotateCenter        *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_URotatePhase         *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_URotateRate          *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VOscillatorAmplitude *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VOscillatorPhase     *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VOscillatorRate      *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VOscillatorType      *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VRotateAmplitude     *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VRotateCenter        *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VRotatePhase         *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VRotateRate          *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_WRotateAmplitude     *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_WRotatePhase         *float32 `xml:",attr" json:",omitzero,omitempty"`
	TexMod_WRotateRate          *float32 `xml:",attr" json:",omitzero,omitempty"`
	TileU                       *float32 `xml:",attr" json:",omitzero,omitempty"`
	TileV                       *float32 `xml:",attr" json:",omitzero,omitempty"`
}

func ParamColor(color string) []float32 {
	tokens := strings.Split(color, ",")
	out := make([]float32, len(tokens))
	for i, token := range tokens {
		out[i] = ParamNum(token)
	}
	return out
}

func ParamNum(param string) float32 {
	v, _ := strconv.ParseFloat(param, 32)
	return float32(v)
}
