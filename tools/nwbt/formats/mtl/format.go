package mtl

import (
	"encoding/xml"
	"iter"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math"
	"strconv"
	"strings"

	"github.com/goccy/go-json"
)

const (
	MTL_FLAG_WIRE                            = 0x0001  // Use wire frame rendering for this material.
	MTL_FLAG_2SIDED                          = 0x0002  // Use 2 Sided rendering for this material.
	MTL_FLAG_ADDITIVE                        = 0x0004  // Use Additive blending for this material.
	MTL_FLAG_DETAIL_DECAL                    = 0x0008  // UNUSED RESERVED FOR LEGACY REASONS
	MTL_FLAG_LIGHTING                        = 0x0010  // Should lighting be applied on this material.
	MTL_FLAG_NOSHADOW                        = 0x0020  // Material do not cast shadows.
	MTL_FLAG_ALWAYS_USED                     = 0x0040  // When set forces material to be export even if not explicitly used.
	MTL_FLAG_PURE_CHILD                      = 0x0080  // Not shared sub material, sub material unique to his parent multi material.
	MTL_FLAG_MULTI_SUBMTL                    = 0x0100  // This material is a multi sub material.
	MTL_FLAG_NOPHYSICALIZE                   = 0x0200  // Should not physicalize this material.
	MTL_FLAG_NODRAW                          = 0x0400  // Do not render this material.
	MTL_FLAG_NOPREVIEW                       = 0x0800  // Cannot preview the material.
	MTL_FLAG_NOTINSTANCED                    = 0x1000  // Do not instantiate this material.
	MTL_FLAG_COLLISION_PROXY                 = 0x2000  // This material is the collision proxy.
	MTL_FLAG_SCATTER                         = 0x4000  // Use scattering for this material
	MTL_FLAG_REQUIRE_FORWARD_RENDERING       = 0x8000  // This material has to be rendered in forward rendering passes (alpha/additive blended)
	MTL_FLAG_NON_REMOVABLE                   = 0x10000 // Material with this flag once created are never removed from material manager (Used for decal materials, this flag should not be saved).
	MTL_FLAG_HIDEONBREAK                     = 0x20000 // Non-physicalized subsets with such materials will be removed after the object breaks
	MTL_FLAG_UIMATERIAL                      = 0x40000 // Used for UI in Editor. Don't need show it DB.
	MTL_64BIT_SHADERGENMASK                  = 0x80000 // ShaderGen mask is remapped
	MTL_FLAG_RAYCAST_PROXY                   = 0x100000
	MTL_FLAG_REQUIRE_NEAREST_CUBEMAP         = 0x200000 // materials with alpha blending requires special processing for shadows
	MTL_FLAG_CONSOLE_MAT                     = 0x400000
	MTL_FLAG_DELETE_PENDING                  = 0x800000 // Internal use only
	MTL_FLAG_BLEND_TERRAIN                   = 0x1000000
	MTL_FLAG_IS_TERRAIN                      = 0x2000000 // indication to the loader - Terrain type
	MTL_FLAG_IS_SKY                          = 0x4000000 // indication to the loader - Sky type
	MTL_FLAG_FOG_VOLUME_SHADING_QUALITY_HIGH = 0x8000000 // high vertex shading quality behaves more accurately with fog volumes.
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
	XMLName      xml.Name      `xml:"Material" json:"-"`
	Textures     Textures      `xml:"Textures" json:",omitzero"`
	Params       *PublicParams `xml:"PublicParams" json:",omitzero,omitempty"`
	VertexDeform *VertexDeform `xml:"VertexDeform" json:",omitzero,omitempty"`
	MaterialAttrs
}

type MaterialAttrs struct {
	AlphaTest     *float32         `xml:"AlphaTest,attr" json:",omitempty"`
	CloakAmount   *float32         `xml:"CloakAmount,attr" json:",omitempty"`
	Diffuse       math.Float32List `xml:"Diffuse,attr" json:",omitzero,omitempty"`
	Emissive      math.Float32List `xml:"Emissive,attr" json:",omitzero,omitempty"`
	Emittance     math.Float32List `xml:"Emittance,attr" json:",omitzero,omitempty"`
	GenMask       string           `xml:"GenMask,attr" json:",omitzero,omitempty"`
	MtlFlags      *int             `xml:"MtlFlags,attr" json:",omitempty"`
	Name          string           `xml:"Name,attr" json:",omitzero,omitempty"`
	Opacity       *float32         `xml:"Opacity,attr" json:",omitempty"`
	Shader        string           `xml:"Shader,attr" json:",omitzero"`
	Shininess     *float32         `xml:"Shininess,attr" json:",omitempty"`
	Specular      math.Float32List `xml:"Specular,attr" json:",omitzero,omitempty"`
	StringGenMask string           `xml:"StringGenMask,attr" json:",omitzero,omitempty"`
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

func (e *Material) TextureByMapType(mapType TexMap) *Texture {
	for _, texture := range e.Textures.Texture {
		if texture.Map == mapType {
			return &texture
		}
	}
	return nil
}

func (e *Material) IsShadowProxy() bool {
	// https://www.cryengine.com/docs/static/engines/cryengine-3/categories/1114113/pages/21268752
	// shadow proxy materials are where
	// Opacity is 0
	// NO_SHADOW flag is not set
	// Shader is "Illum"
	if e.Opacity == nil || *e.Opacity != 0 {
		return false
	}
	if e.Shader != "Illum" {
		return false
	}
	if e.MtlFlags == nil || (*e.MtlFlags&MTL_FLAG_NOSHADOW) != 0 {
		return false
	}
	return true
}

type PublicParams struct {
	params *maps.Dict[string]
}

func (e *Material) PublicParamsMap() map[string]string {
	if e.Params == nil {
		return make(map[string]string)
	}
	return e.Params.ToMap()
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

// WithOverrides is a copy of the params with the overrides set (e.g. the colors of an armor appearance and its
// dyes). The params stay as they are: loaded materials may be shared.
func (e *PublicParams) WithOverrides(overrides map[string]string) *PublicParams {
	result := &PublicParams{params: maps.NewDict[string]()}
	if e != nil && e.params != nil {
		for key, value := range e.params.Iter() {
			result.params.Store(key, value)
		}
	}
	for key, value := range overrides {
		result.params.Store(key, value)
	}
	return result
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

func (it *PublicParams) MarshalJSON() ([]byte, error) {
	if it == nil || it.params == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(it.params)
}

type SubMaterials struct {
	XMLName  xml.Name   `xml:"SubMaterials" json:"-"`
	Material []Material `xml:"Material" json:",omitzero"`
}

type VertexDeform struct {
	XMLName    xml.Name         `xml:"VertexDeform" json:"-"`
	Type       int              `xml:"Type,attr" json:",omitempty"`
	DividerX   float32          `xml:"DividerX,attr" json:",omitempty"`
	DividerY   float32          `xml:"DividerY,attr" json:",omitempty"`
	NoiseScale math.Float32List `xml:"NoiseScale,attr" json:",omitempty"`
	WaveX      WaveX            `xml:"WaveX" json:",omitempty"`
}

type WaveX struct {
	XMLName xml.Name `xml:"WaveX" json:"-"`
	Type    int      `xml:"Type,attr" json:""`
	Amp     float32  `xml:"Amp,attr" json:""`
	Level   float32  `xml:"Level,attr" json:""`
	Phase   float32  `xml:"Phase,attr" json:""`
	Freq    float32  `xml:"Freq,attr" json:""`
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

type TexGenType int

const (
	Stream TexGenType = iota
	World
	Camera
)

type TexModRotateType = int

const (
	TexModRotateNoChange = iota
	TexModRotateFixed
	TexModRotateConstant
	TexModRotateOscillated
)

type Texture struct {
	XMLName xml.Name `xml:"Texture" json:"-"`
	AssetId string   `xml:"AssetId,attr" json:",omitzero"`
	File    string   `xml:"File,attr" json:",omitzero"`
	Map     TexMap   `xml:"Map,attr" json:",omitzero"`
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
	Filter *TextureFilter `xml:"Filter,attr" json:",omitempty"` // omitempty will omit nil pointer but keep 0
	// possible values
	//  0 = false
	//  1 = true (default)
	IsTileU *TextureTile `xml:"IsTileU,attr" json:",omitempty"` // omitempty will omit nil pointer but keep 0
	// possible values
	//  0 = false
	//  1 = true (default)
	IsTileV *TextureTile `xml:"IsTileV,attr" json:",omitempty"` // omitempty will omit nil pointer but keep 0
	// possible values
	//  0 = 1D
	//  1 = 2D (default)
	//  2 = 3D
	//  3 = cube
	//  4 = cube array
	//  5 = dynamic 2d
	//  6 = user
	//  7 = nearest cube
	TexType *TextureType `xml:"TexType,attr" json:",omitempty"`
	TexMod  *TexMod      `xml:"TexMod" json:",omitempty"`
}

type TexMap string

const (
	MtlMap_Bumpmap          TexMap = "Bumpmap"
	MtlMap_Custom           TexMap = "Custom"
	MtlMap_Decal            TexMap = "Decal"
	MtlMap_Detail           TexMap = "Detail"
	MtlMap_Diffuse          TexMap = "Diffuse"
	MtlMap_Emittance        TexMap = "Emittance"
	MtlMap_Environment      TexMap = "Environment"
	MtlMap_Heightmap        TexMap = "Heightmap"
	MtlMap_Occlusion        TexMap = "Occlusion"
	MtlMap_Opacity          TexMap = "Opacity"
	MtlMap_SecondSmoothness TexMap = "SecondSmoothness"
	MtlMap_Smoothness       TexMap = "Smoothness"
	MtlMap_Specular         TexMap = "Specular"
	MtlMap_Specular2        TexMap = "Specular2"
	MtlMap_SubSurface       TexMap = "SubSurface"
	MtlMap_1_Custom         TexMap = "[1] Custom"
	MtlMap_2_Custom         TexMap = "[2] Custom"
	MtlMap_3_Custom         TexMap = "[3] Custom"
	MtlMap_4_Custom         TexMap = "[4] Custom"
	MtlMap_5_Custom         TexMap = "[5] Custom"
	MtlMap_5_Smoothness     TexMap = "[5] Smoothness"
)

type TexMod struct {
	OffsetU                     *float32         `xml:",attr" json:",omitzero,omitempty"`
	OffsetV                     *float32         `xml:",attr" json:",omitzero,omitempty"`
	RotateU                     *float32         `xml:",attr" json:",omitzero,omitempty"`
	RotateV                     *float32         `xml:",attr" json:",omitzero,omitempty"`
	RotateW                     *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_bTexGenProjected     *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_RotateType           TexModRotateType `xml:",attr" json:",omitzero,omitempty"`
	TexMod_TexGenType           TexGenType       `xml:",attr" json:",omitzero,omitempty"`
	TexMod_UOscillatorAmplitude *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_UOscillatorPhase     *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_UOscillatorRate      *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_UOscillatorType      *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_URotateAmplitude     *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_URotateCenter        *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_URotatePhase         *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_URotateRate          *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VOscillatorAmplitude *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VOscillatorPhase     *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VOscillatorRate      *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VOscillatorType      *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VRotateAmplitude     *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VRotateCenter        *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VRotatePhase         *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_VRotateRate          *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_WRotateAmplitude     *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_WRotatePhase         *float32         `xml:",attr" json:",omitzero,omitempty"`
	TexMod_WRotateRate          *float32         `xml:",attr" json:",omitzero,omitempty"`
	TileU                       *float32         `xml:",attr" json:",omitzero,omitempty"`
	TileV                       *float32         `xml:",attr" json:",omitzero,omitempty"`
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
