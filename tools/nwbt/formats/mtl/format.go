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
	Textures *Textures     `xml:"Textures" json:",omitempty"`
	Params   *PublicParams `xml:"PublicParams" json:",omitempty"`
	MaterialAttrs
}

type MaterialAttrs struct {
	AlphaTest     float32 `xml:"AlphaTest,attr" json:",omitempty"`
	CloakAmount   float32 `xml:"CloakAmount,attr" json:",omitempty"`
	Diffuse       string  `xml:"Diffuse,attr" json:",omitempty"`
	Emissive      string  `xml:"Emissive,attr" json:",omitempty"`
	Emittance     string  `xml:"Emittance,attr" json:",omitempty"`
	GenMask       string  `xml:"GenMask,attr" json:",omitempty"`
	MtlFlags      int     `xml:"MtlFlags,attr" json:",omitempty"`
	Name          string  `xml:"Name,attr" json:",omitempty"`
	Opacity       float32 `xml:"Opacity,attr" json:",omitempty"`
	Shader        string  `xml:"Shader,attr" json:",omitempty"`
	Shininess     float32 `xml:"Shininess,attr" json:",omitempty"`
	Specular      string  `xml:"Specular,attr" json:",omitempty"`
	StringGenMask string  `xml:"StringGenMask,attr" json:",omitempty"`
}

func (e *Material) IterTextures() iter.Seq[Texture] {
	return func(yield func(Texture) bool) {
		if e.Textures != nil {
			for _, texture := range e.Textures.Texture {
				if !yield(texture) {
					break
				}
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

func (e *PublicParams) Len() int {
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
	return it.params.Has(name)
}

func (it *PublicParams) Get(name string) string {
	return it.params.Get(name)
}

func (it *PublicParams) Load(name string) (string, bool) {
	return it.params.Load(name)
}

type SubMaterials struct {
	XMLName  xml.Name   `xml:"SubMaterials" json:"-"`
	Material []Material `xml:"Material" json:",omitempty"`
}

type Textures struct {
	XMLName xml.Name  `xml:"Textures" json:"-"`
	Texture []Texture `xml:"Texture" json:",omitempty"`
}

type Texture struct {
	XMLName xml.Name `xml:"Texture" json:"-"`
	AssetId string   `xml:"AssetId,attr" json:",omitempty"`
	File    string   `xml:"File,attr" json:",omitempty"`
	Filter  float32  `xml:"Filter,attr" json:",omitempty"`
	Map     MtlMap   `xml:"Map,attr" json:",omitempty"`
	IsTileU bool     `xml:"IsTileU,attr" json:",omitempty"`
	IsTileV bool     `xml:"IsTileV,attr" json:",omitempty"`
	TexMod  TextMod  `xml:"TexMod,attr" json:",omitempty"`
	TexType float32  `xml:"TexType,attr" json:",omitempty"`
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
	OffsetU                     float32
	OffsetV                     float32
	RotateU                     float32
	RotateV                     float32
	RotateW                     float32
	TexMod_bTexGenProjecte      float32
	TexMod_RotateTyp            float32
	TexMod_TexGenTyp            float32
	TexMod_UOscillatorAmplitude float32
	TexMod_UOscillatorPhase     float32
	TexMod_UOscillatorRate      float32
	TexMod_UOscillatorType      float32
	TexMod_URotateAmplitude     float32
	TexMod_URotateCenter        float32
	TexMod_URotatePhase         float32
	TexMod_URotateRate          float32
	TexMod_VOscillatorAmplitude float32
	TexMod_VOscillatorPhase     float32
	TexMod_VOscillatorRate      float32
	TexMod_VOscillatorType      float32
	TexMod_VRotateAmplitude     float32
	TexMod_VRotateCenter        float32
	TexMod_VRotatePhase         float32
	TexMod_VRotateRate          float32
	TexMod_WRotateAmplitude     float32
	TexMod_WRotatePhase         float32
	TexMod_WRotateRate          float32
	TileU                       float32
	TileV                       float32
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
