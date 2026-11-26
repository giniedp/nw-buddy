package mission

import (
	"encoding/xml"
	"fmt"
	"nw-buddy/tools/nwfs"
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

func LoadTOD(file nwfs.File) (*TimeOfDay, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	var tod TimeOfDay
	err = xml.Unmarshal(data, &tod)
	return &tod, err
}

type Document struct {
	XMLName     xml.Name    `xml:"Mission" json:"-"`
	Environment Environment `xml:"Environment" json:"environment"`
	TimeOfDay   TimeOfDay   `xml:"TimeOfDay" json:"timeOfDay"`
}

type Environment struct {
	XMLName           xml.Name          `xml:"Environment" json:"-"`
	Fog               Fog               `xml:"Fog" json:"fog"`
	Terrain           Terrain           `xml:"Terrain" json:"terrain"`
	EnvState          EnvState          `xml:"EnvState" json:"envState"`
	VolFogShadows     VolFogShadows     `xml:"VolFogShadows" json:"volFogShadows"`
	CloudShadows      CloudShadows      `xml:"CloudShadows" json:"cloudShadows"`
	ParticleLighting  ParticleLighting  `xml:"ParticleLighting" json:"particleLighting"`
	SkyBox            SkyBox            `xml:"SkyBox" json:"skyBox"`
	Ocean             Ocean             `xml:"Ocean" json:"ocean"`
	OceanAnimation    OceanAnimation    `xml:"OceanAnimation" json:"oceanAnimation"`
	Moon              Moon              `xml:"Moon" json:"moon"`
	DynTexSource      DynTexSource      `xml:"DynTexSource" json:"dynTexSource"`
	TotalIllumination TotalIllumination `xml:"Total_Illumination_v2" json:"totalIllumination"`
	Lighting          Lighting          `xml:"Lighting" json:"lighting"`
}
type Fog struct {
	XMLName             xml.Name `xml:"Fog" json:"-"`
	ViewDistance        float32  `xml:"ViewDistance,attr" json:"viewDistance"`
	ViewDistanceLowSpec float32  `xml:"ViewDistanceLowSpec,attr" json:"viewDistanceLowSpec"`
	LDRGlobalDensMult   float32  `xml:"LDRGlobalDensMult,attr" json:"ldrGlobalDensMult"`
}
type Terrain struct {
	XMLName                   xml.Name `xml:"Terrain" json:"-"`
	DetailLayersViewDistRatio float32  `xml:"DetailLayersViewDistRatio,attr" json:"detailLayersViewDistRatio"`
	HeightMapAO               float32  `xml:"HeightMapAO,attr" json:"heightMapAo"`
}
type EnvState struct {
	XMLName                            xml.Name    `xml:"EnvState" json:"-"`
	WindVector                         Float32List `xml:"WindVector,attr" json:"windVector"`
	BreezeGeneration                   float32     `xml:"BreezeGeneration,attr" json:"breezeGeneration"`
	BreezeStrength                     float32     `xml:"BreezeStrength,attr" json:"breezeStrength"`
	BreezeMovementSpeed                float32     `xml:"BreezeMovementSpeed,attr" json:"breezeMovementSpeed"`
	BreezeVariation                    float32     `xml:"BreezeVariation,attr" json:"breezeVariation"`
	BreezeLifeTime                     float32     `xml:"BreezeLifeTime,attr" json:"breezeLifeTime"`
	BreezeCount                        float32     `xml:"BreezeCount,attr" json:"breezeCount"`
	BreezeSpawnRadius                  float32     `xml:"BreezeSpawnRadius,attr" json:"breezeSpawnRadius"`
	BreezeSpread                       float32     `xml:"BreezeSpread,attr" json:"breezeSpread"`
	BreezeRadius                       float32     `xml:"BreezeRadius,attr" json:"breezeRadius"`
	ConsoleMergedMeshesPool            string      `xml:"ConsoleMergedMeshesPool,attr" json:"consoleMergedMeshesPool"`
	ShowTerrainSurface                 string      `xml:"ShowTerrainSurface,attr" json:"showTerrainSurface"`
	SunShadowsMinSpec                  string      `xml:"SunShadowsMinSpec,attr" json:"sunShadowsMinSpec"`
	SunShadowsAdditionalCascadeMinSpec string      `xml:"SunShadowsAdditionalCascadeMinSpec,attr" json:"sunShadowsAdditionalCascadeMinSpec"`
	SunShadowsClipPlaneRange           string      `xml:"SunShadowsClipPlaneRange,attr" json:"sunShadowsClipPlaneRange"`
	SunShadowsClipPlaneRangeShift      string      `xml:"SunShadowsClipPlaneRangeShift,attr" json:"sunShadowsClipPlaneRangeShift"`
	UseLayersActivation                string      `xml:"UseLayersActivation,attr" json:"useLayersActivation"`
	SunLinkedToTOD                     string      `xml:"SunLinkedToTOD,attr" json:"sunLinkedToTod"`
}
type VolFogShadows struct {
	XMLName         xml.Name `xml:"VolFogShadows" json:"-"`
	Enable          string   `xml:"Enable,attr" json:"enable"`
	EnableForClouds string   `xml:"EnableForClouds,attr" json:"enableForClouds"`
}
type CloudShadows struct {
	XMLName               xml.Name `xml:"CloudShadows" json:"-"`
	CloudShadowTexture    string   `xml:"CloudShadowTexture,attr" json:"cloudShadowTexture"`
	CloudShadowSpeed      string   `xml:"CloudShadowSpeed,attr" json:"cloudShadowSpeed"`
	CloudShadowTiling     float32  `xml:"CloudShadowTiling,attr" json:"cloudShadowTiling"`
	CloudShadowBrightness float32  `xml:"CloudShadowBrightness,attr" json:"cloudShadowBrightness"`
	CloudShadowInvert     float32  `xml:"CloudShadowInvert,attr" json:"cloudShadowInvert"`
}
type ParticleLighting struct {
	XMLName    xml.Name `xml:"ParticleLighting" json:"-"`
	AmbientMul float32  `xml:"AmbientMul,attr" json:"ambientMul"`
	LightsMul  float32  `xml:"LightsMul,attr" json:"lightsMul"`
}
type SkyBox struct {
	XMLName         xml.Name `xml:"SkyBox" json:"-"`
	Material        string   `xml:"Material,attr" json:"material"`
	MaterialLowSpec string   `xml:"MaterialLowSpec,attr" json:"materialLowSpec"`
	Angle           float32  `xml:"Angle,attr" json:"angle"`
	Stretching      string   `xml:"Stretching,attr" json:"stretching"`
}
type Ocean struct {
	XMLName               xml.Name `xml:"Ocean" json:"-"`
	Material              string   `xml:"Material,attr" json:"material"`
	CausticsDistanceAtten string   `xml:"CausticsDistanceAtten,attr" json:"causticsDistanceAtten"`
	CausticDepth          string   `xml:"CausticDepth,attr" json:"causticDepth"`
	CausticIntensity      string   `xml:"CausticIntensity,attr" json:"causticIntensity"`
	CausticsTilling       string   `xml:"CausticsTilling,attr" json:"causticsTilling"`
}
type OceanAnimation struct {
	XMLName       xml.Name `xml:"OceanAnimation" json:"-"`
	WindDirection string   `xml:"WindDirection,attr" json:"windDirection"`
	WindSpeed     string   `xml:"WindSpeed,attr" json:"windSpeed"`
	WavesAmount   string   `xml:"WavesAmount,attr" json:"wavesAmount"`
	WavesSize     string   `xml:"WavesSize,attr" json:"wavesSize"`
	WavesSpeed    string   `xml:"WavesSpeed,attr" json:"wavesSpeed"`
}
type Moon struct {
	XMLName   xml.Name `xml:"Moon" json:"-"`
	Latitude  float32  `xml:"Latitude,attr" json:"latitude"`
	Longitude float32  `xml:"Longitude,attr" json:"longitude"`
	Size      float32  `xml:"Size,attr" json:"size"`
	Texture   string   `xml:"Texture,attr" json:"texture"`
}
type DynTexSource struct {
	XMLName xml.Name `xml:"DynTexSource" json:"-"`
	Width   float32  `xml:"Width,attr" json:"width"`
	Height  float32  `xml:"Height,attr" json:"height"`
}
type TotalIllumination struct {
	XMLName xml.Name `xml:"Total_Illumination_v2" json:"-"`
}

type Lighting struct {
	XMLName          xml.Name    `xml:"Lighting" json:"-"`
	SunRotation      int         `xml:"SunRotation,attr" json:"sunRotation"`
	SunHeight        int         `xml:"SunHeight,attr" json:"sunHeight"`
	Lighting         int         `xml:"Lighting,attr" json:"lighting"`
	HemiSamplQuality int         `xml:"HemiSamplQuality,attr" json:"hemiSamplQuality"`
	Longitude        int         `xml:"Longitude,attr" json:"longitude"`
	DawnTime         int         `xml:"DawnTime,attr" json:"dawnTime"`
	DawnDuration     int         `xml:"DawnDuration,attr" json:"dawnDuration"`
	DuskTime         int         `xml:"DuskTime,attr" json:"duskTime"`
	DuskDuration     int         `xml:"DuskDuration,attr" json:"duskDuration"`
	SunVector        Float32List `xml:"SunVector,attr" json:"sunVector"`
}

type TimeOfDay struct {
	XMLName       xml.Name   `xml:"TimeOfDay" json:"-"`
	Time          float32    `xml:"Time,attr" json:"time"`
	TimeStart     float32    `xml:"TimeStart,attr" json:"timeStart"`
	TimeEnd       float32    `xml:"TimeEnd,attr" json:"timeEnd"`
	TimeAnimSpeed float32    `xml:"TimeAnimSpeed,attr" json:"timeAnimSpeed"`
	Variable      []Variable `xml:"Variable" json:"variable"`
}
type Variable struct {
	XMLName xml.Name    `xml:"Variable" json:"-"`
	Name    string      `xml:"Name,attr" json:"name"`
	Color   Float32List `xml:"Color,attr" json:"color"`
	Value   *float32    `xml:"Value,attr" json:"value"`
	Spline  Spline      `xml:"Spline" json:"spline"`
}
type Spline struct {
	XMLName xml.Name `xml:"Spline" json:"-"`
	Keys    string   `xml:"Keys,attr" json:"keys"`
}

type Float32List []float32

func (f *Float32List) UnmarshalXMLAttr(attr xml.Attr) error {
	parts := strings.Split(attr.Value, ",")
	out := make(Float32List, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		val, err := strconv.ParseFloat(p, 64)
		if err != nil {
			return fmt.Errorf("invalid float %q in attribute %q: %w", p, attr.Value, err)
		}
		out = append(out, float32(val))
	}
	*f = out
	return nil
}

func (f Float32List) MarshalXMLAttr(name xml.Name) (xml.Attr, error) {
	strs := make([]string, len(f))
	for i, v := range f {
		strs[i] = strconv.FormatFloat(float64(v), 'g', -1, 64)
	}
	return xml.Attr{Name: name, Value: strings.Join(strs, ",")}, nil
}
